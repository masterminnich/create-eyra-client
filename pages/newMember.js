import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import fetch from 'isomorphic-unfetch';
import { Button, Form, Loader, Radio, Dropdown } from 'semantic-ui-react';

var rState="N/A"

const NewMember = () => {

    //Convert UTC to local time
    let currDate = new Date();
    let edt_offset = -5*60; //alternativelly,  currDate.getTimezoneOffset();
    currDate.setMinutes(currDate.getMinutes() + edt_offset);

    const [form, setForm] = useState({ 
        Name: '', Major: '', PatronType:"", GraduationYear:"N/A", badgedIn: false, lastBadgeIn: currDate, joinedDate: currDate, rfid:'xxxxxxxxxx', sessions:[],
        FourAxisMillCertified: false, BantamMillCertified: false, GlowforgeCertified: false, P9000Certified: false, SewingCertified: false, SilhouetteCertified: false, UltimakerCertified: false,
        CuraCertified: false, VectorCADCertified: false, CircuitDesignCertified: false
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const router = useRouter();
    const majorsList = ["Choose a Major...","Accounting","Anthropology and Geography","Art History","Art Studio","Biochemistry","Biology","Chemistry","Communication","Computer Science","Digital Culture and Design","Early Childhood Education","Economics","Elementary Education","Engineering Science","English","Exercise and Sport Science","Finance","Graphic Design","Health Administration Completion Program","History","Hospitality, Resort and Tourism Management","Information Systems","Information Technology","Intelligence and National Security Studies","Interdisciplinary Studies","Languages and Intercultural Studies","Management","Marine Science","Marketing","Mathematics (Applied)","Middle Level Education","Music","Musical Theatre","Nursing BSN","Nursing 2+2 Residential Bridge Program","PGA Golf Management Program","Philosophy","Physical Education/Teacher Education","Physics, Applied","Political Science","Psychology","Public Health","Recreation and Sport Management","Sociology","Special Education - Multicategorical","Theatre Arts","Undecided"];  // https://www.coastal.edu/admissions/programs/

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
            console.log("form : ",form);
            console.log(JSON.stringify(form));
            const res = await fetch('http://localhost:3000/api/members', {
                method: 'POST',
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(form)
            })
            router.push("/");
        } catch (error) {
            console.log(error);
        }
    }

    const handleSubmit = (e) => {
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
        if(e.target.value == "Student" || e.target.value == "Makerspace Staff"){
            document.querySelector('select').style.display = "inline-block"
            document.querySelectorAll('label')[5].style.display = "inline"
        } else { 
            document.querySelector('select').style.display = "none"
            document.querySelectorAll('label')[5].style.display = "none"
        }
        console.log(e.target.name,e.target.value);
        setForm({
            ...form,
            [e.target.name]: e.target.value
        })
        rState = e.target.value
    }

    const handleSelect = (e) => {
        console.log("handleSelect",e.target.value)
        setForm({
            ...form,
            [e.target.name]: e.target.value
        })
        console.log("form.GraduationYear: ",form.GraduationYear)
    }

    const handleSelectMajor = (e) => {
        console.log("handleSelectMajor",e.target.value)
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
        if (!form.Major) {
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

        return err;
    }

    return (
        <div className="form-container">
            <h1>Create Member</h1>
            <div>
                <p>Add RFID value to form</p>
                {
                    isSubmitting
                    ? <Loader active inline='centered' />
                    : <Form onSubmit={handleSubmit}>
                        <Form.Input
                            fluid
                            error={errors.name ? { content: 'Please enter a name', pointing: 'below' } : null}
                            label='Name'
                            placeholder='Name'
                            name='Name'
                            onChange={handleChange}
                        />
                        <label htmlFor="Major">Major: </label>
                        <select name="Major" onClick={handleSelectMajor}>
                            {majorsList.map((major) => (
                                <option key={major} value={major}>{major}</option>
                            ))}
                        </select>
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
                        <label htmlFor="GraduationYear">Graduation Year: </label>
                        <select name="GraduationYear" onClick={handleSelect}>
                            <option value="N/A">N/A</option>
                            <option value="2021">2021</option>
                            <option value="2022">2022</option>
                            <option value="2023">2023</option>
                            <option value="2024">2024</option>
                        </select>
                        <Button type='submit'>Create</Button>
                    </Form>
                }
            </div>
            <a href="manualBadgeIn">Badge In</a>
        </div>
    )
}

export default NewMember;