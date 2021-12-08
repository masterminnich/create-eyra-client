import React, { Component, useState } from 'react';

class App extends Component {
    state = {};

    render() {
        return (
            <>
                <main id="codeOfConduct">
                    <h1 className="header">Almost Done...</h1>
                    <p className="header">Please read and agree to our code of conduct.</p>

                    <h1 class="header">Code of Conduct</h1>
                    <ul>
                        <li>I understand the makerspace may only be utilized by CCU students/faculty/staff with a current CINO ID, given that makerspace staff is present.</li>
                        <li>I understand that I am fully responsible for the construction of my own projects.</li>
                        <li>I understand that the library provides materials when feasible, and I will be charged for certain consumable materials.</li>
                        <li>I will complete mandatory training before using equipment.</li>
                        <li>I will follow all device-specific rules and prodecures at all times, including wearing proper attire and PPE.</li>
                        <li>I understand that I will be held responsible for damage to makerspace equipment or injuries that are the result of purposeful negligence.</li>
                        <li>I will not use the makerspace for commercial purposes.</li>
                        <li>I will not use the makerspace to create:</li>
                            <ul>
                                <li>drug paraphernalia</li>
                                <li>weapons</li>
                                <li>harmful objects</li>
                                <li>things thats make others uncomfortable</li>
                                <li>items that violate intellectual property rights (copyright/trademark/patent law)</li>
                                <li>anything prohibited by local, state, federal law or Coastal Carolina policies</li>
                            </ul>
                            <li>I understand food and drinks are not allowed inside the lab unless expressly permitted by makerspace staff.</li>
                    </ul>

                    <a id="iAgree" href="/">I Agree</a>
                </main>
            </>
        );
    }
}
export default App;