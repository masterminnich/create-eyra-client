import { useEffect, useState } from "react";

//Ensure that all packages are loaded via line 18.

function useGoogleCharts () {
  const [google, setGoogle] = useState(null);
  
  useEffect(() => {
    if (!google) {
      const head = document.head;
      let script = document.getElementById('googleChartsScript');
      if (!script) {
        script = document.createElement('script');
        script.src = 'https://www.gstatic.com/charts/loader.js';
        script.id = 'googleChartsScript';
        script.onload = () => {
          if (window.google && window.google.charts) {
            window.google.charts.load('current', {'packages':['corechart',"calendar"]});
            
            window.google.charts.setOnLoadCallback(() => setGoogle(window.google))
          }
        };
        head.appendChild(script);
      } else if (window.google && window.google.charts && window.google.visualization) {
        setGoogle(window.google);
      }
    }

    return () => {
      let script = document.getElementById('googleChartsScript');
      if (script) {
        script.remove();
      }
    }
  }, [google]);

  return google;
}

export default useGoogleCharts;