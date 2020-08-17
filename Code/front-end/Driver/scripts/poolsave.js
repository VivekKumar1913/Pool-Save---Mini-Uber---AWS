var map;
var sourceLocationLat;
var sourceLocationLong;
var destinationAddressGeoCodedValue;
var markers = [];
var directions = [];
$('#menu').load("menu.html");

function getSourceLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(getPosition);
  } else {
    console.log("Geolocation is not supported by this browser");
  }
}

function getPosition(position) {
  //document.getElementById("header").innerHTML = "WELCOME";
  document.getElementById("userID").innerHTML = "";
  //document.getElementById("distance").innerHTML = "";
  //document.getElementById("avgRating").innerHTML = "";
  document.getElementById('getUserID').innerHTML = "";
  //document.getElementById('getDistance').innerHTML = "";
  //document.getElementById('getAvgRating').innerHTML = "";
  $("#sendRequest").hide();
  $("#button-div").hide();
  console.log(position);
  sourceLocationLat = position.coords.latitude;
  console.log(sourceLocationLat);
  sourceLocationLong = position.coords.longitude;
  console.log(sourceLocationLong);
  drawSourceMarker();
}

function drawSourceMarker() {
  var geocoder = new google.maps.Geocoder();
  var sourcePoint = new google.maps.LatLng(parseFloat(sourceLocationLat),parseFloat(sourceLocationLong));
  console.log(sourcePoint)
  geocoder.geocode({'location': sourcePoint}, function(results, status) {
    console.log(status)
    if (status == 'OK') {
      if (results[0]) {
        map.setZoom(11);
        var marker = new google.maps.Marker({
          position: sourcePoint,
          map: map,
          title: 'Source Location'
        });
        if(!markers[localStorage.user_id]) {
          markers[localStorage.user_id] = {};
        }
        console.log('localstore user id',localStorage.user_id);
        markers[localStorage.user_id]["Source"] = marker;
        document.getElementById('source').value = results[0].formatted_address;
      } else {
        window.alert('No results found');
      }
    } else {
      window.alert('Geocoder failed due to: ' + status);
    }
  });
}

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 40.730610, lng: -73.935242},
    zoom: 10
  });
  localStorage["user_id"] = "1";
  getSourceLocation();
}

function calculateRoute(flag){
  //document.getElementById("header").innerHTML = "WELCOME";
  document.getElementById("userID").innerHTML = "";
  //document.getElementById("distance").innerHTML = "";
  //document.getElementById("avgRating").innerHTML = "";
  document.getElementById('getUserID').innerHTML = "";
  //document.getElementById('getDistance').innerHTML = "";
  //document.getElementById('getAvgRating').innerHTML = "";
  $("#sendRequest").hide();
  $("#button-div").hide();
  removeDirections();
  removeMarkers();
  drawSourceMarker();
  var destinationAddress = document.getElementById('destination').value;
  var geocoder = new google.maps.Geocoder();
  geocoder.geocode({ 'address': destinationAddress}, function(results, status) {
    if (status == 'OK') {
      //destinationAddressGeoCodedValue = results[0].geometry.location;
      destinationAddressGeoCodedValue = results[0].geometry;
      var marker = new google.maps.Marker({
        position: results[0].geometry.location,
        map: map,
        title: 'Destination Location'
      });
      markers[localStorage.user_id]["Destination"] = marker;
      var directionsService = new google.maps.DirectionsService;
      var directionsDisplay = new google.maps.DirectionsRenderer;
      directionsDisplay.setMap(map);
      directionsDisplay.setOptions( { suppressMarkers: true } );
      directionsService.route({
           origin: {lat: sourceLocationLat, lng:sourceLocationLong},
           destination: results[0].geometry.location,
           travelMode: 'DRIVING'
         }, function(response, status) {
           if (status === 'OK') {
             directionsDisplay.setDirections(response);
             directions[localStorage.user_id] = directionsDisplay;
           } else {
             window.alert('Directions request failed due to ' + status);
           }
         });
      if (flag) {
        postRouteDetails();
      }
      nearByRides();
    } else {
      alert('Geocode was not successful for the following reason: ' + status);
    }
  });
}

function nearByRides() {
  let postdata = {
    "source_lat": sourceLocationLat.toString(),
    "source_long": sourceLocationLong.toString(),
    "destination_lat": destinationAddressGeoCodedValue.location.lat().toString(),
    "destination_long": destinationAddressGeoCodedValue.location.lng().toString(),
  }
  console.log(postdata)
  ridedata = {}
  $.ajax({ url : 'https://1nsdm0v6v6.execute-api.us-east-1.amazonaws.com/prod',
    method : 'GET',
    success: response => {
               console.log(response);
               if((response != null) && (response.length !=0)){
                 nearByRidesDraw(response);
               }
            },
    fail: error => {
              console.error(error)
          }
    })
     setTimeout(nearByRides, 10000);
}

function sendUpdateStatus(status) {
    //POST into DB whether the ride has been approved or declined
    var requestData ={
     "driver_id": "",
     "rider_id": "",
     "ride_status": status
    }
    if (localStorage.type == "Driver") {
        requestData.driver_id = localStorage.user_id;
        requestData.rider_id = document.getElementById('getUserID').innerHTML;
    } else {
        requestData.driver_id = document.getElementById('getUserID').innerHTML;
        requestData.rider_id = localStorage.user_id;
    }

    $.ajax({ url : 'https://s0ykkdg6yf.execute-api.us-east-1.amazonaws.com/prod',
        method : 'POST',
        data: JSON.stringify(requestData),
        dataType: "json",
        processData: true,
        success: response => {
          console.log(response)
        },
        fail: error => {
          console.error(error)
        }
    })

    if (status == 'Approved')
      rideShareStatusPoll();
}

function nearByRidesDraw(nearByRides) {
  removeNearByMarkers();
  marker_count = 0;
  console.log('nearbyrides',nearByRides);
    var url_string;
    url_string =  "images/pendingApproval.png";
    marker_count +=1;
    setTimeout(() => {
      var source_lat;
      var source_long;
      var geocoder = new google.maps.Geocoder();
      var marker;
      geocoder.geocode({ 'address': nearByRides.StartLocation.StringValue }, function (results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
        source_lat = results[0].geometry.location.lat();
        source_long = results[0].geometry.location.lng();
          marker = new google.maps.Marker({
          position: {lat: source_lat, lng:source_long},
          map: map,
          title: 'Nearby Rides',
          animation: google.maps.Animation.DROP
        });
        marker.addListener('click', ()=>{
          toggleBounce(marker, nearByRides.Username.StringValue,  source_lat, source_long, destination_lat, destination_long, directionsService, directionsDisplay, nearByRides);
        });
      }});
      console.log(nearByRides.Location.StringValue)
      var directionsService = new google.maps.DirectionsService;
      var directionsDisplay = new google.maps.DirectionsRenderer;
      var geocoder = new google.maps.Geocoder();
      var destination_lat;
      var destination_long;
      geocoder.geocode({ 'address': nearByRides.Location.StringValue }, function (results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
            destination_lat = results[0].geometry.location.lat();
            destination_long = results[0].geometry.location.lng();
          }});
      
    
      if(!markers[nearByRides.Username.StringValue]){
        markers[nearByRides.Username.StringValue] = {};
      }
      markers[nearByRides.Username.StringValue]["Source"] = marker;
    }, marker_count*400);
}

function removeMarkers() {
    console.log(markers);
    for (var entry in markers) {
      if(markers[entry]["Source"]){
        markers[entry]["Source"].setMap(null);
      }
      if(markers[entry]["Destination"]){
        markers[entry]["Destination"].setMap(null);
      }
    }
    // markers[localStorage.user_id]["Source"].setMap(map);
}

function removeMarkerAnimation() {
    console.log(markers);
    for (var entry in markers) {
      if(markers[entry]["Source"]){
        markers[entry]["Source"].setAnimation(null);
      }
      if(markers[entry]["Destination"]){
        markers[entry]["Destination"].setAnimation(null);
      }
    }
}

function removeDirections() {
  console.log(directions);
  for (var dir in directions) {
    if (directions[dir] != null) {
        directions[dir].setMap(null);
    }
  }
}

function removeNearByDestinationMarkers() {
    console.log(markers);
    for (var entry in markers) {
      if(markers[entry]["Destination"]){
        markers[entry]["Destination"].setMap(null);
      }
    }
    markers[localStorage.user_id]["Destination"].setMap(map);
}

function removeNearByMarkers() {
    removeMarkers();
    markers[localStorage.user_id]["Source"].setMap(map);
    markers[localStorage.user_id]["Destination"].setMap(map);
}

function toggleBounce(marker, Username ,source_lat, source_long, destination_lat, destination_long, directionsService, directionsDisplay, nearByRides) {
    if (marker.getAnimation() !== null) {
      console.log("toggle bounce")
      calculateRoute();
    } else {
      console.log("animation is null")
      if(localStorage.type == "Driver"){
        document.getElementById("userID").innerHTML = "Rider Name";
      }else{
        document.getElementById("userID").innerHTML = "Driver ID";
      }
      localStorage.Username = Username
      console.log('username',localStorage.Username)
      console.log(source_lat)
      console.log(source_long)
      console.log(destination_lat)
      console.log(destination_long)
      document.getElementById('getUserID').innerHTML = Username==null?"N/A":Username;
      $("#button-div").show();
      $("#sendRequest").show();
      removeDirections();
      removeMarkerAnimation();
      removeNearByDestinationMarkers();
      marker.setAnimation(google.maps.Animation.BOUNCE);
      directionsDisplay.setMap(map);
      directionsDisplay.setOptions( { suppressMarkers: true } );
      console.log("routing")
      directionsService.route({
           origin: {lat: sourceLocationLat, lng:sourceLocationLong},
           destination: destinationAddressGeoCodedValue.location,
           waypoints: [{location:new google.maps.LatLng(source_lat, source_long)},
            {location:new google.maps.LatLng(destination_lat, destination_long)}],
           travelMode: 'DRIVING'
         }, function(response, status) {
           if (status === 'OK') {
             console.log("OK passenger")
             directionsDisplay.setDirections(response);
             directions[localStorage.user_id] = directionsDisplay;
           } else {
             console.log("direction request failed")
             window.alert('Directions request failed due to ' + status);
           }
         });
      var nearByDestinationMarker = new google.maps.Marker({
        position: {lat: destination_lat, lng: destination_long},
        map: map,
        title: 'Nearby Rides',
        animation: google.maps.Animation.BOUNCE
      });
      markers[nearByRides.Username.StringValue]["Destination"] = nearByDestinationMarker;
      var nearByDirectionsDisplay = new google.maps.DirectionsRenderer({
        polylineOptions: {
          strokeColor: "#000000"
        }
      });
      nearByDirectionsDisplay.setMap(map);
      nearByDirectionsDisplay.setOptions( { suppressMarkers: true } );
      directionsService.route({
           origin: new google.maps.LatLng(source_lat, source_long),
           destination: new google.maps.LatLng(destination_lat, destination_long),
           travelMode: 'DRIVING'
         }, function(response, status) {
           if (status === 'OK') {
             nearByDirectionsDisplay.setDirections(response);
             directions[Username] = nearByDirectionsDisplay;
           } else {
             window.alert('Directions request failed due to ' + status);
           }
         });
    }
}

function postRouteDetails() {
  let postdata = {
    "user_id": localStorage.user_id,
    "type": localStorage.type,
    "source_lat": sourceLocationLat.toString(),
    "source_long": sourceLocationLong.toString(),
    "destination_lat": destinationAddressGeoCodedValue.location.lat().toString(),
    "destination_long": destinationAddressGeoCodedValue.location.lng().toString(),
    "current_lat": sourceLocationLat.toString(),
    "current_long": sourceLocationLong.toString()
  }
  console.log(postdata)
  $.ajax({
    url : 'https://1nsdm0v6v6.execute-api.us-east-1.amazonaws.com/prod',
    method : 'POST',
    data: JSON.stringify(postdata),
    dataType: "json",
    processData: true,
    success: response => {
              console.log(response)
            },
    fail: error => {
              console.error(error)
          }
    })
}

document.getElementById('getDirection').onclick = ()=> {
  var destination = document.getElementById('destination').value;
  if(destination == "") {
    alert("Please enter valid destination");
  } else {
    calculateRoute(true);
  }
}

function rideShareStatusPoll() {
	var requestData = {
	  "type": localStorage.type,
	  "user_id": localStorage.Username
  }
	$.ajax({ url : 'https://1nsdm0v6v6.execute-api.us-east-1.amazonaws.com/prod',
		method : 'GET',
		success: response => {
		  console.log(response)
			for (var res in response) {
				localStorage[res] = response[res];
			} 
			if (response != null) {
        console.log("Starting ride")
        $("#sendRequest").hide();
        $("#button-div").hide();
        $("#but").hide();
        document.getElementById("message").innerHTML = "RIDE STARTED ";
        $.ajax({ url : 'https://fs3vyps4z7.execute-api.us-east-1.amazonaws.com/prod',
        method : 'POST',
        data: JSON.stringify(requestData),
        dataType: "json",
        processData: true,
        success: response => {
        console.log(response)
        }
		})}},
		fail: error => {
		  console.error(error)
    }});
  
	setTimeout(rideShareStatusPoll, 10000);
}
