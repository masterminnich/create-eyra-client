import { Schema, models, model } from 'mongoose';

const ConfigSchema = new Schema({
    timezone: {
        type: String,
    },
    certifications: {
        type: Array,
    },
    otherTools: {
        type: Array,
    },
    memberAttributes: {
        type: Object,
    },
    visitType: {
        type: Array,
    }
    /*timeZone
    patronType
    major*/
})

export default models.Config || model('Config', ConfigSchema);