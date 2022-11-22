import Cors from 'cors'
import initMiddleware from '../../../utils/init-middleware'
import connectToDatabase from '../../../utils/connectToDatabase';
import Activity from '../../../models/Activity';


// Initialize the cors middleware. You can read more about the available options here: https://github.com/expressjs/cors#configuration-options
const cors = initMiddleware( Cors({ methods: ['GET', 'POST', 'OPTIONS', "PUT"] }) )

export default async function handler(req, res) {

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
            const activity = await Activity.find({});
            
            try {
                const activity = await Activity.create(req.body);
                console.log("Successfully created activity ("+req.body.Events.Name+"|"+req.body.Events.event+") on date,",req.body.Date)
                let activitiesCollection = await Activity.find({});
                res.status(201).json({ success: true, data: activity, activities: activitiesCollection })
            } catch (error) {
                console.log("Error while creating activity [/api/activity/index POST]:",error);
                res.status(400).json({ success: false });
                console.log("req.bod.Event",req.body.Events,"typeof Events",typeof(req.body.Events))
            }
            break;
        case 'PUT':
            //console.log("activityPUT:  req.body",req.body)
            let dateToSearch = req.body.Date
            let newActivityEvents = req.body.Events

            const activityFound = await Activity.find({Date: dateToSearch}) //Fetches the old activites for this day
            
            //To find the events which have changed, compare the activity (current on the DB) with the new activity
            let eventsInDB = activityFound[0].Events; 
            console.log("events already in db",eventsInDB.length)
            
            let idList = [];
            eventsInDB.filter(e => idList.push(e._id.toString()))
            let eventsAdded = newActivityEvents.filter(e => !idList.includes(e._id)) //Drop the events that don't change.

            // Assuming Events already exist for this date... Find the events for that day and replace with request body.
            try {
                let eventsAfter = await Activity.findByIdAndUpdate(activityFound[0]._id, {id: activityFound[0]._id, Date: dateToSearch, Events: newActivityEvents}, {
                    new: true,
                    runValidators: true
                });
                console.log("Number of eventsAdded...",eventsAdded.length)
                eventsAdded.forEach(eventAdded => console.log("Successfully edited an existing activity ("+eventAdded.Name+"|"+eventAdded.event+")") )
                let activitiesCollection = await Activity.find({});
                res.status(201).json({ success: true, date: dateToSearch, found: activityFound[0], after: eventsAfter, toAdd: newActivityEvents, activities: activitiesCollection })
            } catch (error) {
                console.log("Error while editing activity [/api/activity/index PUT]:",error)
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

        /*case 'PUT':
            //Check if there are other activities on this day.
             //If yes: Add new events to the list
              //Does the event need to be updated?
             //If no: create a new activity. Add the event

            //ASLO: Check if badgeOut is the same day. 

            let dateToSearch = req.body.Date
            let eventsToAdd = req.body.Events
            const activityFound = await Activity.find({Date: dateToSearch}) //Fetches the old activites for this day
            //console.log("API DEBUG || activityFound",activityFound)
            if (activityFound.length == 0){
                //Activity does not exist in DB yet.
                console.log("eventsToAdd.length before add",eventsToAdd.length)
                console.log("Couldn't find any activities for",dateToSearch+".") 
                console.log("eventsToAdd.length after add",eventsToAdd.length)

                // const activity = await Activity.create(req.body);
                // res.status(201).json({ success: true, data: activity })
            } else { 
                //Activities for this day already exist in the DB.
                let events = activityFound[0].Events
                console.log("Found ("+events.length+") activities for",dateToSearch)

                let idsInDB = []
                events.forEach((e) => idsInDB.push(e["_id"].toString()))

                //Are we updating an existing event or simply appending new events?
                 //loop through events, check for id match.
                
                eventsToAdd.forEach((event) => {
                    console.log("id:",event._id)
                    if(idsInDB.includes(event._id)){
                        //Editing an event that's already in the DB. 
                        events = events.filter(e => e["_id"]!==event._id); //Drop the existing event
                        events.push(event); //Replace the old event with the new event
                        console.log("Edited an existing event ("+event.Name+"|"+event.event+")");
                    } else {
                        //This event isn't in the DB. Add it to the list.
                        events.push(event);
                        console.log("Added a new event ("+event.Name+"|"+event.event+")");
                    }
                });

                console.log("After add Events length = ",events.length)
            }

            break;*/
            
        default:
            res.status(400).json({ success: false });
            break;
    }
}