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
    visitType: {
        type: Array,
    },
    memberAttributes: {
        type: Object,
    },
    stats: {
        type: Object
    }
    /*timeZone
    patronType
    major*/
})

export default models.Config || model('Config', ConfigSchema);