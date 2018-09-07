// Search
// document.getElementsByTagName('form').onsubmit = runSearch

function initAutocomplete() {
  autocompleteStart = new google.maps.places.Autocomplete(document.getElementById('autocompleteStart'));
  autocompleteEnd = new google.maps.places.Autocomplete(document.getElementById('autocompleteFinish'));
}

function runSearch() {
	let start = document.getElementById("autocompleteStart")
	let end = document.getElementById("autocompleteFinish")

	if (start.value && end.value) {
		let background = document.getElementById("loadingBackground")
		let cyclist = document.getElementById("loadingsvg")
		background.style.zIndex = 99;
		background.style.left = "0"
		cyclist.style.left = "40vw"
		cyclist.style.opacity = 1;
		background.style.backgroundColor = "rgba(0,0,0,0.5)";

		// Once I have implemented the search, this will be a callback
		// rather than a timeout
		setTimeout(function() {
			cyclist.style.left = "60vw";
			cyclist.style.opacity = 0;
			background.style.backgroundColor = "rgba(0,0,0,0)";
			start.value = "";
			end.value = "";

			setTimeout(function() {
				background.style.left = "-100vw";
				cyclist.style.left = "20vw";
				background.style.zIndex = 1;
			}, 600);

		}, 2000);
	}
}

// *********************************************************
// Directions
// function onMapsInit(){
// 	document.getElementById('go').onclick=calculateAndDisplayRoute;
// }


// function calculateAndDisplayRoute() {
// 	var start=document.getElementById('start').value;
// 	var end=document.getElementById('end').value;
//         directionsService.route({
//           origin: start,
//           destination: end,
//           travelMode: 'BICYCLING'
//         }, function(response, status) {
//           if (status === 'OK') {
// 			 var directionsArray=[];
// 			  window.response =response;
// 			  //value of this loop is 0 because its first value of response
// 			  var route_number=0;


// 			for (var step of response.routes[0].legs[0].steps){
// 				for(var path of step.path){
// 				directionsArray.push({lat:path.lat(),lng:path.lng()});

// 				}
//               }
// 			var total_distance=response.routes[0].legs[0].distance.value;
// 			var total_time= (response.routes[0].legs[0].duration.value)/60;

//             directionsDisplay.setDirections(response);
// 			//calling elevation API
// 			getDirectionalAPIData(directionsArray, total_distance, total_time);
//           } else {
//             window.alert('Directions request failed due to ' + status);
//           }
//         });
//       }

// *********************************************************
// ELevations

// function getDirectionalAPIData(path, distance, time) {
// 	elevator.getElevationAlongPath({
//           'path': path,
//           'samples': 512
//         }, ((elevations, status) => processElevationData(elevations, status, distance, time)));
// }

// function processElevationData(elevations, status, distance, timeTotal) {
// 	if (status != 'OK') alert("Panic - unable to retrieve elevations!"); // Panic
// 	let firstElevation = elevations[0].elevation;
// 	elevations[0].normalised = 0;
// 	let distancePerStep = distance / elevations.length;
// 	let totalEffort = 0;
// 	let totalDistanceSoFar = 0;
// 	let dataArray = [[0, elevations[0].normalised]];

// 	for (i = 1; i < elevations.length; i++) {
// 		elevations[i].normalised = elevations[i].elevation - firstElevation;
// 		let differenceInElevation = elevations[i].normalised - elevations[i - 1].normalised;
// 		totalEffort += getEnergyExpenditure(distancePerStep, differenceInElevation);
// 		totalDistanceSoFar += distancePerStep;
// 		dataArray.push([totalDistanceSoFar, elevations[i].normalised]);
// 	}

// 	var data = new google.visualization.DataTable();
//     data.addColumn('number');
//     data.addColumn('number');

// 	data.addRows(dataArray);

// 	var options = {
// 		legend: "none",
// 		backgroundColor: "#cccccc",
//         hAxis: {title: 'Distance'},
//         vAxis: {title: 'Elevation'}
//       };
//     chart = new google.visualization.LineChart(document.getElementById('chart_div'));
//     chart.draw(data, options);

//     document.querySelector("#cardDistance").innerHTML = "Distance: " + (Math.round(distance/100)/10) + " km";
// 		document.querySelector("#cardEnergy").innerHTML = "Energy: " + Math.round(totalEffort) + " calories";
// 		document.querySelector("#cardTime").innerHTML = "Time: " + Math.round(timeTotal) + " minutes";
// }

// *********************************************************
// Effort

// Finds the energy expended moving up a distance
//
// Parameters:
//   distance - the horizontal distance in metres
//   changeInElevation - the change in elevation in metres
// Returns:
//   workDone in calories
function getEnergyExpenditure(distance, changeInElevation) {
	if (changeInElevation < 0) return 0;
	let mass = 75 + 8; // Assuming average human weight of 75kg and bike weight of 8kg

	// find the energy expended by elevation change
	let angle = (changeInElevation < 0) ? 0 : Math.atan(changeInElevation/distance);
	let gravityForce = 9.81 * mass * Math.sin(angle);

	// Find the energy expended by biking for that distance
	let normalForce = 9.81 * mass * Math.cos(angle);
	rollingResistanceForce = 0.02 * normalForce;

	totalThrustForce = rollingResistanceForce + gravityForce;
	distance = Math.sqrt(distance**2 + changeInElevation**2);
	workDone = totalThrustForce * distance * 0.001; // Joules/1000 = calories
	return workDone;
}
