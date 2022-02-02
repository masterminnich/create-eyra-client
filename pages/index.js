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
  let dateUTCOffsetAdded = new Date(dateObj.getTime() - (dateObj.getTimezoneOffset() * 60000))
  var dateEDTStr = dateUTCOffsetAdded.toISOString()//.substring(0,19); 
  return dateEDTStr
}


/* Start Tooltips Code */
function hover(params){ //Checks to see if an element has been hovered over for 2 seconds or more. params = [memberDataOrId, parentElement]. parentElement is the element is which the hover originated. 
  let memberDataOrId = params[0] 
  let parentElement = params[1].target
  console.log("target",parentElement)
  console.log("memberDataOrId:",memberDataOrId,typeof(memberDataOrId))
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
  console.log("")

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


//creates a new activity upon badge out
const updateActivityLog = async (activity, newActivity, existing) => {
  //console.log('activity',activity);
  //console.log('newActivity',newActivity);

  let dateStr = newActivity.badgeOutTime.substring(0,10); //Get Date
  let ActivityDay = activity.find(a => a.Date == dateStr) //Get the activity document for the correct day

  if (existing){
    let DayEvents = ActivityDay.Events.filter(a => a._id !== editEvent._id) //Remove the event from the ActivityDaily document so we can add it back in.
    let DroppedEvent = ActivityDay.Events.filter(a => a._id == editEvent._id) //Remove the event from the ActivityDaily document so we can add it back in.
    let DayEventsAfter = DayEvents.concat(newActivity); //All events from the day.
    //console.log("vMember",vMember,"DayEvents",DayEvents,"DayEventsAfter",DayEventsAfter)

    let prevBadgeOutDate = String(editEvent["badgeOutTime"]).substring(0,10);
    let newBadgeOutDate = newActivity["badgeOutTime"].substring(0,10);
    if (prevBadgeOutDate !== newBadgeOutDate){
      //Check if the activity is being moved to another date.
      console.log("activity is being moved to a different date.")
      console.log("TO DO: delete the old activity.")
      console.log("TO DO: does member Collection still look okay? It should update the dates instead of making a new event.")
    }

    //update Member Session.  Search vMember for prevBadgeInTime, then drop that session and save back to vMember
    const prevBadgeInTime = String(editEvent["badgeOutTime"]);//DroppedEvent[0].badgeInTime);
    let keepEvents = vMember.sessions.filter(vm => vm.badgeIn !== prevBadgeInTime)
    let droppedEvent = vMember.sessions.filter(vm => vm.badgeIn == prevBadgeInTime)
    let newSession = {badgeInTime: newActivity.badgeInTime, badgeOutTime: newActivity.badgeOutTime, sessionLengthMinutes: newActivity.sessionLengthMinutes}
    vMember.sessions = keepEvents
    //console.log("prevBadgeInTime",prevBadgeInTime,"keepEvents",keepEvents)
    //console.log("vMember",vMember,"droppedEvent",droppedEvent,"keepEvents",keepEvents)

    console.log("keepEvents",keepEvents,"DayEventsAfter",DayEventsAfter)

    try {
      const res = await fetch(`/api/activity`, {
          method: 'PUT',
          headers: {
              "Accept": "application/json",
              "Content-Type": "application/json"
          },
          body: JSON.stringify({Date: dateStr, Events: DayEventsAfter})
      })
      console.log("updateActivityLog(): Success adding event to existing date",dateStr, res);
    } catch (error) { console.log("Error adding to Activity collection.",error) }

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
      })
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
      })
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
          console.log("form",form)
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
      console.log("badged in",badgedInTime)
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
    return (
    <>
      <h1 id="badgingOutTitle">Badging out {vMember.Name}...</h1>
      <Form onSubmit={handleSubmit}>
        <div id="visitType">
          <label htmlFor="event">Visit Type: </label>
          <select name="event">
            <option value="Undefined">Undefined</option>
            <option value="Individual">Individual</option>
            <option value="Certification">Certification</option>
            <option value="Class">Class</option>
            <option value="Quick Visit">Quick Visit</option>
            <option value="Staff on Duty">Staff on Duty</option>
            <option value="Event">Event</option>
          </select>
        </div>
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
        <p>Machines Utilized:</p>
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

        <Button type='submit' id="submitBadgeOutPopup">Submit</Button>
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

          updateActivityLog(activity,Editform,true);
          console.log("Updating activity from DB:",Editform)
          //console.log("activity",activity,"Editform",Editform,"members",members)

          //Find and replace member session.
          let foundMember = members.filter(member => member._id == Editform.MemberID)[0]
          let newSession = {'badgeIn': Editform.badgeInTime, 'badgeOut':Editform.badgeOutTime, 'sessionLengthMinutes': Editform.sessionLengthMinutes};
          let foundSessions = foundMember.sessions.filter(fmem => fmem.badgeOut !== Editform.prevBadgeOutTime)
          foundMember.sessions = foundSessions.concat(newSession);
          foundMember.lastBadgeIn = Editform.badgeOutTime;
          console.log("form",Editform)
          let memberEnsured = ensureCertifications(Editform, foundMember)
          updateMemberBadgeInStatus(memberEnsured);
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
      console.log("badged in",badgedInTime)
    }
    if (e.target.badgeOutTime.value == ""){
      badgedOutTime = e.target.badgeOutTime.placeholder
    } else { badgedOutTime = e.target.badgeOutTime.value }

    //Calculate sessionLengthMinutes
    let outDate = new Date(badgedOutTime);
    let inDate = new Date(badgedInTime);
    let sessionLengthMinutes = Math.round(outDate - inDate)/60000  

    setEditForm({
      ...Editform,
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
    setIsSubmittingEdit(true);
    seteditIsOpen(false) //This renders the Popup component
  }

  function EditPopup(props) {
    return (
    <>
      <h1 id="badgingOutTitle">Editing Activity</h1>
      <Form onSubmit={handleEditSubmit}>
        <div id="visitType">
          <label htmlFor="event">Visit Type: </label>
          <select name="event">
            <option value={vSession.visitType}>{vSession.visitType}</option>
            <option value="Undefined">Undefined</option>
            <option value="Individual">Individual</option>
            <option value="Certification">Certification</option>
            <option value="Class">Class</option>
            <option value="Quick Visit">Quick Visit</option>
            <option value="Staff on Duty">Staff on Duty</option>
            <option value="Event">Event</option>
          </select>
        </div>
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
        <p>Machines Utilized:</p>
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

        <Button type='submit' id="submitBadgeOutPopup">Submit</Button>
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

  const updateMemberBadgeInStatus = async (member) => {
    try {  
        const res = await fetch(`/api/members/${member._id}`, {
            method: 'PUT',
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(member)
        })
    } catch (error) {
        console.log(error);
    }
  }

  const editActivity = async (actEvent) => {
    console.log("editActivity()  actEvent",actEvent)
    editEvent = actEvent;
    vSession = {'badgeIn':actEvent.badgeInTime,'badgeOut':actEvent.badgeOutTime, 'visitType':actEvent.event,"machineUtilized":actEvent.machineUtilized}
    vMember = members.filter(m => m._id == actEvent.MemberID)[0] //save member to global variable
    seteditIsOpen(true) //Open popup
  }

  const certificationList = ['UltimakerCertified', 'GlowforgeCertified', 'FourAxisMillCertified', 'BantamMillCertified', 'P9000Certified', 'SewingCertified', 'SilhouetteCertified', 'FusionCertified', 'VectorCADCertified', 'CircuitDesignCertified'];
  const certificationNames = ['Ultimaker','Glowforge','Four Axis Mill', 'Bantam Mill', 'P9000', 'Sewing', 'Silhouette', 'Fusion', 'VectorCAD', 'CircuitDesign'];


  class RecentActivity extends React.Component {
    constructor(props) {
      super(props);
      this.state = { };
    }

    componentDidMount(){
      //console.log("RecentActivity Did Mount")
      console.log("GlobalRecentActivityDate",GlobalRecentActivityDate)
    }
    
    render() {
      function getActivites(){
        let activities = activity.filter(act => act.Date == dateStr);
        console.log("getActivities():",activities)
        return activities
      }

      let dateStr = GlobalRecentActivityDate.toISOString().substring(0,10)
      let currDate = GlobalRecentActivityDate
      let todayActivity = getActivites();

      function updateActivitiesToDOM(activities){
        let recentActivitiesTBody = document.querySelectorAll('tbody')[1]
        while (recentActivitiesTBody.firstChild) { //remove all child elements
          recentActivitiesTBody.removeChild(recentActivitiesTBody.firstChild);
        }
        if (activities.length == 0){
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
        let activities = getActivites();
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
            <tr>
              <th>Member Name</th>
              <th>Visit Type</th>
              <th>Edit Activity</th>
            </tr>
          </thead>
          <tbody>
          {todayActivity.length == 0 ? (
            <tr>
              <td colSpan="3" id="noEvents">No events today.</td>
            </tr>
          ) : (
            todayActivity[0].Events.map((actEvent) => ( 
              <tr>
                <td onMouseEnter={(e) => hover([{actEvent}.actEvent.MemberID,e])} onMouseLeave={hoverOut}>{actEvent.Name}</td>
                <td>{actEvent.event}</td>
                <td>
                  {actEvent.event == "Undefined" ? (
                    <Button type='button' className="addInfoAttn" onClick={() => editActivity(actEvent)}>Add Info</Button>
                  ) : (
                    <Button type='button' className="addInfo" onClick={() => editActivity(actEvent)}>Add Info</Button>
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
          <section className="badgeOutPopUp">
            <Popup/>
          </section>
        </React.Fragment>
      ) : (
        <div></div>
      )}

      {editIsOpen ? (
        <React.Fragment>
          <section className="badgeOutPopUp">
            <EditPopup new={true}/>
          </section>
        </React.Fragment>
      ) : (
        <div></div>
      )}

      <section>
        <table>
          <caption>Badged In Members</caption>
          <thead className="badgeInMembers">
            <tr>
              <th>Name</th>
              <th>Major</th>
              { certificationNames.map((cert) => 
                <th className="rotated"><div><span>{cert}</span></div></th>
                )}
              <th></th>
            </tr>
          </thead>
          <tbody>
            
          {members.filter(member => member.badgedIn == true).length == 0 ? (
            <p>No one badged in...</p>
          ) : (
            members.filter(member => member.badgedIn == true).map((member) => (
              <tr key="{member._id}">
                <td onMouseEnter={(e) => hover([{member},e])} onMouseLeave={hoverOut}>{member.Name}</td>
                <td>{member.Major}</td>
                { certificationList.map((cert) => 
                  member[cert] ? (
                    <td className="true"></td>
                    ) : ( <td className="false"></td>)
                )}
                <td>
                  <button type="button" onClick={() => updateMemberBadgeInStatusManually(member, activity)}>Badge Out</button>
                </td>
              </tr>
            ))
          )}
          </tbody>
        </table>
      </section>
      <section id="recentActivity">
        <RecentActivity></RecentActivity>
      </section>
      <h3>Bugs:</h3>
      <ul>
        <li>Z bageInTime.... I think this is fixed.</li>
        <li>activity date changed. delete from old day</li>
        <li>negative session minutes???</li>
      </ul>
      <h3>Next up:</h3>
      <ul>
        <li>Prevent members from accessing this page (the backend)</li>
        <li style={{textDecoration: "line-through"}}>Automatically badge in Members after they register.</li>
        <li>Auto update index page</li>
      </ul>
      <h3>Later on:</h3>
      <ul>
        <li>check if user badgeIn time is from a different day. Alert the user.</li>
      </ul>
    </div>
  )
}

export async function getServerSideProps(context) {
  const client = await clientPromise

  // client.db() will be the default database passed in the MONGODB_URI
  // You can change the database by calling the client.db() function and specifying a database like:
  // const db = client.db("myDatabase");
  // Then you can execute queries against your database like so:
  // db.find({}) or any of the MongoDB Node Driver commands

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
