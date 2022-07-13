import React, { Component, useState } from 'react';
import { readRemoteFile } from 'react-papaparse'

const getInventoryCSV = async(args) => {
    readRemoteFile('csv/inventory.csv', {
        complete: (results) => {
          console.log('Results:', results.data)
        }
    })
}

class App extends Component {
    state = {
        badgeStatus: "waiting"
    };

    componentDidMount(){
        getFilamentCSV();
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