import { clientPromise } from "../../lib/mongodb.js";

export default async function handler(req, res){
    const client = await clientPromise

    //Check Conenction
    const isConnected = await client.isConnected();
    console.log("badgeOut.js | isConnected :", isConnected);

    const data = req.query;

    const response = await client.collection("Users").update({_id : data}, {$set: {
        badgedIn: false,
        lastTime: "Saturday"
      }});
    
    res.json(response);
}