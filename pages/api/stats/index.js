import Cors from 'cors'
import initMiddleware from '../../../lib/init-middleware'
import connectToDatabase from '../../../utils/connectToDatabase';
import Activity from '../../../models/Activity';

const localDateTimeOptions = {year:"numeric","month":"2-digit", day:"2-digit",hour12:false,hour:"2-digit",minute:"2-digit",second:"2-digit",timeZoneName:"short"}

// This code processing data for the Calendar on the stats page.

// Initialize the cors middleware. You can read more about the available options here: https://github.com/expressjs/cors#configuration-options
const cors = initMiddleware(
   Cors({
    methods: ['GET', 'POST'], // Only allow requests with GET, POST and OPTIONS
  })
)

let results; //Save compiled stats to a global variable.

function fetchAllStats(activtiesCollection){
    //console.log("activities",activtiesCollection)
    //Find Today's Stats
    let todayDateObj = new Date()
    let todayDateStr = new Date().toLocaleString("en-CA", localDateTimeOptions).substring(0,10)
    let returnedVal = fetchDataOneDay(todayDateStr,activtiesCollection)

    //Find This Week's Stats
    let sundayDate = new Date();
    var dateOffset = (24*60*60*1000);
    let dayOfWeek = todayDateObj.getDay() //How many days into the week are we?
    sundayDate.setTime(todayDateObj.getTime() - dateOffset * dayOfWeek) //Find the beggining (Sunday) of the week

    //Get stats for each day of the week
    let thisWeekStats = {}
    for (let i = 0; i < dayOfWeek+1; i++) {
        let todaysDate = new Date();
        let todayDateStr = todaysDate.toLocaleString("en-CA", localDateTimeOptions).substring(0,10)
        let returnedVal = fetchDataOneDay(todayDateStr,activtiesCollection)
        let dateNickName = todaysDate.toString().substring(0,15)
        thisWeekStats[dateNickName] = returnedVal
    }

    //Find this Semester's Stats

    //Find all stats. Compiles all activities in the DB.
    let allStats = {}
    for (let j = 0; j < activtiesCollection.length; j++) {
        let dateStr = activtiesCollection[j].Date
        let returnedVal = fetchDataOneDay(dateStr,activtiesCollection)
        allStats[dateStr] = returnedVal
    }

    // WOW, nesting these if statements was a terrible idea. I'm sorry future me that is reading this code. It takes the allStats object and adds up like properties.
    let cumStats = {"eventTypeCount":{}}
    for(const date in allStats){
        let oneDayOfData = allStats[date]
        for(const prop in oneDayOfData){
            if(prop=="eventTypeCount"){ //If the property is eventType, unpack it further.
                for(const eventType in oneDayOfData["eventTypeCount"]){
                    if(cumStats["eventTypeCount"][eventType] == undefined){ //If the property hasn't been instatiated, set its value
                        cumStats["eventTypeCount"][eventType] = oneDayOfData["eventTypeCount"][eventType]
                    } else { //If the property has been instantiated, take its current value and add the next value.
                        cumStats["eventTypeCount"][eventType] = cumStats["eventTypeCount"][eventType] + oneDayOfData["eventTypeCount"][eventType]
                    }
                }
            } else {
                if(cumStats[prop] == undefined){ //If the property hasn't been instatiated, set its value
                    cumStats[prop] = 0
                } else { //If the property has been instantiated, take its current value and add the next value.
                    cumStats[prop] = cumStats[prop] + oneDayOfData[prop]
                }
            }
        }
    }
    // avgSessionMinutes needs to be recalculated. Because of the code above avgSessionMinutes = Sum(avgDay1 + avgDay2...). Instead it should take cumSessionMinutes and divide by total visits.
    cumStats["avgSessionMinutes"] = cumStats["cumSessionMinutes"]/cumStats["Total visits"]

    //Print stats to console
    //console.log("Today's Stats:",returnedVal)
    //console.log("thisWeekStats:",thisWeekStats)
    //console.log("All Stats:",allStats)
    //console.log("cumStats:",cumStats)
    return [returnedVal,thisWeekStats,allStats,cumStats]
}

const fetchDataOneDay = (todayDateStr,activitiesCollection) =>{
    let collectedStats = {
        "Total visits":0,
        "cumSessionMinutes":0,
        "avgSessionMinutes":0,
        "eventTypeCount":{}
    };

    let ActivityDay = activitiesCollection.find(a => a.Date == todayDateStr)

    if(ActivityDay !== undefined){
        let numberEvents = ActivityDay.Events.length
        collectedStats["Total visits"] = numberEvents;

        //Calculate the cummulative amount of session minutes
        let cumSessionMinutes = 0;
        ActivityDay.Events.forEach(event => cumSessionMinutes += event.sessionLengthMinutes)
        collectedStats["cumSessionMinutes"] = cumSessionMinutes;

        let avgSessionMinutes = cumSessionMinutes / numberEvents
        collectedStats["avgSessionMinutes"] = avgSessionMinutes;

        //Count each type of visit.
        let eventTypeCount = {"Undefined":0,"Individual":0,"Certification":0,"Class":0,"Quick Visit":0,"New Member Registered":0,"Staff on Duty":0,"Event":0}
        ActivityDay.Events.forEach(event => eventTypeCount[event.event] += 1)
        collectedStats["eventTypeCount"] = eventTypeCount;

    } else { console.log("No activities found with date",todayDateStr) }
    return collectedStats
}

function convert(results){ //Converts nested objects into array of arrays. {stat : [date: datapoint],[date: datapoint]}
    let allStats = results[2]

    function getNameOfStats(){
        let namesOfStats = [];
        let namesOfEventTypes = [];
        let KeyOfFirstRow = Object.entries(allStats)[0][1];
        for (let j=0;j<Object.entries(KeyOfFirstRow).length;j++){
            let statName = Object.entries(KeyOfFirstRow)[j][0]
            if (statName == "eventTypeCount"){
                let eventTypeCounts = Object.entries(KeyOfFirstRow)[j][1]
                namesOfEventTypes = Object.keys(eventTypeCounts)
            } else {
                namesOfStats.push(statName)
            }
        }
        return [namesOfStats,namesOfEventTypes]
    }

    let NameInfo = getNameOfStats()
    let NameOfStats = NameInfo[0]
    let NameOfEventTypes = NameInfo[1]
    let dates = Object.keys(allStats)

    //console.log("stat names:",NameOfStats,"event names:",NameOfEventTypes,"datesList",dates)

    let Final = {}
    //Start building Final. Add each stat/event name to the object
    for (let k=0;k<NameOfStats.length;k++){
        Final[NameOfStats[k]] = [] //Set each stat to an empty array. Later to be filed with [Date:datapoint, Date:datapoint]
    }
    for (let k=0;k<NameOfEventTypes.length;k++){
        Final[NameOfEventTypes[k]] = [] //Set each event to an empty array. Later to be filed with [Date:datapoint, Date:datapoint]
    }

    for (let k=0;k<dates.length;k++){ //for each day
        let oneDayStats = allStats[dates[k]]
        let date = dates[k]
        for (let m=0;m<NameOfStats.length;m++) { //for each variable and event type
            let statName = NameOfStats[m]
            let singleDataPoint = oneDayStats[statName]
            //console.log(NameOfStats[m],":",date,":",oneDayStats[NameOfStats[m]])
            let prevData = Final[NameOfStats[m]]
            prevData.push([date,singleDataPoint])
            Final[NameOfStats[m]] = prevData
        }
        for (let n=0;n<NameOfEventTypes.length;n++){
            let eventTypeName = NameOfEventTypes[n]
            let singleDataPoint = oneDayStats["eventTypeCount"][eventTypeName]
            let prevData = Final[eventTypeName]
            prevData.push([date,singleDataPoint])
            Final[eventTypeName] = prevData
        }
    }
    //console.log("Final after",Final)

    return Final
}


export default async function handler(req, res) {

    // Run cors
    await cors(req, res)

    connectToDatabase();

    const { method } = req;
    
    switch (method) {
        case 'GET': //Returns all documents in activities collection
            try{
                console.log("/api/stats is doing something...")
                const activity = await Activity.find({}); 
                let allStats = fetchAllStats(activity)
                console.log("allStats",allStats)
                let calendarDataObj = convert(allStats)
                console.log("calendarDataObj",calendarDataObj)
                console.log("/api/stats finished successfully...")
                res.status(200).json({ success: true, data: calendarDataObj })
            } catch (error) {
                res.status(400).json({ success: false });
                console.log("error",error)
            }
            break;
        default:
            res.status(400).json({ success: false });
            break;
    }
}