import { Schema, models, model } from 'mongoose';

const ActivitySchema = new Schema({
    MemberID: {
        type: Schema.Types.ObjectId,
    },
    Name: {
        type: String,
        trim: true,
    },
    badgeInTime: {
        type: String,
    },
    badgeOutTime: {
        type: String,
    },
    sessionLengthMinutes: {
        type: Number,
    },
    event: {
        type: String,
    },
    machineUtilized: {
        type: Array,
    },
    otherToolsUtilized: {
        type: Array,
    },
    flags: {
        type: Array,
    }
})

const DailyActivitySchema = new Schema({
    Date: {
        type: String,
    },
    Events: [ActivitySchema]
})


/*const ActivitySchema = new Schema({
    MemberID: {
        type: Schema.Types.ObjectId,
    },
    Name: {
        type: String,
        trim: true,
    },
    badgedInTime: {
        type: Date,
    },
    badgedOutTime: {
        type: Date,
    },
    sessionLengthMinutes: {
        type: Number,
    },
    event: {
        type: String,
        // Class, Tour, Special Event, N/A
    },
    machineUtilized: {
        type: Array,
        // Pick multiple
        //handtools, soldering, CNC machines
    }
})*/

export default models.Activity || model('Activity', DailyActivitySchema);