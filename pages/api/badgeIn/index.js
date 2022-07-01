import Cors from 'cors'
import initMiddleware from '../../../lib/init-middleware'
import connectToDatabase from '../../../utils/connectToDatabase';
import Member from '../../../models/Member';

const localDateTimeOptions = {year:"numeric","month":"2-digit", day:"2-digit",hour12:false,hour:"2-digit",minute:"2-digit",second:"2-digit",timeZoneName:"short"}


// Initialize the cors middleware. You can read more about the available options here: https://github.com/expressjs/cors#configuration-options
const cors = initMiddleware(
   Cors({
    methods: ['GET', 'POST', 'OPTIONS', "PUT"], // Only allow requests with GET, POST and OPTIONS
  })
)

const updateMemberBadgeInStatus = async (member) => {
    try {
        const bagdgeInStatusBefore = member.badgedIn;
        member.badgedIn = !member.badgedIn;
        const bagdgeInStatusAfter = member.badgedIn;

        if(bagdgeInStatusAfter == bagdgeInStatusBefore){
            console.log("ERROR! Failed to change badge in status.")
        } else { console.log("Successfully changed members badge in status to",member.badgedIn) }
  
        let currDate = new Date();
        let dateUTCStr = currDate.toISOString()
  
        if (!member.badgedIn){
          //If member is badging out, create a newSession and append to the member's document.
          let memberSessionsBefore = member.sessions;

          //Calculate sessionLengthMinutes
          let outDate = currDate
          let inDate = new Date(member.lastBadgeIn)
          let sessionLengthMinutes = Math.round(outDate - inDate)/60000

          let newSession = {'badgeIn': member.lastBadgeIn, 'badgeOut':dateUTCStr, 'sessionLengthMinutes':sessionLengthMinutes};
          console.log(newSession);
          member.sessions = memberSessionsBefore.concat(newSession);
        }
        if (member.badgedIn){
          member.lastBadgeIn = dateUTCStr;
        }
        
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