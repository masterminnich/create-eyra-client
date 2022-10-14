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
    Certifications: {
        type: Array,
        default: [],
    }
})

export default models.Member || model('Member', MemberSchema);