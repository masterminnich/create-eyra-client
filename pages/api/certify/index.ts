import Cors from 'cors'
import initMiddleware from '../../../utils/init-middleware'
import connectToDatabase from '../../../utils/connectToDatabase';
import Member from '../../../models/Member';

// Initialize the cors middleware. You can read more about the available options here: https://github.com/expressjs/cors#configuration-options
const cors = initMiddleware( Cors({ methods: ['PUT'] }) )

export default async function handler(req, res) {

    await cors(req, res)
    
    connectToDatabase();

    /*const {
        query: { id },
        method
    } = req;*/

    let memberIDList = req.body.memberIDList
    let newCerts = req.body.newCerts
    
    try {
        console.log("about to attemp to certify these members...",memberIDList,"for these certs",newCerts)
        const updatedMembers = await Member.updateMany({ _id: { $in: memberIDList } },
            { $addToSet: { Certifications: { $each: newCerts } }
        });
        //console.log("updatedMembers:",updatedMembers)
        res.status(200).json({ success: true })
    } catch (error) {
        console.log("Failed to batch certify.",error)
        res.status(400).json({ success: false });
    }
}