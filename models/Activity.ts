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

export default models.Activity || model('Activity', DailyActivitySchema);