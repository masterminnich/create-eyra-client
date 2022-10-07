import { Schema, models, model } from 'mongoose';

const ConfigSchema = new Schema({
    certifications: {
        type: Array,
    },
    otherTools: {
        type: Array,
    },
    FourAxisMillCertified: {
        type: Boolean,
    }
})

export default models.Config || model('Config', ConfigSchema);