function getDirectionalAPIData(path, distance, time) {
	elevator.getElevationAlongPath({
          'path': path,
          'samples': 512
        }, ((elevations, status) => processElevationData(elevations, status, distance, time)));
}

function processElevationData(elevations, status, distance, timeTotal) {
	if (status != 'OK') alert("Panic - unable to retrieve elevations!"); // Panic
	let firstElevation = elevations[0].elevation;
	elevations[0].normalised = 0;
	let distancePerStep = distance / elevations.length;
	let totalEffort = 0;
	let totalDistanceSoFar = 0;
	let dataArray = [[0, elevations[0].normalised]];

	for (i = 1; i < elevations.length; i++) {
		elevations[i].normalised = elevations[i].elevation - firstElevation;
		let differenceInElevation = elevations[i].normalised - elevations[i - 1].normalised;
		totalEffort += getEnergyExpenditure(distancePerStep, differenceInElevation);
		totalDistanceSoFar += distancePerStep;
		dataArray.push([totalDistanceSoFar, elevations[i].normalised]);
	}

	var data = new google.visualization.DataTable();
    data.addColumn('number');
    data.addColumn('number');

	data.addRows(dataArray);

	var options = {
		legend: "none",
		backgroundColor: "#cccccc",
        hAxis: {title: 'Distance'},
        vAxis: {title: 'Elevation'}
      };
    chart = new google.visualization.LineChart(document.getElementById('chart_div'));
    chart.draw(data, options);
    console.log(workDone);

    document.querySelector("#cardDistance").innerHTML = "Distance: " + (Math.round(distance/100)/10) + " km";
		document.querySelector("#cardEnergy").innerHTML = "Energy: " + Math.round(totalEffort) + " calories";
		document.querySelector("#cardTime").innerHTML = "Time: " + Math.round(timeTotal) + " minutes";
}
