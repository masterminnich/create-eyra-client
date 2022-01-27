import PizzaChart from "./GoogleCharts/PizzaChart";
import React from 'react';
import useGoogleCharts from "./GoogleCharts/useGoogleCharts";
import Chart from './getStatsAndLoadChart'

function App() {
  const google = useGoogleCharts();

  return (
    <>
        <a className="cornerButton" id="backEndButton" href="/">Backend</a>
        <Chart google={google}/>
    </>
  );
}

export default App;