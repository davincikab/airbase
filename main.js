mapboxgl.accessToken = 'pk.eyJ1IjoiZGF1ZGk5NyIsImEiOiJjanJtY3B1bjYwZ3F2NGFvOXZ1a29iMmp6In0.9ZdvuGInodgDk7cv-KlujA';

var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [-122.486052, 37.830348],
    zoom: 15
});

var dummyGeojson = {
    "type":"featureCollection",
    "features":[]
};

map.on('load', function () {
    map.addSource("airbases", {
        "type":"geojson",
        "data":dummyGeojson
    });

    map.addLayer({
        "id":"airbase",
        "source":"airbases",
        "type":"symbol",
        "layout": {
            "icon-image":"airport-15",
            "icon-size":0.9
        },
        "paint":{

        }
    });

    loadData();
});

function loadData() {
    d3.csv("LongBow_CSV.csv")
    .then(data => {
        // create geojson
        let geoJson = createGeojson(data);

        // update sources
        map.getSource("airbases").setData(geoJson);
    })
    .catch(error => {
        console.log(error);
    });
}

function createGeojson(airbases) {
    let featureCollection = {
        "type": "FeatureCollection",
        "name": "persons",
        "crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
        "features":[]
    };


    airbases.forEach(airbase => {
        let feature = {
            "type":"feature",
            "geometry":{
                "type":"Point",
                "coordinates":[airbase.longitude, airbase.latitude]
            },
            properties:airbase
        }

        featureCollection.features.push(feature);
    });

    console.log(featureCollection);
    return featureCollection;
}