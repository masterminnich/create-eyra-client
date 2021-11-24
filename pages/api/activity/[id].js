import connectToDatabase from '../../../utils/connectToDatabase';
import Activity from '../../../models/Activity';

connectToDatabase();

export default async (req, res) => {
    const {
        query: { id },
        method
    } = req;
    
    switch (method) {
        case 'DELETE':
            try {
                console.log("id found...",id)
                const found = await Activity.find({});//.remove().exec();
                console.log("found=",found)
                console.log("frog")
                let foundEvents = found.Events.filter(e => e._id == id)
                console.log("foundEvents=",foundEvents)

                res.status(200).json({ success: true, data: "event removed." })
            } catch (error) {
                res.status(400).json({ success: false });
            }
            break;
        default:
            res.status(400).json({ success: false });
            break;
    }
}