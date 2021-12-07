import React, { Component, useState } from 'react';

const callbackFn = (activities) =>{
    console.log("activities",activities)

    //Find Today's Stats
    let dateObj = new Date();
    let edt_offset = -5*60; 
    dateObj.setMinutes(dateObj.getMinutes() + edt_offset); //Convert UTC to local time
    let dateStr = dateObj.getFullYear()+"-"+dateObj.toISOString().substring(5,7)+"-"+dateObj.toISOString().substring(8,10);
    let ActivityDay = activities.find(a => a.Date == dateStr)
    if(ActivityDay){
        console.log("ActivityDay:",ActivityDay);

        let numberEvents = ActivityDay.Events.length
        console.log("Total Visits Today:",numberEvents)

        //Calculate the cummulative amount of session minutes
        let cumSessionMinutes = 0;
        ActivityDay.Events.forEach(event => cumSessionMinutes += event.sessionLengthMinutes)
        console.log("cumSessionMinutes",cumSessionMinutes)

        let avgSessionMinutes = cumSessionMinutes / numberEvents
        console.log("avgSessionMinutes",avgSessionMinutes)

        //Count each type of visit.
        let eventTypeCount = {"Undefined":0,"Individual":0,"Certification":0,"Class":0,"Quick Visit":0,"New Member Registered":0}
        ActivityDay.Events.forEach(event => eventTypeCount[event.event] += 1)
        console.log(eventTypeCount)

    } else { console.log("No activities found with today's date.")}
}

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
            console.log("1",resp.data)
            callbackFn(resp.data)
            return response //resp.data
            //
            //updateActivityLog(resp.data, memberData);
        })
    } catch (error) { console.log("error @ getActivitiesCollection(): ",error); }
}

getActivitiesCollection();

class App extends Component {
    state = {};

    render() {
        return (
            <>
                <h1>Stats</h1>
                <p>Day, Week, Semester</p>
                <p>Cummulative Hours, Avg Session Length, Device Popularity, Unique Member visits, New registrants</p>
            </>
        );
    }
}
export default App;