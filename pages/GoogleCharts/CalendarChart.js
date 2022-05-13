import { useEffect, useState } from "react";
import { Spinner } from "react-bootstrap";
import FileSaver from 'file-saver';


function CalendarChart ({google, calStats}) {
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
            console.log(selectValue);
        }
    }

    function loadChart(){
        console.log("drawing CalendarChart.js")
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
        if (varOfInterest == "cumSessionMinutes"){
            let minValue = 360
        } else {
            let minValue = 0
        }

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
        FileSaver.saveAs(csvBlob, 'BadgingSystem Stats.csv');
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

    return (
        <>
            {!google && <Spinner />}
            <div id="calendarChart" className={!google ? 'd-none' : ''} />
            
            <div className="controlCalendarChart">
                <p>Displaying Statistic: </p>
                <select id="selectEventType" onClick={() => changeVar("selectEventType")}>
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
                <button type="button" id="downloadCSV" download="" onClick={() => downloadCSV()}>
                    Download as CSV
                </button>
            </div>
        </>
    )
}

export default CalendarChart;