import { resolveHref } from 'next/dist/shared/lib/router/router';
import React, { Component, useState } from 'react';
import { SearchResult } from 'semantic-ui-react';
//import activity from './api/activity';
//import connectToDatabase from '../utils/connectToDatabase';

//connectToDatabase();

//This page allows users to manually type in their RFID number to badge in.
//This file contains functionality to search for the RFID, record key strokes.

var createReactClass = require('create-react-class');
var RFID_UID_input = "";

const getActivitiesCollection = async (memberData) => {
    try {
        const res = await fetch('http://localhost:3000/api/activity', {
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

function timeout(delay) {
  return new Promise( res => setTimeout(res, delay) );
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
  let T = timeout(350000);
  T.then((a) =>{
    document.getElementsByClassName("popupMsg")[0].remove();
  });
}

const searchForRFID = async (RFID_UID_input) => {
    try {
        const res = await fetch('http://localhost:3000/api/badgeIn', {
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
            //console.log(memberData.Name,"badged in?")

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
                if(memberData.badgeIn){msg = "badged in"}else{msg = "badged out"}
                let fullMsg = memberData.Name+" "+msg+"!"
                console.log(fullMsg)
                if (memberData.badgedIn == false){
                    getActivitiesCollection(memberData); //If member badging out, append a new Event to activity collection
                };
                createPopUp(fullMsg,"twohundred")
            } else { return "something really wrong happened"};
        });
        //router.push("/");
    } catch (error) {
        console.log(error);
        return "something really wrong happened (2)";
    }
}

class App extends Component {
  state = {
      badgeStatus: "waiting"
  };

  handleKeyDown = e => {
    RFID_UID_input += e.key;
    console.log("keypress: ", e.key);

    if (RFID_UID_input.length == 10){
        //When all characters of RFID are entered. Check if in database.
        console.log("Searching database for RFID_UID matching",RFID_UID_input,"...");
        let searchResultPromise = searchForRFID(RFID_UID_input);

        //searchResult = "waiting..."
        searchResultPromise.then((a) => {
            //this.state = "test69"
            //console.log("prmose",searchResultPromise)
        });
        RFID_UID_input = "";
    }
  }

  componentDidMount(){
    this.nameInput.focus(); 
  }

  render() {
      return (
        <React.Fragment>
          <input id="badgeInTextInput" type='text' 
            ref={(input) => { this.nameInput = input; }} //autoFocus wasn't working for some reason. Solution from StackOverflow: https://stackoverflow.com/questions/28889826/how-to-set-focus-on-an-input-field-after-rendering?rq=1
            onKeyDown={this.handleKeyDown}/>
          <div className="badgeIn">
            <h1 id="pleaseBadgeIn">Please Badge In!</h1>
            <div className="arrow"></div>
            <a href="newMember" id="newMemberButton">New Member Sign-Up</a>
            <div className="herf"></div>
          </div>
        </React.Fragment>
      );
  }
}
export default App;