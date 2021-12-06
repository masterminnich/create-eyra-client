import React, { Component, useState } from 'react';
import { readRemoteFile } from 'react-papaparse'

function writeRow (filamentRow) {
    let trNew = document.createElement("tr");

    /*filamentRow.map((elem) => (
        
    ));*/
}

const getFilamentCSV = async(args) => {
    readRemoteFile('csv/filament.csv', {
        complete: (results) => {
            console.log('Results:', results.data);
            filamentData = results.data;
            resultHello = "kitty";
            

            console.log(filamentData);
            {filamentData.map((filamentRow) => (
                writeRow(filamentRow)
            ))}
        }
    })
}

const getInventoryCSV = async(args) => {
    readRemoteFile('csv/inventory.csv', {
        complete: (results) => {
          console.log('Results:', results.data)
        }
    })
}

const filamentData = ""
const resultHello = ""
const loaded = false;

class App extends Component {
    state = {
        badgeStatus: "waiting"
    };

    componentDidMount(){
        getFilamentCSV();

        //console.log("resultHello",resultHello)

        //console.log("filament:",filament)
        
        
    }

    render() {
        return (
            <>
                <button type="button" onClick={() => getInventoryCSV()}></button>
                <p className="badgeStatus">Status: {this.state.badgeStatus}</p>

                <h3>3D Printing Filaments</h3>
                <table>
                    <thead>
                        <tr>
                            <th>One</th>
                            <th>Two</th>
                        </tr>
                    </thead>
                    <tbody>
                    </tbody>
                </table>
            </>
        );
    }
}
export default App;