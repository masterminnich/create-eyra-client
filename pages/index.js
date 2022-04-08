import Head from 'next/head'
import clientPromise from '../lib/mongodb'
import React, { Component, useState, useEffect } from 'react';
import { Button, Form } from 'semantic-ui-react';

var vMember = {};
var vSession = [];
var editEvent = {};
let isHovering = false; //Whether the user is currently hovering over an element of interest
let hoverTimerId;

let GlobalRecentActivityDate = new Date() //This variable keeps track of which day Recent Activity compononet is current displaying. This is important because otherwise state updates would set Recent Activity day to current date. 

function reloadPage(){

}

function ensureCertifications(form, member){
  console.log("member",member)
  if (form.event == "Certification"){
    if (form.machineUtilized.includes("FourAxisMill")){ member.FourAxisMillCertified = true }
    if (form.machineUtilized.includes("BantamMill")){ member.BantamMillCertified = true }
    if (form.machineUtilized.includes("Glowforge")){ member.GlowforgeCertified = true }
    if (form.machineUtilized.includes("P9000")){ member.P9000Certified = true }
    if (form.machineUtilized.includes("Sewing")){ member.SewingCertified = true }
    if (form.machineUtilized.includes("Silhouette")){ member.SilhouetteCertified = true }
    if (form.machineUtilized.includes("Ultimaker")){ member.UltimakerCertified = true }
    if (form.machineUtilized.includes("Fusion")){ member.FusionCertified = true }
    if (form.machineUtilized.includes("VectorCAD")){ member.VectorCADCertified = true }
    if (form.machineUtilized.includes("CircuitDesign")){ member.CircuitDesignCertified = true }
  }
  return member
}

function toEDTString(dateObj){
  // Converts a DateObj into a DateStr in local EDT time (YYYY-MM-DDTHH:MM:SS). Based on a modified ISO format.
  if (typeof(dateObj) == "string"){ dateObj = new Date(dateObj) } //If function is passed a dateStr instead of a dateObj cast the date to an object before proceeding. 
  let dateUTCOffsetAdded = new Date(dateObj.getTime() - (dateObj.getTimezoneOffset() * 60000))
  var dateEDTStr = dateUTCOffsetAdded.toISOString()//.substring(0,19); 
  return dateEDTStr
}


/* Start Tooltips Code */
function hover(params){ //Checks to see if an element has been hovered over for 2 seconds or more. params = [memberDataOrId, parentElement]. parentElement is the element is which the hover originated. 
  let memberDataOrId = params[0] 
  let parentElement = params[1].target
  //console.log("target",parentElement,"memberDataOrId:",memberDataOrId,typeof(memberDataOrId))
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

function createTooltip(memberData,parentElement){
  console.log("Making tooltip for ",parentElement,"w/ data:",memberData)
  let dataToKeep = {"Patron Type":memberData["PatronType"],"Major":memberData["Major"],"GraduationYear":memberData["GraduationYear"],"RFID UID":memberData["rfid"],"joinedDate":memberData["joinedDate"]}//,memberData["lastBadgeIn"]
  let span = document.createElement("span")
  span.className = "tooltip"
  let arrow = document.createElement("div")
  arrow.className="tooltipArrow"
  span.appendChild(arrow);
  let dataToKeepKeys = Object.keys(dataToKeep) //The keys are the name of the attribute to be printed
  for (let i=0;i<dataToKeepKeys.length;i++){ //Create a seperate p element for each attribute.
    let value = dataToKeep[dataToKeepKeys[i]]
    let p1 = document.createElement("p")
    let p2 = document.createElement("p")
    let div = document.createElement("div")
    p1.innerText = dataToKeepKeys[i]+": "
    p1.id = "tooltip_info_p1"+dataToKeepKeys[i]
    p1.className = "tooltip_attribute"
    p2.innerText = String(value)
    p2.id = "tooltip_info_p2"+dataToKeepKeys[i]
    p2.className = "tooltip_attribute"
    div.appendChild(p1)
    div.appendChild(p2)
    span.appendChild(div)
  }
  parentElement.appendChild(span)
}

const getMemberDataFromID = async (memberID,parentElement) => { //Fetch member data from MongoDB for a specific member
  try {  
      const res = await fetch(`/api/members/${memberID}`, {
          method: 'GET',
          headers: {
              "Accept": "application/json",
              "Content-Type": "application/json"
          }
      })
      let response = res.json();
      response.then((resp) => {
        let memberData = resp.data
        //console.log("Got",memberID," member data",memberData)
        createTooltip(memberData,parentElement)
      })
  } catch (error) { console.log(error); }
}

function createMemberTooltip(memberDataOrId,parentElement){
  if (typeof(memberDataOrId) == "object"){ //memberDataOrId is a member object
    createTooltip(memberDataOrId["member"],parentElement)
  } else { //memberDataOrId is member._id as a string
    getMemberDataFromID(memberDataOrId,parentElement);
  }
}
/* End Tooltips Code */


const moveEvent = async (activity, ActivityToMove, existing) => {
  let eventsAfter;
  let dateStr = ActivityToMove.badgeOutTime.substring(0,10); //Get Date
  console.log("activity is being moved to a different date.")
  if (existing){
    //Get existing events, Append new event to the end, Update the activity.
    console.log("ActivityDay already exists")
    let ActivityDay = activity.find(a => a.Date == dateStr)
    let eventsBefore = ActivityDay.Events
    eventsBefore.push(ActivityToMove)
    eventsAfter = eventsBefore
    try {
      const res = await fetch(`/api/activity`, {
          method: 'PUT',
          headers: {
              "Accept": "application/json",
              "Content-Type": "application/json"
          },
          body: JSON.stringify({Date: dateStr, Events: eventsAfter})
      }).then(setTimeout(() => { window.location.reload() }, 200));
      console.log("moveEvent(): Success adding event to existing date",dateStr, res);
    } catch (error) { console.log("Error adding to Activity collection. moveEvent()",error) }
  } else {
    //Append the new event, Create the ActivityDay.
    console.log("Creating new ActivityDay")
    eventsAfter = ActivityToMove
    try {
      const res = await fetch(`/api/activity`, {
          method: 'POST',
          headers: {
              "Accept": "application/json",
              "Content-Type": "application/json"
          },
          body: JSON.stringify({Date: dateStr, Events: eventsAfter})
      }).then(setTimeout(() => { window.location.reload() }, 200));
      console.log("moveEvent(): Success adding event to existing date",dateStr, res);
    } catch (error) { console.log("Error adding to Activity collection. moveEvent()",error) }
  }
  console.log("TO DO: members Collection is messed up. Delete the event before appending new.")
}

const updateMemberBadgeInStatus = async (member) => {
  try {  
    const res = await fetch(`/api/members/${member._id}`, {
      method: 'PUT',
      headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
      },
      body: JSON.stringify(member)
    }).then(setTimeout(() => { window.location.reload() }, 200));
  } catch (error) { console.log("ERROR:",error); }
}

const updateActivityByDate = async (date, events) => {
  console.log("date",date,"Evemts",events)
  try {  
      const res = await fetch(`/api/activity`, {
          method: 'PUT',
          headers: {
              "Accept": "application/json",
              "Content-Type": "application/json"
          },
          body: JSON.stringify({Date: date, Events: events})
      }).then(setTimeout(() => { window.location.reload() }, 200));
  } catch (error) { console.log("ERROR:",error); }
}

const createNewActivity = async (date, events) => {
  try {
    const res = await fetch(`/api/activity`, {
        method: 'POST',
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
        },
        body: JSON.stringify({Date: date, Events: events})
    })//.then(setTimeout(() => { window.location.reload() }, 200));
    console.log("date:",date,"res",res);
  } catch (error) { console.log("ERROR:",error) }
}

const deleteActivity = async(props) => {
  let [e,activityCollection,membersCollection,vSession,vMember,existing] = props
  //console.log("props:",[activityCollection,membersCollection,vSession,vMember,existing])
  console.log("Attempting to delete an event from the Activities collection...")
  let date = vSession.badgeOut.slice(0,10)
  if(existing){ //If deleting an event that exists in the DB
    let activityDay = activityCollection.find(e => e.Date == date)//Find the correct day inside the activityCollection
    let remainingEvents = activityDay.Events.filter(event => event._id !== e.target.name)
    let foundEvent = activityDay.Events.filter(event => event._id == e.target.name)//e.badgeOutTime == vSession.badgeOut && e.badgeInTime == vSession.badgeIn)//Find the correct day inside the activityCollection

    if(foundEvent.length == 1){
      console.log("Found event, attempting to delete:",foundEvent)
      updateActivityByDate(date, remainingEvents)
    } else {
      let trList = document.getElementsByClassName("tr_event");
      console.log("ERROR deleting event: couldn't find event")
    }
  } else { //If deleting an event that hasn't been added to the DB yet
    console.log("activity not in DB yet...")
    //Ensure member is badged out
    //Check if lastIn time changed
    vMember.badgedIn = false;
    updateMemberBadgeInStatus(vMember)
  }
}

const badgeInByRFID = async (RFID_UID_input) => {
  try {
    const res = await fetch('/api/badgeIn', {
      method: 'POST',
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({rfid: RFID_UID_input})
    }).then(setTimeout(() => { window.location.reload() }, 200));
    let response = res.json();
    response.then((resp) => {
      console.log(resp.data);
    });
  } catch (error) { console.log("Error badging in member",error) }
}

//creates a new activity upon badge out
const updateActivityLog = async (activity, newActivity, existing) => {
  //console.log('activity',activity,'newActivity',newActivity);

  let dateStr = newActivity.badgeOutTime.substring(0,10); //Get Date
  let ActivityDay = activity.find(a => a.Date == dateStr) //Get the activity document for the correct day

  if (existing !== false){ //Updating an existing event
    let activityID = existing
    console.log('activity',activity,'newActivity',newActivity,'ActivityDay',ActivityDay,'activityID',activityID);

    let prevBadgeOutDate = String(editEvent["badgeOutTime"]).substring(0,10);
    let newBadgeOutDate = newActivity["badgeOutTime"].substring(0,10);

    if (prevBadgeOutDate !== newBadgeOutDate){ //Check if the activity is being moved to another date.
      //Date of the activity has changed. Delete the event from the old activity.
      let prevDate = document.getElementById("date").innerText //Fetches the date currently being displayed by Recent Activity component
      let prevActivityDay = activity.find(a => a.Date == prevDate)
      let prevActivityEvents = prevActivityDay.Events
      //console.log("prevDate",prevDate,"prevActivityEvents",prevActivityEvents)
      for (let i=0;i<Object.keys(prevActivityEvents).length;i++){ 
        if(prevActivityEvents[i]._id == activityID){
          delete prevActivityEvents[i] //Remove that event from ActivityDay
          prevActivityEvents = prevActivityEvents.filter(ee => ee[0] !== null) //The previous line replaces the event with empty. This line deletes any empty objects that are created by the previous line.
          console.log("prevActivityDay After",prevActivityDay)

          //Update the activity Day 
          try {
            const res = await fetch(`/api/activity`, {
                method: 'PUT',
                headers: {
                  "Accept": "application/json",
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({Date: prevDate, Events: prevActivityEvents})
            }).then(setTimeout(() => { window.location.reload() }, 200));
          } catch (error) { console.log("Error adding to Activity collection.",error) }    
        
          //Move the event to the new day.
          if (ActivityDay){ //If the day we are moving the event to already exists, append this event to the end of that day.
            moveEvent(activity,newActivity,true)
          } else{  //If the day we are moving the event to doesn't exist, create a new ActivityDay.
            moveEvent(activity,newActivity,false)
          }
        }
      }
    } else { //Event is not being moved to a different day

      let DayEvents = ActivityDay.Events.filter(a => a._id !== editEvent._id) //Remove the event from the ActivityDaily document so we can add it back in.
      let DroppedEvent = ActivityDay.Events.filter(a => a._id == editEvent._id) //Remove the event from the ActivityDaily document so we can add it back in.
      let DayEventsAfter = DayEvents.concat(newActivity); //All events from the day.

      //update Member Session.  Search vMember for prevBadgeInTime, then drop that session and save back to vMember
      const prevBadgeInTime = String(editEvent["badgeOutTime"]);//DroppedEvent[0].badgeInTime);
      if(typeof(vMember)!=="undefined"){ //Check to make sure vMember exists. This value is undefined while editing events from unknown members.
        let keepEvents = vMember.sessions.filter(vm => vm.badgeIn !== prevBadgeInTime)
        let droppedEvent = vMember.sessions.filter(vm => vm.badgeIn == prevBadgeInTime)
        let newSession = {badgeInTime: newActivity.badgeInTime, badgeOutTime: newActivity.badgeOutTime, sessionLengthMinutes: newActivity.sessionLengthMinutes}
        vMember.sessions = keepEvents
        console.log("keepEvents",keepEvents,"DayEventsAfter",DayEventsAfter)
      }

      try {
        const res = await fetch(`/api/activity`, {
            method: 'PUT',
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({Date: dateStr, Events: DayEventsAfter})
        }).then(setTimeout(() => { window.location.reload() }, 200));
        console.log("updateActivityLog(): Success adding event to existing date",dateStr, res);
      } catch (error) { console.log("Error adding to Activity collection.",error) }
    }
  } else {
  if (ActivityDay){
    console.log("date found. Check the code. This may be redundant...");
    try {
      let acitivitiesBefore = ActivityDay.Events
      let activitiesAfter = acitivitiesBefore.concat(newActivity);

      const res = await fetch(`/api/activity`, {
          method: 'PUT',
          headers: {
              "Accept": "application/json",
              "Content-Type": "application/json"
          },
          body: JSON.stringify({Date: dateStr, Events: activitiesAfter})
      }).then(setTimeout(() => { window.location.reload() }, 200));
      console.log("updateActivityLog(): Success adding event to existing date (ActivityDay)",dateStr);
      
    } catch (error) {
      console.log("Error adding to Activity collection.",error);
    }
  } else { 
    //No acitivities yet today... adding a new date to the Activity collection.
    console.log("No activity with date",dateStr);
    try {
      const res = await fetch(`/api/activity`, {
          method: 'POST',
          headers: {
              "Accept": "application/json",
              "Content-Type": "application/json"
          },
          body: JSON.stringify({Date: dateStr, Events: newActivity})
      }).then(setTimeout(() => { window.location.reload() }, 200));
      console.log("updateActivityLog(): Success adding event to new date ",dateStr);


    } catch (error) {
      console.log("Error adding to Activity collection.",error);
    }
  }
  }
}

export default function Home({ isConnected, members, activity }) {

  const [isOpen, setisOpen] = useState(false);
  const [editIsOpen, seteditIsOpen] = useState(false);
  const [form, setForm] = useState({ 
    badgeInTime: '', Name: '', MemberID: '', badgeInTime: '', badgeOutTime: '', sessionLengthMinutes: '', event: '', machineUtilized: ''
  });
  const [Editform, setEditForm] = useState({ 
    badgeInTime: '', Name: '', MemberID: '', badgeInTime: '', badgeOutTime: '', sessionLengthMinutes: '', event: '', machineUtilized: '', prevBadgeOutTime: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [errors, setErrors] = useState({});
  const [ActivityId, setActivityId] = useState({});
  const [ActivityName, setActivityName] = useState({});

  useEffect(() => {
    if (isSubmitting) {
        if (Object.keys(errors).length === 0) {
          updateActivityLog(activity,form,false);
          console.log("Attempting to add activity to DB:",form)
          //console.log("activity",activity,"form",form,"members",members)

          //Append a new session to the member
          let foundMember = members.filter(member => member._id == form.MemberID)[0]
          let newSession = {'badgeIn': form.badgeInTime, 'badgeOut':form.badgeOutTime, 'sessionLengthMinutes': form.sessionLengthMinutes};
          let memberSessionsBefore = foundMember.sessions;
          foundMember.sessions = memberSessionsBefore.concat(newSession);
          foundMember.badgedIn = false;
          foundMember.lastBadgeIn = form.badgeOutTime;
          let memberEnsured = ensureCertifications(form, foundMember)
          updateMemberBadgeInStatus(memberEnsured);
        }
        else {
            setIsSubmitting(false);
            console.log("Error submitting form.",errors)
        }
    }
  }, [errors])


  function validate(e) {
    let err = {};
    let reqVariables = ['MemberID', 'Name','badgeInTime','badgeOutTime', 'event'];
    
    /*
    for (let i = 0; i < reqVariables.length; i++) {
      if (e.target[reqVariables[i]].value == "") {
        err[reqVariables[i]] = reqVariables[i]+" is required";
      }
    }

    if (e.target.sessionLengthMinutes.value == NaN){
      err.sessionLengthMinutes = "sessionLengthMinutes cannot be NaN"
    }*/

    console.log("REMINDER: Popup in index.js does not have a validation function")
    //console.log("(debug) e:",e.target)

    return err;
  }

  class VisitType extends React.Component{
    constructor(props){
      super(props);
      this.selectValue = this.props.selectValue;
    }
    
    render(){
      return(
        <>
          <div id="visitType" style={{"display":"flex"}}>
            <label htmlFor="event">Visit Type: </label>
            <select defaultValue={this.selectValue} name="event">
              <option value="Undefined">Undefined</option>
              <option value="Individual">Personal Project</option>
              <option value="Certification">Certification</option>
              <option value="Homework / Class Project">Homework / Class Project</option>
              <option value="Class">Class</option>
              <option value="Event">Event</option>
              <option value="Quick Visit">Quick Visit</option>
              <option value="Staff on Duty">Staff on Duty</option>
            </select>
          </div>
        </>
      )
    }
  }

  const handleSubmit = (e) => {
    //Concatenate checkboxes... All checked boxes get added to an array
    let machinesList = ["FourAxisMill","BantamMill","Glowforge","P9000","Sewing","Silhouette","Ultimaker","Fusion","VectorCAD","CircuitDesign"];
    let machinesInUse = [];
    for (let j = 0; j < machinesList.length; j++) {
      if (e.target[machinesList[j]].checked){machinesInUse.push(machinesList[j])}
    }

    //Check if input field changed from default value
    let badgedInTime = ''; let badgedOutTime = '';
    if (e.target.badgeInTime.value == ""){
      badgedInTime = e.target.badgeInTime.placeholder
    } else { 
      badgedInTime = e.target.badgeInTime.value
    }
    if (e.target.badgeOutTime.value == ""){
      badgedOutTime = e.target.badgeOutTime.placeholder
    } else { badgedOutTime = e.target.badgeOutTime.value }

    //Calculate sessionLengthMinutes
    let outDate = new Date(badgedOutTime);
    let inDate = new Date(badgedInTime);
    let sessionLengthMinutes = Math.round(outDate - inDate)/60000

    setForm({
      ...form,
      ["event"]: e.target.event.value,
      ["Name"]: vMember.Name,
      ['MemberID']: vMember['_id'],
      ["badgeOutTime"]: badgedOutTime,
      ["badgeInTime"]: badgedInTime,
      ["sessionLengthMinutes"]: sessionLengthMinutes,
      ['machineUtilized']: machinesInUse,
    })

    e.preventDefault();
    let errs = validate(e);
    setErrors(errs);
    setIsSubmitting(true);
    setisOpen(false) //This stops rendering the Popup component
  }

  const closeEditPopup = async() => {
    seteditIsOpen(false);
  }

  const closePopup = async() => {
    setisOpen(false);
  }

  function Popup(props) {
    console.log("Popup activity",activity)
    return (
    <>
      <h1 id="badgingOutTitle">Badging out {vMember.Name}...</h1>
      <Form onSubmit={handleSubmit}>
        <VisitType/>
        <Form.Input
          label='Badged In: '
          placeholder={toEDTString(new Date(vSession.badgeIn)).substring(0,19)}
          defaultValue={toEDTString(new Date(vSession.badgeIn)).substring(0,19)}
          name='badgeInTime'
        />
        <Form.Input
          label='Badged Out: '
          placeholder={toEDTString(new Date(vSession.badgeOut)).substring(0,19)}
          defaultValue={toEDTString(new Date(vSession.badgeOut)).substring(0,19)}
          name='badgeOutTime'
        />
        <div className="checkboxes">
        <p>Machines Utilized (Certification Required):</p>
          <div><input type="checkbox" id="FourAxisMill" name="FourAxisMill"/>
          <label htmlFor="FourAxisMill">Four Axis Mill</label></div>
          <div><input type="checkbox" id="BantamMill" name="BantamMill"/>
          <label htmlFor="BantamMill">Bantam Mill</label></div>
          <div><input type="checkbox" id="Glowforge" name="Glowforge"/>
          <label htmlFor="Glowforge">Glowforge</label></div>
          <div><input type="checkbox" id="P9000" name="P9000"/>
          <label htmlFor="P9000">P9000</label></div>
          <div><input type="checkbox" id="Sewing" name="Sewing"/>
          <label htmlFor="Sewing">Sewing</label></div>
          <div><input type="checkbox" id="Silhouette" name="Silhouette"/>
          <label htmlFor="Silhouette">Silhouette</label></div>
          <div><input type="checkbox" id="Ultimaker" name="Ultimaker"/>
          <label htmlFor="Ultimaker">Ultimaker</label></div>
          <div><input type="checkbox" id="Fusion" name="Fusion"/>
          <label htmlFor="Fusion">Fusion</label></div>
          <div><input type="checkbox" id="VectorCAD" name="VectorCAD"/>
          <label htmlFor="VectorCAD">Vector CAD</label></div>
          <div><input type="checkbox" id="CircuitDesign" name="CircuitDesign"/>
          <label htmlFor="CircuitDesign">Circuit Design</label></div>
        </div>

        <Button type='button' id="deleteActivityButton" onClick={(e) => deleteActivity([e,activity, members, vSession, vMember,false])}></Button>

        <Button type='submit' id="submitBadgeOutPopup">Badge Out</Button>
        <Button type='button' id="cancelPopupButton" onClick={() => closePopup()}>Cancel</Button>
      </Form>
    </>
    )
  }

  useEffect(() => {
    if (isSubmittingEdit) {
      if (Object.keys(errors).length === 0) {
        //Find and replace activity.
        let activityID = editEvent._id

        console.log("Updating activity from DB:",Editform)
        updateActivityLog(activity,Editform,activityID);
        //console.log("activity",activity,"Editform",Editform,"members",members)

        //Find and replace member session.
        let foundMemberList = members.filter(member => member._id == Editform.MemberID)
        if(foundMemberList.length == 1){ //Make sure only one member fits the search. This will fail if the member is unknown (they aren't in the members collection)
          let foundMember = foundMemberList[0] 
          let newSession = {'badgeIn': Editform.badgeInTime, 'badgeOut':Editform.badgeOutTime, 'sessionLengthMinutes': Editform.sessionLengthMinutes};
          let foundSessions = foundMember.sessions.filter(fmem => fmem.badgeOut !== Editform.prevBadgeOutTime)
          foundMember.sessions = foundSessions.concat(newSession);
          foundMember.lastBadgeIn = Editform.badgeOutTime;
          let memberEnsured = ensureCertifications(Editform, foundMember)
          updateMemberBadgeInStatus(memberEnsured);
        }
      }
      else {
        setIsSubmittingEdit(false);
        console.log("Error submitting form.",errors)
      }
    }
  }, [errors])

  const handleEditSubmit = (e) => {
    //Concatenate checkboxes... All checked boxes get added to an array
    let machinesList = ["FourAxisMill","BantamMill","Glowforge","P9000","Sewing","Silhouette","Ultimaker", "Fusion","VectorCAD","CircuitDesign"];
    let machinesInUse = [];
    for (let j = 0; j < machinesList.length; j++) {
      if (e.target[machinesList[j]].checked){machinesInUse.push(machinesList[j])}
    }

    //Check if input field changed from default value
    let badgedInTime = ''; let badgedOutTime = '';
    if (e.target.badgeInTime.value == ""){
      badgedInTime = e.target.badgeInTime.placeholder
    } else { 
      badgedInTime = e.target.badgeInTime.value 
    }
    if (e.target.badgeOutTime.value == ""){
      badgedOutTime = e.target.badgeOutTime.placeholder
    } else { badgedOutTime = e.target.badgeOutTime.value }

    //Calculate sessionLengthMinutes
    let outDate = new Date(badgedOutTime);
    let inDate = new Date(badgedInTime);
    let sessionLengthMinutes = Math.round(outDate - inDate)/60000  


    let memberName = ""; let memberID = "";
    if(typeof(vMember)=="undefined"){ //If vMember.Name doesn't exist. (This happens when editing events of Unknown Members)
      memberName = ActivityName;
      memberID = ActivityId;
    }else{ 
      memberName = vMember.Name;
      memberID = vMember['_id'];
    }

    setEditForm({
      ...Editform,
      ["event"]: e.target.event.value,
      ["Name"]: memberName,
      ['MemberID']: memberID,
      ["badgeOutTime"]: badgedOutTime,
      ["badgeInTime"]: badgedInTime,
      ["sessionLengthMinutes"]: sessionLengthMinutes,
      ['machineUtilized']: machinesInUse,
    })

    e.preventDefault();
    let errs = validate(e);
    setErrors(errs);
    setIsSubmittingEdit(true);
    seteditIsOpen(false) //This closes the component
  }

  function EditPopup(props) {
    return (
    <>
      <h1 id="badgingOutTitle">Editing Activity</h1>
      <Form onSubmit={handleEditSubmit}>
        <VisitType selectValue={vSession.visitType}/>
        <Form.Input
          label='Badged In: '
          placeholder={toEDTString(new Date(vSession.badgeIn)).substring(0,19)}
          defaultValue={toEDTString(new Date(vSession.badgeIn)).substring(0,19)}
          name='badgeInTime'
        />
        <Form.Input
          label='Badged Out: '
          placeholder={toEDTString(new Date(vSession.badgeOut)).substring(0,19)}
          defaultValue={toEDTString(new Date(vSession.badgeOut)).substring(0,19)}
          name='badgeOutTime'
        />
        
        <div className="checkboxes">
        <p>Machines Utilized (Certification Required):</p>
          <div><input type="checkbox" id="FourAxisMill" name="FourAxisMill" defaultChecked={vSession.machineUtilized.includes("FourAxisMill")}/>
          <label htmlFor="FourAxisMill">Four Axis Mill</label></div>
          <div><input type="checkbox" id="BantamMill" name="BantamMill" defaultChecked={vSession.machineUtilized.includes("BantamMill")}/>
          <label htmlFor="BantamMill">Bantam Mill</label></div>
          <div><input type="checkbox" id="Glowforge" name="Glowforge" defaultChecked={vSession.machineUtilized.includes("Glowforge")}/>
          <label htmlFor="Glowforge">Glowforge</label></div>
          <div><input type="checkbox" id="P9000" name="P9000" defaultChecked={vSession.machineUtilized.includes("P9000")}/>
          <label htmlFor="P9000">P9000</label></div>
          <div><input type="checkbox" id="Sewing" name="Sewing" defaultChecked={vSession.machineUtilized.includes("Sewing")}/>
          <label htmlFor="Sewing">Sewing</label></div>
          <div><input type="checkbox" id="Silhouette" name="Silhouette" defaultChecked={vSession.machineUtilized.includes("Silhouette")}/>
          <label htmlFor="Silhouette">Silhouette</label></div>
          <div><input type="checkbox" id="Ultimaker" name="Ultimaker" defaultChecked={vSession.machineUtilized.includes("Ultimaker")}/>
          <label htmlFor="Ultimaker">Ultimaker</label></div>
          <div><input type="checkbox" id="Fusion" name="Fusion" defaultChecked={vSession.machineUtilized.includes("Fusion")}/>
          <label htmlFor="Fusion">Fusion</label></div>
          <div><input type="checkbox" id="VectorCAD" name="VectorCAD" defaultChecked={vSession.machineUtilized.includes("VectorCAD")}/>
          <label htmlFor="VectorCAD">Vector CAD</label></div>
          <div><input type="checkbox" id="CircuitDesign" name="CircuitDesign" defaultChecked={vSession.machineUtilized.includes("CircuitDesign")}/>
          <label htmlFor="CircuitDesign">Circuit Design</label></div>
        </div>

        
        <Button type='button' name={ActivityId} id="deleteActivityButton" onClick={(e) => deleteActivity([e,activity, members, vSession, vMember, true])}></Button>

        <Button type='submit' id="submitBadgeOutPopup">Update</Button>
        <Button type='button' id="cancelPopupButton" onClick={() => closeEditPopup()}>Cancel</Button>
      </Form>
    </>
    )
  }

  function updateMemberBadgeInStatusManually(member, activity) {
    //Convert UTC to local time
    let currDate = new Date();
    let dateEDTStr = toEDTString(currDate).substring(0,19) //Convert DateObj into a dateStr in local EDT time (YYYY-MM-DDTHH:MM:SS)

    vSession = {'badgeIn':toEDTString(member.lastBadgeIn).substring(0,19), 'badgeOut':dateEDTStr}//member.sessions[member.sessions.length-1].badgeIn}
    
    vMember = member //save member to a global variable

    setisOpen(true) //This renders the Popup component
  }

  const editActivity = async (actEvent) => {
    console.log("editActivity()  actEvent",actEvent)
    editEvent = actEvent;
    vSession = {'badgeIn':actEvent.badgeInTime,'badgeOut':actEvent.badgeOutTime, 'visitType':actEvent.event,"machineUtilized":actEvent.machineUtilized}
    vMember = members.filter(m => m._id == actEvent.MemberID)[0] //save member to global variable
    seteditIsOpen(true) //Open popup
    setActivityId(actEvent._id)
    setActivityName(actEvent.Name)
  }

  const certificationList = ['UltimakerCertified', 'GlowforgeCertified', 'FourAxisMillCertified', 'BantamMillCertified', 'P9000Certified', 'SewingCertified', 'SilhouetteCertified', 'FusionCertified', 'VectorCADCertified', 'CircuitDesignCertified'];
  const certificationNames = ['Ultimaker','Glowforge','Four Axis Mill', 'Bantam Mill', 'P9000', 'Sewing', 'Silhouette', 'Fusion', 'VectorCAD', 'CircuitDesign'];

  class MachinesUtilized extends React.Component{
    constructor(props){
      super(props);
      this.state = {
        machines: [] //List of machines utilize
      }
    }

    updateState = (e) => {
      let machinesInUse = this.state.machines
      if (e.target.checked){
        machinesInUse.push(e.target.id)
      } else { 
        machinesInUse = machinesInUse.filter(m => m !== e.target.id)
        this.setState({"machines":machinesInUse})
      }      
    }

    render(){
      return(
        <>
          <div onClick={this.updateState} className="checkboxes">
            <p>Machines Utilized (Certification Required):</p>
            <fieldset id="machinesUtilized" style={{"display": "inline-block","position": "relative","textAlign": "initial","float":"left","border":"none"}}>
              <input type="checkbox" id="FourAxisMill" name="FourAxisMill"/>
              <label htmlFor="FourAxisMill">Four Axis Mill</label><br/>
              <input type="checkbox" id="BantamMill" name="BantamMill"/>
              <label htmlFor="BantamMill">Bantam Mill</label><br/>
              <input type="checkbox" id="Glowforge" name="Glowforge"/>
              <label htmlFor="Glowforge">Glowforge</label><br/>
              <input type="checkbox" id="P9000" name="P9000"/>
              <label htmlFor="P9000">P9000</label><br/>
              <input type="checkbox" id="Sewing" name="Sewing"/>
              <label htmlFor="Sewing">Sewing</label><br/>
              <input type="checkbox" id="Silhouette" name="Silhouette"/>
              <label htmlFor="Silhouette">Silhouette</label><br/>
              <input type="checkbox" id="Ultimaker" name="Ultimaker"/>
              <label htmlFor="Ultimaker">Ultimaker</label><br/>
              <input type="checkbox" id="Fusion" name="Fusion"/>
              <label htmlFor="Fusion">Fusion</label><br/>
              <input type="checkbox" id="VectorCAD" name="VectorCAD"/>
              <label htmlFor="VectorCAD">Vector CAD</label><br/>
              <input type="checkbox" id="CircuitDesign" name="CircuitDesign"/>
              <label htmlFor="CircuitDesign">Circuit Design</label>
            </fieldset>
           </div>
        </>
      )
    }
  }

  class OtherToolsUtilized extends React.Component{
    constructor(props){
      super(props);
      this.state = {
        machines: [] //List of machines utilize
      }
    }

    updateState = (e) => {
      let machinesInUse = this.state.machines
      if (e.target.checked){
        machinesInUse.push(e.target.id)
      } else { 
        machinesInUse = machinesInUse.filter(m => m !== e.target.id)
        this.setState({"machines":machinesInUse})
      }      
    }

    render(){
      return(
        <>
          <div onClick={this.updateState} className="checkboxes">
            <p>Other Tools Utilized (No Certification Required):</p>
            <fieldset id="otherToolsUtilized" style={{"display": "inline-block","position": "relative","textAlign": "initial","float":"left","border":"none"}}>
              <input type="checkbox" id="3DScanner" name="3DScanner"/>
              <label htmlFor="3DScanner">3DScanner</label><br/>
              <input type="checkbox" id="ButtonPress" name="ButtonPress"/>
              <label htmlFor="ButtonPress">ButtonPress</label><br/>
              <input type="checkbox" id="VR/3DCamera" name="VR/3DCamera"/>
              <label htmlFor="VR/3DCamera">VR/3DCamera</label><br/>
            </fieldset>
           </div>
        </>
      )
    }
  }

  class BadgeInForgotIDPopUp extends React.Component{
    constructor(props){
      super(props);
      this.togglePopup = this.props.togglePopup.bind(this);
      this.state = {
        members: [0], //An array whose number of elements corresponds to the number of members being badged in.
      }
    }

    numOfMembersChanged(){
      let numMembersInput = document.getElementById("numMembersToBadgeIn")
      let arr = Array.from(Array(parseInt(numMembersInput.value)).keys())
      this.setState({members:arr});
    }

    onSubmit(){
      let badgeInAndCreateEvent = document.getElementById("createEventCheckbox").checked
      let badgeInInput = document.getElementById("badgeInInput")
      let badgeOutInput = document.getElementById("badgeOutInput")
      if(badgeInAndCreateEvent){ //If the checkbox is selected create entries in the activities collection
        let numMembers = document.getElementById("numMembersToBadgeIn").value
        for(let i=0; i<numMembers; i++){
          let todaysActivities = activity.filter(a => a.Date==badgeInInput.value.slice(0,10))[0]
          let searchedTodaysActivities = todaysActivities
          if (typeof(todaysActivities) == "undefined"){ //No events found
            console.log("No events found for this day.")
            let todaysEvents = [] //Create an empty array to append events to
            todaysActivities = {
              "Date": badgeInInput.value,
              "Events": todaysEvents
            }
          } else { 
            let todaysEvents = todaysActivities.Events
          }
          //Create New Event
          //for(let i=0; i< document.getElementById("numMembersToBadgeIn").value; i++){
            let memberToAppend = document.getElementById("member"+i).value
            let sessionLengthMinutes = Math.round(new Date(badgeOutInput.value) - new Date(badgeInInput.value))/60000

            //Get Machines Utilized
            let f = document.getElementById("machinesUtilized").children;
            let machinesUtilized = []
            for(let i=0;i<f.length;i++){
              if(f[i].checked){ machinesUtilized.push(f[i].name) }
            }

            let eventToAppend = { 
              "Name": memberToAppend,
              "badgeInTime" : badgeInInput.value,
              "badgeOutTime" : badgeOutInput.value,
              "event": document.getElementsByName("event")[0].value,
              "machineUtilized": machinesUtilized,
              "sessionLengthMinutes": sessionLengthMinutes
            }
            todaysActivities.Events.push(eventToAppend)
        }
        if (typeof(searchedTodaysActivities) == "undefined"){ //No events found
          console.log("Creating new Activity...");
          createNewActivity(badgeInInput.value.slice(0,10), todaysEvents);
        } else {
          console.log("Appending events to existing Activity... date:",badgeInInput.value.slice(0,10));
          updateActivityByDate(badgeInInput.value.slice(0,10), todaysActivities.Events);
        }        
        //document.getElementById("enterInfoNoID").remove()  //Close this component
      } else { //If the checkbox is not selected badge the members in, an entry to the activities collection will be made upon badge out.
        console.log("ELSE")
      }
    }

    render(){
      let todaysDate = new Date().toISOString().slice(0,19);
      return(
        <>
          <section id="enterInfoNoID" className="backEndPopUp">
            <div>
              <p style={{"display": "inline"}}>Members: </p>
              <input type="number" min="1" max="35" defaultValue="1" id="numMembersToBadgeIn" onChange={this.numOfMembersChanged.bind(this)} style={{"display": "inline"}}></input>
            </div>
            <VisitType/>
            <label className="enterInfoLabelFixed" htmlFor="badgeInTime">Badged In:
              <input defaultValue={todaysDate} name="badgeInTime" id="badgeInInput"></input>
            </label>
            <label className="enterInfoLabelFixed" htmlFor="badgeOutTime">Badged Out: 
              <input defaultValue={todaysDate} name="badgeOutTime" id="badgeOutInput"></input>
            </label>
            <MachinesUtilized/>
            <button type="button" onClick={this.togglePopup} style={{"width": "10ch","left":"0","bottom":"0","position":"absolute"}}>Close</button>
            <button type="button" onClick={ this.onSubmit } style={{"width": "10ch","right":"0","bottom":"0","position":"absolute"}}>Submit</button>
            {this.state.members.map((char) =>
              <label className="enterInfoLabel" htmlFor={"member"+char} style={{"marginBottom":"4px"}}>Name:
                <input type="text" id={"member"+char} defaultValue={"Unknown Member"} style={{"display":"inline-block", "position":"absolute", "left":"7ch", "width": "30ch"}}></input>
              </label>
            )}
            <label className="enterInfoLabel" htmlFor="createEventCheckbox">Badge Out and Create Event?
              <input type="checkbox" id="createEventCheckbox" name="createEventCheckbox"></input>
            </label>
          </section>
        </>
      )
    }
  }

  class BadgeInForgotIDButton extends React.Component{
    constructor(props){
      super(props);
      this.state = {
        showPopup: false
      }
      this.togglePopup = this.togglePopup.bind(this);
    }

    togglePopup(){
      this.setState({showPopup: !this.state.showPopup});
    }

    render(){
      return(
        <>
          <button onClick={this.togglePopup.bind(this)} type="button">Forgot ID</button>
          {this.state.showPopup ? 
            <BadgeInForgotIDPopUp togglePopup={this.togglePopup}/>
            : <div></div>
          }
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
        selection: ""
      }
    }

    onKeyUpCapture(e){
      function BadgeInMemberSearch(members){
        //Searches for a member by name, then badges in the member.
        let searchInput = e.target.value
        let listOfMembers = members.map(x => [x.Name,x._id,x.rfid])
        /*let listOfMemberNames = [] //Get a list of all member names
        let listOfMemberIds = [] //Save member name and id
        for(let i=0; i<listOfMembers.length; i++){
          listOfMemberNames.push(listOfMembers[i][0])
          //listOfMemberIds.push(listOfMembers[i][1])
          listOfMemberRFID.push(listOfMembers[i][2])
        }*/
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
        document.getElementById("searchMemberBadgeIn").value = e.target.innerText
      }, 200);
    }

    handleSubmit(e){
      console.log("Badging in Member",this.state.selection[0],"w/ RFID UID:",this.state.selection[1])
      badgeInByRFID(this.state.selection[1])
    }
    
    render(){
      return(
        <>
        <div style={{"textAlign": "center"}}>
        <p style={{display: "inline"}}>Badge someone in: </p>
        <input onFocus={this.onFocus.bind(this)} onBlur={this.onBlur.bind(this)} onKeyUpCapture={this.onKeyUpCapture.bind(this)} id='searchMemberBadgeIn'></input> 
        <BadgeInForgotIDButton/>
        {this.state.showResults && this.state.results.length > 0 ? 
          <SearchResults handleSelect={this.handleSelect.bind(this)} results={this.state.results}></SearchResults>
          :  <div></div> }
        {this.state.selectionMade ? 
          <SubmitSelection result={this.state.selection} handleSubmit={this.handleSubmit.bind(this)} selectionMade={this.state.selection[0]}></SubmitSelection>
          : <div></div>}
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
          {this.props.results?.map((result) => (
            <div id={result[2]} onClick={this.props.handleSelect}>{result[0]}</div>  
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

  class RecentActivity extends React.Component {
    constructor(props) {
      super(props);
      this.state = { };
    }
    
    render() {
      function getTodaysActivities(){
        let activities = activity.filter(act => act.Date == dateStr);
        console.log("getTodaysActivities():",activities)
        return activities
      }

      let dateStr = GlobalRecentActivityDate.toISOString().substring(0,10)
      let currDate = GlobalRecentActivityDate
      let todayActivity = getTodaysActivities();

      function updateActivitiesToDOM(activities){
        let recentActivitiesTBody = document.getElementById("recentActivityTbody")
        while (recentActivitiesTBody.firstChild) { //remove all child elements
          recentActivitiesTBody.removeChild(recentActivitiesTBody.firstChild);
        }
        if (activities.length == 0 || (activities.length == 1 && activities[0].Events[0] == null)){
          let tr = document.createElement("tr")
          let td = document.createElement("td")
          td.innerText = "No events today."
          td.id = "noEvents"
          td.colSpan="3"
          tr.appendChild(td)
          recentActivitiesTBody.appendChild(tr)
        } else {
          console.log(activities[0].Events.length,"events today.")
          for (let i=0; i < activities[0].Events.length;i++){
            let tr = document.createElement("tr")
            tr.key = "event_"+String(i)
            tr.className = "tr_event";
            let td_Name = document.createElement("td");
            td_Name.innerText = activities[0].Events[i].Name;
            td_Name.addEventListener('mouseenter', e => { hover([activities[0].Events[i].MemberID,e]) });
            td_Name.addEventListener('mouseleave', e => { hoverOut() });
            let td_event = document.createElement("td");
            td_event.innerText = activities[0].Events[i].event;
            let button = document.createElement("button");
            button.type = "button"
            button.onclick= () => editActivity(activities[0].Events[i])
            button.innerText = "Add Info"
            if(activities[0].Events[i].event == "Undefined"){
              button.className = "addInfoAttn"
            } else {
              button.className = "addInfo"
            }
            tr.appendChild(td_Name);
            tr.appendChild(td_event);
            tr.appendChild(button)
            recentActivitiesTBody.appendChild(tr)
          }
        }
      }

      function changeDay(arg){
        if (arg == "forward-one-day"){
          currDate.setMinutes(currDate.getMinutes() + 24*60); //Change dateObj to the next day
        } else if (arg == "backward-one-day"){
          currDate.setMinutes(currDate.getMinutes() - 24*60); //Change dateObj to the previous day
        }
        let dateEDTStr = toEDTString(currDate)
        dateStr = dateEDTStr.substring(0,10) //YYYY-MM-DD
        document.getElementById("date").innerText=dateStr;
        let activities = getTodaysActivities();
        updateActivitiesToDOM(activities);
        GlobalRecentActivityDate = currDate;
      }

      return (
        <>
        <a id="activitiesForward" onClick={() => changeDay("forward-one-day")}></a>
        <a id="activitiesBackward" onClick={() => changeDay("backward-one-day")}></a>
        <table id="recentActivity">
          <caption>Recent Activity</caption>
          <caption id="date">{dateStr}</caption>
          <thead>
            <tr key={"head_tr"}>
              <th>Member Name</th>
              <th>Visit Type</th>
              <th>Edit Activity</th>
            </tr>
          </thead>
          <tbody id="recentActivityTbody">
          { todayActivity.length == 0 ? ( //Sometimes todayActivity is [] (a blank array). Sometimes it is [{"Events":[]}]. 
            <tr key={"noEvents_tr"}>
              <td colSpan="3" id="noEvents">No events today.</td>
            </tr>
          ) : (
            todayActivity[0].Events.map((actEvent) => ( 
              <tr key={actEvent._id+"_tr"}>
                <td onMouseEnter={(e) => hover([{actEvent}.actEvent.MemberID,e])} onMouseLeave={hoverOut}>{actEvent.Name}</td>
                <td>{actEvent.event}</td>
                <td>
                  {actEvent.event == "Undefined" ? (
                    <Button type='button' id={"b_"+actEvent._id} className="addInfoAttn" onClick={() => editActivity(actEvent)}>Add Info</Button>
                  ) : (
                    <Button type='button' id={"b_"+actEvent._id} className="addInfo" onClick={() => editActivity(actEvent)}>Add Info</Button>
                  )}</td>
              </tr>))
          )}
          </tbody>
        </table>
        </>
      );
    }
  }

  return (
    <div className="container">
      <Head>
        <title>Makerspace Badging System</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main> 
        {isConnected ? (
          <h2 className="subtitle">You are connected to MongoDB</h2>
        ) : (
          <h2 className="subtitle">
            You are NOT connected to MongoDB. Check the <code>README.md</code>{' '}
            for instructions.
          </h2>
        )}
        <a className="cornerButton" id="stock" href="/stock">Stock</a>
        <a className="cornerButton" id="stats" href="/stats">Stats</a>
      </main>

      
      {isOpen ? (
        <React.Fragment>
          <section className="backEndPopUp">
            <Popup/>
          </section>
        </React.Fragment>
      ) : (
        <div></div>
      )}

      {editIsOpen ? (
        <React.Fragment>
          <section className="backEndPopUp">
            <EditPopup new={true}/>
          </section>
        </React.Fragment>
      ) : (
        <div></div>
      )}

      <section className="fit">
        {members.filter(member => member.badgedIn == true).length == 0 ? (
          <p style={{"textAlign":"center"}}>No one badged in...</p>
        ) : (
          <>
            <table>
              <caption>Badged In Members</caption>
              <thead className="badgeInMembers">
                <tr>
                  <th key={"NameHeader"}>Name</th>
                  <th key={"MajorHeader"}>Major</th>
                  { certificationNames.map((cert) => 
                    <th key={cert+"_th"} className="rotated"><div><span>{cert}</span></div></th>
                    )}
                </tr>
              </thead>
              <tbody>
                {members.filter(member => member.badgedIn == true).map((member) => (
                  <tr key={member._id+"_tr"}>
                    <td onMouseEnter={(e) => hover([{member},e])} onMouseLeave={hoverOut}>{member.Name}</td>
                    <td>{member.Major}</td>
                    { certificationList.map((cert) => 
                      member[cert] ? (
                        <td key={member.id+"_"+cert+"_td"} className="true"></td>
                        ) : ( <td key={member.id+"_"+cert+"_td"} className="false"></td>)
                    )}
                    <td>
                      <button type="button" onClick={() => updateMemberBadgeInStatusManually(member, activity)}>Badge Out</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
        <SearchMemberBadgeIn members={members}></SearchMemberBadgeIn>
      </section>
      <section id="recentActivity" className="fit">
        <RecentActivity></RecentActivity>
      </section>
      <h3>Bugs:</h3>
      <ul>
        <li>Change date of activity.... Fix duplicates in members collection</li>
        <li>validation: no negative session minutes</li>
        <li style={{textDecoration: "line-through"}}>?new gets removed</li>
        <li style={{textDecoration: "line-through"}}>Ignore caps lock on badgeIn page and on member creation</li>
        <li style={{textDecoration: "line-through"}}>Ignore escape key and other bs. must be alphanumeric</li>
      </ul>
      <h3>Next up:</h3>
      <ul>
        <li>Add button machine, VR to tools list under Other Tools</li>
        <li>Add button to badgeIn allowing members to make accounts w/o an ID. We should flag all no id members w/ the same RFID_UID. They can select from the list of all accounts to badgeIn if they made an account already.</li>
        <li>Add button to backEnd allowing us to create activity entries w/o a RFID_UID for members who didn't use the badgeSystem</li>
        <li>Change "badge someone in..." to "search members". Have the badgeIn button in addition to info which gives What certs, rfid uid, etc.</li>
        <li>check if user badgeIn time is from a different day. Alert the user.</li>
        <li>Prevent members from accessing this page (the backend)</li>
        <li>Auto update index page (using state changes)</li>
        <li>New Member Validation: red borders on missing info + message</li>
        <li style={{textDecoration: "line-through"}}>Add Homework/ClassProj to VisitType</li>
        <li style={{textDecoration: "line-through"}}>Add a delete button to the editActivityPopUp</li>
        <li style={{textDecoration: "line-through"}}>Change failed badge in message. Remove "Failed search". Change colors? Maybe, 'New Member? n/ Register [button]' Already Signed Up?, Try scanning again</li>
        <li style={{textDecoration: "line-through"}}>Create a button for people who arrive w/o a CINO ID and haven't become a member yet.</li>
        <li style={{textDecoration: "line-through"}}>CSS: index.js | conditionally render header row of Badge In Members table</li>
        <li style={{textDecoration: "line-through"}}>Automatically badge in Members after they register.</li>
        <li style={{textDecoration: "line-through"}}>Create a badge In member button. Lets you search a member</li>
      </ul>
    </div>
  )
}

export async function getServerSideProps(context) {
  const client = await clientPromise
  const isConnected = await client.isConnected();

  //Get "members" Collection
  const membersCollection = await client.db().collection("members");
  const membersArray = await membersCollection.find({}).toArray();
  const membersP = JSON.parse(JSON.stringify(membersArray));

  //Get "activities" Collection
  const activityCollection = await client.db().collection("activities");
  const activityArray = await activityCollection.find({}).toArray();
  const activityP = JSON.parse(JSON.stringify(activityArray));

  return {
    props: { isConnected, members: membersP, activity: activityP },
  }
}
