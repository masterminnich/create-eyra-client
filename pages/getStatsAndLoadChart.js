import React, { Component, useState } from 'react';
import CalendarChart from './GoogleCharts/CalendarChart';
import WorkshopPopularityPieChart from './GoogleCharts/WorkshopPopularityPieChart';
import MemberPieChart from './GoogleCharts/MemberPieChart';

//Fetches data in calendar-ready format from api/stats/index.js (GET)

class App extends Component {
    constructor() {
        super();
        this.state = { 
            calendarData: "placeholder",
            workshopStats: "placeholder",
            memberStats: "placeholder"
        };
    }

    async componentDidMount() {
        //Get Calendar Data
        try {
            const res = await fetch('/api/stats', { method: 'GET'})
            let response = res.json()
            response.then((resp) => { 
                this.setState({calendarData:resp.data})
                console.log("calendarData",resp)
             })
        } catch (error) { console.log("error fetching calendarData from /api/stats: ",error); }
    
        //Get Member Stats
        try {
            const res = await fetch('/api/stats/memberStats', { method: 'GET'})
            let response = res.json()
            response.then((resp) => { 
                this.setState({
                    workshopStats:resp.data[0],
                    memberStats:resp.data[1]
                }) 
                console.log("fetched PieChart data",resp.data)
            })
            
        } catch (error) { console.log("error fetching memberStats from /api/stats/memberStats: ",error); }
    }
    
    render() {
        //console.log("rendered Chart3 this.state.data",this.state.data)
        if (this.state.calendarData == "placeholder" || this.state.memberStats == "placeholder" || this.state.workshopStats == "placeholder"){
            //console.log("calStats has not loaded yet.")
            //console.log("chart3 google prop ==",this.props.google)
            return(<h1>loading Google Charts...</h1>)
        } else { console.log("this.state.memberStats",this.state.memberStats,"this.state.workshopStats",this.state.workshopStats)
        return (
            <>
            <CalendarChart google={this.props.google} calStats={this.state.calendarData}/>
            <div className="PieCharts">
                <WorkshopPopularityPieChart google={this.props.google} workshopStats={this.state.workshopStats}/>
                <MemberPieChart google={this.props.google} memberStats={this.state.memberStats}/>
            </div>
            </>
        )}
    }
}

export default App;