import { useEffect, useState } from "react";
import { Spinner } from "react-bootstrap";

let defaultVarOfInterest = "Certification"
let DataTables = {}


function SemesterComparisonChart ({google,calStats,config}) {
    const [chart, setChart] = useState(null);
    const [semCompVarOfInterest, setSemCompVarOfInterest] = useState(defaultVarOfInterest)
    const [segmentation, setSegmentation] = useState("Cummulative");

    let Semesters = {}
    for (let i=0; i<config?.stats?.semesters?.length; i++){
        Semesters["Semester "+String(i)] = new Date(config?.stats?.semesters[i])
    }
    let Years = {}
    for (let i=0; i<config?.stats?.academicYears?.length; i++){
        let date = new Date(config?.stats?.academicYears[i])
        Years[String(date.getFullYear()) +" - "+ String(date.getFullYear()+1)] = date
    }

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
                'width':700,
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
            if (found == false){ return [null,null] }
        }
        /*function findLastIndex(date){
            let found = false;
            for (let i=calStats[varOfInterest].length; i>0; i--){
                if (date > calStats[varOfInterest][i-1][0]){
                    found = true;
                    return [calStats[varOfInterest][i][2],i]
                }
            }
            if (found == false){ return [null,null] }
        }*/


        //Define columns
        if (segmentation == "Cummulative"){
            dataTable.addColumn({ type: 'date', id: 'Date' }); 
            dataTable.addColumn({ type: 'string', role: 'annotation'});
            dataTable.addColumn({ type: 'number', id: varOfInterest });
            //dataTable.addColumn({ type: 'number', id: segment });
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
        

        //Convert daily stat to a cummulative stat
        let data = [];
        //if (segmentation == "Cummulative"){
        let cumStatValue = 0;
        for (let i=0;i<calStats[varOfInterest].length;i++){
            cumStatValue += calStats[varOfInterest][i][1]
            data[i] = [ calStats[varOfInterest][i][0], null, cumStatValue ]
        }
        //console.log("cummulative stats computed. data=",data,"calStats[varOfInterest]",calStats[varOfInterest])
        

        //Segment that data
        if (segmentation !== "Cummulative"){
            let daysInSemester = 0;

            //Reformat values
            for(let j=0; j<Object.keys(segments).length; j++){
                let d = Object.keys(segments)[j]
            }            

            //console.log("creating a 5 col array. finding daysSince and columnIndex for each datapoint. data=",data)
            //data now looks like... [Date, annotation, datapoint, daysSince, segmentIndex]

            //Find daysSince and columnIndex
            for(let i=0; i<data.length; i++){
                let o = {}
                let date = data[i][0]
                let datapoint = data[i][2]
                for(let j=0; j<Object.keys(segments).length-1; j++){
                    let d = Object.keys(segments)[j]
                    if (date >= segments[d]){
                        let days = -Math.round((segments[d]-date)/(60000*60*24))
                        o[days]=j
                    }
                } 
                let l = Object.keys(o).filter(x => x >= 0)
                l = l.sort((a, b) => a-b)
                let daysSince = l[0] //Get the minimum positive value
                let columnIndex = o[daysSince]
                data[i][3] = parseInt(daysSince)
                data[i][4] = columnIndex
                //if (daysSince > daysInSemester){ daysInSemester = daysSince }
            }

            daysInSemester = Math.max.apply(Math, data.map(function(o) { return o[3]; })) //Get max value in column 3 (daysSince)

            //data now looks like... [Date, annotation, datapoint, daysSince, segmentIndex]
            //console.log("about to reformat the data",data)

            //Create the DataTable. Take data:[Date, annotation, datapoint, daysSince, segmentIndex] and turn it into newData [daysSince, annotation, seg1, seg2...]
            let lastDataFound = Array(Object.keys(segments).length-1).fill(null)
            let newData = []
            for (let i=0; i<daysInSemester; i++){
                let row = [i, null] //annotation = null
                let dataFound = false;
                for (let j=0; j<data.length; j++){
                    //let dataFound = []; //list of columnIndexs
                    let [daysSince, datapoint, columnIndex] = [data[j][3], data[j][2], data[j][4]]
                    if (daysSince == i){
                        //dataFound.push(i)
                        dataFound = true;
                        lastDataFound[columnIndex] = datapoint // store the datapoint
                    }
                }
                lastDataFound.forEach(segDatapoint => row.push(segDatapoint))
                newData.push(row)
            }

            //Force each segment to start at 0.
            if (true){
                let numOfColumns = newData[0].length
                let lastVal = 0;
                let daysSinceCol = newData.map((x) => x[0])
                let annotationCol = newData.map((x) => x[1])
                let newData2 = [ daysSinceCol, annotationCol ]
                for (let i=2; i<numOfColumns; i++){
                    let col = newData.map((x) => x[i])
                    col = col.map(x => x-lastVal)
                    let lastValueInSegment = Math.max(...col)
                    if(lastValueInSegment > 0){
                        lastVal += lastValueInSegment
                        console.log("set to lastValueInSegment",lastVal)
                    } else {
                        lastVal += 0
                        console.log("set to 0")
                    }
                    // Replace all negative values with 0. Artifact of null values.
                    for (let j=0; j<col.length; j++){
                        if(col[j] < 0){ col[j] = 0 }
                    }
                    newData2.push(col)
                }
                function transpose(a) {
                    return Object.keys(a[0]).map(function(c) {
                        return a.map(function(r) { return r[c]; });
                    });
                }
                newData = transpose(newData2)
            }

            //Trim Tails. Some semesters are longer than others. This finds the max value and trims the data to that point.
            //for (let i=0; i<newData[0].length; i++){ //For each column
                //Find the max value of each segment 
                //replace each datapoint until the end of the array with null

                /*let endIndex = row.indexOf(Math.max(...row))
                for (let k=endIndex; k<daysInSemester; k++){
                    row[k]=null
                }*/
            //}

            //Add Columns
            let index = [...Array(daysInSemester).keys()] //This will be the x-axis. It reprsents daysSince beginning of segment (semester/year). It looks like  [0,1,2,3...daysInSemester-1]
            dataTable.addColumn({ type: 'number', id: 'numOfDays' }, index); //The x-axis: number of days since beginning of semester/year.
            dataTable.addColumn({ type: 'string', role: 'annotation'});
            for (let i=0; i<Object.keys(segments).length-1; i++){
                let segmentName = Object.keys(segments)[i]
                dataTable.addColumn('number', segmentName)
            }

            dataTable.addRows( newData );
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

        //console.log("semesterComparison dataTable:",dataTable)
        DataTables[semCompVarOfInterest+segmentation] = dataTable //Save the DataTable to an object so we don't have to compute it again.
        
        return dataTable
    }


    useEffect(() => {
        if (google && !chart) {
            let dataTable = createDataTable(defaultVarOfInterest)

            var options = {
                'title':'Semester Comparison - '+defaultVarOfInterest,
                'width':700,
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
  
    if (config == undefined){ return(null) }
    return (
        <>
            {!google && <Spinner />}
            <div id="semesterComparisonChart" className={!google ? 'd-none' : ''} />
            <select id="semCompEventType" onChange={() => changeVarOfInterest("semCompEventType")} defaultValue={semCompVarOfInterest}>
                <option value="Total visits">Total visits</option>
                <option disabled value="avgSessionMinutes">avgSessionMinutes</option>
                <option value="cumSessionMinutes">cumSessionMinutes</option>
                <option disabled>──────────</option>
                <option value="New Member Registered">New Member Registered</option>
                {config?.visitType.map((visitType) =>
                    <option value={visitType} key={visitType}>{visitType}</option>
                )}
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