import React from 'react';
import { useRouter, withRouter } from 'next/router';
import fetch from 'isomorphic-unfetch';
import { Button, Form, Loader, Radio, Dropdown } from 'semantic-ui-react';
import clientPromise from '../utils/mongodb'
import io from 'socket.io-client'

const localDateTimeOptions = {year:"numeric","month":"2-digit", day:"2-digit",hour12:false,hour:"2-digit",minute:"2-digit",second:"2-digit",timeZoneName:"short"}
const headers = {"Accept": "application/json", "Content-Type": "application/json"}

//Copied from index.js and badgeIn.js -- Make sure to update any changes to both documents.
const updateActivityLog = async (activities, newMemberData) => {
    await fetch('/api/socket');
    var socket = io({transports: ['websocket'], upgrade: false});
    socket.on('connect', () => { console.log('WebSocket connected.') })
    let dateStr = new Date().toISOString().substring(0,10);
    let dateObj = new Date();
    let ActivityDay = activities.find(a => a.Date == dateStr) //Get the activity document for the correct day
    let newActivity = {MemberID: newMemberData._id, Name: newMemberData.Name, badgeInTime: dateObj, badgeOutTime: dateObj, event: "New Member Registered",machineUtilized: [], sessionLengthMinutes: 0}

    if (ActivityDay){
        console.log("found Activities w/ date",dateStr);
        try {
            let acitivitiesBefore = ActivityDay.Events
            let activitiesAfter = acitivitiesBefore.concat(newActivity);
            const res = await fetch(`/api/activity`, {
                method: 'PUT',
                headers: headers,
                body: JSON.stringify({Date: dateStr, Events: activitiesAfter})
            });
            let response = res.json()
            response.then((resp) => {
                socket.emit('activitiesCollection-change', resp.activities);
            });
        } catch (error) { console.log("Error adding to Activity collection.",error); }
    } else { 
        //No acitivities yet today... adding a new date to the Activity collection.
        console.log("No activity with date",dateStr);
        try {
            const res = await fetch(`/api/activity`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({Date: dateStr, Events: newActivity})
            });
            let response = res.json()
            response.then((resp) => {
                socket.emit('activitiesCollection-change', resp.activities);
            });
        } catch (error) { console.log("Error adding to Activity collection.",error); }
    }
}

class NewMember extends React.Component {
    constructor(props) {
        super(props);
        this.router = props.router;
        let currDate = new Date().toLocaleString("en-CA", localDateTimeOptions);
        this.state = {
            form: {
                Name: '', Major: '', PatronType:"", GraduationYear:"N/A", badgedIn: false, lastBadgeIn: currDate, joinedDate: currDate, rfid: "globalRFID", Certifications: []
            },
            isSubmitting: false,
            errors: "",
        };
    };

    componentDidMount() {
        //Form.rfid is given a placeholder value. When the page loads, fetch the RFID_UID from the URL and overwrite form.rfid with this value. 
        if(this.state.form.rfid == "globalRFID"){
            let RFIDFromURL = new URL(window.location.href).searchParams.get("rfid")
            let tempForm = this.state.form
            tempForm.rfid = RFIDFromURL
            this.setState({ form:tempForm });
        }
    }

    createMember = async () => {
        try {
            console.log("Adding new member to DB: ",this.state.form);
            const res = await fetch('/api/members', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(this.state.form)
            })
            let response = res.json();
            response.then((resp) => {
                if (resp.success == true){ //Only send the user to the next page if member creation is successful.
                    updateActivityLog(this.props.activities,resp.data)
                    console.log("routing to /codeOfConduct ...")
                    this.router.push("/codeOfConduct");
                } else { console.log("An error occured when creating member. This probably means the validate() function failed to do its job.")}
            })
        } catch (error) { console.log(error); }
    };

    handleSubmit = (e) => {
        e.preventDefault();
        let errs = this.validate();
        this.setState({ errors:errs });
        console.log("errs",errs)
        if (Object.keys(errs).length === 0) {
            this.setState({ isSubmitting:true });
            this.createMember();
        }
    };

    handleNameChange = (e) => {
        let tempForm = this.state.form
        tempForm.Name = e.target.value.replace(/[^a-z0-9 ]/gi, ''); //Remove all non-alphanumeric characters
        this.setState({ form:tempForm });
    };

    handleRadio = (e) => {        
        let tempForm = this.state.form
        let radioSelected;
        if(e.target.value == undefined){ //Find the radio value when the user clicks the <label>
            radioSelected = e.target.innerText
        } else { //Find the radio value when the user radio button itself
            radioSelected = e.target.value
        }
        
        tempForm.PatronType = radioSelected

        this.forceUpdate() //Radio button checked state doesn't update until the component gets an update. Therefore we force an update.
    };

    handleSelect = (e) => {
        console.log("GraduationYear:",e.target.value)
        let tempForm = this.state.form
        tempForm.GraduationYear = e.target.value
        this.setState({ form:tempForm });
    };

    handleSelectMajor = (e) => {
        console.log("Major Selected:",e.target.value)
        let tempForm = this.state.form
        tempForm.Major = e.target.value
        this.setState({ form:tempForm });
    };


    validate() {
        let err = {};

        if (!this.state.form.Name) {
            err.Name = 'Name is required';
        }
        if (!this.state.form.Major && !["Faculty/Staff" || "Faculty" || "Staff"].includes(this.state.form.PatronType)) {
            console.log("Form Results:",this.state.form)
            err.Major = 'Major is required';
        }
        if (!this.state.form.Major && ["Faculty/Staff" || "Faculty" || "Staff"].includes(this.state.form.PatronType)) { //If Faculty doesn't select N/A from the list, automatically set it for them instead of throwing an error.
            let tempForm = this.state.form
            tempForm.Major = "N/A"
            this.setState({ form:tempForm });
        }
        if (!this.state.form.lastBadgeIn) {
            err.lastBadgeIn = 'lastBadgeIn not defined';
        }
        if (!this.state.form.GraduationYear && this.state.form.PatronType == "Student") {
            err.GraduationYear = 'Graduation Year not defined';
        } else if (this.state.form.GraduationYear == "N/A"  && this.state.form.PatronType == "Student") {
            err.GraduationYear = 'Student cannot have graduation year undefined.';
        }
        if (!this.state.form.PatronType) {
            err.PatronType = 'Patron Type not defined';
        }
        if (!this.state.form.rfid || this.state.form.rfid == "globalRFID" ) {
            err.rfid = 'No RFID. rfid = '+this.state.form.rfid;
        }

        return err;
    };
    
    render(){
        return(
            <>
            <div className="form-container">
                <h1>Become a New Member</h1>
                <p>Please fill out the form below to be added to our database.</p>
                <div>
                    {
                        this.state.isSubmitting
                        ? <Loader active inline='centered' />
                        : <Form id="newMember" onSubmit={this.handleSubmit}>
                            <div className="formComponent" id="formName">
                                <Form.Input
                                    fluid
                                    error={this.state.errors.Name ? { content: 'Please enter a name', pointing: 'left' } : null}
                                    style={ this.state.errors.Name ? { border:"red solid" } : {  }}
                                    label='Full Name: '
                                    placeholder='Name'
                                    name='Name'
                                    id="NameInput"
                                    onChange={this.handleNameChange}
                                />
                            </div>
                            <div className="formComponent" id="formRadios" style={ this.state.errors.PatronType ? { border:"red solid" } : {  }}>
                                {this.props.config.memberAttributes.patronTypes.map((patronType) => (
                                    <Form.Radio
                                        label={patronType}
                                        value={patronType}
                                        name="PatronType"
                                        type="radio"
                                        id={patronType+"Radio"}
                                        key={patronType+"Radio"}
                                        onClick={this.handleRadio}
                                        checked={this.state.form.PatronType == patronType}
                                    />
                                ))}
                            </div>
                            <div className="formComponent" id="formMajor">
                                <label htmlFor="Major">Major:</label>
                                <select name="Major" onChange={this.handleSelectMajor} defaultValue={"Select your major..."} style={ this.state.errors.Major ? { border:"red solid" } : {  }}>
                                    <option key="Select your major..." value="Select your major..." disabled>Select your major...</option>
                                    <option key="N/A" value="N/A">N/A</option>
                                    <option key="Undecided" value="Undecided">Undecided</option>
                                    {this.props.config.memberAttributes.majors.map((major) => (
                                        <option key={major} value={major}>{major}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="formComponent" id="formGrad">
                                <label htmlFor="GraduationYear">Graduation Year: </label>
                                <select name="GraduationYear" onChange={this.handleSelect} style={ this.state.errors.GraduationYear ? { border:"red solid" } : {  }}>
                                    {this.props.config.memberAttributes.graduationYears.map((gradYr) => (
                                        <option key={gradYr} value={gradYr}>{gradYr}</option>
                                    ))}
                                </select>
                            </div>
                            <Button id="newMemberSubmit" type='submit'>Create</Button>
                        </Form>
                    }
                </div>
                <a href="badgeIn" id="manualBadgeIn"><div className="left-arrow"></div>Badge In</a>
            </div>
            </>
        )
    }
}

export async function getStaticProps(context) {
    const client = await clientPromise

    const activityCollection = await client.db().collection("activities");
    const activityArray = await activityCollection.find({}).toArray();
    const activityP = JSON.parse(JSON.stringify(activityArray));

    const configCollection = await client.db().collection("configs");
    const configArray = await configCollection.find({}).toArray();
    const configP = JSON.parse(JSON.stringify(configArray));

    return { 
        props: { activities: activityP, config: configP[0] } 
    }
}

//export default NewMember;
export default withRouter(NewMember);