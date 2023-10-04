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

function getMemberStats(members, config){
    let patronTypes = config.memberAttributes.patronTypes
    let gradYrs = config.memberAttributes.graduationYears
    let numOfEachPatronType = []
    let numOfEachGradYr = []
    
    gradYrs.forEach(gradYr => {
        let stats = {"registered":0,"totalEvents":0}
        numOfEachGradYr.push( { [gradYr] : stats } )
    })

    patronTypes.forEach(patronType => {
        let stats = {"registered":0,"totalEvents":0}
        numOfEachPatronType.push( { [patronType] : stats } )
    })

    for (let i=0;i<members.length;i++){
        let member = members[i];

        let foundStats_patronType = numOfEachPatronType.find(obj => obj.hasOwnProperty(member.PatronType))
        if (foundStats_patronType) {
            foundStats_patronType[member.PatronType].registered += 1
        }

        let foundStats_gradYr = numOfEachGradYr.find(obj => obj.hasOwnProperty(member.GraduationYear))
        if (foundStats_gradYr) {
            foundStats_gradYr[member.GraduationYear].registered += 1
        }
    }

    let memberStats = [numOfEachGradYr,numOfEachPatronType]
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
                let memberStats = getMemberStats(members, config[0])
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