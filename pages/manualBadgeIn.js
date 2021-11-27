import React, { Component, useState } from 'react';
//import activity from './api/activity';
//import connectToDatabase from '../utils/connectToDatabase';

//connectToDatabase();

//This page allows users to manually type in their RFID number to badge in.
//This file contains functionality to search for the RFID, record key strokes.

var createReactClass = require('create-react-class');
var RFID_UID_input = "";
var activities;

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
        let parsedResponse;
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

            if (res.status == 406){ 
                console.log("Search failed. More than one user share this RFID.");
                return 406;
            } else if (res.status == 404){
                console.log("Search failed. No member with this RFID.");
                console.log("redirect to new member page?");
                return 404;
            } else if (res.status == 200) {
                if (memberData.badgedIn == false){
                    getActivitiesCollection(memberData); //If member badging out, append a new Event to activity collection
                };
                return 200;
            } else { return "something really wrong happened"};
        });
        //router.push("/");
    } catch (error) {
        console.log(error);
        return "something really wrong happened (2)";
    }
}


const CheckKey = createReactClass({
    handleKeyDown: function(e) {
        RFID_UID_input += e.key;
        console.log("keypress: ", e.key);

        if (RFID_UID_input.length == 10){
            //When all characters of RFID are entered. Check if in database.
            console.log("Searching database for RFID_UID matching",RFID_UID_input,"...");
            let searchResultPromise = searchForRFID(RFID_UID_input);
            let searchResult = "waiting..."
            searchResultPromise.then((a) => {
                searchResult = a;
                //this.props.onKeyPress(searchResult);
            });
            RFID_UID_input = "";
        }
    },
    componentDidMount(){
        this.nameInput.focus(); 
    },
    render: function() {

        return (
            <React.Fragment>
                <h1>Please Badge In!</h1>

                <input type='text'
                    ref={(input) => { this.nameInput = input; }} //autoFocus wasn't working for some reason. Solution from StackOverflow: https://stackoverflow.com/questions/28889826/how-to-set-focus-on-an-input-field-after-rendering?rq=1
                    onKeyDown={this.handleKeyDown}/>
                <a href="newMember">New Member Sign-Up</a>
            </React.Fragment>
        )
    }
  })

export default CheckKey;