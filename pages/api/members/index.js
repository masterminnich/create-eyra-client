import Cors from 'cors'
import initMiddleware from '../../../lib/init-middleware'
import connectToDatabase from '../../../utils/connectToDatabase';
import Member from '../../../models/Member';


// Initialize the cors middleware. You can read more about the available options here: https://github.com/expressjs/cors#configuration-options
const cors = initMiddleware(
   Cors({
    methods: ['GET', 'POST', 'OPTIONS', "PUT", "DELETE"], // Only allow requests with GET, POST and OPTIONS
  })
)

export default async function handler(req, res) {
    // Run cors
    await cors(req, res)

    connectToDatabase();

    const { method } = req;

    switch (method) {
        case 'GET':
            try {
                const members = await Member.find({});

                res.status(200).json({ success: true, data: members })
            } catch (error) {
                res.status(400).json({ success: false });
            }
            break;
        case 'POST':
            //console.log("index.js|POST");
            try {
                const member = await Member.create(req.body);
                console.log("New member added to database:",member);

                res.status(201).json({ success: true, data: member })
            } catch (error) {
                res.status(400).json({ success: false });
                console.log("Error at /api/members/index.js|POST")
                console.log(error);
            }
            break;
        default:
            res.status(400).json({ success: false });
            break;
    }
}