import { useEffect, useState } from "react";
import { Spinner } from "react-bootstrap";

let defaultVarOfInterest = "Certification"
let DataTables = {}

//Event Annotations
let Semesters = {
    "Spring 2022": new Date("1/10/22"),
    "Summer 2022": new Date("5/14/22"), 
    "Fall 2022": new Date("8/24/22"),
}
let Years = {
    "2021 - 2022": new Date("8/18/21"), 
    "2022 - 2023": new Date("8/24/22"),
}

function SemesterComparisonChart ({google,calStats}) {
    const [chart, setChart] = useState(null);
    const [semCompVarOfInterest, setSemCompVarOfInterest] = useState(defaultVarOfInterest)
    const [segmentation, setSegmentation] = useState("Cummulative");

    function changeVarOfInterest(idOfSelectElem){
        let selectValue = document.getElementById(idOfSelectElem).value
        setSemCompVarOfInterest(selectValue);
    }

    function changeSegmentation(idOfSelectElem){
        let selectValue = document.getElementById(idOfSelectElem).value
        setSegmentation(selectValue);
    }

    useEffect(() => {
        if (semCompVarOfInterest && chart) {
            var options = {
                'title':'Semester Comparison - '+semCompVarOfInterest,
                'width':400,
                'height':300,
                'annotations': { 
                    'style': 'line',
                    'stem': { 'color': 'red', }
                },
            };

            if (Object.keys(DataTables).includes(semCompVarOfInterest+segmentation)){
                //load a DataTable which was computed previously 
                let dataTable = DataTables[semCompVarOfInterest+segmentation]
                const newChart = new google.visualization.LineChart(document.getElementById('semesterComparisonChart'));
                newChart.draw(dataTable, options);
                setChart(newChart);
            } else {
                //create a new DataTable
                let dataTable = createDataTable(semCompVarOfInterest)
                const newChart = new google.visualization.LineChart(document.getElementById('semesterComparisonChart'));
                newChart.draw(dataTable, options);
                setChart(newChart);
            }
        }
    }, [semCompVarOfInterest, segmentation]);


    function createDataTable(varOfInterest){
        console.log("dddd",calStats)
        const dataTable = new google.visualization.DataTable();

        let segments; 
        if(segmentation == "Year"){ segments = Years }
        if(segmentation == "Semester"){ segments = Semesters }

        //Define columns
        if (segmentation == "Semester" || segmentation == "Year"){
            dataTable.addColumn({ type: 'number', id: 'numOfDays' }); //The x-axis: number of days since beginning of semester/year.
        } else { 
            dataTable.addColumn({ type: 'date', id: 'Date' }); 
        }
        dataTable.addColumn({ type: 'string', role: 'annotation'});
        if (segmentation == "Cummulative"){
            dataTable.addColumn({ type: 'number', id: varOfInterest });
        } else { 
            Object.keys(segments).forEach( segment =>
                dataTable.addColumn({ type: 'number', id: segment })
            )
        } 

        //Convert dates (as strings) into DateObjs. Add timezone offset which was lost in transport (because date was saved as a string).
        //Convert String to Date Obj          
        function addOffset(dateObj){ //Correct dates by adding edt_offset
            let edt_offset = -5*60; 
            dateObj.setMinutes(dateObj.getMinutes() - edt_offset);
            return dateObj
        }
        if (typeof(calStats[varOfInterest][0][0]) !== "object"){ 
            for (let i=0;i<calStats[varOfInterest].length;i++){ 
                let one = calStats[varOfInterest][i]
                calStats[varOfInterest][i][0] = addOffset(new Date(one[0]))
            }
        }

        calStats[varOfInterest] = calStats[varOfInterest].sort(function(a, b){ return a[0] - b[0] }); //Sort by date

        //Add data to the DataTable
        let data = [];
        if (segmentation == "Cummulative"){
            //Convert daily stat to a cummulative stat
            let cumStatValue = 0;
            for (let i=0;i<calStats[varOfInterest].length;i++){
                cumStatValue += calStats[varOfInterest][i][1]
                //calStats[varOfInterest][i][2] = cumStatValue
                //calStats[varOfInterest][i][1] = null //Annotation
                data[i] = [ calStats[varOfInterest][i][0], null, cumStatValue ]
            }
        } else {
            //Count days since beginning of semester/year.
            //Calculate semester/yearly cummulative statistics.

            //Segment the data by Year/Semester
            let start;
            let dataCols = {}
            for (let i=0; i<Object.keys(Semesters); i++){
                let sem = Object.keys(Semesters)[i] //name
                start = Semesters[sem] //Beginning Date

                //calStats[varOfInterest][0:firstIndex]
                //dataCols[semm] = []
                //Index of First Value: findClosestValue(Semesters[sem])[1]
                //First Value: findClosestValue(Semesters[sem])[0]

                //get index of last value
                //save that slice [b:e]
                //add the slice into the dataTable with addColumn
                //dataTable.addRow([ daysSince, null, segment1, segment2... ])
            }
        }

        dataTable.addRows( data );

        //Create Semester Annotations
        console.log("ddddddddddd",calStats)
        function findClosestValue(date){ 
            let found = false;
            for (let i=1;i<calStats[varOfInterest].length;i++){
                if (date < calStats[varOfInterest][i][0]){
                    let ValueAndIndex = [data[i-1][2],i]
                    console.log(ValueAndIndex,"ddd",data[i-1][2])
                    found = true;
                    return ValueAndIndex
                    //return [calStats[varOfInterest][i-1][2],i]
                }
            }
            if (found == false){
                return null
            }
        }
        
        for (let i=0; i< Object.keys(Semesters).length; i++){
            let sem = Object.keys(Semesters)[i]
            if (findClosestValue(Semesters[sem]) !== null){
                dataTable.addRow([Semesters[sem], sem, findClosestValue(Semesters[sem])[0]])
            }
        }
        dataTable.sort({ column: 0 });

        console.log("dt",dataTable)
        DataTables[semCompVarOfInterest+segmentation] = dataTable //Save the DataTable to an object so we don't have to compute it again.
        
        return dataTable
    }


    useEffect(() => {
        if (google && !chart) {
            let dataTable = createDataTable(defaultVarOfInterest)

            var options = {
                'title':'Semester Comparison - '+defaultVarOfInterest,
                'width':400,
                'height':300,
                'annotations': { 
                    'style': 'line',
                    'stem': { 'color': 'red', }
                },
            };
    
            // Instantiate and draw our chart, passing in some options.
            const newChart = new google.visualization.LineChart(document.getElementById('semesterComparisonChart'));
            newChart.draw(dataTable, options);
            setChart(newChart);
        }
    }, [google, chart]);
  
    return (
        <>
            {!google && <Spinner />}
            <div id="semesterComparisonChart" className={!google ? 'd-none' : ''} />
            <select id="semCompEventType" onChange={() => changeVarOfInterest("semCompEventType")} defaultValue={semCompVarOfInterest}>
                <option value="Total visits">Total visits</option>
                <option disabled value="avgSessionMinutes">avgSessionMinutes</option>
                <option disabled value="cumSessionMinutes">cumSessionMinutes</option>
                <option disabled>──────────</option>
                <option value="Certification">Certification</option>
                <option value="Individual">Individual</option>
                <option value="Class">Class</option>
                <option value="Event">Event</option>
                <option value="New Member Registered">New Member Registered</option>
                <option value="Quick Visit">Quick Visit</option>
                <option value="Staff on Duty">Staff on Duty</option>
                <option value="Undefined">Undefined</option>
            </select>
            <select id="segmentation" onChange={() => changeSegmentation("segmentation")} defaultValue={segmentation}>
                <option value="Cummulative">Cummulative</option>
                <option value="Semester">Semester</option>
                <option value="Year">Year</option>
            </select>
        </>
    )
}
  
export default SemesterComparisonChart;

//Get activity collection
//get fall semester, get spring semester
//find days from start of semester



//Select (dropdown) field to pick VarOfInterest
//Create a function to calculate dayOfSemester. 
    //Given an object of first days of the semester
        //{"Fall 2021": new Date("9/18/2021"), "Summer 2022": new Date("5/8/22")}
    //which semester?
    //how many days since day 0 of the semester
    //return the array
    //Fully cummulative vs since beginning of semester

//Create vertical lines to show each semester.
// Convert from one long graph to one smaller graph with overlapping lines.