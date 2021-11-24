import connectToDatabase from '../../../utils/connectToDatabase';
import Member from '../../../models/Member';

connectToDatabase();

export default async (req, res) => {
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