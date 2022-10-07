import Cors from 'cors'
import initMiddleware from '../../../lib/init-middleware'
import connectToDatabase from '../../../utils/connectToDatabase';
import Member from '../../../models/Member';


// Initialize the cors middleware. You can read more about the available options here: https://github.com/expressjs/cors#configuration-options
const cors = initMiddleware( Cors({ methods: ['GET', 'POST', 'OPTIONS', "PUT", "DELETE"] }) )

export default async function handler(req, res) {
    
    await cors(req, res)
  
    connectToDatabase();

    const {
        query: { id },
        method
    } = req;

    switch (method) {
        case 'GET':
            try {
                const member = await Member.findById(id);

                if (!member) {
                    return res.status(400).json({ success: false });
                }

                res.status(200).json({ success: true, data: member });
            } catch (error) {
                res.status(400).json({ success: false });
            }
            break;
        case 'PUT':
            try {
                //Update Member
                const member = await Member.findByIdAndUpdate(id, req.body, {
                    new: true,
                    runValidators: true
                });

                if (!member) {
                    return res.status(400).json({ success: false });
                }
                if (member.badgedIn){ 
                    console.log(member.Name,"badged in!"); 
                } else { console.log(member.Name,"badged out!") }

                res.status(200).json({ success: true, data: member });
            } catch (error) {
                res.status(400).json({ success: false });
            }
            break;
        case 'DELETE':
            try {
                const deletedMember = await Member.deleteOne({ _id: id });

                if (!deletedMember) {
                    return res.status(400).json({ success: false })
                }

                res.status(200).json({ success: true, data: {} });
            } catch (error) {
                res.status(400).json({ success: false })
            }
            break;
        default:
            res.status(400).json({ success: false })
            break;
    }
}