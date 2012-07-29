var da = window.da || {};

da.location = {};

$(function() {

    da.map = L.map('map', {
        center: [39.7477, -104.9866],
        zoom: 14,
        layers: [L.tileLayer('http://{s}.tiles.mapbox.com/v3/jcsanford.map-c7d5e9uz/{z}/{x}/{y}.png', {
            subdomains: ['a', 'b', 'c', 'd'],
            detectRetina: true
        })]
    });

    da.updateArtInfo = function(context) {
        $('#art_info').html(da.art_info_template(context));
    };

    da.art_info_template = Handlebars.compile($('#art_info_template').html());

    if (navigator.geolocation) {
        da.watching = navigator.geolocation.watchPosition(locateSuccess, locateError, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        });

        setTimeout(function() {
            if (da.watching) {
                navigator.geolocation.clearWatch(da.watching);
                da.map.removeLayer(da.location.circle);
            }
        }, 5000);
    }

    da.updateArtInfo({
        art: null
    });

    function locateSuccess(postion) {
        var latLng = L.latLng(postion.coords.latitude, postion.coords.longitude);
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