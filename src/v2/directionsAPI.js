function onMapsInit(){
	document.getElementById('go').onclick=calculateAndDisplayRoute;
}


function calculateAndDisplayRoute() {
	var start=document.getElementById('start').value;
	var end=document.getElementById('end').value;
        directionsService.route({
          origin: start,
          destination: end,
          travelMode: 'BICYCLING'
        }, function(response, status) {
          if (status === 'OK') {
			 var directionsArray=[];
			  window.response =response;
			  //value of this loop is 0 because its first value of response
			  var route_number=0;


			for (var step of response.routes[0].legs[0].steps){
				for(var path of step.path){
				directionsArray.push({lat:path.lat(),lng:path.lng()});

				}
              }
			var total_distance=response.routes[0].legs[0].distance.value;
			var total_time= (response.routes[0].legs[0].duration.value)/60;
			console.log(typeof total_time);

            directionsDisplay.setDirections(response);
			//calling elevation API
			getDirectionalAPIData(directionsArray, total_distance, total_time);
          } else {
            window.alert('Directions request failed due to ' + status);
          }
        });
      }
