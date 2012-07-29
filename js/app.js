var da = window.da || {};

da.location = {};

$(function() {

    da.art_icon = L.icon({
        iconUrl: 'img/markers/pin.png',
        iconSize: [15, 27],
        iconAnchor: [8, 27],
        popupAnchor: [0, -27]
    });


    da.art_layer = L.geoJson(null, {
        pointToLayer: function (feature, latlng) {
            return L.marker(latlng, {icon: da.art_icon});
        }
    });

    da.map = L.map('map', {
        center: [39.7477, -104.9866],
        zoom: 14,
        layers: [
            L.tileLayer('http://{s}.tiles.mapbox.com/v3/jcsanford.map-c7d5e9uz/{z}/{x}/{y}.png', {
                subdomains: ['a', 'b', 'c', 'd'],
                detectRetina: true
            }),
            da.art_layer
        ]
    });

    da.updateArtInfo = function(context) {
        $('#art_info').html(da.art_info_template(context));
    };

    da.art_info_template = Handlebars.compile($('#art_info_template').html());

    da.updateArtInfo({
        art: null
    });

    if (navigator.geolocation) {
        da.watching = navigator.geolocation.watchPosition(locateSuccess, locateError, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        });
    }

    setTimeout(function() {
        if (da.watching) {
            navigator.geolocation.clearWatch(da.watching);
            da.map.removeLayer(da.location.circle);
        }
        updateLocation();
    }, 5000);

    function updateLocation() {
        var lat,
            lng,
            map_center;
        if (!(isNaN(da.location.lat) || isNaN(da.location.lng))) {
            lat = da.location.lat;
            lng = da.location.lng;
        } else {
            map_center = da.map.getCenter();
            lat = map_center.lat;
            lng = map_center.lng;
        }
        var params = {
            format: 'geojson',
            q: 'SELECT title,location,artist,year_installed,material,the_geom FROM public_art ORDER BY the_geom <-> st_setsrid(st_makepoint(' + lng + ',' + lat + '),4326) LIMIT 10'
        }
        $.getJSON('http://geojason.cartodb.com/api/v2/sql?' + $.param(params), function(data) {
            da.art_layer.addData(data);
        });
    }

    function locateSuccess(postion) {
        var latLng = L.latLng(postion.coords.latitude, postion.coords.longitude);
        da.location.lat = postion.coords.latitude;
        da.location.lng = postion.coords.longitude;
        if (da.location.circleMarker) {
            da.location.circleMarker.setLatLng(latLng);
            da.location.circle.setLatLng(latLng);
            da.location.circle.setRadius(postion.coords.accuracy);
        } else {
            da.location.circleMarker = L.circleMarker(latLng, {
                radius: 6,
                fillOpacity: 1,
                opacity: 1
            });
            da.location.circle = L.circleMarker(latLng, postion.coords.accuracy, {

            });
            da.map.addLayer(da.location.circleMarker);
            da.map.addLayer(da.location.circle);
        }
        da.map.panTo(latLng);
    }

    function locateError(error) {
        var foo = 'Ummmm, I\'m sorry?';
    }
});