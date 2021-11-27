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
                console.log("request!:",req.body)
                const date = req.body.badgeOutTime.substring(0,10)
                console.log("date : ",date)
                const found = await Activity.find({});//.remove().exec();
                const ActivityDaily = found.find(e => e.Date == date)
                const found2 = ActivityDaily.Events.find(ee => ee._id == id)
                console.log("ActivityDaily:",ActivityDaily)
                console.log("found2:",found2)
                console.log("activity:",found)

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