import { useEffect, useState } from "react";
import { Spinner } from "react-bootstrap";
import FileSaver from 'file-saver';


function CalendarChart ({google, calStats, config}) {
    const [chart, setChart] = useState(null);
    const [varOfInterest, setVarOfInterest] = useState("Total visits")

    function changeVarOfInterest(varOfInterest){
        setVarOfInterest(varOfInterest);
    }

    let currValue = "default"
    function changeVar(idOfSelectElem){
        let selectValue = document.getElementById(idOfSelectElem).value
        if (currValue !== selectValue){ //Only update if the value changes.
            currValue = selectValue;
            changeVarOfInterest(selectValue);
        }
    }

    function loadChart(){
        //console.log("drawing CalendarChart.js calStats",calStats)
        const dataTable = new google.visualization.DataTable();
        dataTable.addColumn({ type: 'date', id: 'Date' });
        dataTable.addColumn({ type: 'number', id: 'Won/Loss' });

        //Formatting. Dates got turned into strings. Convert back to Date Obj           
        function addOffset(dateObj){ //Correct dates by adding edt_offset
            let edt_offset = -5*60; 
            dateObj.setMinutes(dateObj.getMinutes() - edt_offset);
            return dateObj
        }
        if (typeof(calStats[varOfInterest][0][0]) !== "object"){ //Convert dates (as strings) into DateObjs. Add timezone offset which was lost in transport (because date was saved as a string).
            for (let i=0;i<calStats[varOfInterest].length;i++){ 
                let one = calStats[varOfInterest][i]
                calStats[varOfInterest][i][0] = addOffset(new Date(one[0]))
            }
        }

        dataTable.addRows(
            calStats[varOfInterest]
            //[ new Date(2012, 3, 13), 8 ]
        );

        // Set minValue to 360 for cumSessionMinutes only.
        let minValue = 0
        if (varOfInterest == "cumSessionMinutes"){ minValue = 360 }

        // Set chart options
        var options = {
            title: varOfInterest,
            colorAxis: {minValue: minValue, colors: ['#ffff00', '#ff0000']}
        };

        // Instantiate and draw our chart, passing in some options.
        const newChart = new google.visualization.Calendar(document.getElementById('calendarChart'));
        newChart.draw(dataTable, options);

        setChart(newChart);
    }

    function downloadCSV(){
        let length = calStats["Certification"].length //How many rows of data to be written
        let vars=Object.keys(calStats) //Get a list of all variable names
        let headerCSV = "Date," + vars.join() //This is the first line of the CSV which serves as a header, listing all the variables
        let contentCSV = headerCSV

        for(let i=0; i<length; i++){ //Iterate through each row
            contentCSV += "\n" //Append a new line
            contentCSV += calStats["Certification"][i][0] //Apend the date
            vars.forEach(variable => //Fetch the value for each variable for the given row
                contentCSV += ","+calStats[variable][i][1]
            )
        }

        console.log(contentCSV)

        const csvBlob = new Blob([contentCSV], { type: 'text/csv;charset=utf-8;' });
        FileSaver.saveAs(csvBlob, 'Eyra Stats.csv');
    }


    // Stats added after the fact...

    let members;
    let activities;
    let statsByMember = {}
    let statsByMajor = {}

    function computeNewStats(){
        console.log("members",members,"activities",activities)
        for(let i=1; i<82; i++){ //Manually specify the date range. Spring 2022 = 1 -> 82
            let dayActivity = activities[i].Events
            
            function getStatsByMember(event){
                if(Object.keys(statsByMember).includes(event.Name)){
                    statsByMember[event.Name].visits += 1
                    statsByMember[event.Name].cumMinutes += event.sessionLengthMinutes
                    if(event.event=="Certification"){
                        if(statsByMember[event.Name].certs.length > 0){ //If appending to a list add comma seperator
                            statsByMember[event.Name].certs += ', '+event.machineUtilized[0]
                        } else { //If this is the first entry in the list don't append a comma
                            statsByMember[event.Name].certs += event.machineUtilized[0]  //Assumes that all certification workshops are saved as seperate events.
                        }
                        statsByMember[event.Name].numOfCerts += 1
                    }
                } else {
                    statsByMember[event.Name] = {"visits":1,"cumMinutes":event.sessionLengthMinutes,"certs":"","numOfCerts":0}
                }
            }

            function getMajorFromName(name){
                for(let i=0; i<members.length; i++){
                    if(members[i].Name == name){
                        return members[i].Major.replace(",","") //Remove any commas that exist in the Major name
                    }
                }
            }

            function getStatsByMajor(event){
                let major = getMajorFromName(event.Name)
                if(Object.keys(statsByMajor).includes(major)){
                    statsByMajor[major].visits += 1
                    statsByMajor[major].cumMinutes += event.sessionLengthMinutes
                    if(event.event=="Certification"){
                        statsByMajor[major].numOfCerts += 1
                    }
                } else {
                    statsByMajor[major] = {"visits":1,"cumMinutes":event.sessionLengthMinutes,"numOfCerts":0,"numOfMembers":0}
                }
            }

            for(let k=0; k<dayActivity.length; k++){
                getStatsByMember(dayActivity[k])
                getStatsByMajor(dayActivity[k])
            }

        }
        //convert obj to csv
        function ObjToCSV(obj, filename, header){
            let csvContent = header
            let keys = Object.keys(obj)
            let vars = Object.keys(obj[keys[0]]); 
                for(let i=0; i<keys.length; i++){ //for each key
                    csvContent += keys[i]
                    for(let j=0; j<vars.length; j++){ //for each variable
                        if(vars[j] == "certs"){ //
                            csvContent += ",\""+obj[keys[i]][vars[j]]+"\""
                        } else {
                            csvContent += ","+obj[keys[i]][vars[j]]
                        }
                    }
                    csvContent += "\n"
                }
            console.log(csvContent)
            const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            FileSaver.saveAs(csvBlob, filename+'.csv');
        }

        setTimeout(function () {
            ObjToCSV(statsByMember, "statsByMember", "Name, visits, cumMinutes, certs, numOfCerts \n")
            ObjToCSV(statsByMajor, "statsByMajor", "Major, visits, cumMinutes, numOfCerts, numOfMembers \n")
            console.log("statsbyMajor",statsByMajor,"\n","statsByMem",statsByMember)
        }, 2000);
    }

    const getMembers = async () => { //Fetch member data from MongoDB for a specific member
        try {  
            const res = await fetch(`/api/members/`, {
                method: 'GET',
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                }
            })
            let response = res.json();
            response.then((resp) => {
              let memberData = resp.data
              members = memberData
            })
        } catch (error) { console.log(error); }
    }

    const getActivities = async () => {
        try {  
            const res = await fetch(`/api/activity/`, {
                method: 'GET',
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                }
            })
            let response = res.json();
            response.then((resp) => {
              let activityData = resp.data
              activities = activityData
            })
        } catch (error) { console.log(error); }
    }

    function downloadCSV2(){ //Additional Stats
        function getStatsByMajor2(){ //Append numOfRegistrants to statsByMajor
            console.log("statsByMajor",statsByMajor)
            for(let k=0; k<members.length; k++){
                let major = members[k].Major.replace(",","")
                console.log(major, statsByMajor[major].numOfMembers)
                statsByMajor[major].numOfMembers += 1 
            }
        }
        
        getMembers()
        getActivities()
        setTimeout(function () {
            computeNewStats()
            console.log("statsByMajor",statsByMajor)
            getStatsByMajor2()
        }, 2000);
        console.log("finish download")
    }

    useEffect(() => { // This is called everytime varOfInterest changes.
        if (google){ // Ensure google charts is loaded before trying to render a chart
            loadChart()
        } else {console.log("CalendarChart.js error: google not loaded.")}
    },[varOfInterest]);

    useEffect(() => {
        // This is called only once, when the page is loaded.

        //console.log("CalendarChart: calStats",calStats,"CalendarChart: google",google)
        if (google && !chart) { // Ensure google charts is loaded before trying to render a chart
            loadChart() // Create the data table.
        }
    }, [google, chart]);

    if (config == undefined){ return(null) }
    return (
        <>
            {!google && <Spinner />}
            <div id="calendarChart" className={!google ? 'd-none' : ''} style={{height: "34ch"}} />
            
            <div className="controlCalendarChart">
                <p>Displaying Statistic: </p>
                <select id="selectEventType" onClick={() => changeVar("selectEventType")}>
                    <option value="Total visits">Total visits</option>
                    <option value="avgSessionMinutes">avgSessionMinutes</option>
                    <option value="cumSessionMinutes">cumSessionMinutes</option>
                    <option disabled>──────────</option>
                    {config.visitType.map((v) =>
                        <option value={v} key={v}>{v}</option>
                    )}
                </select>
                <button type="button" id="downloadCSV" download="" onClick={() => downloadCSV()}>
                    Download as CSV
                </button>

                <button type="button" id="downloadCSV2" download="" onClick={() => downloadCSV2()}>
                    Download stats by major
                </button>
            </div>
        </>
    )
}

export default CalendarChart;