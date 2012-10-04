(function() {

    var da = window.da || {};

    da.location = {};

    da.arts = {};

    da.fake_location = (function() {
        // Since we only find art < 1km away, let's let users fake their location
        if (window.location.href.indexOf('fake_location') > -1) {
            return {
                lat: 39.7477,
                lng: -104.9866
            };
        }
        return null;
    }());

    da.art_icon = L.icon({
        iconUrl: 'img/markers/pin.png',
        iconSize: [15, 27],
        iconAnchor: [8, 27],
        popupAnchor: [0, -27]
    });


    da.art_layer = L.geoJson(null, {
        pointToLayer: function(feature, latlng) {
            return L.marker(latlng, {icon: da.art_icon});
        },
        onEachFeature: function(feature, layer) {
            layer.on('click', function(event) {
                var lat_lng = L.latLng(feature.geometry.coordinates[1], feature.geometry.coordinates);
                da.updateArtInfo({
                    art: feature.properties
                });
                if (da.selected_art_circle) {
                    da.selected_art_circle.setLatLng(lat_lng);
                } else {
                    da.selected_art_circle = L.circleMarker(lat_lng, {
                        radius: 8,
                        fillColor: '#ff0000',
                        fillOpacity: 0.4,
                        color: '#ff0000',
                        opacity: 1
                    }).addTo(da.map);
                }
            });
        }
    });

    da.map = L.map('map', {
        center: [39.7477, -104.9866],
        zoom: 14,
        layers: [
            L.tileLayer('http://{s}.tiles.mapbox.com/v3/jcsanford.map-xu5k4lii/{z}/{x}/{y}.png', {
                subdomains: ['a', 'b', 'c', 'd'],
                detectRetina: true,
                maxZoom: 17
            }),
            da.art_layer
        ],
        attributionControl: false,
        zoomControl: false
    }).on('click', function(event) {
        da.updateArtInfo({
            art: null
        });
        if (da.selected_art_circle && da.map.hasLayer(da.selected_art_circle)) {
            da.map.removeLayer(da.selected_art_circle);
        }
        da.selected_art_circle = null;
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
    }

    setTimeout(function() {
        if (da.watching) {
            navigator.geolocation.clearWatch(da.watching);
            da.map.removeLayer(da.location.circle);
        }
        da.updateArtInfo({
            art: null
        });
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
        if (da.fake_location) {
            lat = da.fake_location.lat;
            lng = da.fake_location.lng;
        }
        var params = {
            format: 'geojson',
            q: 'SELECT t.id,t.title,t.location,t.artist,t.year_installed,t.material,t.the_geom,t.distance FROM (SELECT cartodb_id id,title,location,artist,year_installed,material,the_geom,st_distance(st_transform(st_setsrid(st_makepoint(' + lng + ',' + lat + '),4326),3857),the_geom_webmercator) as distance FROM public_art) as t WHERE t.distance <= 1000 ORDER BY the_geom <-> st_setsrid(st_makepoint(' + lng + ',' + lat + '),4326) LIMIT 10'
        }
        $.getJSON('http://geojason.cartodb.com/api/v2/sql?' + $.param(params), function(data) {
            var i,
                len = data.features.length,
                art;
            if (data && data.features) {
                for (i = 0; i < len; i++) {
                    art = data.features[i];
                    da.arts[art.properties.id] = art;
                }
                da.art_layer.addData(data);
            }
        });
    }

    function locateSuccess(postion) {
        var latLng = da.fake_location ? L.latLng(da.fake_location.lat, da.fake_location.lng) : L.latLng(postion.coords.latitude, postion.coords.longitude);
        da.location.lat = da.fake_location ? da.fake_location.lat : postion.coords.latitude;
        da.location.lng = da.fake_location ? da.fake_location.lng : postion.coords.longitude;
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
}());

Handlebars.registerHelper('format_distance', function (distance) {
    return distance.toFixed(0);
});
