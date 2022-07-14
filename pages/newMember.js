import React, { useState, useEffect } from 'react';
import { useRouter, withRouter } from 'next/router';
import fetch from 'isomorphic-unfetch';
import { Button, Form, Loader, Radio, Dropdown } from 'semantic-ui-react';
//import { render } from 'react-dom';
//import Link from 'next/link';

const localDateTimeOptions = {year:"numeric","month":"2-digit", day:"2-digit",hour12:false,hour:"2-digit",minute:"2-digit",second:"2-digit",timeZoneName:"short"}

const getActivitiesCollection = async (newMemberData) => {
    try {
        const res = await fetch('/api/activity', {
            method: 'GET',
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
        })
        console.log("newMemberData",newMemberData)
        let response = res.json();
        response.then((resp) => {
            updateActivityLog(resp.data,newMemberData)
        })
    } catch (error) { console.log("error @ getActivitiesCollection(): ",error); }
}

//Copied from index.js and badgeIn.js -- Make sure to update any changes to both documents.
const updateActivityLog = async (activities, newMemberData) => {
    let dateStr = new Date().toLocaleString("en-CA", localDateTimeOptions).substring(0,10);
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
              headers: {
                  "Accept": "application/json",
                  "Content-Type": "application/json"
              },
              body: JSON.stringify({Date: dateStr, Events: activitiesAfter})
          })
          
        } catch (error) {
          console.log("Error adding to Activity collection.",error);
        }
    

      } else { 
        //No acitivities yet today... adding a new date to the Activity collection.
        console.log("No activity with date",dateStr);
        try {
          const res = await fetch(`/api/activity`, {
              method: 'POST',
              headers: {
                  "Accept": "application/json",
                  "Content-Type": "application/json"
              },
              body: JSON.stringify({Date: dateStr, Events: newActivity})
          })
    
        } catch (error) {
          console.log("Error adding to Activity collection.",error);
        }
      }
}

class Box0 extends React.Component {
    constructor(props) {
        super(props);
        this.router = props.router;

        let currDate = new Date().toLocaleString("en-CA", localDateTimeOptions);

        this.state = {
            form: 
                {
                Name: '', Major: '', PatronType:"", GraduationYear:"N/A", badgedIn: false, lastBadgeIn: currDate, joinedDate: currDate, rfid: "globalRFID",
                FourAxisMillCertified: false, BantamMillCertified: false, GlowforgeCertified: false, P9000Certified: false, SewingCertified: false, SilhouetteCertified: false, UltimakerCertified: false,
                FusionCertified: false, VectorCADCertified: false, CircuitDesignCertified: false
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

    componentDidUpdate(){
        //console.log("update detected!  state.rfid =", this.state.form.rfid)
    }

    createMember = async () => {
        try {
            console.log("Adding new member to DB: ",this.state.form);
            const res = await fetch('/api/members', {
                method: 'POST',
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(this.state.form)
            })
            let response = res.json();
            response.then((resp) => {
                if (resp.success == true){ //Only send the user to the next page if member creation is successful.
                    getActivitiesCollection(resp.data)
                    console.log("routing to /codeOfConduct ...")
                    this.router.push("/codeOfConduct");
                } else { console.log("An error occured when creating member. This probably means the validate() function failed to do its job.")}
            })
        } catch (error) {
            console.log(error);
        }
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
        document.querySelector('select').style.display = "inline-block"
        document.querySelectorAll('label')[4].style.display = "inline"
        /*if(e.target.value == "Student" || e.target.value == "Makerspace Staff" || e.target.value === undefined){
            document.querySelector('select').style.display = "inline-block"
            document.querySelectorAll('label')[4].style.display = "inline"
        } else { 
            document.querySelector('select').style.display = "none"
            document.querySelectorAll('label')[4].style.display = "none"
        }*/
        //console.log("e.target.name:",e.target.name," e.target.value:",e.target.value);
        
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
        if (!this.state.form.Major && this.state.form.PatronType !== "Faculty") {
            err.Major = 'Major is required';
        }
        if (!this.state.form.Major && this.state.form.PatronType == "Faculty") { //If Faculty doesn't select N/A from the list, automatically set it for them instead of throwing an error.
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
            console.log("form.rfid = ",this.state.form.rfid,"RQ.RFID = ",RQ.rfid.toString())
        }

        return err;
    };
    
    render(){
        const majorsList = ["Choose a Major...","N/A","Undecided","Accounting","Anthropology and Geography","Art History","Art Studio","Biochemistry","Biology","Chemistry","Communication","Computer Science","Digital Culture and Design","Early Childhood Education","Economics","Elementary Education","Engineering Science","English","Exercise and Sport Science","Finance","Graphic Design","Health Administration Completion Program","History","Hospitality, Resort and Tourism Management","Information Systems","Information Technology","Intelligence and National Security Studies","Interdisciplinary Studies","Languages and Intercultural Studies","Management","Marine Science","Marketing","Mathematics (Applied)","Middle Level Education","Music","Musical Theatre","Nursing BSN","Nursing 2+2 Residential Bridge Program","PGA Golf Management Program","Philosophy and Religious Studies","Physical Education/Teacher Education","Physics, Applied","Political Science","Psychology","Public Health","Recreation and Sport Management","Sociology","Special Education - Multicategorical","Theatre Arts"];  // https://www.coastal.edu/admissions/programs/
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
                                <Form.Radio
                                    label="Student"
                                    value="Student"
                                    name="PatronType"
                                    type="radio"
                                    id="studentRadio"
                                    onClick={this.handleRadio}
                                    checked={this.state.form.PatronType == "Student"}
                                />
                                <Form.Radio
                                    label="Faculty/Staff"
                                    value="Faculty"
                                    name="PatronType"
                                    type="radio"
                                    id="facultyRadio"
                                    checked={this.state.form.PatronType == "Faculty"}
                                    onClick={this.handleRadio}
                                />
                                <Form.Radio
                                    label="Makerspace Staff"
                                    value="Makerspace Staff"
                                    name="PatronType"
                                    type="radio"
                                    id="makerspaceStaffRadio"
                                    checked={this.state.form.PatronType == "Makerspace Staff"}
                                    onClick={this.handleRadio}
                                />
                            </div>
                            <div className="formComponent" id="formMajor">
                                <label htmlFor="Major">Major:</label>
                                <select name="Major" onChange={this.handleSelectMajor} style={ this.state.errors.Major ? { border:"red solid" } : {  }}>
                                    {majorsList.map((major) => (
                                        <option key={major} value={major}>{major}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="formComponent" id="formGrad">
                                <label htmlFor="GraduationYear">Graduation Year: </label>
                                <select name="GraduationYear" onChange={this.handleSelect} style={ this.state.errors.GraduationYear ? { border:"red solid" } : {  }}>
                                    <option value="N/A">N/A</option>
                                    <option value="Grad Student">Grad Student</option>
                                    <option value="2022">2022</option>
                                    <option value="2023">2023</option>
                                    <option value="2024">2024</option>
                                    <option value="2025">2025</option>
                                    <option value="2026">2026</option>
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

export default withRouter(Box0);//NewMember;