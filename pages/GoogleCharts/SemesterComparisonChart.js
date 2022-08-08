import { useEffect, useState } from "react";
import { Spinner } from "react-bootstrap";

function SemesterComparisonChart ({google,memberStats}) {
    const [chart, setChart] = useState(null);

    useEffect(() => {
        if (google && !chart) {
            loadChart()
        }
    }, [google, chart]);

    function loadChart(){
        // Create the data table.
        let dataForPieChart = [["Member",varOfInterest]]
        let keys = Object.keys(memberStats)
        for (let i=0;i<keys.length;i++){ //memberStats is {stat:{Registered:dp1, cumEvents:dp2}}
            let datapoint = memberStats[keys[i]][varOfInterest]
            let categoryName = keys[i].substring(5,keys[i].length)
            dataForPieChart.push([categoryName, datapoint]) 
        }
        var data = google.visualization.arrayToDataTable(dataForPieChart);

        // Set chart options
        var options = {
            'focusTarget': "category",
            'title': 'Semester Comparison',
            'width': 600,
            'height': 300
        };

        // Instantiate and draw our chart, passing in some options.
        const newChart = new google.visualization.LineChart(document.getElementById('semesterComparisonChart'));
        newChart.draw(data, options);

        setChart(newChart);
    }

    return (
        <>
            {!google && <Spinner />}
            <div id="semesterComparisonChart" className={!google ? 'd-none' : ''} />
        </>
    )
}

export default SemesterComparisonChart;


//Get activity collection
//get fall semester, get spring semester
//find days from start of semester