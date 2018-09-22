function initAPIs() {
  google.charts.load('current', {packages: ['corechart', 'line']});
  let searchOptions = {types: ['address'],
                       location: {lat: -36.8485, lng: 174.7633},
                       radius: 10000,
                       componentRestrictions: {country: "nz"},
                       strictBounds: true};
  autocompleteStart = new google.maps.places.Autocomplete(document.getElementById('autocompleteStart1'), searchOptions);
  autocompleteEnd = new google.maps.places.Autocomplete(document.getElementById('autocompleteFinish1'), searchOptions);
  autocompleteStart = new google.maps.places.Autocomplete(document.getElementById('autocompleteStart2'), searchOptions);
  autocompleteEnd = new google.maps.places.Autocomplete(document.getElementById('autocompleteFinish2'), searchOptions);
  directionsService = new google.maps.DirectionsService;
  elevator = new google.maps.ElevationService;
}

// Processes the data for a particular route out of those returned by the Google Directions API
//
// Parameters:
//   sourceType - the source number, telling the function which input to read from
// Returns:
//   None - starts a search
function prepareSearch(sourceType) {
  let start = document.getElementById("autocompleteStart" + sourceType);
  let end = document.getElementById("autocompleteFinish" + sourceType);

  if (start.value && end.value) {
    let background = document.getElementById("loadingBackground");
    let cyclist = document.getElementById("loadingsvg");
    background.style.zIndex = 99;
    background.style.left = "0";
    cyclist.style.left = "40vw";
    cyclist.style.opacity = 1;
    background.style.backgroundColor = "rgba(0,0,0,0.5)";

    // To show some of the animation - if this actually becomes popular (which I doubt - I'm not planning on
    // advertising it) I will remove this, for now its just nice to have so I can demonstrate the loading animation
    setTimeout(() => startSearch(start.value, end.value), 300);
  }
}

// Sends a request to the Google Directions API - I would have inlined this in set Timeout at the end of prepareSearch,
// however for some reason this happened immediately instead of waiting for the callback after a second
//
// Parameters:
//   start - the starting location
//   end - the destination
// Returns:
//   None - sends a Google Directions API request 
function startSearch(start, end) {
  directionsService.route({
    origin: start,
    destination: end,
    travelMode: 'BICYCLING',
    provideRouteAlternatives: true
  }, processSearchResults);
}

// Processes the data for a particular route out of those returned by the Google Directions API
//
// Parameters:
//   routeNumber - the route index
//   routeData - a list of steps with longitude and latitude along that particular route
// Returns:
//   None - adds a new card with information about that route
function processSearchResults(response, status) {
  let background = document.getElementById("loadingBackground");
  let cyclist = document.getElementById("loadingsvg");

  document.body.style.overflowY  = "auto";
  cyclist.style.left = "60vw";
  cyclist.style.opacity = 0;
  background.style.backgroundColor = "rgba(0,0,0,0)";
  
  // wait until the loading icons are gone then move them back to their original positions
  setTimeout(function() {
    background.style.left = "-100vw";
    cyclist.style.left = "20vw";
    background.style.zIndex = 1;
  }, 300);

  if (status == "OK") {
    document.getElementById("cardsContainer").innerHTML = "";
    document.getElementById("errorMessageDiv").style.display = "none";
    document.getElementById("landingDiv").style.display = "none";
    document.getElementById("cardsDiv").style.display = "block";

    window.response = response;
    maps = [];
    lines = [];
    directionsRenderers = [];
    routesAdded = 0;
    monitorUserScrolling = true;

    numberOfRoutes = (response.routes.length >= 3) ? 3 : response.routes.length;
    for (i = 0; i < numberOfRoutes; i++) {
      routesAdded += 1;
      addRoute(routesAdded, response.routes[routesAdded - 1]);
    }
  }

  else {
    const errorMessage = {
      "NOT_FOUND": "At least one of your locations could not be found, please try a nearby or more general address.",
      "ZERO_RESULTS": "Sorry, we couldn't find a route between these locations.",
      "MAX_ROUTE_LENGTH_EXCEEDED": "Your route was too long, please try something shorter.",
      "default":  "An unknown error occured, please try again later."};

    document.getElementById("landingDiv").style.display = "block";
    document.getElementById("cardsDiv").style.display = "none";
    document.getElementById("errorMessageDiv").style.display = "block";
    document.getElementById("errorMessage").innerHTML = 
      (Object.keys(errorMessage).includes(status)) ? errorMessage[status] : errorMessage["default"];
  }
}

// Processes the data for a particular route out of those returned by the Google Directions API
//
// Parameters:
//   routeNumber - the route index
//   routeData - a list of steps with longitude and latitude along that particular route
// Returns:
//   None - adds a new card with information about that route
function addRoute(routeNumber, routeData) {
  let latitudeLongitudes=[];

  for (var step of routeData.legs[0].steps) {
    for(var path of step.path) latitudeLongitudes.push({ lat:path.lat(), lng:path.lng() });
  }

  let total_distance = routeData.legs[0].distance.value;
  let total_time = routeData.legs[0].duration.value / 60;
  let card = "<div class='card' id='card" + routeNumber + "'>\n<div class='graphContainer'>\n" +
    "<aside class='cardAside' id='map" + routeNumber + "'></aside>\n" +
    "<aside class='cardAside' id='elevation" + routeNumber + "'></aside>\n" +
    "<div class='cardDetails' id='distance" + routeNumber + "'>Distance loading...</div>\n" +
    "<div class='cardDetails' id='energy" + routeNumber + "'>Energy loading...</div>\n" +
    "<div class='cardDetails' id='time" + routeNumber + "'>Time loading...</div>\n" +
    "<span class='stretch'></span>\n</div>\n</div>\n";

  document.getElementById("cardsContainer").insertAdjacentHTML("beforeend", card);

  elevator.getElevationAlongPath({
    'path': latitudeLongitudes,
    'samples': 330
  }, ((elevations, status) => getElevationData(elevations, status, routeNumber, total_distance)) );

  let formatGuide = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 });

  document.getElementById("distance" + routeNumber).innerHTML = "Distance: " + formatGuide.format(total_distance / 1000) + " km";
  if (total_time > 60) document.getElementById("time" + routeNumber).innerHTML = "Time: " + Math.floor(total_time / 60) +
    " hours and " + formatGuide.format(total_time % 60) + " minutes";
  else document.getElementById("time" + routeNumber).innerHTML = "Time: " + formatGuide.format(total_time) + " minutes";

  let mapOptions = {zoom: 14,
                    disableDefaultUI: true,
                    panControl: true,
                    zoomControl: true,
                    center: routeData.overview_path[0]};

  maps[routeNumber - 1] = new google.maps.Map(document.getElementById("map" + routeNumber), mapOptions);
  directionsRenderers[routeNumber - 1] = new google.maps.DirectionsRenderer();
  directionsRenderers[routeNumber - 1].setDirections(window.response)
  directionsRenderers[routeNumber - 1].setRouteIndex(routeNumber - 1)
  directionsRenderers[routeNumber - 1].hideRouteList = true;
  directionsRenderers[routeNumber - 1].setMap(maps[routeNumber - 1]);
}

// Processes the elevation data returned by the Google Elevations API
//
// Parameters:
//   elevations - elevation data
//   status - the return status of the API lookup
//   routeNumber - the route index
//   total_distance - the horizontal length of the route in metres
// Returns:
//   None - adds a graph of elevations to the corresponding card and logs the energy expenditure
function getElevationData(elevations, status, routeNumber, total_distance) {
  if (status == "OK") {
    let firstElevation = elevations[0].elevation;
    let distancePerStep = total_distance / elevations.length;
    let totalEffort = 0;
    let totalDistanceSoFar = 0;

    elevations[0].normalised = 0;
    let dataArray = [[0, elevations[0].normalised]];

    for (i = 1; i < elevations.length; i++) {
      elevations[i].normalised = elevations[i].elevation - firstElevation;
      totalDistanceSoFar += distancePerStep;
      dataArray.push([totalDistanceSoFar/1000, elevations[i].normalised]);

      let changeInElevation = elevations[i].normalised - elevations[i - 1].normalised;
      totalEffort += getEnergyExpenditure(distancePerStep, changeInElevation);
    }

    let chart = new google.visualization.LineChart(document.getElementById("elevation" + routeNumber));
    let data = new google.visualization.DataTable();
    let chartwidth = document.getElementById("map" + routeNumber).offsetWidth;
    let options = {legend: "none",
                   width: chartwidth,
                   chartArea: {width: chartwidth - 80, height: 140},
                   backgroundColor: "#153E5C", 
                   colors:["#91B0F2"],
                   hAxis: {title: 'Distance (km)', titleTextStyle: {color: '#91B0F2'}, baselineColor: 'white', textStyle: {color: '#91B0F2'} }, 
                   vAxis: {title: 'Elevation (m)', titleTextStyle: {color: '#91B0F2'}, baselineColor: 'white', textStyle: {color: '#91B0F2'} }};

    data.addColumn('number');
    data.addColumn('number');
    data.addRows(dataArray);

    const redrawChart = (function() {
      let chartObject = chart;
      let chartData = data;
      let chartOptions = options;

      return function() {
        let chartwidth = document.getElementById("map" + routeNumber).offsetWidth;
        chartOptions.width = chartwidth;
        chartOptions.chartArea.width = chartwidth - 80;

        chartObject.draw(chartData, chartOptions);}
    })();

    if (window.addEventListener) window.addEventListener('resize', redrawChart);
    else window.attachEvent('onresize', redrawChart);
    // Draw the initial chart;
    redrawChart();

    let formatGuide = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 });
    document.getElementById("energy" + routeNumber).innerHTML = "Energy expenditure: " + formatGuide.format(totalEffort) + " calories";
  }

  else {
    document.getElementById("energy" + routeNumber).innerHTML = "Energy expenditure could not be calculated";
    document.getElementById("elevation" + routeNumber).style.backgroundImage = "url('error.svg')"
    document.getElementById("elevation" + routeNumber).style.backgroundSize = "30%"
  }
}

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