var da = window.da || {};

$(function() {
    da.map = L.map('map', {
        center: [39.7477, -104.9866],
        zoom: 14,
        layers: [L.tileLayer('http://{s}.tiles.mapbox.com/v3/jcsanford.map-c7d5e9uz/{z}/{x}/{y}.png', {
            subdomains: ['a', 'b', 'c', 'd']
        })]
    });
});