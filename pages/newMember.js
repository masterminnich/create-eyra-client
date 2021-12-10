import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import fetch from 'isomorphic-unfetch';
import { Button, Form, Loader, Radio, Dropdown } from 'semantic-ui-react';

var rState="N/A"


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
    //Get today's date
    let dateObj = new Date();
    let edt_offset = -5*60; 
    dateObj.setMinutes(dateObj.getMinutes() + edt_offset); //Convert UTC to local time
    let dateStr = dateObj.getFullYear()+"-"+dateObj.toISOString().substring(5,7)+"-"+dateObj.toISOString().substring(8,10);

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

const NewMember = () => {

    const router = useRouter();
    const majorsList = ["Choose a Major...","N/A","Undecided","Accounting","Anthropology and Geography","Art History","Art Studio","Biochemistry","Biology","Chemistry","Communication","Computer Science","Digital Culture and Design","Early Childhood Education","Economics","Elementary Education","Engineering Science","English","Exercise and Sport Science","Finance","Graphic Design","Health Administration Completion Program","History","Hospitality, Resort and Tourism Management","Information Systems","Information Technology","Intelligence and National Security Studies","Interdisciplinary Studies","Languages and Intercultural Studies","Management","Marine Science","Marketing","Mathematics (Applied)","Middle Level Education","Music","Musical Theatre","Nursing BSN","Nursing 2+2 Residential Bridge Program","PGA Golf Management Program","Philosophy","Physical Education/Teacher Education","Physics, Applied","Political Science","Psychology","Public Health","Recreation and Sport Management","Sociology","Special Education - Multicategorical","Theatre Arts"];  // https://www.coastal.edu/admissions/programs/

    //Convert UTC to local time
    let currDate = new Date();
    let edt_offset = -5*60; //alternativelly,  currDate.getTimezoneOffset();
    currDate.setMinutes(currDate.getMinutes() + edt_offset);

    //Get RFID UID from the URL. Looks like this:  /newMember?rfid=abcdefghij
    let RQ = router.query;
    const globalRFID = RQ.rfid; 

    const [form, setForm] = useState({ 
        Name: '', Major: '', PatronType:"", GraduationYear:"N/A", badgedIn: false, lastBadgeIn: currDate, joinedDate: currDate, rfid:"globalRFID", sessions:[],
        FourAxisMillCertified: false, BantamMillCertified: false, GlowforgeCertified: false, P9000Certified: false, SewingCertified: false, SilhouetteCertified: false, UltimakerCertified: false,
        CuraCertified: false, VectorCADCertified: false, CircuitDesignCertified: false
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
        
    useEffect(() => {
        if (isSubmitting) {
            if (Object.keys(errors).length === 0) {
                createMember();
            }
            else {
                setIsSubmitting(false);
                console.log("Error submitting form.")
                console.log(errors)
            }
        }
    }, [errors])

    const createMember = async () => {
        try {
            console.log("Adding new member to DB: ",form);
            const res = await fetch('/api/members', {
                method: 'POST',
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(form)
            })
            let response = res.json();
            response.then((resp) => {
                getActivitiesCollection(resp.data)
            })
            
            router.push("/codeOfConduct");
        } catch (error) {
            console.log(error);
        }
    }

    const ensureRFIDSet = () => {
        setForm({
            ...form,
            "rfid": globalRFID.toString()
        })
    }

    const handleSubmit = (e) => {
        ensureRFIDSet(); //Ensures that the user's RFID has been stripped from the URL. Sometimes refreshing or other actions cause weird behavior otherwise.
        e.preventDefault();
        let errs = validate();
        setErrors(errs);
        setIsSubmitting(true);
    }

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        })
    }

    const handleRadio = (e) => {
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
        setForm({
            ...form,
            [e.target.name]: e.target.value
        })
        rState = e.target.value
    }

    const handleSelect = (e) => {
        console.log("handleSelect:",e.target.value)
        setForm({
            ...form,
            [e.target.name]: e.target.value
        })
    }

    const handleSelectMajor = (e) => {
        console.log("Major Selected:",e.target.value)
        setForm({
            ...form,
            [e.target.name]: e.target.value
        })
    }


    function validate() {
        let err = {};

        if (!form.Name) {
            err.Name = 'Name is required';
        }
        if (!form.Major && form.PatronType !== "Faculty") {
            err.Major = 'Major is required';
        }
        if (!form.lastBadgeIn) {
            err.lastBadgeIn = 'lastBadgeIn not defined';
        }
        if (!form.GraduationYear && form.PatronType == "Student") {
            err.GraduationYear = 'Graduation Year not defined';
        } else if (form.GraduationYear == "N/A"  && form.PatronType == "Student") {
            err.GraduationYear = 'Student cannot have graduation year undefined.';
        }
        if (!form.PatronType) {
            err.PatronType = 'Patron Type not defined';
        }
        if (!form.rfid) {
            err.rfid = 'No RFID';
        }

        return err;
    }

    return (
        <div className="form-container">
            <h1>Become a New Member</h1>
            <p>Please fill out the form below to be added to our database.</p>
            <div>
                {
                    isSubmitting
                    ? <Loader active inline='centered' />
                    : <Form id="newMember" onSubmit={handleSubmit}>
                        <div className="formComponent" id="formName">
                            <Form.Input
                                fluid
                                error={errors.name ? { content: 'Please enter a name', pointing: 'below' } : null}
                                label='Name:'
                                placeholder='Name'
                                name='Name'
                                id="NameInput"
                                onChange={handleChange}
                            />
                        </div>
                        <div className="formComponent" id="formRadios">
                            <Form.Radio
                                label="Student"
                                value="Student"
                                name="PatronType"
                                type="radio"
                                checked={rState == "Student"}
                                onClick={handleRadio}
                            />
                            <Form.Radio
                                label="Makerspace Staff"
                                value="Makerspace Staff"
                                name="PatronType"
                                type="radio"
                                checked={rState == "Makerspace Staff"}
                                onClick={handleRadio}
                            />
                            <Form.Radio
                                label="Faculty"
                                value="Faculty"
                                name="PatronType"
                                type="radio"
                                checked={rState == "Faculty"}
                                onClick={handleRadio}
                            />
                        </div>
                        <div className="formComponent" id="formMajor">
                            <label htmlFor="Major">Major:</label>
                            <select name="Major" onChange={handleSelectMajor}>
                                {majorsList.map((major) => (
                                    <option key={major} value={major}>{major}</option>
                                ))}
                            </select>
                        </div>
                        <div className="formComponent" id="formGrad">
                            <label htmlFor="GraduationYear">Graduation Year: </label>
                            <select name="GraduationYear" onChange={handleSelect}>
                                <option value="N/A">N/A</option>
                                <option value="2021">2021</option>
                                <option value="2022">2022</option>
                                <option value="2023">2023</option>
                                <option value="2024">2024</option>
                            </select>
                        </div>
                        <Button id="newMemberSubmit" type='submit'>Create</Button>
                    </Form>
                }
            </div>
            <a href="badgeIn" id="manualBadgeIn"><div className="left-arrow"></div>Badge In</a>
        </div>
    )
}

export default NewMember;