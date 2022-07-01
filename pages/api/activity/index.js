import Cors from 'cors'
import initMiddleware from '../../../lib/init-middleware'
import connectToDatabase from '../../../utils/connectToDatabase';
import Activity from '../../../models/Activity';


// Initialize the cors middleware. You can read more about the available options here: https://github.com/expressjs/cors#configuration-options
const cors = initMiddleware(
   Cors({
    methods: ['GET', 'POST', 'OPTIONS', "PUT"], // Only allow requests with GET, POST and OPTIONS
  })
)

export default async function handler(req, res) {

    // Run cors
    await cors(req, res)

    connectToDatabase();

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
            let dateToSearch = req.body.Date
            let eventsToAdd = req.body.Events
            console.log("dateToSearch",dateToSearch)

            const activityFound = await Activity.find({Date: dateToSearch}) //Fetches the old activites for this day
            console.log("activityFound",activityFound)


            // Assuming Events already exist for this date... Find the events for that day and replace with request body.
            try {
                let activitiesAfter = await Activity.findByIdAndUpdate(activityFound[0]._id, {id: activityFound[0]._id, Date: dateToSearch, Events: eventsToAdd}, {
                    new: true,
                    runValidators: true
                });
                res.status(201).json({ success: true, date: dateToSearch, found: activityFound, after: activitiesAfter, toAdd: eventsToAdd })
            } catch (error) {
                console.log("ERROR:",error)
                res.status(400).json({ success: false })
            }
            break;
        /*case 'DELETE':
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