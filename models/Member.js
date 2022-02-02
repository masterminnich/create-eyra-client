import { Schema, models, model } from 'mongoose';

const MemberSchema = new Schema({
    Name: {
        type: String,
        required: [true, 'Please enter a name!'],
        trim: true,
    },
    Major: {
        type: String,
        required: [true, 'Please enter a major!'],
        trim: true,
    },
    PatronType: {
        type: String,
        required: [true, 'Please enter a patron type!'],
        trim: true,
    },
    GraduationYear: {
        type: String,
        required: [true, 'Please enter a patron type!'],
        trim: true,
    },
    badgedIn: {
        type: Boolean,
        /*default: false*/
    },
    lastBadgeIn: {
        //type: String,
        //default: String(Date.now)
        type: Date,
        default: Date.now
    },
    joinedDate: {
        type: Date,
        default: Date.now
    },
    rfid: {
        type: String,
    },
    sessions: {
        type: Array,
    },
    FourAxisMillCertified: {
        type: Boolean,
    },
    BantamMillCertified: {
        type: Boolean,
    },
    GlowforgeCertified: {
        type: Boolean,
    },
    P9000Certified: {
        type: Boolean,
    },
    SewingCertified: {
        type: Boolean,
    },
    SilhouetteCertified: {
        type: Boolean,
    },
    UltimakerCertified: {
        type: Boolean,
    },
    FusionCertified: {
        type: Boolean,
    },
    VectorCADCertified: {
        type: Boolean,
    },
    CircuitDesignCertified: {
        type: Boolean,
    }
})

export default models.Member || model('Member', MemberSchema);