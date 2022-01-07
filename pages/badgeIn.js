import React, { Component, useState } from 'react';

//This page allows users to manually type in their RFID number to badge in.
//This file contains functionality to search for the RFID, record key strokes.

var createReactClass = require('create-react-class');
var RFID_UID_input = "";

const getActivitiesCollection = async (memberData) => {
    try {
        const res = await fetch('/api/activity', {
            method: 'GET',
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
        })
        let response = res.json();
        response.then((resp) => {
            updateActivityLog(resp.data, memberData);
        })
    } catch (error) { console.log("error @ manualBadgeIn|getActivitiesCollection(): ",error); }
}

//Copied from index.js -- Make sure to update any changes to both documents.
const updateActivityLog = async (activity, memberData) => {
    let session = memberData.sessions[memberData.sessions.length-1]
    let dateStr = session.badgeOut.substring(0,10); //Get Date
    let ActivityDay = activity.find(a => a.Date == dateStr) //Get the activity document for the correct day
    let newActivity = {MemberID: memberData._id, Name: memberData.Name, badgeInTime: session.badgeIn, badgeOutTime: session.badgeOut, event: "Undefined",machineUtilized: [], sessionLengthMinutes: session.sessionLengthMinutes}
    //console.log('activity',activity,"newActivity.... ",newActivity)

    if (ActivityDay){
        console.log("found Activities w/ date",dateStr);
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
    
        } catch (error) {
          console.log("Error adding to Activity collection.",error);
        }
      }
}

function timeout(delay) {
  return new Promise( res => setTimeout(res, delay) );
}

function checkFocus(){
  // This function is run when the badgeInInputText element is un-focused. It automatically re-focuses the element.
  if(document.getElementById("badgeInTextInput") !== document.activeElement){
    document.getElementById("badgeInTextInput").focus()
  }
}

function createPopUp(msg,code){
  let f = document.getElementsByClassName("herf")[0]
  const p = document.createElement("p");
  const d = document.createElement("div");

  d.id = code
  p.className = "popupMsg"
  p.innerText = msg
  d.appendChild(p)
  f.appendChild(d);
  if(code !== "twohundred"){ //If there is an error scanning the badge display a button linking to newMember page.
    const a = document.createElement("a")
    let newLink = "newMember?rfid=" + RFID_UID_input.toString()
    a.href=newLink
    a.id="newMemberButton"
    a.innerText="New Member Sign-Up"
    d.appendChild(a);
  }
  RFID_UID_input=""
  let T = timeout(4000);
  T.then((a) =>{
    document.getElementById(code).remove();
  });
}

const searchForRFID = async (RFID_UID_input) => {
    try {
        const res = await fetch('/api/badgeIn', {
            method: 'POST',
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({rfid: RFID_UID_input})
        });
        let response = res.json()
        response.then((resp) => {
            let memberData = resp.data;

            if (res.status == 406){ 
                let fullMsg = "Search failed. More than one user share this RFID."
                console.log(fullMsg);
                createPopUp(fullMsg,"fourohsix")
            } else if (res.status == 404){
                let fullMsg = "Search failed. No member with this RFID."
                console.log(fullMsg);
                console.log("redirect to new member page?");
                createPopUp(fullMsg,"fourohfour")
            } else if (res.status == 200) {
                let msg = ""
                if(memberData.badgedIn){msg = "badged in"}else{msg = "badged out"}
                let fullMsg = memberData.Name+" "+msg+"!"
                console.log(fullMsg)
                if (memberData.badgedIn == false){
                    getActivitiesCollection(memberData); //If member badging out, append a new Event to activity collection
                };
                createPopUp(fullMsg,"twohundred")
            } else { return "something really wrong happened"};
        });
    } catch (error) {
        console.log(error);
        return "something really wrong happened (2)";
    }
}

class App extends Component {
  state = {
      badgeStatus: "waiting",
      rfid: ''
  };

  handleKeyDown = e => {
    checkFocus()

    if (e.key !== "Shift"){ //Ignore Shift Keypresses
      RFID_UID_input += e.key;
      console.log("keypress: ", e.key);
    }

    if (RFID_UID_input.length == 16){
        //When all characters of RFID are entered. Check if in database.
        console.log("Searching database for RFID_UID matching",RFID_UID_input,"...");
        let searchResultPromise = searchForRFID(RFID_UID_input);

        console.log("RFID_UID_input",RFID_UID_input)
        //this.state.rfid = RFID_UID_input
        //console.log("rfid",this.state.rfid)

        /*
        searchResultPromise.then((a) => {
        });*/

        //RFID_UID_input gets reset inside createPopUp()
    }
  }

  componentDidMount(){
    this.nameInput.focus(); 
  }

  render() {
      return (
        <React.Fragment>
          <div className="badgeIn">
          <input id="badgeInTextInput" spellCheck="false" type='text' 
            ref={(input) => { this.nameInput = input; }} //autoFocus wasn't working for some reason. Solution from StackOverflow: https://stackoverflow.com/questions/28889826/how-to-set-focus-on-an-input-field-after-rendering?rq=1
            onKeyDown={this.handleKeyDown} onBlur={checkFocus}/>
            <h1 id="pleaseBadgeIn">Please Badge In!</h1>
            <h2 id="pleaseBadgeIn">(Hold your CINO ID to the reader until you hear a beep)</h2>
            <div className="arrow"></div>
            <div className="herf"></div>
          </div>
        </React.Fragment>
        
      );
  }
}
export default App;