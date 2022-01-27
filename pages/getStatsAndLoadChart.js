import React, { Component, useState } from 'react';
import CalendarChart from './GoogleCharts/CalendarChart';

//Fetches data in calendar-ready format from api/stats/index.js (GET)

class App extends Component {
    constructor() {
        super();
        this.state = { data: "placeholder" };
    }

    async componentDidMount() {
        try {
            const res = await fetch('/api/stats', {
                method: 'GET'}
            )
            let response = res.json()
            response.then((resp) => {
                this.setState({data:resp.data})
            })
        } catch (error) { console.log("error @ Chart3.js: ",error); }
    }
    
    render() {
        //console.log("rendered Chart3 this.state.data",this.state.data)
        if (this.state.data == "placeholder"){
            //console.log("calStats has not loaded yet.")
            //console.log("chart3 google prop ==",this.props.google)
            return(<h1>loading Google Charts...</h1>)
        } else {
        return (
            <>
            <CalendarChart google={this.props.google} calStats={this.state.data}/>
            </>
        )}
    }
}

export default App;