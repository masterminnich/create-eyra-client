import mongoose from 'mongoose';

const connection = {};

async function connectToDatabase(){ 
    if (connection.isConnected) {
        return;
    }

    mongoose.set('strictQuery', false);
    const db = await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    connection.isConnected = db.connections[0].readyState;
    console.log(connection.isConnected)
}

export default connectToDatabase;