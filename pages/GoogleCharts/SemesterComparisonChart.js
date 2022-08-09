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
        const dataTable = new google.visualization.DataTable();

        let segments; 
        if(segmentation == "Year"){ segments = Years }
        if(segmentation == "Semester"){ segments = Semesters }


        function findClosestValue(date){
            let found = false;
            for (let i=1;i<calStats[varOfInterest].length;i++){
                if (date < calStats[varOfInterest][i][0]){
                    found = true;
                    return [calStats[varOfInterest][i-1][2],i]
                }
            }
            if (found == false){ 
                console.log("findCLosestValue notfound")
                return [null,null] }
        }
        function findLastIndex(date){
            let found = false;
            for (let i=calStats[varOfInterest].length; i>0; i--){
                if (date > calStats[varOfInterest][i-1][0]){
                    found = true;
                    return [calStats[varOfInterest][i][2],i]
                }
            }
            if (found == false){ 
                console.log("findLastIndex notfound")
                return [null,null] }
        }


        //Define columns
        if (segmentation == "Cummulative"){
            dataTable.addColumn({ type: 'date', id: 'Date' }); 
            dataTable.addColumn({ type: 'string', role: 'annotation'});
            dataTable.addColumn({ type: 'number', id: varOfInterest });
            //dataTable.addColumn({ type: 'number', id: segment });
        } else { 
            //dataTable.addColumn({ type: 'number', id: 'numOfDays' }); //The x-axis: number of days since beginning of semester/year.
            //dataTable.addColumn({ type: 'string', role: 'annotation'});
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
        
        //Prepare data for DataTable
        let data = [];
        let dataCols = {}
        //if (segmentation == "Cummulative"){
            //Convert daily stat to a cummulative stat
            let cumStatValue = 0;
            for (let i=0;i<calStats[varOfInterest].length;i++){
                cumStatValue += calStats[varOfInterest][i][1]
                //calStats[varOfInterest][i][2] = cumStatValue
                //calStats[varOfInterest][i][1] = null //Annotation
                data[i] = [ calStats[varOfInterest][i][0], null, cumStatValue ]
            }
        /*} else {
            //Count days since beginning of semester/year.
            //Calculate semester/yearly cummulative statistics.

            //Segment the data by Year/Semester
            for (let i=0; i<Object.keys(segments).length-1; i++){
                let sem = Object.keys(segments)[i] //name

                console.log("seg",sem,"i",i,"max",Object.keys(Semesters).length-1)
                
                let [v2,startIndex] = findLastIndex(Semesters[Object.keys(Semesters)[i]])
                let [v3,endIndex] = findClosestValue(Semesters[Object.keys(Semesters)[i+1]])

                let seg;
                if (endIndex == null){ 
                    seg = calStats[varOfInterest].slice(startIndex) 
                } else { 
                    seg = calStats[varOfInterest].slice(startIndex,endIndex) 
                }

                console.log("i0",startIndex,"i1",endIndex,"seg",seg)

                dataTable.addColumn({ type: 'number', id: sem }, seg)
            }
            dataTable.sort({ column: 0 });
        }*/
        console.log("data",data)

        if (segmentation !== "Cummulative"){
            console.log("data.length",data.length)
            for(let i=0; i<data.length; i++){
                for(let j=0; j<segments.length; j++){
                    console.log("t")
                } 
            }
            //convert date to days since nearest segment start
            //for 0 -> largest number daysSince
            
            //dataTable.addColumn({ type: 'number', id: 'numOfDays' }); //The x-axis: number of days since beginning of semester/year.
            //dataTable.addColumn({ type: 'string', role: 'annotation'});
            //addColumn 
        }

        //Create DataTable
        if(segmentation == "Cummulative"){
            dataTable.addRows( data );

            //Create Semester Annotations
            for (let i=0; i< Object.keys(Semesters).length; i++){
                let sem = Object.keys(Semesters)[i]
                if (findClosestValue(Semesters[sem]) !== null){
                    dataTable.addRow([Semesters[sem], sem, findClosestValue(Semesters[sem])[0]])
                }
            }

            dataTable.sort({ column: 0 });
        }

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
                    'stem': { 'color': 'red' }
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