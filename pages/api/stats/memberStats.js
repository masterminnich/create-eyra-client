import Cors from 'cors'
import initMiddleware from '../../../lib/init-middleware'
import connectToDatabase from '../../../utils/connectToDatabase';
import Member from '../../../models/Member';

// Initialize the cors middleware. You can read more about the available options here: https://github.com/expressjs/cors#configuration-options
const cors = initMiddleware(
   Cors({
    methods: ['GET', 'POST'], // Only allow requests with GET, POST and OPTIONS
  })
)

function getWorkshopPopularity(members){ //get data to create Donut Chart. 
    let DonutChartData = [];
    DonutChartData.push(["Workshop","Completions"])
    let WorkshopList = [{"BantamMill":0}, {"CircuitDesign":0}, {"FourAxisMill":0}, {"Fusion":0}, {"Glowforge":0}, {"P9000":0}, {"Sewing":0}, {"Silhouette":0}, {"Ultimaker":0}, {"VectorCAD":0}]
    for (let i=0;i<members.length;i++){
        let member = members[i];
        let RowOfData = [];
        for (let j=0;j<WorkshopList.length;j++){
            let WorkshopName = Object.keys(WorkshopList[j])[0]
            let FullCertificationName = WorkshopName+"Certified"
            if (member[FullCertificationName]){ //If member is certified for this workshop
                WorkshopList[j][WorkshopName] += 1;
            }
        }
    }
    for (let i=0;i<WorkshopList.length;i++){
        let WorkshopName = Object.keys(WorkshopList[i])[0]
        let WorkshopAttendance = Object.values(WorkshopList[i])[0]
        DonutChartData.push([WorkshopName,WorkshopAttendance])
    }
    //console.log("WorkshopList",WorkshopList)
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
                numOfFaculty.cumEvents += member.sessions.length;
                break;
            case "Makerspace Staff":
                numOfMakerspaceStaff.registered += 1;
                numOfMakerspaceStaff.cumEvents += member.sessions.length;
                break;
        }
        switch (member.GraduationYear){
            case "2022":
                numOf2022Grads.registered += 1;
                numOf2022Grads.cumEvents += member.sessions.length;
                break;
            case "2023":
                numOf2023Grads.registered += 1;
                numOf2023Grads.cumEvents += member.sessions.length;
                break;
            case "2024":
                numOf2024Grads.registered += 1;
                numOf2024Grads.cumEvents += member.sessions.length;
                break;
            case "2025":
                numOf2025Grads.registered += 1;
                numOf2025Grads.cumEvents += member.sessions.length;
                break;
            case "2026":
                numOf2026Grads.registered += 1;
                numOf2026Grads.cumEvents += member.sessions.length;
                break;
        }
    }
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
                let memberStats = getMemberStats(members)
                let workshopStats = getWorkshopPopularity(members)
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