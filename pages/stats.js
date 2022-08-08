import React from 'react';
import useGoogleCharts from "./GoogleCharts/useGoogleCharts";
import GetCalendarChart from './displayStatsCharts'

function App() {
  const google = useGoogleCharts();

  return (
    <>
        <a className="cornerButton" id="backEndButton" href="/">Backend</a>
        <GetCalendarChart google={google}/>
    </>
  );
}

export default App;