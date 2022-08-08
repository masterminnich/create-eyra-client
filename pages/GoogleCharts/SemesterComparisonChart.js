import { useEffect, useState } from "react";
import { Spinner } from "react-bootstrap";

let defaultVarOfInterest = "cumSessionMinutes"
let DataTables = {}

function SemesterComparisonChart ({google,calStats}) {
    const [chart, setChart] = useState(null);
    const [semCompVarOfInterest, setSemCompVarOfInterest] = useState("defaultVarOfInterest")

    function changeVarOfInterest(idOfSelectElem){
        let selectValue = document.getElementById(idOfSelectElem).value
        setSemCompVarOfInterest(selectValue);
    }

    useEffect(() => {
        if (semCompVarOfInterest && chart) {
            var options = {
                'title':'Semester Comparison - '+semCompVarOfInterest,
                'width':400,
                'height':300
            };

            if (Object.keys(DataTables).includes(semCompVarOfInterest)){
                //load a DataTable which was computed previously 
                let dataTable = DataTables[semCompVarOfInterest]
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
    }, [semCompVarOfInterest]);


    function createDataTable(varOfInterest){
        // Create the data table.
        const dataTable = new google.visualization.DataTable();
        dataTable.addColumn({ type: 'date', id: 'Date' });
        dataTable.addColumn({ type: 'number', id: 'Won/Loss' });

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

        //Convert daily stat to a cummulative stat
        let cumCerts = 0;
        for (let i=0;i<calStats[varOfInterest].length;i++){
            cumCerts += calStats[varOfInterest][i][1]
            calStats[varOfInterest][i][1] = cumCerts
        }

        dataTable.addRows(
            calStats[varOfInterest] // looks like:  [ new Date(2012, 3, 13), 8 ]
        );

        DataTables[semCompVarOfInterest] = dataTable //Save the DataTable to an object so we don't have to compute it again.
        
        return dataTable
    }


    useEffect(() => {
        if (google && !chart) {
            let dataTable = createDataTable(defaultVarOfInterest)

            var options = {
                'title':'Semester Comparison - '+defaultVarOfInterest,
                'width':400,
                'height':300
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
            <select id="semCompEventType" onChange={() => changeVarOfInterest("semCompEventType")}>
                <option value="Total visits">Total visits</option>
                <option value="avgSessionMinutes">avgSessionMinutes</option>
                <option value="cumSessionMinutes">cumSessionMinutes</option>
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
            <label>
                <input type="checkbox" defaultChecked="true"></input>
                Cummulative / Per-Semester
            </label>
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