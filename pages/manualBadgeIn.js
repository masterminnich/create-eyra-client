import React, { Component, useState } from 'react';
//import connectToDatabase from '../utils/connectToDatabase';
//import Activity from '../models/Activity';

//connectToDatabase();

var createReactClass = require('create-react-class');
var RFID_UID_input = "";

//This page allows users to manually type in their RFID number to badge in.
//This file contains functionality to search for the RFID, record key strokes.


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
            console.log("memberData",memberData)
            try { console.log("Member Name:",memberData.Name); } catch {} //Catch statement triggers when multiple RFID found
        });

        if (res.status == 406){ 
            console.log("Search failed. More than one user share this RFID.")
            return 406
        } else if (res.status == 404){
            console.log("Search failed. No member with this RFID.")
            console.log("redirect to new member page?")
            return 404
        } else if (res.status == 200) {
            console.log('res',res)
            if (memberData.badgeIn == false){
                //If member badging out, append a new Event to activity collection
                //Add event to activities collection!!!!!!!
                const newEvent = {
                    "MemberID":memberData._id,
                    "Name":memberData.Name,
                    "Event":"Undefined"
                }/*
                const activity = await Activity.find({});
                try {
                    let acitivitiesBefore = activity[activity.length-1].Events
                    let activitiesAfter = acitivitiesBefore.concat(newEvent);
              
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
                        body: JSON.stringify({Date: dateStr, Events: newEvent})
                    })
              
                  } catch (error) {
                    console.log("Error adding to Activity collection.",error);
                  }*/
            }
            return 200
        } else { return "something really wrong happened"}
        //router.push("/");
    } catch (error) {
        console.log(error);
        return "something really wrong happened (2)"
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