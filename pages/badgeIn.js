import React from 'react';
import io from 'Socket.IO-client'

//This page allows users to manually type in their RFID number to badge in.
//This file contains functionality to search for the RFID, record key strokes.

//If you want to detect both RFID and Magstripe, at least one of the inputs needs a pre or post stroke.
const EXPECTED_RFID_LENGTH = 16 //Set value to 0 if not in use
const EXPECTED_RFID_PRESTROKE = "" //Can be a pre or post stroke. Set to "" if not in use.
const EXPECTED_MAGSTRIPE_LENGTH = 0 //Set value to 0 if not in use
const EXPECTED_MAGSTRIPE_PRESTROKE = ";" //Can be a pre or post stroke. Set to "" if not in use.

var search_input = "";
const headers = {"Accept": "application/json", "Content-Type": "application/json"}


function checkFocus(){
  // This function is run when the badgeInInputText element is un-focused. It automatically re-focuses the element.
  if(document.getElementById("badgeInTextInput") !== document.activeElement){
    document.getElementById("badgeInTextInput").focus()
  }
}

class NewCardButton extends React.Component {
  render(){
    return(
      <>
        <button type="button">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-credit-card-2-front" viewBox="0 0 16 16">
            <path d="M2 3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h5.5a.5.5 0 0 1 0 1H2a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v4a.5.5 0 0 1-1 0V4a1 1 0 0 0-1-1H2Z"></path>
            <path d="M2 5.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-1zm0 3a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm3 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm3 0a.5.5 0 0 1 5"></path>
            <path d="M16 12.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Zm-3.5-2a.5.5 0 0 0-.5.5v1h-1a.5.5 0 0 0 0 1h1v1a.5.5 0 0 0 1 0v-1h1a.5.5 0 0 0 0-1h-1v-1a.5.5 0 0 0-.5-.5Z"></path>
          </svg>
        </button>
      </>
    )
  }
}

class Loading extends React.Component {
  render(){
    return(
      <>
        <p style={{textAlign: "center"}}>loading...</p>
      </>
  )}
}

class NotFoundPopup extends React.Component {
  render(){
    return(
      <>
        <div className="popupMsg" id="NotFoundPopup">
          <p>New member? Create an account!</p>
          <a id="newMemberButton" href={"newMember?rfid=" + this.props.rfid}>Register</a>
          <p className="helpMsg">Already registered? Ask makerspace staff for assistance.</p>
          <a id="close-button" onClick={this.props.closePopups}></a>
        </div>
      </>
  )}
}

class FoundPopup extends React.Component {
  constructor(props){
    super(props);
    this.state = {};
  }

  render(){
    let message = this.props.memberData.Name;
    if(this.props.memberData.badgedIn){
      message += " badged in!"
    } else { message += " badged out!" }

    return(
      <>
        <div className="popupMsg" id="FoundPopup">
          <p>{message}</p>
        </div>
      </>
  )}
}

class TooManyPopup extends React.Component {
  render(){
    return(
      <>
        <div className="popupMsg" id="TooManyPopup">
          <p>More than one member with this RFID...</p>
        </div>
      </>
  )}
}

function closeNewMemberMsg(){
  //document.getElementById("newMemberMsg").remove();
  window.location.href = window.location.origin + "/badgeIn" //Remove the ?new search tag from the URL
}

function showNewMemberMsg(){
  document.getElementById("newMemberMsg").style.display = "block";
}

const searchForID = async (id) => {
  console.log("Searching database for ID matching",id,"...");
  try {
    console.log("Need to implement an api route for ID searching....")
  } catch (error) {
    console.log("Error searching for ID.",error);
  }
}

const searchForMagstripe = async (magstripe_input) => {
  searchForID(magstripe_input.slice(1,8)) //Convert Magstrip UID to CINO ID
}

class App extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      badgeStatus: "waiting", // waiting, loading, tooMany, notFound, found
      rfid: '',
      memberData: undefined,
    };
  }

  closePopups = () => { this.setState({...this.state, badgeStatus: "waiting"}) }

  searchForRFID = async (RFID_UID_input) => {
    console.log("Searching database for RFID_UID matching",RFID_UID_input,"...");
    await fetch('/api/socket');
    var socket = io({transports: ['websocket'], upgrade: false});
    socket.on('connect', () => { console.log('WebSocket connected.') })
    //socket.on('update-both', data => {  setState({...state, activitiesCollection: data.activities, membersCollection: data.members}); })
    try {
      const res = await fetch('/api/badgeIn', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({rfid: RFID_UID_input})
      });
      let response = res.json()
      response.then((resp) => {
        let memberData = resp.after;
        let updatedMembers = resp.members;
        let updatedActivities = resp.activities;
        
        if (res.status == 200) {
          this.setState({...this.state, rfid: RFID_UID_input, badgeStatus: "found", memberData: memberData})
          socket.emit('membersAndActivities-change', {members: updatedMembers, activities: updatedActivities})
          setTimeout(() => this.setState({...this.state, badgeStatus: "waiting" }), 4000)
        } else if (res.status == 406){ 
          this.setState({...this.state, rfid: RFID_UID_input, badgeStatus: "tooMany"});
        } else {
          this.setState({...this.state, rfid: RFID_UID_input, badgeStatus: "notFound"});
        }
      });
    } catch (error) { console.log("Error searching for RFID.",error); }
  }

  searchRFIDOrMagStripe(lengthBefore, MIN_INPUT_LENGTH, MAX_INPUT_LENGTH){
    if (lengthBefore < search_input.length){
      console.log("removed leading characters...")
    } else { //If no additional keypresses follow, search for the RFID/Magstripe
      let last_search_input = search_input.slice(-MAX_INPUT_LENGTH)
      this.setState({...this.state, rfid: last_search_input})
      if ((EXPECTED_MAGSTRIPE_LENGTH == 0) || (last_search_input.includes(EXPECTED_RFID_PRESTROKE) & EXPECTED_RFID_PRESTROKE !== "")){
        last_search_input = last_search_input.slice(-EXPECTED_RFID_LENGTH)
        this.searchForRFID(last_search_input)
      } else if ((EXPECTED_RFID_LENGTH == 0) || (last_search_input.includes(EXPECTED_MAGSTRIPE_PRESTROKE) & EXPECTED_MAGSTRIPE_PRESTROKE !== "")){
        last_search_input = last_search_input.slice(-EXPECTED_MAGSTRIPE_LENGTH)
        searchForMagstripe(last_search_input)
      } else {
        //The input lacks a pre/post stroke 
        if (EXPECTED_RFID_PRESTROKE == ""){
          last_search_input = last_search_input.slice(-EXPECTED_RFID_LENGTH)
          console.log("r2")
          this.searchForRFID(last_search_input)
        } else {
          last_search_input = last_search_input.slice(-EXPECTED_MAGSTRIPE_LENGTH)
          searchForMagstripe(last_search_input)
        }
      }
      search_input = ""
    }
  }
  
  handleKeyDown = e => {
    checkFocus()

    const MIN_INPUT_LENGTH = Math.min.apply(null,[EXPECTED_RFID_LENGTH,EXPECTED_MAGSTRIPE_LENGTH].filter(x => x>0))
    const MAX_INPUT_LENGTH = Math.max.apply(null,[EXPECTED_RFID_LENGTH,EXPECTED_MAGSTRIPE_LENGTH].filter(x => x>0))

    if ([EXPECTED_RFID_PRESTROKE,EXPECTED_MAGSTRIPE_PRESTROKE,"a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z","1","2","3","4","5","6","7","8","9","0"].includes(e.key)){ //Ignore all keypresses except alphanumeric characters.
      search_input += e.key.toUpperCase(); //Force all letters to be Upper Case
      console.log("keypress: ", e.key.toUpperCase());
    
      if (search_input.length >= MIN_INPUT_LENGTH){ //Wait a short amount of time before searching database for string, if another keypress comes wait until keypresses finish then search last (16) characters. Helps minimize accidental keypresses.
        window.clearTimeout(Timer)
        this.setState({...this.state, badgeStatus: "loading"})
        let lengthBefore = search_input.length 
        var Timer = window.setTimeout(() => this.searchRFIDOrMagStripe(
          lengthBefore, MIN_INPUT_LENGTH, MAX_INPUT_LENGTH), 250);
      }
    }
  }

  componentDidMount(){
    this.nameInput.focus(); 
    if(window.location.search == "?new"){showNewMemberMsg()};
  }

  render() {
      return (
        <React.Fragment>
          <div className="badgeIn">
          <input id="badgeInTextInput" spellCheck="false" type='text' 
            ref={(input) => { this.nameInput = input; }} //autoFocus wasn't working for some reason. Solution from StackOverflow: https://stackoverflow.com/questions/28889826/how-to-set-focus-on-an-input-field-after-rendering?rq=1
            onKeyDown={this.handleKeyDown} onBlur={checkFocus}/>
            <h1 id="pleaseBadgeIn">Please Badge In!</h1>
            <h2 id="pleaseBadgeIn">(Hold your CINO ID to the reader until you hear a beep)</h2>
            <div className="arrow"></div>
            <div className="herf"></div>
            { this.state.badgeStatus == "loading" ? (
              <Loading/>
            ) : (<div></div>) }
            { this.state.badgeStatus == "tooMany" ? (
              <TooManyPopup/>
            ) : (<div></div>) }
            { this.state.badgeStatus == "notFound" ? (
              <NotFoundPopup closePopups={this.closePopups} rfid={this.state.rfid}/>
            ) : (<div></div>) }
            { this.state.badgeStatus == "found" ? (
              <FoundPopup memberData={this.state.memberData}/>
            ) : (<div></div>) }
            <div id="newMemberMsg">
	            <h1>Welcome New Member!</h1>
	            <p>This database keeps track of your progress in the makerspace. Please <b>remember to badge in everytime you arrive at the makerspace</b> and badge out when you’re leaving.<br/><br/><b>You are NOT badged in yet!</b> If you are sticking around, please scan your card again to badge in for the first time. </p>
	            <a onClick={closeNewMemberMsg}>Got it!</a>
              </div>
          </div>
        </React.Fragment>
      );
  }
}
export default App;


/*function createPopUp(msg,code){
  console.log("rfid:",last_search_input)

  // Remove any existing popups
  if(document.getElementById("twohundred")){ document.getElementById("twohundred").remove() } 
  if(document.getElementById("fourohfour")){ document.getElementById("fourohfour").remove() } 
  if(document.getElementById("fourohsix")){ document.getElementById("fourohsix").remove() } 

  let f = document.getElementsByClassName("herf")[0]
  const p = document.createElement("p");
  const d = document.createElement("div");

  d.id = code
  p.className = "popupMsg"
  p.innerText = msg
  d.appendChild(p)
  f.appendChild(d);
  if(code !== "twohundred"){ //If there is an error scanning the badge display a button linking to newMember page.
    const a = document.createElement("a")
    const a2 = document.createElement("a")
    a2.className = "close-button"
    a2.onclick = function closePopUp(){
      document.getElementsByClassName("popupMsg")[0].parentNode.remove()
      search_input="" 
    }
    d.appendChild(a2);
    let newLink = "newMember?rfid=" + last_search_input.toString()
    a.href=newLink
    a.id="newMemberButton"
    a.innerText="Register"
    d.appendChild(a);
    const helpMsg = document.createElement("p")
    helpMsg.innerText = "Already registered? Ask makerspace staff for assistance."
    helpMsg.className = "helpMsg"
    d.appendChild(helpMsg);
  }
  search_input=""
  if(code == "twohundred"){
    let T = timeout(4000);
    T.then((a) =>{
      document.getElementById(code).remove();
    });
  }
}




const searchForRFID = async (RFID_UID_input) => {
  console.log("Searching database for RFID_UID matching",last_search_input,"...");
  await fetch('/api/socket');
  let socket = io();
  socket.on('connect', () => { console.log('WebSocket connected.') })
  //socket.on('update-both', data => {  setState({...state, activitiesCollection: data.activities, membersCollection: data.members}); })
  try {
    const res = await fetch('/api/badgeIn', {
      method: 'POST',
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({rfid: RFID_UID_input})
    });
    let response = res.json()
    response.then((resp) => {
      let memberData = resp.after;
      let updatedMembers = resp.members;
      let updatedActivities = resp.activities;

      if (res.status == 406){ 
        let fullMsg = "Search failed. Multiple members with same RFID." //Already registered? Ask makerspace staff for assistance.
        console.log(fullMsg);
        createPopUp(fullMsg,"fourohsix")
      } else if (res.status == 404){
        let fullMsg = "New member? Create an account!"
        console.log(fullMsg);
        createPopUp(fullMsg,"fourohfour")
      } else if (res.status == 200) {
        socket.emit('membersAndActivities-change', {members: updatedMembers, activities: updatedActivities})
        let msg = ""
        if(memberData.badgedIn){msg = "badged in"}else{msg = "badged out"}
        let fullMsg = memberData.Name+" "+msg+"!"
        console.log(fullMsg)
        createPopUp(fullMsg,"twohundred")
      } else { return "something really wrong happened"};
    });
  } catch (error) {
    console.log("Error searching for RFID.",error);
  }
}*/