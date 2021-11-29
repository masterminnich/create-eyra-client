import { get } from 'mongoose';
import React, { Component, useState } from 'react';
import CheckKey from "./manualBadgeIn";

function timeout(delay) {
    return new Promise( res => setTimeout(res, delay) );
}

class App extends Component {
    state = {
        badgeStatus: "waiting"
    };

    //let history = useHistory();

    handleKeyPress = badgeStatus => {
        //this.setState({ badgeStatus })
        console.log(this.state.badgeStatus)
        console.log("XZXZXZXZXZXZXZXZXXZXZXZXZ!!!!!!XZXZXZXZZXZX!!!")
        //let T = timeout(2000);
        //T.then((a) =>{
        //    document.getElementsByClassName("badgeStatus")[0].innerText = "Status: waiting";
        //});
        
    }

    render() {
        return (
            <>
                <CheckKey onKeyPress={this.handleKeyPress()}/>
                <p className="badgeStatus">Status: {this.state.badgeStatus}</p>
            </>
        );
    }
}
export default App;