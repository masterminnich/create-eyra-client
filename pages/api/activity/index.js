import connectToDatabase from '../../../utils/connectToDatabase';
import Activity from '../../../models/Activity';

connectToDatabase();

export default async (req, res) => {
    const { method } = req;
    
    switch (method) {
        case 'GET': //Returns all documents in activities collection
            try {
                const activity = await Activity.find({});
                res.status(200).json({ success: true, data: activity })
            } catch (error) {
                res.status(400).json({ success: false });
            }
            break;
        case 'POST':
            //Check if there is other activity today. If not, add today's date to the Activity collection.
            //console.log("RB:",req.body)
            const activity = await Activity.find({});
            //console.log("activity|index.js activity:",activity);
            
            try {
                const activity = await Activity.create(req.body);
                console.log("New activity added to database (new date inserted):",activity);

                res.status(201).json({ success: true, data: activity })
            } catch (error) {
                res.status(400).json({ success: false });
                console.log("Error at activity|index.js|POST",error);
            }
            break;
        case 'PUT':
            let dateObj = new Date();
            let edt_offset = -5*60; 
            dateObj.setMinutes(dateObj.getMinutes() + edt_offset);
            let dateStr = dateObj.getFullYear()+"-"+dateObj.toISOString().substring(5,7)+"-"+dateObj.toISOString().substring(8,10);

            const activity1 = await Activity.find({Date: dateStr})
            
            try {
                const activity2 = await Activity.findByIdAndUpdate(activity1[0]._id, req.body, {
                    new: true,
                    runValidators: true
                });
                console.log("New activity added to database:",activity2.Date);

                res.status(201).json({ success: true, data: activity2 })
            } catch (error) {
                res.status(400).json({ success: false });
                console.log("Error at api/activity/index.js")
                console.log(error);
            }
            break;/*
        case 'DELETE':
            try {
                const activity = await Activity.find({});
                res.status(200).json({ success: true, data: activity })
            } catch (error) {
                res.status(400).json({ success: false });
            }
            break;*/
        default:
            res.status(400).json({ success: false });
            break;
    }
}