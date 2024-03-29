import Head from 'next/head'
import clientPromise from '../utils/mongodb'
import React, { Component, useState, useEffect } from 'react';
import { Button, Form, Input } from 'semantic-ui-react';
import io from 'socket.io-client'
import ReactDOM from "react-dom";

var socket = io({transports: ['websocket'], upgrade: false});
let hoverTimerId;
let isHovering = false; //Whether the user is currently hovering over an element of interest
const localDateTimeOptions = {year:"numeric","month":"2-digit", day:"2-digit",hour12:false,hour:"2-digit",minute:"2-digit",second:"2-digit",timeZoneName:"short"} // mm/dd/yyyy in local timezone
const headers = {"Accept": "application/json", "Content-Type": "application/json"}


function getMachinesUtilized(){ //Get list of machinesUtilized from an on-screen PopUp
  let machinesUtilized = []
  let machinesFieldset = document.getElementById("machinesUtilized")
  for(let i=0; i < machinesFieldset.children.length; i++){
    let machines = machinesFieldset.children[i].children[0]
    if (machines.checked){
      machinesUtilized.push(machines.name)
    }
  }
  return machinesUtilized
}

function getotherToolsUtilized(){ //Get list of otherToolsUtilized from an on-screen PopUp
  let otherToolsUtilized= []
  let otherToolsFieldset = document.getElementById("otherToolsUtilized")
  for(let i=0; i < otherToolsFieldset.children.length; i++){
    let tools = otherToolsFieldset.children[i].children[0]
    if (tools.checked){
      otherToolsUtilized.push(tools.name)
    }
  }
  return otherToolsUtilized
}

/*function ensureCertifications(form, member){
  console.log("member",member)
  if (form.event == "Certification"){
    for(let t=0;t<certFullNameList.length;t++){
      if (form.machineUtilized.includes(certNameList[t])){ member[certFullNameList[t]] = true }
    }  
  }
  return member
}*/

/* Start Tooltips Code */
function hover(params){ //Checks to see if an element has been hovered over for 2 seconds or more. params = [memberDataOrId, parentElement]. parentElement is the element is which the hover originated. 
  let memberDataOrId = params[0] 
  let parentElement = params[1].target
  isHovering = true 
  hoverTimerId = setTimeout(function() { //Start the timer
    if (isHovering){
      createMemberTooltip(memberDataOrId,parentElement)
    }
  }, 1500)
}

function hoverOut(){ //Resets timer when done hovering over an element.
  isHovering = false 
  clearTimeout(hoverTimerId)

  //Delete all tooltips if they exist
  let tooltipsInTheDOM = document.getElementsByClassName("tooltip")
  for (let i=0;i<tooltipsInTheDOM.length;i++){ tooltipsInTheDOM[0].remove() }
}

function createTooltip(dataToDisplay,parentElement){
  let span = document.createElement("span")
  span.className = "tooltip"
  let arrow = document.createElement("div")
  arrow.className="tooltipArrow"
  span.appendChild(arrow);
  let dataToDisplayKeys = Object.keys(dataToDisplay) //The keys are the name of the attribute to be printed
  for (let i=0;i<dataToDisplayKeys.length;i++){ //Create a seperate p element for each attribute.
    let value = dataToDisplay[dataToDisplayKeys[i]]
    let p1 = document.createElement("p")
    let p2 = document.createElement("p")
    let div = document.createElement("div")
    p1.innerText = dataToDisplayKeys[i]+": "
    p1.id = "tooltip_info_p1"+dataToDisplayKeys[i]
    p1.className = "tooltip_attribute"
    p2.innerText = String(value)
    p2.id = "tooltip_info_p2"+dataToDisplayKeys[i]
    p2.className = "tooltip_attribute"
    div.appendChild(p1)
    div.appendChild(p2)
    span.appendChild(div)
  }
  parentElement.appendChild(span)
}

const getMemberDataFromID = async (MemberID,parentElement) => { //Fetch member data from MongoDB for a specific member
  try {  
    const res = await fetch(`/api/members/${MemberID}`, {
        method: 'GET',
        headers: headers
    })
    let response = res.json();
    response.then((resp) => {
      let memberData = resp.data
      let dataToDisplay;
      if (memberData !== undefined){  
        dataToDisplay = {"Patron Type":memberData["PatronType"],"Major":memberData["Major"],"GraduationYear":memberData["GraduationYear"],"RFID UID":memberData["rfid"],"joinedDate":new Date(memberData["joinedDate"]).toLocaleString("en-CA", localDateTimeOptions)}
        //console.log("memberData",memberData)
      } else { //Create Tooltip for users not in the members collection
        dataToDisplay = {"RFID UID":"N/A"}
      }
      createTooltip(dataToDisplay,parentElement)
    })
  } catch (error) { console.log(error); }
}

function createMemberTooltip(memberDataOrId,parentElement){
  if (typeof(memberDataOrId) == "object"){ //memberDataOrId is a member object
    let dataToDisplay = {"Patron Type":memberDataOrId["member"].PatronType,"Major":memberDataOrId["member"].Major,"GraduationYear":memberDataOrId["member"].GraduationYear,"RFID UID":memberDataOrId["member"].rfid,"joinedDate":new Date(memberDataOrId["member"].joinedDate).toLocaleString("en-CA", localDateTimeOptions)}
    createTooltip(dataToDisplay,parentElement)
  } else { //memberDataOrId is member._id as a string
    getMemberDataFromID(memberDataOrId,parentElement);
  }
}
/* End Tooltips Code */

export default function Home({ members, activities, config }){
  const [state, setState] = useState({
    configCollection: config[0],
    membersCollection: members,
    activitiesCollection: activities,
    displayingDay: new Date().toISOString().substring(0,10), //This should be converted to local time first!
    isOpen: false,
    activityEvent: {
      badgeInTime: "", badgeOutTime: "", machineUtilized: [], otherToolsUtilized: [],
      event: "", sessionLengthMinutes: null, MemberID: null, _id: null, flags: [],
    },
    displayProps: { submitButtonText:"", message:"" },
    batchEvents: [],
    submitType: "",
    showConfigPopup: false,
    showForgotIDPopup: false,
  });
  //console.log("state",state);

  useEffect(() => { 
    if (state.configCollection == undefined){
      console.log("Welcome to Eyra. Setting up your config collection...")
      let c = {
        rfidLength: 16,
        certifications: [],
        otherTools: [],
        visitType: ["Undefined","Certification"],
        memberAttributes: {
          majors: [],
          patronTypes: [],
          graduationYears: [],
        },
        stats: {
          semesters:[],
          academicYears:[],
          campusReach:{
            campusPopulation: 0,
            goalPercentage: 0,
            patronType: "",
          },
        },
      }
      setState({...state,configCollection:c})
    }

    async function socketInitializer(){
      await fetch('/api/socket');
      socket.on('connect', () => { console.log('WebSocket connected.') })
      socket.on('disconnect', () => { console.log('Disconnected from server'); });
      socket.on('update-membersCollection', msg => { 
        setState({...state, membersCollection: msg});
        console.log("updating members collection...");
      })
      socket.on('update-activitiesCollection', msg => { 
        setState({...state, activitiesCollection: msg}); 
        console.log("updating activties collection...");
      })
      socket.on('update-both', data => {  
        setState({...state, activitiesCollection: data.activities, membersCollection: data.members}); 
        console.log("updating activties and members collection...");
      })  
    }
    socketInitializer();
  }, [])

  function toggleConfigPopup(){ setState({...state, showConfigPopup: !state.showConfigPopup}); }

  function ISOToLocalString(isoString){
    let offsets = { EDT: 5, CST: 6, MST: 7, PST: 8}
    let offset = offsets[state.configCollection.timezone] //get offset
    let time = new Date(isoString).getTime() - offset*60 //time in minutes from UTC
    let localDate = new Date()
    localDate.setTime(time)
    return localDate.toLocaleDateString("sv") +" "+ localDate.toTimeString().substring(0,5)
  }

  /*function validate(e) {
    let err = {};
    let reqVariables = ['MemberID', 'Name','badgeInTime','badgeOutTime', 'event'];
    
    for (let i = 0; i < reqVariables.length; i++) {
      if (e.target[reqVariables[i]].value == "") {
        err[reqVariables[i]] = reqVariables[i]+" is required";
      }
    }

    if (e.target.sessionLengthMinutes.value == NaN){
      err.sessionLengthMinutes = "sessionLengthMinutes cannot be NaN"
    }
    return err;
  }*/

  const toggleShowGhostPopup = () => {
    let stateBefore = state.showForgotIDPopup
    setState({ 
      ...state,
      submitType: "(e) => handleSubmitForgotID(this.getInfo(),e)",
      showForgotIDPopup: !stateBefore,
    })
  }

  const updateMemberThenActivities = async ({member, activityProps}) => {
    try {
      if(member){ 
        await updateMember(member);
      }
      updateActivityLog(activityProps[0],activityProps[1],activityProps[2],activityProps[3]);
    } catch (error) { console.log("ERROR:",error) }
  }

  const updateMember = async (member) => {
    try {  
      const res = await fetch(`/api/members/${member._id}`, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(member)
      });
      let response = res.json()
      response.then((resp) => {
        setState({...state, membersCollection: resp.after, isOpen: false, showForgotIDPopup: false})
        socket.emit('membersCollection-change', resp.after)
      });
    } catch (error) { console.log("ERROR in updateMember() ",error); }
  }

  const updateActivityByDate = async (date, events, originFn) => {
    try {
      const res = await fetch(`/api/activity`, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify({Date: date, Events: events})
      });
      let response = res.json()
      response.then((resp) => {
        let updatedActivities = state.activitiesCollection.map(e => (e.Date==resp.after.Date) ? resp.after : e ) //Update a single entry in the activitiesCollection
        setState({...state, activitiesCollection: updatedActivities, isOpen: false, showForgotIDPopup: false})
        socket.emit('activitiesCollection-change', updatedActivities)
      });
    } catch (error) { console.log("ERROR in updateActivityByDate():",error); }
  }

  const batchCertify = async (newCerts, memberIDList) => {
    console.log("Members to certify:",memberIDList)
    console.log("Certifications to add:",newCerts)
    try {  
      const res = await fetch(`/api/certify`, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify({ newCerts: newCerts, memberIDList: memberIDList })
      });
      let response = res.json()
      response.then((resp) => {
        console.log("resp",resp)
        setState({...state, membersCollection: resp.after, isOpen: false, showForgotIDPopup: false})
        socket.emit('membersCollection-change', resp.after)
      });
    } catch (error) { console.log("ERROR in batchCertify() ",error); }
  }
  
  const createNewActivity = async (date, event, originFn) => {
    try {
      const res = await fetch(`/api/activity`, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({Date: date, Events: event})
      })
      let response = res.json()
      response.then((resp) => {
        setState({...state, activitiesCollection: resp.activities, isOpen: false, showForgotIDPopup: false})
        socket.emit('activitiesCollection-change', resp.activities)
      });
    } catch (error) { console.log("ERROR in",originFn,":",error) }
  }

  const updateConfigCollection = async (config) => {
    try {
      const res = await fetch(`/api/config`, {
          method: 'PUT',
          headers: headers,
          body: JSON.stringify(config)
      })
      console.log("config",config)
      let response = res.json()
      response.then((resp) => {
        setState({...state, configCollection: config, isOpen: false, showForgotIDPopup: false, showConfigPopup: false})
        //socket.emit('configCollection-change', config)
      });
    } catch (error) { console.log("ERROR in updateConfigCollection :",error) }
  }
  
  //creates a new activity upon badge out
  const updateActivityLog = async (activitiesCollection, newActivity, e, existing) => {
    // activity : The activities collection
    // newActivity: the activityEvent to update
    // existing : true = edit an activity that exists in the DB. false = add a new activity to the DB
    let newBadgeOutDate = newActivity.badgeOutTime.substring(0,10);
    let displayProps = JSON.parse(e.target["displayProps"].innerText);
    let prevBadgeOutDate = displayProps.displayDay;
    let newActivityDay = activitiesCollection.find(a => a.Date == newBadgeOutDate) //Get the activity document for the correct day
    let prevActivityDay = activitiesCollection.find(a => a.Date == prevBadgeOutDate)
  
    let newActivities;
  
    if (existing !== false){ //Updating an existing event
      //console.log('activity',activity,'newActivity',newActivity,'newActivityDay',newActivityDay);
  
      if (prevBadgeOutDate !== newBadgeOutDate){ //Check if the activity is being moved to another date.
        //Date of the activity has changed. Delete the event from the old activity.
        let prevActivityEvents = prevActivityDay.Events.filter(a => a._id !== newActivity._id)
        updateActivityByDate(prevBadgeOutDate, prevActivityEvents, "updateActivityLog()|  editExisting: true, movingDays: true"); //Delete activity from old date
        
        if (newActivityDay){ //If activities exist for this day, update the list. 
          newActivities = newActivityDay.Events.concat(newActivity)
        }
  
        //finish: check to update member.lastBadgeOut
      } else { //Event is not being moved to a different day. Edited single activity.
        let DayEvents = newActivityDay.Events.filter(a => a._id !== newActivity._id) //Remove the event from the ActivityDaily document so we can add it back in.
        newActivities = DayEvents.concat(newActivity); //All events from the day.
      }
    } else {
      if (newActivityDay){ //Activities exist for this day... updating existing activity list
        let acitivitiesBefore = newActivityDay.Events
        newActivities = acitivitiesBefore.concat(newActivity);
      }
    }
  
    //Add events to the DB
    if (newActivityDay){
      updateActivityByDate(newBadgeOutDate,newActivities, "updateActivityLog()|  editExisting: true, movingDays: false")
    } else { 
      createNewActivity(newBadgeOutDate,newActivity, "updateActivityLog()|  editExisting: false, movingDays: false")
    }
  }

  const deleteActivity = async(props) => {
    let [activitiesCollection, popUpState, activityID, member] = props
    let date = popUpState.badgeOutDate.substring(0,10)
    let activityDay;
    let remainingActivities;
    if(typeof(activityID)=="string"){
      activityDay = activitiesCollection.find(a => a.Date == date)
      remainingActivities = activityDay.Events.filter(a => a._id !== activityID)
      updateActivityByDate(date, remainingActivities, "deleteActivity")
    } else if (activityID == undefined){ //delete from badgeOut Screen
      member.badgedIn = !member.badgedIn
      updateMember(member)
    } else { //list of IDs
      console.log("FIX BATCH DELETE from deleteActivity()")
    }
  }

  const badgeInByRFID = async (RFID_UID_input) => {
    try {
      const res = await fetch('/api/badgeIn', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({rfid: RFID_UID_input})
      })
      let response = res.json();
      response.then((resp) => {
        let updatedMembers = state.membersCollection.map(m => (m._id==resp.after._id) ? resp.after : m )
        setState({...state, membersCollection: updatedMembers, activitiesCollection: resp.activities, isOpen: false});
        socket.emit("membersAndActivities-change", {members: updatedMembers, activities: resp.activities})
      });
    } catch (error) { console.log("Error badging in member",error) }
  }


  class QuestionTooltip extends React.Component{
    render(){
      return(
        <>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-question-circle" viewBox="0 0 16 16" style={{float:"right"}}>
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
            <path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286zm1.557 5.763c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94z"/>
          </svg>
        </>
      )
    }
  }

  class VisitType extends React.Component{
    constructor(props){
      super(props);
      //this.selectedValue = this.props.selectValue;
      this.state = {
        selectValue: this.props.selectValue
      }
    }

    VisitTypeChange(e){ this.props.onChange(e.target.value) }
    
    render(){
      return(
        <>
          <div id="visitType" style={{"display":"flex"}}>
            <label htmlFor="event">Visit Type: </label>
            <select onChange={(e) => this.VisitTypeChange(e)} defaultValue={this.state.selectValue} name="event">
              {state.configCollection.visitType.map((v) => 
                <option key={v} value={v}>{v}</option>
              )} 
            </select>
          </div>
        </>
      )
    }
  }

  const batchEdit = (e,selected) => {
    let date = document.getElementById("date")?.innerText
    let editDate = state.activitiesCollection.filter(a => a.Date== date)[0]
    let eventIdsToEdit = []; //list of event ids to delete
    selected.forEach(item => eventIdsToEdit.push(item.parentNode.parentNode.id)) //Get a list of event ids to delete
    let eventsToEdit = editDate.Events.filter(e => eventIdsToEdit.includes(e._id))
    let eventInfo = eventsToEdit[0];
    let message = "Editing ("+eventIdsToEdit.length+") events..."
    openBatchEditPopUp(eventsToEdit,eventInfo,{submitButtonText:"Batch Update","message":message}, "() => this.batchEdit()") 
  }

  const batchDelete = (e,selected) => {
    let date = document.getElementById("date").innerText
    let deleteDate = state.activitiesCollection.filter(a => a.Date== date)[0]
    let eventIdsToDelete = []; //list of event ids to delete
    selected.forEach(item => eventIdsToDelete.push(item.parentNode.parentNode.id)) //Get a list of event ids to delete
    let eventsToKeep = deleteDate.Events.filter(e => !eventIdsToDelete.includes(e._id))
    //console.log("e",e,"selected",selected,"eventsToKeep",eventsToKeep,"toDelete",eventsToDelete)
    updateActivityByDate(date, eventsToKeep, "batchDelete")
  }

  const handleSubmitPopUp = (existingInDB, e) => { //handleSubmitBadgeOut
    //console.log("existingInDB",existingInDB,"e",e)
    e.preventDefault();
    let newActivity = state.activityEvent
    let badgeInTime = new Date(e.target.badgeInDate.value+" "+e.target.badgeInTime.value)
    let badgeOutTime = new Date(e.target.badgeOutDate.value+" "+e.target.badgeOutTime.value)
    newActivity.badgeInTime = badgeInTime.toISOString()
    newActivity.badgeOutTime = badgeOutTime.toISOString()
    newActivity.machineUtilized = getMachinesUtilized()
    newActivity.otherToolsUtilized = getotherToolsUtilized()
    newActivity.event = e.target[0].value
    newActivity.sessionLengthMinutes = Math.round((badgeOutTime.getTime() - badgeInTime.getTime())/60000)
    newActivity.MemberID = state.activityEvent.MemberID
    newActivity._id = state.activityEvent._id
    newActivity.flags = state.activityEvent.flags
    

    let memberToUpdate = state.membersCollection.filter(m => m._id == state.activityEvent.MemberID)[0]
    if (existingInDB == false){ memberToUpdate.badgedIn = false }
    if (newActivity.event == "Certification"){
      let memberCerts = new Set(memberToUpdate.Certifications)
      newActivity.machineUtilized.forEach( c => memberCerts.add(c) )
      memberToUpdate["Certifications"] = [...memberCerts]
      console.log("saved",memberToUpdate["Certifications"])
    }
    //if memberToUpdate is undefinded it could be because its a ghost activity. No need to update the member.
    if (memberToUpdate){
      console.log("memberToUpdate",memberToUpdate.Name)
    } else { console.log("updating a ghost activity...")}
    updateMemberThenActivities({member: memberToUpdate, activityProps: [state.activitiesCollection, newActivity, e, existingInDB]})
  }

  const handleSubmitForgotID = (props,e) => {
    e.preventDefault();
    let numOfMembers = e.target.parentNode.children[2].children[1].value
    let newActivities = [] 
    for (let i=0; i<numOfMembers; i++){
      let inputElem = document.getElementById("member"+i)
      let out = new Date(props.badgeOutTime).getTime(); //ms since
      let inn = new Date(props.badgeInTime).getTime(); //ms since
      let newActivity = {
        Name: inputElem.value,
        flags: ["noID"],
        badgeInTime: props.badgeInTime,
        badgeOutTime: props.badgeOutTime,
        event: props.event,
        machineUtilized: getMachinesUtilized(),
        otherToolsUtilized: getotherToolsUtilized(),
        sessionLengthMinutes: Math.round((out - inn)/60000)  
      }
      newActivities.push(newActivity)
    }
    let date = newActivities[0].badgeOutTime.substring(0,10)
    console.log("updating Activities collection...  newActivities=",newActivities)
    let activityDay = state.activitiesCollection.filter(a => a.Date == date)[0]
    //console.log("activityDay",activityDay,"newActivities",newActivities)
    if (activityDay){
      let oldEvents = activityDay.Events
      let activities = oldEvents.concat(newActivities)
      updateActivityByDate(date, activities, "handleSubmitForgotID")
    } else { createNewActivity(date, newActivities, "handleSubmitForgotID") }
  }

  class Popup extends React.Component{
    constructor(props) {
      super(props);
      let visitType;
      if(state.activityEvent.event){ visitType = state.activityEvent.event } else { visitType = "Undefined" }
      this.state = {
        badgeInDate: ISOToLocalString(this.props.inTime).substring(0,10),
        badgeInTime: ISOToLocalString(this.props.inTime).substring(11,16),
        badgeOutDate: ISOToLocalString(this.props.outTime).substring(0,10),
        badgeOutTime: ISOToLocalString(this.props.outTime).substring(11,16),
        visitType: visitType,
        machineUtilized: [],
        otherToolsUtilized: [],
      }
    }

    updateBadgeInDate(item){ this.setState({"badgeInDate": item.target.value}) }
    updateBadgeInTime(item){ this.setState({"badgeInTime": item.target.value}) }
    updateBadgeOutDate(item){ this.setState({"badgeOutDate": item.target.value}) }
    updateBadgeOutTime(item){ this.setState({"badgeOutTime": item.target.value}) }
    handleMachineUtilized(value){ this.setState({"machineUtilized": getMachinesUtilized()})}
    handleOtherToolsUtilized(value){ this.setState({"otherToolsUtilized": value}) }
    handleVisitType(value){ this.setState({"visitType": value}) }

    batchEdit(){
      let activityInfo = this.getInfo()
      let date = activityInfo.badgeOutTime.substring(0,10)
      let editedEvents = [];
      let eventIDList = []; //List of _id of each edited event
      let eventIDsToDelete = [];
      let memberIDList = [];
      let dayMovingFromL = [];
      for (let i=0; i<state.batchEvents.length; i++){
        let singleEvent = state.batchEvents[i]
        let editedEvent = { badgeInTime: "", badgeOutTime: "", machineUtilized: [], otherToolsUtilized: [], event: "", sessionLengthMinutes: null, MemberID: null, _id: null, flags: [] };
        editedEvent.sessionLengthMinutes = activityInfo.sessionLengthMinutes;
        editedEvent.badgeInTime = activityInfo.badgeInTime
        editedEvent.badgeOutTime = activityInfo.badgeOutTime
        editedEvent.machineUtilized = this.state.machineUtilized
        editedEvent.otherToolsUtilized = this.state.otherToolsUtilized
        editedEvent.event = this.state.visitType
        editedEvent.Name = singleEvent.Name
        editedEvent.MemberID = singleEvent.MemberID
        editedEvent._id = singleEvent._id
        editedEvent.flags = singleEvent.flags
        editedEvents.push(editedEvent)
        eventIDList.push(singleEvent._id)
        let dayMovingFrom= singleEvent.badgeOutTime.substring(0,10)
        if (dayMovingFrom !== activityInfo.badgeOutTime.substring(0,10)){ 
          eventIDsToDelete.push(singleEvent._id) 
          dayMovingFromL.push(dayMovingFrom)
        }
        if (this.state.visitType == "Certification"){
          memberIDList.push(singleEvent.MemberID)
        }
      };
      console.log("memberIDs:",memberIDList)

      //Batch Certify Members
      batchCertify(getMachinesUtilized(), memberIDList)

      //updateActivityLog(activitiesCollection, newActivity, e, existing)
      let activityDay = state.activitiesCollection.filter(a => a.Date == date)[0]//Get previous events
      if (activityDay){
        let oldEvents = activityDay.Events
        oldEvents = oldEvents.filter(e => !eventIDList.includes(e._id))//remove edited Events
        editedEvents = editedEvents.concat(oldEvents)
        updateActivityByDate(date,editedEvents,"Popup.batchEdit()")
        console.log("eventIDsToDelete",eventIDsToDelete)
        if (eventIDsToDelete.length > 0){ //delete oldEvents if moving
          console.log("moving events to another day... removing original events.")
          let origActivityDay = state.activitiesCollection.filter(a => a.Date == dayMovingFromL[0])[0]
          let keepEvents = origActivityDay.Events.filter(e => !eventIDsToDelete.includes(e._id))
          updateActivityByDate(dayMovingFromL[0], keepEvents, "moving events to another day...")
        }
      } else { 
        console.log("about to create activity w/ editedEvents",editedEvents)
        createNewActivity(date, editedEvents, "Popup.batchEdit()") }
    }

    getInfo(){
      let badgeInTime = new Date(this.state.badgeInDate+" "+this.state.badgeInTime);
      let badgeOutTime = new Date(this.state.badgeOutDate+" "+this.state.badgeOutTime);
      let activityInfo = {
        badgeInTime: badgeInTime.toISOString(),
        badgeOutTime: badgeOutTime.toISOString(),
        event: this.state.visitType,
        machineUtilized: getMachinesUtilized(),
        otherToolsUtilized: getotherToolsUtilized(),
        //_id:
        sessionLengthMinutes: Math.round(badgeOutTime.getTime() - badgeInTime.getTime())/60000
      }
      //console.log("this.getInfo()| this.props",this.props,"activityInfo",activityInfo)
      return activityInfo
    }
    
    render(){
      let trashButtonCSS = {"display": "block"}
      if(this.props.noId && this.props.noId == true){ trashButtonCSS = {"display": "none"} }
      if(state.batchEvents.length > 0){ trashButtonCSS = {"display": "none"} }
      let member = state.membersCollection.filter(m => m._id == state.activityEvent.MemberID)[0]
      return (
        <>
          <h1 id="badgingOutTitle">{this.props.message}</h1>
          <form onSubmit={eval(state.submitType)}>
            <VisitType onChange={this.handleVisitType.bind(this)} selectValue={state.activityEvent.event}/>
            <div id="badgeInTime" style={{display: "flex"}}>
              <label htmlFor="badgeInTime">Badged In: </label>
              <input onChange={value => this.updateBadgeInDate(value)} id="badgeInDate" type="date" className="date" defaultValue={this.state.badgeInDate}></input>
              <input onChange={value => this.updateBadgeInTime(value)} id="badgeInTime" type="time" className="time" defaultValue={this.state.badgeInTime}></input>
            </div>
            <div id="badgeOutTime" style={{display: "flex"}}>
              <label htmlFor="badgeOutTime">Badged Out: </label>
              <input onChange={value => this.updateBadgeOutDate(value)} id="badgeOutDate" type="date" className="date" defaultValue={this.state.badgeOutDate}></input>
              <input onChange={value => this.updateBadgeOutTime(value)} id="badgeOutTime" type="time" className="time" defaultValue={this.state.badgeOutTime}></input>
            </div>

            <div className="equipment">
              <MachinesUtilized onChange={this.handleMachineUtilized.bind(this)}/>
              <OtherToolsUtilized onChange={this.handleOtherToolsUtilized.bind(this)}/>
            </div>

            <textarea style={{display:"none"}} id="displayProps" defaultValue={JSON.stringify(state.displayProps)}></textarea>
            <textarea style={{display:"none"}} id="hiddenProps" defaultValue={JSON.stringify(this.props)}></textarea>

            <Button type='button' name={state.activityEvent._id} id="deleteActivityButton" onClick={(e) => deleteActivity([state.activitiesCollection, this.state, state.activityEvent._id, member])} style={trashButtonCSS}></Button>
            <Button type='submit' id="submitBadgeOutPopup">{this.props.submitButtonText}</Button>
            <Button type='button' id="cancelPopupButton" onClick={() => setState({ ...state,  isOpen: false, showForgotIDPopup: false })}>Cancel</Button>
          </form>
        </>
      )
    }
  }

  function openManualBadgeOutPopup(member){
    setState({
      ...state,
      activityEvent: {
        badgeInTime: member.lastBadgeIn,
        badgeOutTime: new Date().toISOString(), 
        Name: member.Name,
        MemberID: member._id,
        //member: member,
        flags: [],
      },
      displayProps: {
        submitButtonText:"Badge Out",
        message:"Badging out "+member.Name+"..."
      },
      submitType: "(e) => handleSubmitPopUp(false,e)", //badgeInByRFID
      isOpen: true,
    })
  }

  const openBatchEditPopUp = async (eventsToEdit,eventInfo,displayProps,submitFn) => {
    setState({
      ...state,
      activityEvent: eventInfo,
      batchEvents: eventsToEdit,
      submitType: submitFn,
      displayProps: displayProps,
      isOpen: true,
    })
  }

  const openPopUp = async (actEvent,displayProps,submitFn) => {
    setState({
      ...state,
      activityEvent: actEvent,
      submitType: submitFn,
      displayProps: displayProps,
      isOpen: true,
    })
  }

  class MachinesUtilized extends React.Component{
    constructor(props){
      super(props);
      if(typeof(state.activityEvent.machineUtilized)!=="undefined"){
        this.state = { machines: state.activityEvent.machineUtilized } //List of machines utilize
      } else { 
        this.state = { machines: [] } //List of machines utilize
      }
    }

    MachineUtilizedChange(e){ 
      this.props.onChange(this.state.machines) 
    }

    updateState = (e) => {
      let machinesInUse = this.state.machines
      if (e.target.checked){  
        machinesInUse.push(e.target.id) 
      } else {  
        machinesInUse = machinesInUse.filter(m => m !== e.target.id)
      }
      this.setState({"machines":machinesInUse})
    }

    render(){
      return(
        <>
          <div onClick={this.updateState} className="checkboxes" style={{display:'flow-root', width: "50%"}}>
            <p>Machines Utilized (Certification Required):</p>
            <fieldset onChange={(e) => this.MachineUtilizedChange(e)} id="machinesUtilized" style={{"display": "inline-block","position": "relative","textAlign": "initial","float":"left","border":"none"}}>
              {state.configCollection.certifications.map((CertName) => 
                <label htmlFor={CertName} key={"label_"+CertName}>
                  <input type="checkbox" id={CertName} name={CertName} defaultChecked={this.state.machines.includes(CertName)}></input>
                  {CertName}
                </label>
              )}
            </fieldset>
          </div>
        </>
      )
    }
  }

  class OtherToolsUtilized extends React.Component{
    constructor(props){
      super(props);
      if(typeof(state.activityEvent.otherToolsUtilized)!=="undefined"){
        this.state = { otherTools: state.activityEvent.otherToolsUtilized } //List of other tools that don't require certification
      } else { 
        this.state = { otherTools: [] } //List of other tools that don't require certification
      }
    }

    OtherToolsUtilizedChange(e){ this.props.onChange(this.state.otherTools) }

    updateState = (e) => {
      let otherTools = this.state.otherTools
      if (e.target.checked){  
        otherTools.push(e.target.id) 
      } else {  
        otherTools = otherTools.filter(m => m !== e.target.id)
      }
      this.setState({"otherTools":otherTools})
    }

    render(){
      return(
        <>
          <div onClick={this.updateState} className="checkboxes" style={{display:'flow-root', width: "50%"}}>
            <p>Other Tools Utilized (No Certification Required):</p>
            <fieldset onChange={(e) => this.OtherToolsUtilizedChange(e)} id="otherToolsUtilized" style={{"display": "inline-block","position": "relative","textAlign": "initial","float":"left","border":"none"}}>
              {state.configCollection.otherTools.map((ToolName) => 
                <label htmlFor={ToolName} key={"label_"+ToolName}>
                  <input type="checkbox" id={ToolName} name={ToolName} defaultChecked={this.state.otherTools.includes(ToolName)}></input>
                  {ToolName}
                </label>
              )}
            </fieldset>
          </div>
        </>
      )
    }
  }

  class BadgeInForgotIDPopUp extends React.Component{
    constructor(props){
      super(props);
      this.state = {
        members: [0], //An array whose number of elements corresponds to the number of members being badged in.
      }
    }

    numOfMembersChanged(){
      let numMembersInput = document.getElementById("numMembersToBadgeIn")
      let arr = Array.from(Array(parseInt(numMembersInput.value)).keys())
      this.setState({members:arr});
    }

    render(){
      return(
        <>
          <section className="Popup">
            <Popup
              //badgeInDate={new Date().toLocaleString("en-CA", localDateTimeOptions).substring(0,10)} //In local time
              //badgeInTime={new Date().toLocaleString("en-CA", localDateTimeOptions).substring(12,17)} //In local time
              //badgeOutDate={new Date().toLocaleString("en-CA", localDateTimeOptions).substring(0,10)} //In local time
              //badgeOutTime={new Date().toLocaleString("en-CA", localDateTimeOptions).substring(12,17)} //In local time
              inTime = {new Date().toISOString()}
              outTime = {new Date().toISOString()}
              message={"Creating anonymous activity..."}
              submitButtonText="Create"
              existsInDB={false}
              noId={true}
            />

            <div>
              <p style={{"display": "inline"}}>Members: </p>
              <input type="number" min="1" max="35" defaultValue="1" id="numMembersToBadgeIn" onChange={this.numOfMembersChanged.bind(this)} style={{"display": "inline"}}></input> 
            </div>

            <div style={{"display":"flow-root", "overflowY":"scroll", "maxBlockSize":"7vw"}}>
              { this.state.members.map((member,i) => 
                <label className="enterInfoLabel" htmlFor={"member"+i} style={{"marginBottom":"4px", display:"block"}} key={"member"+i}>Name:
                  <input type="text" id={"member"+i} defaultValue={"Unknown Member"} style={{"display":"inline-block", "position":"absolute", "left":"7ch", "width": "30ch"}}></input>
                </label>
              )}
            </div>
          </section>
          <div id="blur"></div>
        </>
      )
    }
  }

  class BadgeInForgotIDButton extends React.Component{
    constructor(props){
      super(props);
    }

    render(){
      // toggle={toggleShowGhostPopup}
      return(
        <>
          <button onClick={toggleShowGhostPopup} type="button">Forgot ID</button> 
          { state.showForgotIDPopup ? <BadgeInForgotIDPopUp/> : <></> }
        </>
      )
    }
  }

  class SearchMemberBadgeIn extends React.Component{
    constructor(props){
      super(props);
      this.state = {
        results: [],
        showResults: false,
        selectionMade: false,
        selection: [],
        showEditMemberPopup: false,
      }
    }
    
    onKeyUpCapture(e){
      function BadgeInMemberSearch(members){
        //Searches for a member by name, then badges in the member.
        let searchInput = e.target.value
        let listOfMembers = members.map(x => [x.Name,x._id,x.rfid])
        const regexSearch = new RegExp("(.*"+searchInput+".*)","i") //Create a regex rule to match the search input exactly and capture the entire names of any matching searches. i flag ignores case sensitivity.
        const memberNamesMatchingSearch = listOfMembers.filter(memberName => regexSearch.test(memberName[0]));
        //console.log("members:",memberNamesMatchingSearch)
        return memberNamesMatchingSearch
      }

      let searchResults = BadgeInMemberSearch(this.props.members)
      this.setState({results:searchResults})
    }

    onFocus(e){ //When the user focuses on the search bar show the search results
      this.setState({showResults:true})
    }

    onBlur(e){ //When the user stops focusing on the search bar hide the search results
      setTimeout(() => { this.setState({showResults:false}) }, 200);
    }

    handleSelect(e){
      setTimeout(() => { 
        this.setState({selection:[e.target.innerText,e.target.id], selectionMade:true})
        let searchInput = document.getElementById("searchMemberBadgeIn")
        searchInput.value = e.target.innerText
      }, 200);
    }

    handleSubmit(e){
      console.log("Badging in Member",this.state.selection[0],"w/ RFID UID:",this.state.selection[1])
      badgeInByRFID(this.state.selection[1])
    }
    
    render(){
      return(
        <>
        {this.state.showEditMemberPopup ? 
          <EditMemberPopup rfid={this.state.selection[1]} cancel={() => this.setState({showEditMemberPopup: false})}/>
          : <></>
        }

        <div style={{"textAlign": "center"}}>
        <p style={{display: "inline"}}>Search members: </p>
        <input autoComplete='' onFocus={this.onFocus.bind(this)} onBlur={this.onBlur.bind(this)} onKeyUpCapture={this.onKeyUpCapture.bind(this)} id='searchMemberBadgeIn'></input> 
        <BadgeInForgotIDButton/>
        {this.state.showResults && this.state.results.length > 0 ? 
          <SearchResults handleSelect={this.handleSelect.bind(this)} results={this.state.results}></SearchResults>
          :  <></> }
        {this.state.selectionMade ? 
          <>
            <SubmitSelection result={this.state.selection} handleSubmit={this.handleSubmit.bind(this)} selectionMade={this.state.selection[0]}></SubmitSelection>
            <button type="button" onClick={() => this.setState({showEditMemberPopup: true})}>Edit Member</button>
          </>
          : <></>}
        </div>
        </>
      ) 
    }
  }

  class SearchResults extends React.Component{
    constructor(props){
      super(props);
    }

    render(){
      return(
        <div className="searchResultsDropdown">
          {this.props.results?.map((result,i) => (
            <div id={result[2]} onClick={this.props.handleSelect} key={"searchResult"+i}>{result[0]}</div>  
          ))}
        </div>
      )
    }
  }

  class SubmitSelection extends React.Component{
    constructor(props){
      super(props);
      this.state = {}
    }

    render(){
      return(
        <button onClick={this.props.handleSubmit}>Badge In {this.props.selectionMade}</button>
      )
    }
  }

  class EditMemberPopup extends React.Component{
    constructor(props){
      super(props);
      let member = state.membersCollection.filter(mem => mem.rfid == this.props.rfid)[0]
      this.state = {
        member: member,
        earnedCerts: member.Certifications
      }
    }

    updateCerts(e){ //property: string, value
      let certName = e.target.name
      let checkboxValue = e.target.checked
      let certsList = this.state.earnedCerts
      if (checkboxValue){ //Certification added
        certsList.push(certName)
      } else { //Certification removed
        certsList = certsList.filter(c => c !== certName)
      }
      this.setState({...this.state, earnedCerts: certsList})
      //console.log({certName,checkboxValue,certsList})
    }

    updateString(property, value){
      let updatedMember = this.state.member
      updatedMember[property] = value
      this.setState({...this.state, member: updatedMember})
      //console.log("updated",this.state.member[property])
    }

    handleSubmit(){
      let updatedMember = this.state.member
      updatedMember.Certifications = this.state.earnedCerts
      updateMember(updatedMember)
      setState({...state, isOpen: false})
    }

    render(){
      return(
        <>
          <section id="editMember" className="Popup">
            <h2 id="title">Editing Member</h2>
            <div style={{display: "flex", gap: "4px", flexFlow: "wrap"}}>
            <label>
              Name:
              <input type="text" defaultValue={this.state.member.Name} onChange={(e) => this.updateString("Name", e.target.value)}></input>
            </label>

            <label>
              RFID:
              <input type="text" defaultValue={this.props.rfid} onChange={(e) => this.updateString("rfid", e.target.value)}></input>
            </label>

            <label>
              Major:
              <select defaultValue={this.state.member.Major} onChange={(e) => this.updateString("Major", e.target.value)}>
                {state.configCollection.memberAttributes.majors.map((major) => 
                  <option key={major}>{major}</option>
                )}
              </select>
            </label>

            <label>
              PatronType: 
              <select defaultValue={this.state.member.PatronType} onChange={(e) => this.updateString("PatronType", e.target.value)}>
                {state.configCollection.memberAttributes.patronTypes.map((patronType) => 
                  <option key={patronType}>{patronType}</option>
                )}
              </select>
            </label>

            <label>
              GraduationYear:
              <select defaultValue={this.state.member.GraduationYear} onChange={(e) => this.updateString("GraduationYear", e.target.value)}>
                {state.configCollection.memberAttributes.graduationYears.map((gradYear) => 
                  <option key={gradYear}>{gradYear}</option>
                )}
              </select>
            </label>
            </div>

            <div id="certs" onChange={(e) => this.updateCerts(e)}>
              {state.configCollection.certifications.map((cert,i) => (
                <div style={{flexDirection:"column", width: "35px"}} className='rotated'>
                  <p>{cert}</p>
                  <input name={cert} type="checkbox" id="checkbox" defaultChecked={this.state.member.Certifications.includes(cert)}></input>
                </div>
              ))}
            </div>

            <div id="buttons">
              <button type="button" onClick={this.props.cancel}>Cancel</button>
              <button type="button" onClick={() => console.log("TODO: Implement this button w/ an Are you Sure? popup")}>Delete</button>
              <button type="button" onClick={() => this.handleSubmit()}>Update</button>
            </div>
          </section>
          <div id="blur"></div>
        </>
      )
    }
  }

  class AddPill extends React.Component{
    constructor(props){
      super(props);
      this.textInput = React.createRef();
      this.focusOnInput = this.focusOnInput.bind(this);
      this.state = {
        name: "",
        focus: false,
      }
    }

    focusOnInput() {
      this.textInput.current?.focus();
    }

    checkForEnter(e){
      if (e.key=="Enter"){
        this.handleChange(e)
        e.target.innerText = "";
      }
    }

    handleChange(e){
      this.validateNewPill(e)
      this.setState({focus: false})
    }

    createNewPill(e, pillName){
      this.props.addPill(pillName);
      this.setState({name: "", focus: false});
      e.target.innerText = "";
    }

    validateNewPill(e){
      let pillName = ""
      if (!this.props.isDate){
        pillName = e.target.innerText.replace(/[^a-zA-Z0-9_()]+/g,""); //drop all non-alphanumeric characters except () and _
      } else {
        pillName = e.target.innerText;
      }
      if (pillName == ""){
        console.log("validate | pillName is empty")
      } else if (this.props.existingPills.includes(pillName)) {
        console.log("validate | Duplicate pill detected")
      } else if (this.props.isDate == true && new Date(pillName).toString() == 'Invalid Date'){
        console.log("validate | Invalid date. Use mm/dd/yyyy format.")
      } else {
        this.createNewPill(e, pillName)
      }
    }

    render(){
      return(
        <>
          <div id="pill">
            <span id="addPill" contentEditable="true" onKeyDown={(e) => this.checkForEnter(e)} ref={this.textInput} onFocus={() => this.setState({focus: true})} onBlur={this.handleChange.bind(this)}></span>
            { !this.state.focus && this.state.name == "" ? (
                <svg xmlns="http://www.w3.org/2000/svg" onClick={this.focusOnInput} className="x" style={{transform: "rotate(45deg)"}} width="18" height="18" fill="none" viewBox="0 0 18 18">
                  <path fill="#545454" d="M.485.485a1.5 1.5 0 0 1 2.122 0L8.97 6.85 15.335.485a1.5 1.5 0 0 1 2.12 2.122L11.093 8.97l6.364 6.364a1.5 1.5 0 1 1-2.121 2.12L8.97 11.093l-6.364 6.364a1.5 1.5 0 1 1-2.122-2.121L6.85 8.97.485 2.607a1.5 1.5 0 0 1 0-2.122Z"/>
                </svg>
              ) : ( <></> )
            }
          </div>
        </>
      )
    }
  }

  class DeletablePill extends React.Component{
    constructor(props){
      super(props);
      this.state = {}
    }

    render(){
      return(
        <>
          <div id="pill">
            <p>{this.props.inputName}</p>
            <button type="button" id="x" onClick = {() => this.props.handler(this.props.inputName)}>
              <svg xmlns="http://www.w3.org/2000/svg" className="x" width="18" height="18" fill="none" viewBox="0 0 18 18">
                <path fill="#545454" d="M.485.485a1.5 1.5 0 0 1 2.122 0L8.97 6.85 15.335.485a1.5 1.5 0 0 1 2.12 2.122L11.093 8.97l6.364 6.364a1.5 1.5 0 1 1-2.121 2.12L8.97 11.093l-6.364 6.364a1.5 1.5 0 1 1-2.122-2.121L6.85 8.97.485 2.607a1.5 1.5 0 0 1 0-2.122Z"/>
              </svg>
            </button>
          </div>
        </>
      )
    }
  }

  class ConfigPopup extends React.Component{
    constructor(props){
      super(props);
      this.state = {
        config: state.configCollection,
        action: "",
        details: "",
        onCancel: "",
        onConfirm: "",
      }
      this.handleRemoveCertification = this.handleRemoveCertification.bind(this)
      this.handleRemoveTool = this.handleRemoveTool.bind(this)
      this.handleRemoveGradyr = this.handleRemoveGradyr.bind(this)
    }

    updateConfigCollection = () => {
      ReactDOM.unstable_batchedUpdates(() => {
        toggleConfigPopup();
        updateConfigCollection(this.state.config);
      });
    }

    addCertPill = (pillName) => {
      let newState = this.state.config
      newState.certifications.push(pillName)
      this.setState({config: newState})
    }

    addToolPill = (pillName) => {
      let newState = this.state.config
      newState.otherTools.push(pillName)
      this.setState({config: newState})
    }
    
    addPatron = (pillName) => {
      let newState = this.state.config
      newState.memberAttributes.patronTypes.push(pillName)
      this.setState({config: newState})
    }

    addVisitType = (pillName) => {
      let newState = this.state.config
      newState.visitType.push(pillName)
      this.setState({config: newState})
    }

    addGraduationYr = (pillName) => {
      let newState = this.state.config
      newState.memberAttributes.graduationYears.push(pillName)
      this.setState({config: newState})
    }

    addSemester = (pillName) => {
      let newState = this.state.config
      newState.stats.semesters.push(pillName)
      this.setState({config: newState})
    }

    addAcademicYr = (pillName) => {
      let newState = this.state.config
      newState.stats.academicYears.push(pillName)
      this.setState({config: newState})
    }

    handleTimezone = (timezone) => {
      let newState = this.state.config
      newState.timezone = timezone.target.value
      this.setState({config: newState})
    }

    handleRFIDLength = (e) => {
      let newState = this.state.config
      newState.rfidLength = parseInt(e.target.value)
      this.setState({config: newState})
    }

    handleRemoveCertification = (inputName) => {
      //Check Certification Usage
      let certified = members.filter(m => m.Certifications && m.Certifications.includes(inputName))

      if (certified.length == 0){
        //Do not throw a confirmation popup if no members have the certification
        eval("this.removeCertification('"+inputName+"')")
      } else {
        this.setState({
          action: "Removing certification '"+inputName+"'",
          details: certified.length+" members w/ this certification...",
          onCancel: '() => this.closeConfirmationPopup()',
          onConfirm: "() => this.removeCertification('"+inputName+"')",
        })
      }
    }

    handleRemoveTool = (inputName) => {
      this.setState({
        action: "Removing tool '"+inputName+"'",
        details: "",
        onCancel: '() => this.closeConfirmationPopup()',
        onConfirm: "() => this.removeTool('"+inputName+"')",
      })
    }

    handleRemoveGradyr = (inputName) => {
      this.setState({
        action: "Removing Graduation Year '"+inputName+"'",
        details: "",
        onCancel: '() => this.closeConfirmationPopup()',
        onConfirm: "() => this.removeGraduationYr('"+inputName+"','graduationyrs')",
      })
    }

    handleRemovePatron = (inputName) => {
      //Check for patrons of this type
      let patrons = members.filter(m => m.PatronType && m.PatronType.includes(inputName))

      if (patrons.length == 0){
        //Do not throw a confirmation popup if no members have the certification
        eval("this.removePatron('"+inputName+"')")
      } else {
        this.setState({
          action: "Removing patronType '"+inputName+"'",
          details: patrons.length+" members w/ this patronType...",
          onCancel: '() => this.closeConfirmationPopup()',
          onConfirm: "() => this.removePatron('"+inputName+"')",
        })
      }
    }

    closeConfirmationPopup = () => {
      this.setState({action: "", details: "", onCancel: "", onConfirm: ""})
    }

    removeGraduationYr = (inputName) => {
      let newState = this.state.config
      newState.memberAttributes.graduationYears = newState.memberAttributes.graduationYears.filter(c => c !== inputName) //remove inputName from from list 
      this.setState({config: newState})
      this.closeConfirmationPopup()
    }
    
    removeCertification = (inputName) => {
      let newState = this.state.config
      newState.certifications = newState.certifications.filter(c => c !== inputName) //remove certification from list 
      this.setState({config: newState})
      this.closeConfirmationPopup()
    }

    removeTool = (inputName) => {
      let newState = this.state.config
      newState.otherTools = newState.otherTools.filter(c => c !== inputName) //remove otherTool from list 
      this.setState({config: newState})
      this.closeConfirmationPopup()
    }

    removeVisitType = (inputName) => {
      let newState = this.state.config
      newState.visitType = newState.visitType.filter(c => c !== inputName) //remove visitType from list 
      this.setState({config: newState})
      this.closeConfirmationPopup()
    }

    removePatron = (inputName) => {
      let newState = this.state.config
      newState.memberAttributes.patronTypes = newState.memberAttributes.patronTypes.filter(c => c !== inputName) //remove certification from list 
      this.setState({config: newState})
      this.closeConfirmationPopup()
    }

    removeSemester = (inputName) => {
      let newState = this.state.config
      newState.stats.semesters = newState.stats.semesters.filter(c => c !== inputName) //remove certification from list 
      this.setState({config: newState})
      this.closeConfirmationPopup()
    }

    removeAcademicYr = (inputName) => {
      let newState = this.state.config
      newState.stats.academicYears = newState.stats.academicYears.filter(c => c !== inputName) //remove certification from list 
      this.setState({config: newState})
      this.closeConfirmationPopup()
    }

    handleMajors = (e) => {
      let majors = e.target.value.split(",")
      let newState = this.state.config
      newState.memberAttributes.majors = majors
      this.setState({config: newState})
    }

    handleCampusReachChange = (attribute,e) => {
      let newState = this.state.config
      newState.stats.campusReach[attribute] = e.target.value
      this.setState({config: newState})
      console.log("this.state",this.state)
    }

    render(){
      return(
        <>
          { this.state.action.length > 0 ? (
            <><div id="confirmPopup">
              <h2>Are you sure?</h2>
              { this.state.action ? (
                <h3>{this.state.action}</h3>) : (
                <></>
              )}
              { this.state.details ? (
                <h4>{this.state.details}</h4>) : (
                <></>
              )}
              <div style={{display: "inline"}}>
                <button type="button" onClick={eval(this.state.onCancel)}>Cancel</button>
                <button type="button" onClick={eval(this.state.onConfirm)}>Continue anyway</button>
              </div>
            </div></>
          ) : (<></>)}
          <section className="Popup" id="config">
            <h3>This configuration will apply to all activities going forward.<br/>Previous activities WILL NOT be retroactively updated.</h3>

            <h2>Time Zone:</h2>
            <select onClick={this.handleTimezone} defaultValue={this.state.config.timezone}>
              <option value="EDT">(UTC-5) Eastern Standard Time</option>
              <option value="CST">(UTC-6) Central Standard Time</option>
              <option value="MST">(UTC-7) Mountain Standard Time</option>
              <option value="PST">(UTC-8) Pacific Standard Time</option>
            </select>

            <h2 title="The amount of characters that makeup each cardSerialNumber.">Expected RFID Length</h2>
            <input type="number" defaultValue={this.state.config.rfidLength} min="1" max="64" onChange={(e) => this.handleRFIDLength(e)} id="rfidLength"></input>

            <h2 title="List of all tools that require certification to access. When an activity is saved with a visitType of 'Certification' the member will be certified for the associated tool.">Certifications: </h2>
            <div id="certification-pills">
              {this.state.config.certifications.map((i) => 
                <DeletablePill inputName={i} handler={this.handleRemoveCertification} key={i}/>
              )}
              <AddPill addPill={this.addCertPill} existingPills={state.configCollection.certifications} isDate={false}/>
            </div>

            <h2 title="All other tools you want to track the usage of that don't require a certification.">otherTools: </h2>
            <div id="otherTools-pills">
              {this.state.config.otherTools.map((i) => 
                <DeletablePill inputName={i} handler={this.handleRemoveTool} key={i}/>
              )}
              <AddPill addPill={this.addToolPill} existingPills={state.configCollection.otherTools} isDate={false}/>
            </div>

            
            <h2 title="Categories to describe what someone did during their visit. 'Undefined' and 'Certification' are required visitTypes and have special functionality.">visitType:</h2>
            <div id="visitType-pills">
              {this.state.config.visitType.map((i) => 
                <DeletablePill inputName={i} handler={this.removeVisitType} key={i}/>
              )}
              <AddPill addPill={this.addVisitType} existingPills={state.configCollection.visitType} isDate={false}/>
            </div>

            <details id="memberAttributes">
              <summary>Member Attributes</summary>
              <p>The following fields are information that members are asked to provide upon registration.</p>
              <h2 title="A comma seperated list of student majors. (ex: Physics,Mathematics,English)">Majors:</h2>
              <textarea id="majors" defaultValue={this.state.config.memberAttributes.majors.toString()} onChange={(e) => this.handleMajors(e)}></textarea>
              <h2 title="Categories to track different types of members. (ex: Faculty, Student, Guest)">Patron Types:</h2>
              <div id="patron-pills">
                {this.state.config.memberAttributes.patronTypes.map((i) => 
                  <DeletablePill inputName={i} handler={this.handleRemovePatron} key={i}/>
                )}
                <AddPill addPill={this.addPatron} existingPills={state.configCollection.memberAttributes.patronTypes} isDate={false}/>
              </div>
              <h2 title="ex: 2023, 2024, 2025, 2026, Graduate Student">Graduation Years:</h2>
              <div id="gradyr-pills">
                {this.state.config.memberAttributes.graduationYears.map((i) => 
                  <DeletablePill inputName={i} handler={this.handleRemoveGradyr} key={i}/>
                )}
                <AddPill addPill={this.addGraduationYr} existingPills={this.state.config.memberAttributes.graduationYears} isDate={false}/>
              </div>
              {/*<input type="text" defaultValue={this.state.config.memberAttributes.graduationYears.toString()}></input>*/}
            </details>

            <details id="stats">
              <summary>Statistics</summary>
              <p>The following fields add functionality to the stats page.</p>
              <h2 title="Enter the dates (mm/dd/yyyy) representing the first day of each semester. Include the next upcoming semester as well.">Semesters:</h2>
              <div id="semester-pills">
                {this.state.config.stats.semesters.map((i) => 
                  <DeletablePill inputName={i} handler={this.removeSemester} key={i}/>
                )}
                <AddPill addPill={this.addSemester} existingPills={state.configCollection.stats.semesters} isDate={true}/>
              </div>

              <h2 title="Enter the dates (mm/dd/yyyy) representing the first day of each academic year. Include the next academic year as well.">Academic Years:</h2>
              <div id="academicYr-pills">
                {this.state.config.stats.academicYears.map((i) => 
                  <DeletablePill inputName={i} handler={this.removeAcademicYr} key={i}/>
                )}
                <AddPill addPill={this.addAcademicYr} existingPills={state.configCollection.stats.academicYears} isDate={true}/>
              </div>

              <h2 title="Track what percentage of the total campus has registed in Eyra.">Campus Reach</h2>
              <div id="campusReach">
                <label>Campus Population
                  <input type="number" min="0" defaultValue={this.state.config?.stats?.campusReach?.campusPopulation} onChange={(e) => this.handleCampusReachChange("campusPopulation",e)}></input>
                </label>
                <label>% Reach Goal
                  <input type="number" max="100" min="0" defaultValue={this.state.config?.stats?.campusReach?.goalPercentage} onChange={(e) => this.handleCampusReachChange("goalPercentage",e)}></input>
                </label>
                <label htmlFor="countPatronType">Count: 
                  <select name="countPatronType" defaultValue={this.state.config?.stats?.campusReach?.patronType} onClick={(e) => this.handleCampusReachChange("patronType",e)}>
                    {this.state.config.memberAttributes.patronTypes.map((p) =>
                      <option key={p} value={p}>{p}</option>
                    )}
                    <option value="All Members">All Members</option>
                  </select>
                </label>
              </div>
            </details>

            <button type="button" onClick={this.props.cancel}>Cancel</button>
            <button type="button" onClick={() => updateConfigCollection(this.state.config)}>Update</button>
          </section>
          <div id="blur"></div>
        </>
      )
    }
  }

  class AddInfoButton extends React.Component{
    constructor(props){
      super(props);
      this.state = { 
        lastCheckboxSelected: undefined 
      }
    }

    render(){
      return(
        <>
        {!this.props.showCheckbox && this.props.activity.event !== "Undefined" ? (
          <button onClick={this.props.clickedAddInfo} className="addInfo">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" viewBox="0 0 32 34">
              <path fill="#000" d="M31.674 3.377a1.116 1.116 0 0 1 0 1.576l-2.328 2.33-4.464-4.464L27.21.49a1.116 1.116 0 0 1 1.578 0l2.886 2.886v.002ZM27.768 8.86l-4.465-4.464L8.095 19.603a1.116 1.116 0 0 0-.27.438l-1.797 5.388a.558.558 0 0 0 .706.705l5.388-1.797c.165-.054.315-.145.438-.267L27.768 8.86Z"/>
              <path fill="#000" fillRule="evenodd" d="M0 28.841a3.321 3.321 0 0 0 3.321 3.321H27.68A3.322 3.322 0 0 0 31 28.841V15.555a1.107 1.107 0 1 0-2.214 0v13.286a1.107 1.107 0 0 1-1.107 1.107H3.32a1.107 1.107 0 0 1-1.107-1.107V4.484A1.107 1.107 0 0 1 3.32 3.377h14.393a1.107 1.107 0 0 0 0-2.215H3.321A3.321 3.321 0 0 0 0 4.484V28.84Z" clipRule="evenodd"/>
            </svg>
          </button>
        ) : (
          (!this.props.showCheckbox && this.props.activity.event == "Undefined") ? ( 
            <button onClick={this.props.clickedAddInfo} className="addInfoAttn">Add Info</button>
          ) : (
            <input className="addInfoCheckbox" id={String(this.props.index)} onClick={this.props.clickedCheckbox} type="checkbox" style={{display:"flex",margin:"auto","height":"1.8em"}}></input>
          )
        )}
        </>
      )
    }
  }
  
  class RecentActivity extends React.Component{
    constructor(props) {
      super(props);     

      let displayingActivities = state.activitiesCollection.filter(act => act.Date == state.displayingDay)[0]

      //Sort the activities by badgeInTime
      if (typeof displayingActivities !== 'undefined'){ //Check to make sure the activity exists
        displayingActivities.Events.sort(function(a, b) {
          let dateA = new Date(a.badgeOutTime);
          let dateB = new Date(b.badgeOutTime);
          if (dateA < dateB) return -1;
          if (dateA > dateB) return 1;
          return 0;
        });
      }

      this.state = {
        displayingActivities: displayingActivities,
        toggle: false, //toggle batch selections on and off. If true, batch selections are on. 
        firstCheckboxSelected: undefined,
        selected: [] //A list of selected elements
      };
      //console.log("RecentActivity.state =",this.state)
    }

    changeDay(arg,dayToChange){
      let currDate = new Date(dayToChange)
        if (arg == "forward-one-day"){
          currDate.setMinutes(currDate.getMinutes() + 24*60); //Change dateObj to the next day
        } else if (arg == "backward-one-day"){
          currDate.setMinutes(currDate.getMinutes() - 24*60); //Change dateObj to the previous day
        }
        let currDay = currDate.toISOString().substring(0,10);
        setState({...state, displayingDay: currDay})
    }
    
    checkboxClicked(e){
      function getSelectedActivites(){
        let checkboxElems = document.getElementsByClassName("addInfoCheckbox");
        let selected = []
        for(let i=0; i<checkboxElems.length; i++){
          let checkbox = checkboxElems[i]
          checkbox.checked ? selected.push(checkbox) : undefined ;
        }
        return selected
      }

      //Detect multiple selection shift-clicks
      if (this.state.toggle){
          if (e.shiftKey && this.state.firstCheckboxSelected) { 
          let firstId = parseInt(this.state.firstCheckboxSelected.id)
          let secondId = e.target.id
          let checkboxElems = document.getElementsByClassName("addInfoCheckbox");
          let checkbox = checkboxElems[secondId]
          let changeToState = checkbox.checked
          for (let i=Math.min(firstId,secondId); i<Math.max(firstId,secondId); i++){
            checkboxElems[i].checked = changeToState;
          }
        }
      }
      let selected = getSelectedActivites();
      this.setState({firstCheckboxSelected: e.target, selected: selected});
    }

    hourMinStr(minutes){
      if (minutes/60 >= 1){
        let hours = Math.floor(minutes/60);
        let mins = minutes % 60;
        return hours+"h "+mins+"m"
      } else { return minutes+"m" }
    }

    inOutTime(props){//in_out: string, time: string
      let hr = parseInt(String(props.time).substring(0,3))
      let mins = String(props.time).substring(3,6)
      //console.log(props,hr,mins)
      let am_pm;
      if (hr >= 13){
        am_pm = "PM"
        hr = hr - 12
      } else { am_pm = "AM"}
      let timeStr = String(hr) +":"+ mins
      return (<>
        <div className="inOutTime">
          <p className="in_out">{props.in_out}</p>
          <p className="inOutTime">{timeStr}</p>
          <p className="am_pm">{am_pm}</p>
        </div></>
      )
    }
    
    render() {
      return (
        <>
        <section id="recentActivity" className="fit">
          <header>
            <div>
              <h2>Activity</h2>
            </div>
            <div id="dateSelection">
              <a id="activitiesBackward" onClick={() => this.changeDay("backward-one-day",state.displayingDay)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="33" fill="none" viewBox="0 0 32 33">
                  <path fill="#000" fillRule="evenodd" d="M30 16.411a14 14 0 1 0-28 0 14 14 0 0 0 28 0Zm-30 0a16 16 0 1 1 32 0 16 16 0 0 1-32 0Zm23 1a1 1 0 0 0 0-2H11.414l4.294-4.292a1.001 1.001 0 0 0-1.416-1.416l-6 6a1 1 0 0 0 0 1.416l6 6a1.001 1.001 0 0 0 1.416-1.416l-4.294-4.292H23Z" clipRule="evenodd"/>
                </svg>
              </a>
              <p id="date">{state.displayingDay}</p>
              <a id="activitiesForward" onClick={() => this.changeDay("forward-one-day",state.displayingDay)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="33" fill="none" viewBox="0 0 32 33" style={{"transform": "rotate(180deg)"}}>
                  <path fill="#000" fillRule="evenodd" d="M30 16.411a14 14 0 1 0-28 0 14 14 0 0 0 28 0Zm-30 0a16 16 0 1 1 32 0 16 16 0 0 1-32 0Zm23 1a1 1 0 0 0 0-2H11.414l4.294-4.292a1.001 1.001 0 0 0-1.416-1.416l-6 6a1 1 0 0 0 0 1.416l6 6a1.001 1.001 0 0 0 1.416-1.416l-4.294-4.292H23Z" clipRule="evenodd"/>
                </svg>
              </a>
            </div>
            <div onClick={() => this.setState({toggle:!this.state.toggle})} style={{justifyContent: "flex-end"}}>
              <button>
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="25" fill="none" viewBox="0 0 40 25">
                  { this.state.toggle ? (
                    <path xmlns="http://www.w3.org/2000/svg" fill="#000" d="M12.5 0a12.5 12.5 0 1 0 0 25h15a12.5 12.5 0 0 0 0-25h-15Zm15 22.5a10 10 0 1 1 0-20 10 10 0 0 1 0 20Z"/>
                  ):(
                    <path fill="#000" d="M27.5 2.5a10 10 0 0 1 0 20H20a12.48 12.48 0 0 0 5-10 12.48 12.48 0 0 0-5-10h7.5Zm-15 20a10 10 0 1 1 0-20 10 10 0 0 1 0 20ZM0 12.5A12.5 12.5 0 0 0 12.5 25h15a12.5 12.5 0 0 0 0-25h-15A12.5 12.5 0 0 0 0 12.5Z"/>
                  )}
                </svg>
              </button>
            </div>
          </header>
          <table id="recentActivity">
            <thead>
              <tr key={"head_tr"}>
                <th style={{"width":"24px"}}></th>
                <th style={{"width":"14rem"}}></th>
                <th style={{"width":"8rem"}}></th>
                <th style={{"width":"10ch"}}></th>
                <th style={{"width":"6rem"}}></th>
                <th style={{"width": "32px", "textAlign": "center"}}></th>
              </tr>
            </thead>
            <tbody id="recentActivityTbody">
            { this.state.displayingActivities == undefined || this.state.displayingActivities.Events.length == 0 ? (
              <tr key={"noEvents_tr"}>
                <td colSpan={6} id="noEvents">No events today.</td>
              </tr>
            ) : (
              this.state.displayingActivities.Events.map((actEvent,i) => (
                <tr id={String(actEvent._id)} key={actEvent._id+"_tr"}>
                  {actEvent.flags.includes("noID") ? (
                    <td>
                      <svg viewBox="0 0 512 512" style={{width:"1.75rem"}}>
                      {/*License: CC0. Original art by SVG Repo: https://www.svgrepo.com/svg/202851/ghost */}
                        <path style={{fill:"#CCCCCC"}} d="M420.607,164.6v303.522c0,20.451-23.636,31.857-39.647,19.119v-0.013
                          c-8.906-7.079-21.53-7.079-30.436,0l-24.435,19.449c-8.906,7.092-21.517,7.092-30.423,0l-24.435-19.449
                          c-8.906-7.079-21.53-7.079-30.436,0l-24.435,19.462c-8.906,7.079-21.517,7.079-30.423,0l-24.448-19.462
                          c-8.906-7.079-21.53-7.079-30.436,0l-0.013,0.013c-15.998,12.738-39.647,1.345-39.647-19.119V164.6
                          C91.393,73.686,165.092,0,256.006,0c45.445,0,86.601,18.421,116.39,48.21C402.185,77.987,420.607,119.143,420.607,164.6z"/>
                        <g>
                          <path style={{fill:"#666666"}} d="M195.084,114.487c17.838,0,32.301,14.45,32.301,32.288s-14.463,32.301-32.301,32.301
                            s-32.288-14.463-32.288-32.301S177.246,114.487,195.084,114.487z"/>
                          <path style={{fill:"#666666"}} d="M316.916,114.487c17.838,0,32.288,14.45,32.288,32.288s-14.45,32.301-32.288,32.301
                            c-17.838,0-32.288-14.463-32.288-32.301S299.078,114.487,316.916,114.487z"/>
                        </g>
                        <path style={{fill:"#CCCCCC"}} d="M283.918,2.36C274.846,0.812,265.522,0,256.006,0C165.092,0,91.393,73.686,91.393,164.6v303.522
                          c0,20.464,23.648,31.857,39.647,19.119l0.013-0.013c6.014-4.783,13.727-6.331,20.845-4.656c-2.918-3.933-4.681-8.855-4.681-14.45
                          V164.6C147.216,83.201,206.299,15.605,283.918,2.36z"/>
                      </svg>
                    </td>
                  ) : (
                    <td></td>
                  )}
                  <td onMouseEnter={(e) => hover([{actEvent}.actEvent.MemberID,e])} onMouseLeave={hoverOut}>{actEvent.Name}</td>
                  <td>{actEvent.event}</td>
                  <td>
                    <this.inOutTime in_out={"IN"} time={new Date(actEvent.badgeInTime).toLocaleString("en-CA", localDateTimeOptions).substring(12,17)}/>
                    <this.inOutTime in_out={"OUT"} time={new Date(actEvent.badgeOutTime).toLocaleString("en-CA", localDateTimeOptions).substring(12,17)}/>
                  </td>
                  <td>
                    <p>{ this.hourMinStr((Date.parse(actEvent.badgeOutTime) - Date.parse(actEvent.badgeInTime))/60000) }</p>
                  </td>
                  <td><AddInfoButton activity={actEvent} clickedCheckbox={(e) => this.checkboxClicked(e)} clickedAddInfo={() => openPopUp(actEvent, {displayDay: state.displayingDay, submitButtonText: "Update", "message":"Editing "+actEvent.Name+"'s event..."}, "(e) => handleSubmitPopUp(true,e)")} showCheckbox={this.state.toggle} index={i}/></td>
                </tr>))
            )}
            </tbody>
          </table>
          { this.state.firstCheckboxSelected && this.state.selected.length > 0 ? (
            <>
              <div style={{display:"flex", "justifyContent":"center"}}>
                <p style={{margin: ".5em"}}>{this.state.selected.length} Activities selected</p>
                <button type="button" style={{margin:".25em"}} onClick={(e) => batchEdit(e,this.state.selected)}>Edit</button>
                <button type="button" style={{margin:".25em"}} onClick={(e) => batchDelete(e,this.state.selected)}>Delete</button>
              </div>
            </>
          ):( <></> )}
        </section>
        </>
      );
    }
  }

  class BadgedInMembers extends React.Component{
    constructor(props){
      super(props);
      this.state = { }
    }

    Checkbox(isCertified) {
      if (isCertified.isCertified) {
        return <div className="checkbox" style={{backgroundColor: "violet"}}></div>
      } else {
        return <div className="checkbox"></div>
      }
    }

    render(){
      return(
        <>
          <section className="fit">
            {state.membersCollection.filter(member => member.badgedIn == true).length == 0 ? (
              <p style={{"textAlign":"center"}}>No one badged in...</p>
            ) : (
              <>
                <header>
                  <div>
                    <h2>{state.membersCollection.filter(member => member.badgedIn == true).length} Members in Now</h2>
                  </div>
                </header>
                <div>
                  <div className='row' style={{border: "none"}}>
                    <div className="name"></div>
                    <div className="major"></div>
                    <div className="rotated">
                      { state.configCollection?.certifications.map((cert) => 
                        <div className="certHeader" key={cert+"cert"}><p>{cert}</p></div>
                      )}
                    </div>
                    <div className="badgeOut"></div>
                  </div>
                
                  {state.membersCollection.filter(member => member.badgedIn == true).map((member) => (
                    <div key={member._id+"_badgedIn"} className="row">
                      <div className="name" onMouseEnter={(e) => hover([{member},e])} onMouseLeave={hoverOut}>{member.Name}</div>
                      <div className="major">{member.Major}</div>
                      <div className="certChecbox">
                      {state.configCollection.certifications.map((cert) => 
                        <this.Checkbox isCertified={member.Certifications.includes(cert)} key={cert+"checkbox"}/>
                      )}
                      </div>
                      <div className="badgeOut">
                        <button type="button" className="badgeOut" onClick={() => openManualBadgeOutPopup(member)}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="42" height="33" fill="none" viewBox="0 0 42 33">
                            <path fill="#000" d="M2.625 32.25S0 32.25 0 29.627c0-2.625 2.625-10.5 15.75-10.5S31.5 27 31.5 29.626s-2.625 2.625-2.625 2.625H2.625ZM15.75 16.5a7.875 7.875 0 1 0 0-15.75 7.875 7.875 0 0 0 0 15.75Z"/>
                            <path fill="#000" fillRule="evenodd" d="M28.823 15.266a.824.824 0 0 1 .824-.824h9.54l-3.535-3.534a.824.824 0 1 1 1.166-1.166l4.94 4.94a.823.823 0 0 1 0 1.166l-4.94 4.94a.825.825 0 0 1-1.166-1.165l3.535-3.534h-9.54a.823.823 0 0 1-.823-.823Z" clipRule="evenodd"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {/*<table>
                  <thead className="badgeInMembers">
                    <tr>
                      <th key={"NameHeader"}>Name</th>
                      <th key={"MajorHeader"}>Major</th>
                      { state.configCollection.certifications.map((cert) => 
                        <th key={cert+"_th"} className="rotated"><div><span>{cert}</span></div></th>
                        )}
                    </tr>
                  </thead>
                  <tbody>
                    {state.membersCollection.filter(member => member.badgedIn == true).map((member) => (
                      <tr key={member._id+"_tr"}>
                        <td onMouseEnter={(e) => hover([{member},e])} onMouseLeave={hoverOut}>{member.Name}</td>
                        <td>{member.Major}</td>
                        {state.configCollection.certifications.map((cert) => 
                          <this.Checkbox isCertified={member.Certifications.includes(cert)}/>
                        )}
                        <td>
                          <button type="button" className="badgeOut" onClick={() => openManualBadgeOutPopup(member)}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="42" height="33" fill="none" viewBox="0 0 42 33">
                              <path fill="#000" d="M2.625 32.25S0 32.25 0 29.627c0-2.625 2.625-10.5 15.75-10.5S31.5 27 31.5 29.626s-2.625 2.625-2.625 2.625H2.625ZM15.75 16.5a7.875 7.875 0 1 0 0-15.75 7.875 7.875 0 0 0 0 15.75Z"/>
                              <path fill="#000" fillRule="evenodd" d="M28.823 15.266a.824.824 0 0 1 .824-.824h9.54l-3.535-3.534a.824.824 0 1 1 1.166-1.166l4.94 4.94a.823.823 0 0 1 0 1.166l-4.94 4.94a.825.825 0 0 1-1.166-1.165l3.535-3.534h-9.54a.823.823 0 0 1-.823-.823Z" clipRule="evenodd"/>
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>*/}
              </>
            )}
            <SearchMemberBadgeIn members={members}></SearchMemberBadgeIn>
          </section>
        </>
      )
    }
  }

  class GraphStatCard extends React.Component{
    constructor(props){
      super(props);

      let goal = state.configCollection?.stats?.campusReach?.goalPercentage;
      let patronsRegistered = 0
      if (state.configCollection?.stats?.campusReach?.patronType == "All Members"){
        patronsRegistered = state.membersCollection.length
      } else {
        patronsRegistered = state.membersCollection.filter((mem) => mem.PatronType === state.configCollection?.stats?.campusReach?.patronType).length
      
        //identify how many students have graduated and subtract from the count.
        //Assuming students graduate on June 1st... (This assumpsion is weak. The config page should collect better data about semesters/academic year)
        let patrons = state.membersCollection.filter((mem) => mem.PatronType === state.configCollection?.stats?.campusReach?.patronType)

        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const isBeforeJune1 = currentDate.getMonth() < 5; // Months are zero-indexed, so May is 4

        // Filter the array based on the current date and criteria
        const filteredPatrons = patrons.filter((patron) => {
          const patronGraduationYear = parseInt(patron.GraduationYear, 10); // Parse year string to integer
          if (isBeforeJune1) {
            return patronGraduationYear < currentYear;
          } else {
            return patronGraduationYear <= currentYear;
          }
        });

        patronsRegistered = patronsRegistered - filteredPatrons.length
      }

      this.state = { 
        patronsRegistered: patronsRegistered,
        goal: goal,
        progress: patronsRegistered / state.configCollection?.stats?.campusReach?.campusPopulation * 100,
      }
    }
    
    render(){
      return(
        <div className="statCard">
          <h3>{this.props.statTitle}</h3>
          <h2>{Math.round(this.state.progress * 10) / 10}%</h2>
          <div style={{width: "100%"}}>
            <h4>Goal: {this.state.goal}%</h4>
            <div className="progressBar">
              <div className="progress" style={{width: String(this.state.progress / this.state.goal * 100) +"%", maxWidth: "100%"}}></div>
            </div>
          </div>
        </div>
      )
    }
  }

  class StatCard extends React.Component{
    render(){
      return(
        <div className="statCard">
          <h3>{this.props.statTitle}</h3>
        </div>
      )
    }
  }


  return (
    <>
    <style>{` html { background: #D9D9D9; } `}</style>
    <Head>
      <title>Eyra</title>
      <link rel="icon" href="/icon_256x256.ico" />
    </Head>
    
    <header id="header">
      <h1 className="gradient">Eyra</h1>
      <h1 id="org_name"></h1>
      <nav>
        <a id="stats" href="/stats">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" viewBox="0 0 43 42">
            <path fill="#000" fillRule="evenodd" d="M.775 0h2.614v39.375H42.6V42H.775V0Zm26.14 9.188a1.315 1.315 0 0 1 1.308-1.313h10.456c.347 0 .679.138.924.384.245.247.383.58.383.928v10.5c0 .349-.138.682-.383.929a1.304 1.304 0 0 1-2.231-.928v-6.825l-9.445 11.594a1.308 1.308 0 0 1-1.48.393 1.307 1.307 0 0 1-.454-.296l-6.763-6.79-9.557 13.195a1.306 1.306 0 0 1-2.314-.583 1.317 1.317 0 0 1 .202-.96l10.456-14.438a1.31 1.31 0 0 1 .955-.537 1.301 1.301 0 0 1 1.027.38l6.82 6.851L35.92 10.5h-7.698c-.347 0-.68-.138-.924-.384a1.316 1.316 0 0 1-.383-.928Z" clipRule="evenodd"/>
          </svg>
        </a>
        <button className="cornerButton" id={"config_"+String(state.configCollection == undefined || !state.configCollection.hasOwnProperty("_id"))} onClick={() => toggleConfigPopup()}>
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" viewBox="0 0 42 42">
            <path fill="#000" d="M21 12.48a8.52 8.52 0 0 0-7.872 11.78A8.52 8.52 0 1 0 21 12.48ZM15.104 21a5.895 5.895 0 1 1 11.791 0 5.895 5.895 0 0 1-11.79 0Z"/>
            <path fill="#000" d="M25.715 3.525c-1.384-4.698-8.046-4.698-9.43 0l-.246.838a2.291 2.291 0 0 1-3.295 1.365l-.766-.42c-4.305-2.342-9.012 2.368-6.668 6.67l.418.766a2.291 2.291 0 0 1-1.365 3.295l-.838.246c-4.698 1.384-4.698 8.046 0 9.43l.838.246a2.293 2.293 0 0 1 1.365 3.295l-.42.766c-2.342 4.305 2.365 9.014 6.67 6.668l.766-.418a2.293 2.293 0 0 1 3.295 1.365l.246.838c1.384 4.698 8.046 4.698 9.43 0l.246-.838a2.291 2.291 0 0 1 3.295-1.365l.766.42c4.305 2.344 9.014-2.367 6.668-6.67l-.418-.766a2.29 2.29 0 0 1 1.365-3.295l.838-.246c4.698-1.384 4.698-8.046 0-9.43l-.838-.246a2.291 2.291 0 0 1-1.365-3.295l.42-.766c2.344-4.305-2.367-9.012-6.67-6.668l-.766.418a2.292 2.292 0 0 1-3.295-1.365l-.246-.838Zm-6.912.743c.646-2.192 3.748-2.192 4.394 0l.247.838a4.916 4.916 0 0 0 7.069 2.927l.764-.42c2.005-1.09 4.2 1.102 3.108 3.11l-.417.767a4.916 4.916 0 0 0 2.929 7.066l.835.247c2.192.646 2.192 3.748 0 4.394l-.838.247a4.916 4.916 0 0 0-2.926 7.069l.42.764c1.089 2.005-1.103 4.2-3.111 3.108l-.764-.417a4.916 4.916 0 0 0-7.07 2.929l-.246.835c-.646 2.192-3.748 2.192-4.394 0l-.247-.838a4.917 4.917 0 0 0-7.066-2.926l-.767.42c-2.005 1.089-4.2-1.103-3.108-3.111l.418-.764a4.917 4.917 0 0 0-2.927-7.072l-.838-.246c-2.192-.646-2.192-3.749 0-4.395l.838-.247a4.917 4.917 0 0 0 2.927-7.063l-.42-.767c-1.09-2.005 1.102-4.2 3.11-3.108l.767.418a4.916 4.916 0 0 0 7.066-2.927l.247-.838Z"/>
          </svg>
        </button>
      </nav>
    </header>

    <main>
      {state.isOpen ? (
        <React.Fragment>
          <section className="Popup">
            <Popup 
              //badgeInDate={new Date(state.activityEvent.badgeInTime).toLocaleString("en-CA", localDateTimeOptions).substring(0,10)} //In local time
              //badgeInTime={new Date(state.activityEvent.badgeInTime).toLocaleString("en-CA", localDateTimeOptions).substring(12,17)} //In local time
              //badgeOutDate={new Date(state.activityEvent.badgeOutTime).toLocaleString("en-CA", localDateTimeOptions).substring(0,10)} //In local time
              //badgeOutTime={new Date(state.activityEvent.badgeOutTime).toLocaleString("en-CA", localDateTimeOptions).substring(12,17)} //In local time
              inTime={state.activityEvent.badgeInTime}
              outTime={state.activityEvent.badgeOutTime}
              message={state.displayProps.message}
              submitButtonText={state.displayProps.submitButtonText}
              existsInDB={false}
              noId={false}
              event={state.activityEvent.event}
              //submitting={() => console.log("test!")}
            />
          </section>
          <div id="blur"></div>
        </React.Fragment>
      ) : ( <></> )}

      { state.showConfigPopup ?  <ConfigPopup cancel={toggleConfigPopup}/> : <></> }

      <div className="column" id="c1">
        <BadgedInMembers></BadgedInMembers>
        <RecentActivity></RecentActivity>
      </div>
      <div className="column" id="c2">
        <GraphStatCard statTitle="Campus Reach"/>
      </div>
    </main>
    </>
  )
}

export async function getStaticProps(context) {
  const client = await clientPromise

  //Fetch "members" and "activities" Collection as server-side props
  const membersCollection = await client.db().collection("members");
  const membersArray = await membersCollection.find({}).toArray();
  const membersP = JSON.parse(JSON.stringify(membersArray));

  const activityCollection = await client.db().collection("activities");
  const activityArray = await activityCollection.find({}).toArray();
  const activityP = JSON.parse(JSON.stringify(activityArray));

  const configCollection = await client.db().collection("configs");
  const configArray = await configCollection.find({}).toArray();
  const configP = JSON.parse(JSON.stringify(configArray));

  return { 
    props: { members: membersP, activities: activityP, config: configP } 
  }
}