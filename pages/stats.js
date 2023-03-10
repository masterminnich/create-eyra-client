import useGoogleCharts from "./GoogleCharts/useGoogleCharts";
import React, { Component, useState } from 'react';
import CalendarChart from './GoogleCharts/CalendarChart';
import WorkshopPopularityPieChart from './GoogleCharts/WorkshopPopularityPieChart';
import MemberPieChart from './GoogleCharts/MemberPieChart';
import SemesterComparisonChart from './GoogleCharts/SemesterComparisonChart';


class AllCharts extends Component {
    constructor() {
        super();
        this.state = { 
            configData: "placeholder",
            calendarData: "placeholder",
            workshopStats: "placeholder",
            memberStats: "placeholder"
        };
    }

    async componentDidMount() {
        //Get Config Data
        try {
            const res = await fetch('/api/config', { method: 'GET'})
            let response = res.json()
            response.then((resp) => { 
                this.setState({...this.state, configData:resp.data[0]})
                //console.log("configData:",resp.data[0])
            })
        } catch (error) { console.log("error fetching config data from /api/stats: ",error); }


        //Get Calendar Data
        try {
            const res = await fetch('/api/stats', { method: 'GET'})
            let response = res.json()
            response.then((resp) => { 
                this.setState({...this.state, calendarData:resp.data})
                //console.log("calendarData:",resp)
            })
        } catch (error) { console.log("error fetching calendarData from /api/stats: ",error); }
    
        //Get Member Stats
        try {
            const res = await fetch('/api/stats/memberStats', { method: 'GET'})
            let response = res.json()
            response.then((resp) => { 
                this.setState({
                    ...this.state, 
                    workshopStats:resp.data[0],
                    memberStats:resp.data[1]
                }) 
                //console.log("fetched PieChart data",resp.data)
            })
            
        } catch (error) { console.log("error fetching memberStats from /api/stats/memberStats: ",error); }
    }
    
    render() {
        //console.log("this.state.data",this.state.data)
        if (this.state.calendarData == "placeholder" || this.state.memberStats == "placeholder" || this.state.workshopStats == "placeholder"){
            //console.log("calStats has not loaded yet.")
            //console.log("props.google =",this.props.google)
            return(<h1>loading Google Charts...</h1>)
        } else { console.log("this.state.memberStats",this.state.memberStats,"this.state.workshopStats",this.state.workshopStats,"this.state.configData",this.state.configData,"this.state.calendarData",this.state.calendarData)
        return (
            <>
            <SemesterComparisonChart google={this.props.google} calStats={this.state.calendarData} config={this.state.configData}/>
            <CalendarChart google={this.props.google} calStats={this.state.calendarData} config={this.state.configData}/>
            <div className="PieCharts">
                <WorkshopPopularityPieChart google={this.props.google} workshopStats={this.state.workshopStats}/>
                <MemberPieChart google={this.props.google} memberStats={this.state.memberStats}/>
            </div>
            </>
        )}
    }
}

function Stats() {
  const google = useGoogleCharts();

  return (
    <>
        <a className="cornerButton" id="backEndButton" href="/">Backend</a>
        <AllCharts google={google}/>
    </>
  );
}

export default Stats;