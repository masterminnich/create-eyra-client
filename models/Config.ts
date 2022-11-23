import { Schema, models, model } from 'mongoose';

const ConfigSchema = new Schema({
    //timeZone
    certifications: {
        type: Array,
    },
    otherTools: {
        type: Array,
    },
    /*memberAttributes: {
        type: Object,
    }
    patronType
    major*/
    
})

export default models.Config || model('Config', ConfigSchema);