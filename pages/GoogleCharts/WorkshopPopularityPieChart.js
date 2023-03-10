import { useEffect, useState } from "react";
import { Spinner } from "react-bootstrap";

function WorkshopPopularityPieChart ({google,workshopStats}) {
  const [chart, setChart] = useState(null);

  useEffect(() => {
    if (google && !chart) {
        // Create the data table.
        var data = google.visualization.arrayToDataTable(workshopStats);

        // Set chart options
        var options = {
            'title':'Certifications Earned',
            'width':400,
            'height':300
        };

        // Instantiate and draw our chart, passing in some options.
        const newChart = new google.visualization.PieChart(document.getElementById('workshopPopularityPieChart'));
        newChart.draw(data, options);

        setChart(newChart);
    }
  }, [google, chart]);

    return (
        <>
            {!google && <Spinner />}
            <div id="workshopPopularityPieChart" className={!google ? 'd-none' : ''} />
        </>
    )
}

export default WorkshopPopularityPieChart;