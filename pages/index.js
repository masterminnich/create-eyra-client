import Head from 'next/head'
import clientPromise from '../lib/mongodb'
import React, { Component, useState, useEffect } from 'react';
import { Button, Form } from 'semantic-ui-react';

var vMember = {};
var vSession = [];
var editEvent = {};

//creates a new activity upon badge out
const updateActivityLog = async (activity, newActivity, existing) => {
  //console.log('activity',activity);
  //console.log('newActivity',newActivity);

  let dateStr = newActivity.badgeOutTime.substring(0,10); //Get Date
  let ActivityDay = activity.find(a => a.Date == dateStr) //Get the activity document for the correct day

  if (existing){
    console.log("updating existing activity...")
    let DayEvents = ActivityDay.Events.filter(a => a._id !== editEvent._id) //Remove the event from the ActivityDaily document so we can add it back in.
    let DroppedEvent = ActivityDay.Events.filter(a => a._id == editEvent._id) //Remove the event from the ActivityDaily document so we can add it back in.
    let DayEventsAfter = DayEvents.concat(newActivity); //All events from the day.
    //console.log("vMember",vMember,"DayEvents",DayEvents,"DayEventsAfter",DayEventsAfter)

    //update Member Session.  Search vMember for prevBadgeInTime, then drop that session and save back to vMember
    const prevBadgeInTime = String(DroppedEvent[0].badgeInTime);
    let keepEvents = vMember.sessions.filter(vm => vm.badgeIn !== prevBadgeInTime)
    let droppedEvent = vMember.sessions.filter(vm => vm.badgeIn == prevBadgeInTime)
    let newSession = {badgeInTime: newActivity.badgeInTime, badgeOutTime: newActivity.badgeOutTime, sessionLengthMinutes: newActivity.sessionLengthMinutes}
    vMember.sessions = keepEvents
    //console.log("prevBadgeInTime",prevBadgeInTime,"keepEvents",keepEvents)
    //console.log("vMember",vMember,"droppedEvent",droppedEvent,"keepEvents",keepEvents)

    try {
      const res = await fetch(`http://localhost:3000/api/activity`, {
          method: 'PUT',
          headers: {
              "Accept": "application/json",
              "Content-Type": "application/json"
          },
          body: JSON.stringify({Date: dateStr, Events: DayEventsAfter})
      })
    } catch (error) { console.log("Error adding to Activity collection.",error) }

  } else {
  if (ActivityDay){
    console.log("date found");
    try {
      let acitivitiesBefore = ActivityDay.Events
      let activitiesAfter = acitivitiesBefore.concat(newActivity);

      const res = await fetch(`http://localhost:3000/api/activity`, {
          method: 'PUT',
          headers: {
              "Accept": "application/json",
              "Content-Type": "application/json"
          },
          body: JSON.stringify({Date: dateStr, Events: activitiesAfter})
      })
      
    } catch (error) {
      console.log("Error adding to Activity collection.",error);
    }
  } else { 
    //No acitivities yet today... adding a new date to the Activity collection.
    console.log("No activity with date",dateStr);
    try {
      const res = await fetch(`http://localhost:3000/api/activity`, {
          method: 'POST',
          headers: {
              "Accept": "application/json",
              "Content-Type": "application/json"
          },
          body: JSON.stringify({Date: dateStr, Events: newActivity})
      })

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
          console.log("activity",activity,"form",form,"members",members)

          //Append a new session to the member
          let foundMember = members.filter(member => member._id == form.MemberID)[0]
          let newSession = {'badgeIn': form.badgeInTime, 'badgeOut':form.badgeOutTime, 'sessionLengthMinutes': form.sessionLengthMinutes};
          console.log("newSession ",newSession);
          let memberSessionsBefore = foundMember.sessions;
          foundMember.sessions = memberSessionsBefore.concat(newSession);
          foundMember.badgedIn = false;
          foundMember.lastBadgeIn = form.badgeOutTime;
          updateMemberBadgeInStatus(foundMember);
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
    }*/

    /*
    if (e.target.sessionLengthMinutes.value == NaN){
      err.sessionLengthMinutes = "sessionLengthMinutes cannot be NaN"
    }*/

    console.log("REMINDER: I still have to finish validation function for popup in index.js")
    //console.log("(debug) e:",e.target)

    return err;
  }

  const handleSubmit = (e) => {
    //Concatenate checkboxes... All checked boxes get added to an array
    let machinesList = ["FourAxisMill","BantamMill","Glowforge","P9000","Sewing","Silhouette","Ultimaker","Cura","VectorCAD","CircuitDesign"];
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
    let inDate = new Date(String(badgedInTime));
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
          </select>
        </div>
        <Form.Input
          label='Badged In: '
          placeholder={vSession.badgeIn}
          deafultvalue={vSession.badgeIn}
          name='badgeInTime'
        />
        <Form.Input
          label='Badged Out: '
          placeholder={vSession.badgeOut}
          deafultvalue={vSession.badgeOut}
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
          <div><input type="checkbox" id="Cura" name="Cura"/>
          <label htmlFor="Cura">Cura</label></div>
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

  const deleteActivity = async (activityID) => {
    try {  
        const res = await fetch(`http://localhost:3000/api/activity/${activityID}`, {
            method: 'DELETE',
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(editEvent)
        })
    } catch (error) {
        console.log(error);
    }
  }

  useEffect(() => {
    if (isSubmittingEdit) {
        if (Object.keys(errors).length === 0) {
          //Find and replace activity.
          let activityID = editEvent._id

          updateActivityLog(activity,Editform,true);
          console.log("activity",activity,"Editform",Editform,"members",members)

          //Find and replace member session.
          let foundMember = members.filter(member => member._id == Editform.MemberID)[0]
          console.log('badgeIn',Editform.badgeInTime, 'badgeOut',Editform.badgeOutTime, 'sessionLengthMinutes',Editform.sessionLengthMinutes)
          let newSession = {'badgeIn': Editform.badgeInTime, 'badgeOut':Editform.badgeOutTime, 'sessionLengthMinutes': Editform.sessionLengthMinutes};
          let foundSessions = foundMember.sessions.filter(fmem => fmem.badgeOut !== Editform.prevBadgeOutTime)
          foundMember.sessions = foundSessions.concat(newSession);
          foundMember.lastBadgeIn = Editform.badgeOutTime;
          updateMemberBadgeInStatus(foundMember);
        }
        else {
            setIsSubmittingEdit(false);
            console.log("Error submitting form.",errors)
        }
    }
  }, [errors])

  const handleEditSubmit = (e) => {
    //Concatenate checkboxes... All checked boxes get added to an array
    let machinesList = ["FourAxisMill","BantamMill","Glowforge","P9000","Sewing","Silhouette","Ultimaker","Cura","VectorCAD","CircuitDesign"];
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
    let outDate = new Date(badgedOutTime)
    let inDate = new Date(String(badgedInTime))
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
          </select>
        </div>
        <Form.Input
          label='Badged In: '
          placeholder={vSession.badgeIn}
          deafultvalue={vSession.badgeIn}
          name='badgeInTime'
        />
        <Form.Input
          label='Badged Out: '
          placeholder={vSession.badgeOut}
          deafultvalue={vSession.badgeOut}
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
          <div><input type="checkbox" id="Cura" name="Cura" defaultChecked={vSession.machineUtilized.includes("Cura")}/>
          <label htmlFor="Cura">Cura</label></div>
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
    let edt_offset = -5*60; //alternativelly,  currDate.getTimezoneOffset();
    currDate.setMinutes(currDate.getMinutes() + edt_offset);

    console.log("test!!!!!!!!",member.lastBadgeIn)
    vSession = {'badgeIn':member.lastBadgeIn, 'badgeOut':currDate.toISOString()}//member.sessions[member.sessions.length-1].badgeIn}
    
    vMember = member //save member to a global variable

    setisOpen(true) //This renders the Popup component
  }

  const updateMemberBadgeInStatus = async (member) => {
    try {  
        const res = await fetch(`http://localhost:3000/api/members/${member._id}`, {
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
    console.log("actEvent!!!!!!!!!",actEvent)
    console.log("Make sure everything loads right including visit type!!!! Then make sure it updates both member and activity. and editIsOpen = false")
    seteditIsOpen(true) //Open popup
    editEvent = actEvent;
    vSession = {'badgeIn':actEvent.badgeInTime,'badgeOut':actEvent.badgeOutTime, 'visitType':actEvent.event,"machineUtilized":actEvent.machineUtilized}
    vMember = members.filter(m => m._id == actEvent.MemberID)[0] //save member to global variable
  }

  //Convert UTC to local time
  let dateObj = new Date();
  let edt_offset = -5*60; 
  dateObj.setMinutes(dateObj.getMinutes() + edt_offset);
  let dateStr = dateObj.getFullYear()+"-"+(dateObj.getMonth()+1)+"-"+dateObj.getDate();

  let todayActivity = activity.filter(act => act.Date == dateStr);
  if (todayActivity.length !== 0){
    console.log("Todays activities:",todayActivity[0].Events)
  }
  

  const certificationList = ['UltimakerCertified', 'GlowforgeCertified', 'FourAxisMillCertified', 'BantamMillCertified', 'P9000Certified', 'SewingCertified', 'SilhouetteCertified', 'CuraCertified', 'VectorCADCertified', 'CircuitDesignCertified'];
  const certificationNames = ['Ultimaker','Glowforge','Four Axis Mill', 'Bantam Mill', 'P9000', 'Sewing', 'Silhouette', 'Cura', 'VectorCAD', 'CircuitDesign'];

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
            <EditPopup/>
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
                <td>{member.Name}</td>
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
      <section>
        <table>
          <caption>Recent Activity</caption>
          <thead>
            <tr>
              <th>Info</th>
              <th>Visit Type</th>
              <th>Button</th>
            </tr>
          </thead>
          <tbody>
          {todayActivity.length == 0 ? (
            <tr>
              <td>No events yet today.</td>
            </tr>
          ) : (
            todayActivity[0].Events.map((actEvent) => ( 
              <tr>
                <td>{actEvent.Name}</td>
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
      </section>
      <h3>Next up:</h3>
      <ul>
        <li>Send failed scans to newMember</li>
        <li>Popups for testBadge GUI</li>
        <li>STILL NEED TO DO: testBadge adds to activity collection</li>
        <li>CSS</li>
      </ul>
      <h3>Later on:</h3>
      <ul>
        <li>check if user badgeIn time is from a different day. Alert the user.</li>
        <li>create a script to determine popularity of each day.... Nope - activity log!</li>
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
