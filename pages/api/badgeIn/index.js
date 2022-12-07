import Cors from 'cors'
import initMiddleware from '../../../utils/init-middleware'
import connectToDatabase from '../../../utils/connectToDatabase';
import Member from '../../../models/Member';
import Activity from '../../../models/Activity';

const localDateTimeOptions = {year:"numeric","month":"2-digit", day:"2-digit",hour12:false,hour:"2-digit",minute:"2-digit",second:"2-digit",timeZoneName:"short"}


// Initialize the cors middleware. You can read more about the available options here: https://github.com/expressjs/cors#configuration-options
const cors = initMiddleware( Cors({ methods: ['GET', 'POST', 'OPTIONS', "PUT"] }) )

const addEventToActivityCollection = async (activitiesCollection, member, prevBadgeIn) => {
    let badgeOutTime = member.lastBadgeIn;
    let date = badgeOutTime.toLocaleString("en-CA",localDateTimeOptions).substring(0,10)
    let sessionLengthMinutes = Math.round(new Date(badgeOutTime).getTime() - new Date(prevBadgeIn).getTime())/60000   
    let newActivityDay = activitiesCollection.filter(a => a.Date == date)[0]
    let newEvent = {
        MemberID: member._id, 
        Name: member.Name, 
        badgeInTime: prevBadgeIn, 
        badgeOutTime: badgeOutTime, 
        event: "Undefined",
        machineUtilized: [], 
        sessionLengthMinutes: sessionLengthMinutes
    }

    let activityAdded;
    if(newActivityDay){ //Update existing activity document
        let oldEvents = newActivityDay.Events
        let updatedEvents = oldEvents.concat(newEvent)
        try {
            activityAdded = await Activity.findByIdAndUpdate(newActivityDay._id, {id: newActivityDay._id, Date: date, Events: updatedEvents}, {
                new: true,
                runValidators: true
            });
        } catch (error) {
            console.log("Error while updaying existing activity (/api/badgeIn) :",error)
        }
    } else { //Create new activity document in activity collection
        try {
            activityAdded = await Activity.create({Date: date, Events: newEvent});
            console.log("New activity added to database:",activity.date);
        } catch (error) {
            console.log("Error while creating new activity (/api/badgeIn):",error);
        }
    }
    return activityAdded;
}

const updateMemberBadgeInStatus = async (activitiesCollection, member) => {
    try {
        member.badgedIn = !member.badgedIn;
        console.log("Successfully changed "+member.Name+"'s badge in status to",member.badgedIn)
        
        let prevBadgeIn = member.lastBadgeIn
        member.lastBadgeIn = new Date().toISOString(); //update member.lastBadgeIn
        
        let res = {};
        //Update Member
        let updatedMember = await Member.findByIdAndUpdate(member._id, member, {
            new: true,
            runValidators: true
        });

        if (!updatedMember) {
            return res.status(400).json({ success: false });
        }
        if (member.badgedIn){ 
            console.log(updatedMember.Name,"badged in!"); 
            return [undefined, updatedMember];
        } else { 
            console.log("prevBadgeIn:",prevBadgeIn," lastBadgeIn:",updatedMember.lastBadgeIn)
            let activityAdded = await addEventToActivityCollection(activitiesCollection, updatedMember, prevBadgeIn)
            console.log(updatedMember.Name,"badged out!") 
            return [activityAdded, updatedMember];
        }
    } catch (error) {
        console.log(error);
        return
    }
}

function findMemberByRFID(membersCollection, rfid_to_find) {
    console.log("Searching for member with rfid",rfid_to_find,"...");
    const foundMember = membersCollection.filter(member => {return member.rfid === rfid_to_find})
    if (foundMember.length === 1){
        console.log("Found member", foundMember[0].Name," w/ rfid",foundMember[0].rfid);
        return foundMember;
    } else if (foundMember.length > 1){
        return 406; //Search failed. More than one user share this RFID.
    } else if (foundMember.length === 0){
        return 404; //Search failed. No member with this RFID.
    } else { return 400; }
}

function findAndReplace(array, valueToAdd){ //ex: activitiesCollection, activityToAdd
    let index = array.findIndex((e) => e._id == valueToAdd._id); //find index of the element to replace
    array[index] = valueToAdd;
    return array;
}


export default async function handler(req, res) {
    // Run cors
    await cors(req, res)

    connectToDatabase();

    const rfid_to_find = req.body.rfid;
    try {
        let activitiesCollection = await Activity.find({});
        let membersCollection = await Member.find({}); //Objects are not valid error...
        let foundMember = findMemberByRFID(membersCollection, rfid_to_find);

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
                console.log("Attempting to update "+foundMember[0].Name+"'s badge in status. (Currently: "+foundMember[0].badgedIn+")");
                let [activityAdded, updatedMember] = await updateMemberBadgeInStatus(activitiesCollection, foundMember[0]);
                console.log({activityAdded,updatedMember});
                if (activityAdded !== undefined){
                    activitiesCollection = findAndReplace(activitiesCollection, activityAdded);
                }
                membersCollection = findAndReplace(membersCollection, updatedMember);
                res.status(200).json({ success: true, after: foundMember[0], members: membersCollection, activities: activitiesCollection })
                break;
        }
    } catch (error) {
        res.status(400).json({ success: false });
    }
}