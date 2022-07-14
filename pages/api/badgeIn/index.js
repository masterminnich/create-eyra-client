import Cors from 'cors'
import initMiddleware from '../../../lib/init-middleware'
import connectToDatabase from '../../../utils/connectToDatabase';
import Member from '../../../models/Member';
import Activity from '../../../models/Activity';

const localDateTimeOptions = {year:"numeric","month":"2-digit", day:"2-digit",hour12:false,hour:"2-digit",minute:"2-digit",second:"2-digit",timeZoneName:"short"}


// Initialize the cors middleware. You can read more about the available options here: https://github.com/expressjs/cors#configuration-options
const cors = initMiddleware(
   Cors({
    methods: ['GET', 'POST', 'OPTIONS', "PUT"], // Only allow requests with GET, POST and OPTIONS
  })
)

const addEventToActivityCollection = async (member, prevBadgeIn) => {
    let badgeOutTime = member.lastBadgeIn;
    let date = badgeOutTime.toISOString().substring(0,10)
    let sessionLengthMinutes = Math.round(new Date(badgeOutTime) - new Date(prevBadgeIn))/60000   
    const activity = await Activity.find({});
    let newActivityDay = activity.filter(a => a.Date == date)[0]
    let newEvent = {
        MemberID: member._id, 
        Name: member.Name, 
        badgeInTime: prevBadgeIn, 
        badgeOutTime: badgeOutTime, 
        event: "Undefined",
        machineUtilized: [], 
        sessionLengthMinutes: sessionLengthMinutes
    }

    if(newActivityDay){ //Update existing activity document
        let oldEvents = newActivityDay.Events
        let updatedEvents = oldEvents.concat(newEvent)
        try {
            let activitiesAfter = await Activity.findByIdAndUpdate(newActivityDay._id, {id: newActivityDay._id, Date: date, Events: updatedEvents}, {
                new: true,
                runValidators: true
            });
        } catch (error) {
            console.log("api/badgeIn (1) ERROR:",error)
        }
    } else { //Create new activity document in activity collection
        try {
            const activity = await Activity.create({Date: date, Events: newEvent});
            console.log("New activity added to database (new date inserted):",activity);
        } catch (error) {
            console.log("api/badgeIn (2) ERROR:",error);
        }
    }
}

const updateMemberBadgeInStatus = async (member) => {
    try {
        const bagdgeInStatusBefore = member.badgedIn;
        member.badgedIn = !member.badgedIn;
        const bagdgeInStatusAfter = member.badgedIn;

        if(bagdgeInStatusAfter == bagdgeInStatusBefore){
            console.log("ERROR! Failed to change badge in status.")
        } else { console.log("Successfully changed members badge in status to",member.badgedIn) }
        
        let prevBadgeIn = member.lastBadgeIn
        member.lastBadgeIn = new Date().toISOString(); //update member.lastBadgeIn
        
        let res = {};
        try {
            //Update Member
            const member2 = await Member.findByIdAndUpdate(member._id, member, {
                new: true,
                runValidators: true
            });

            if (!member2) {
                return res.status(400).json({ success: false });
            }
            if (member.badgedIn){ 
                console.log(member2.Name,"badged in!"); 
            } else { 
                console.log("mem1 vs mem2",prevBadgeIn," ",member2.lastBadgeIn)
                addEventToActivityCollection(member2, prevBadgeIn)
                console.log(member2.Name,"badged out!") 
            }
        } catch (error) {
            console.log("Error at api/badgeIn... error:", error)
        }

    } catch (error) {
        console.log(error);
    }
}

function findMemberByRFID(membersArray, rfid_to_find) {
    console.log("Searching for member with rfid",rfid_to_find,"...");
    const foundMember = membersArray.filter(member => {return member.rfid === rfid_to_find})
    if (foundMember.length === 1){
        console.log("Found member", foundMember[0].Name," w/ rfid",foundMember[0].rfid);
        return foundMember;
    } else if (foundMember.length > 1){
        return 406; //Search failed. More than one user share this RFID.
    } else if (foundMember.length === 0){
        return 404; //Search failed. No member with this RFID.
    } else { return 400; }
    
}


export default async function handler(req, res) {
    // Run cors
    await cors(req, res)

    connectToDatabase();

    const rfid_to_find = req.body.rfid;
    try {
        const membersArray = await Member.find({}); //Objects are not valid error...
        const foundMember = findMemberByRFID(membersArray, rfid_to_find);

        switch (foundMember) {
            case 406:
                console.log("Search failed. More than one user share this RFID.");
                res.status(406).json({ success: false }); //406: Not Acceptable. Multiple members found with the same RFID.
                break;

            case 404:
                console.log("Search failed. No member with this RFID.");
                res.status(404).json({ success: false }); //404: Not Found. RFID not found in database.
                break;

            case 400:
                console.log("Search failed. Error unknown.");
                res.status(400).json({ success: false });
                break;
                    
            default: //Member is found
                console.log("Attempting to update member's badge in status....");
                updateMemberBadgeInStatus(foundMember[0]);
                res.status(200).json({ success: true, data: foundMember[0] })
                break;
        }
    } catch (error) {
        res.status(400).json({ success: false });
    }
}