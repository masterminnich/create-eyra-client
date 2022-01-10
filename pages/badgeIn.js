import React, { Component, useState } from 'react';

//This page allows users to manually type in their RFID number to badge in.
//This file contains functionality to search for the RFID, record key strokes.

var createReactClass = require('create-react-class');
var RFID_UID_input = "";
var last_RFID_UID_input = "";

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
  console.log("rfid:",last_RFID_UID_input)
  console.log("createPopUp")
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
    const a2 = document.createElement("a")
    a2.className = "close-button"
    a2.onclick = function closePopUp(){
      document.getElementsByClassName("popupMsg")[0].parentNode.remove()
      RFID_UID_input="" 
    }
    d.appendChild(a2);
    let newLink = "newMember?rfid=" + last_RFID_UID_input.toString()
    a.href=newLink
    a.id="newMemberButton"
    a.innerText="New Member Sign-Up"
    d.appendChild(a);
  }
  RFID_UID_input=""
  if(code == "twohundred"){
    let T = timeout(4000);
    T.then((a) =>{
      document.getElementById(code).remove();
    });
  }
}

function closeNewMemberMsg(){
  document.getElementById("newMemberMsg").remove();
}

function showNewMemberMsg(){
  document.getElementById("newMemberMsg").style.display = "block";
  console.log("2222")
}

const searchForRFID = async (RFID_UID_input) => {
  console.log("searchRFID")
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
            console.log("!!!!",resp.data)

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

    const RFID_LENGTH = 16

    if (RFID_UID_input.length >= RFID_LENGTH){ //Wait a short amount of time before searching database for string, if another keypress comes wait until keypresses finish then search last (16) characters. Helps minimize accidental keypresses.
      window.clearTimeout(Timer)
      let lengthBefore = RFID_UID_input.length 
      var Timer = window.setTimeout(function(){
        if (lengthBefore < RFID_UID_input.length){
          console.log("removed leading characters...")
        } else {
          last_RFID_UID_input = RFID_UID_input.slice(-RFID_LENGTH)
          console.log("Searching database for RFID_UID matching",last_RFID_UID_input,"...");
          searchForRFID(last_RFID_UID_input);
          console.log("last_RFID_UID_input",last_RFID_UID_input)
          RFID_UID_input = ""
        }
      }, 200);
    }
  }

  componentDidMount(){
    this.nameInput.focus(); 
    if(window.location.search == "?new"){showNewMemberMsg()};
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
            <div id="newMemberMsg">
	            <h1>Welcome New Member!</h1>
	            <p>This database keeps track of your progress in the makerspace. Please <b>remember to badge in everytime you arrive at the makerspace</b> and badge out when you’re leaving.<br/><br/><b>You are NOT badged in yet!</b> If you are sticking around, please scan your card again to badge in for the first time. </p>
	            <a onClick={closeNewMemberMsg}>Got it!</a>
              </div>
          </div>
        </React.Fragment>
        
      );
  }
}
export default App;