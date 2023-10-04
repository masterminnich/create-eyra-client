import { useEffect, useState } from "react";
import { Spinner } from "react-bootstrap";

function WorkshopPopularityPieChart ({google,memberStats}) {
    const [chart, setChart] = useState(null);
    const [varOfInterest, setVarOfInterest] = useState("registered")

    let currValue = "registered"
    function changeVar(idOfSelectElem){
        let selectValue = document.getElementById(idOfSelectElem).value
        if (currValue !== selectValue){ //Only update if the value changes.
            currValue = selectValue;
            console.log("SV",selectValue);
            setVarOfInterest(selectValue);
        }
    }

    useEffect(() => { // This is called everytime varOfInterest changes.
        if (google){ // Ensure google charts is loaded before trying to render a chart
            loadChart()
        } else {console.log("CalendarChart.js error: google not loaded.")}
    },[varOfInterest]);

    useEffect(() => {
        if (google && !chart) {
            loadChart()
        }
    }, [google, chart]);

    function loadChart(){
        // Create the data table.
        let dataForPieChart = [["Member",varOfInterest]]

        function isNumeric(str) {
            const num = parseFloat(str);
            return !isNaN(num);
        }

        memberStats[0].forEach(gradYr => {
            let categoryName = Object.keys(gradYr)[0]
            let datapoint =  gradYr[categoryName].registered
            if (isNumeric(categoryName)){ categoryName = categoryName + " Graduates"} //If gradYr is a number add 'graduates' to the end of the string
            dataForPieChart.push([categoryName, datapoint])
        })
        
        var data = google.visualization.arrayToDataTable(dataForPieChart);

        // Set chart options
        var options = {
            'title':'Registered Members',
            'width':400,
            'height':300
        };

        // Instantiate and draw our chart, passing in some options.
        const newChart = new google.visualization.PieChart(document.getElementById('memberPieChart'));
        newChart.draw(data, options);

        setChart(newChart);
    }

    return (
        <>
            {!google && <Spinner />}
            <div>
            <div className="controlMemberPieChart">
                {/*<p>Displaying Statistic: </p>
                <select id="selectMemberData" onClick={() => changeVar("selectMemberData")}>
                    <option value="registered">Registered</option>
                     <option value="cumEvents">Event Count</option>
                </select>*/}
            </div>
            <div id="memberPieChart" className={!google ? 'd-none' : ''} />
            
            </div>
        </>
    )
}

export default WorkshopPopularityPieChart;