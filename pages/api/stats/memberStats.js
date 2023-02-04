import Cors from 'cors'
import initMiddleware from '../../../utils/init-middleware'
import connectToDatabase from '../../../utils/connectToDatabase';
import Member from '../../../models/Member';
import Config from '../../../models/Config';

// Initialize the cors middleware. You can read more about the available options here: https://github.com/expressjs/cors#configuration-options
const cors = initMiddleware(
   Cors({
    methods: ['GET', 'POST'], // Only allow requests with GET, POST and OPTIONS
  })
)

function getWorkshopPopularity(members, listOfCerts){ //get data to create Donut Chart. 
    let DonutChartData = [];
    DonutChartData.push(["Workshop","Completions"])
    let WorkshopList = listOfCerts.reduce((listOfCerts,c) => (listOfCerts[c]=0,listOfCerts),{}); //[{"BantamMill":0}, {"CircuitDesign":0}, {"FourAxisMill":0}, {"Fusion":0}, {"Glowforge":0}, {"P9000":0}, {"Sewing":0}, {"Silhouette":0}, {"Ultimaker":0}, {"VectorCAD":0}]
    for (let i=0;i<members.length;i++){
        let member = members[i];
        let RowOfData = [];
        for (let j=0; j<Object.keys(WorkshopList).length; j++){
            let WorkshopName = Object.keys(WorkshopList)[j]
            if (member.Certifications.includes(WorkshopName)){ //If member is certified for this workshop
                WorkshopList[WorkshopName] += 1;
                console.log("add to "+WorkshopName+"...",WorkshopList[WorkshopName])
            }
        }
    }
    for (let k=0; k<Object.keys(WorkshopList).length; k++){
        let WorkshopName = Object.keys(WorkshopList)[k]
        let WorkshopAttendance = WorkshopList[WorkshopName]
        DonutChartData.push([WorkshopName,WorkshopAttendance])
    }
    console.log({DonutChartData})
    return DonutChartData
}

function getMemberTableData(members){ //Create a sortable table using GoogleCharts. Include major, gradYr, amount of certifications, totalSessionLength
    let TableData = [];
    for (let i=0;i<members.length;i++){
        let member = members[i];
        let RowOfData = [];
        RowOfData.push(member.Name)
        RowOfData.push(member.Name)
    }
    return "test"
}

function getMemberStats(members){
    let numOfMakerspaceStaff = {"registered":0,"cumEvents":0};
    let numOfFaculty = {"registered":0,"cumEvents":0};
    let numOf2022Grads = {"registered":0,"cumEvents":0};
    let numOf2023Grads = {"registered":0,"cumEvents":0};
    let numOf2024Grads = {"registered":0,"cumEvents":0};
    let numOf2025Grads = {"registered":0,"cumEvents":0};
    let numOf2026Grads = {"registered":0,"cumEvents":0};
    for (let i=0;i<members.length;i++){
        let member = members[i];
        switch (member.PatronType){
            case "Faculty":
                numOfFaculty.registered += 1;
                //numOfFaculty.cumEvents += member.sessions.length;
                break;
            case "Makerspace Staff":
                numOfMakerspaceStaff.registered += 1;
                //numOfMakerspaceStaff.cumEvents += member.sessions.length;
                break;
        }
        switch (member.GraduationYear){
            case "2022":
                numOf2022Grads.registered += 1;
                //numOf2022Grads.cumEvents += member.sessions.length;
                break;
            case "2023":
                numOf2023Grads.registered += 1;
                //numOf2023Grads.cumEvents += member.sessions.length;
                break;
            case "2024":
                numOf2024Grads.registered += 1;
                //numOf2024Grads.cumEvents += member.sessions.length;
                break;
            case "2025":
                numOf2025Grads.registered += 1;
                //numOf2025Grads.cumEvents += member.sessions.length;
                break;
            case "2026":
                numOf2026Grads.registered += 1;
                //numOf2026Grads.cumEvents += member.sessions.length;
                break;
        }
    }

    // Get cumEvents for each member.
    // Turn activities -> one giant array of all events (from everyday)
    // let allMemberEvents = activities.filter(a => a.memberID == )
    // .length

    //console.log("numOfMakerspaceStaff",numOfMakerspaceStaff,"numOfFaculty",numOfFaculty,"numOf2022Grads",numOf2022Grads,"numOf2023Grads",numOf2023Grads,"numOf2024Grads",numOf2024Grads,"numOf2025Grads",numOf2025Grads,"numOf2026Grads",numOf2026Grads)
    let memberStats = {"numOfMakerspaceStaff":numOfMakerspaceStaff,"numOfFaculty":numOfFaculty,"numOf2022Grads":numOf2022Grads,"numOf2023Grads":numOf2023Grads,"numOf2024Grads":numOf2024Grads,"numOf2025Grads":numOf2025Grads,"numOf2026Grads":numOf2026Grads}
    return memberStats
}


export default async function handler(req, res) {

    // Run cors
    await cors(req, res)

    connectToDatabase();

    const { method } = req;
    
    switch (method) {
        case 'GET': //Returns all documents in activities collection
            try{
                console.log("/api/stats/memberStats is fetching stats...")
                const members = await Member.find({}); 
                const config = await Config.find({});
                let memberStats = getMemberStats(members)
                let workshopStats = getWorkshopPopularity(members, config[0].certifications)
                res.status(200).json({ success: true, data: [workshopStats,memberStats] })
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





// Get members Collection.
// Compare how many register members (Faculty/staff/1yr/2yr/3yr/4yr)
// Compare registered members reach by major.
    // How many unique majors total vs. all majors
    // Ranked List of major vs registered vs visits