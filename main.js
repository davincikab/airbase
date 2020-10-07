mapboxgl.accessToken = 'pk.eyJ1IjoiZGF1ZGk5NyIsImEiOiJjanJtY3B1bjYwZ3F2NGFvOXZ1a29iMmp6In0.9ZdvuGInodgDk7cv-KlujA';

var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/dark-v10',
    center: {lng: 37.13453913170133, lat: 34.968030128763615},
    zoom: 6.5
});

var dummyGeojson = {
    "type": "FeatureCollection",
    "features":[]
};

var images = ["Airport_Blue", "Airport_Red", "Airport_Neutral", "Farp_Red", "Farp_Neutral"];

// load the image
function loadImages() {
    images.forEach(imageString => {
        let imageName = imageString.split("_").join(" ");
    
        map.loadImage("icons/"+imageName+".png", function(error, image) {
            if (error) throw error;
            if(!map.hasImage(imageString)) {
                map.addImage(imageString.toLowerCase(), image);
            }
        });
    });
}

map.on('load', function () {
    loadImages()
    map.addSource("airbases", {
        "type":"geojson",
        "data":dummyGeojson
    });

    map.addLayer({
        "id":"airbase",
        "source":"airbases",
        "type":"symbol",
        "layout": {
            "icon-image":[
                'match',
                ["get", "coaltion_in_control"],
                "0", "airport_neutral",
                "1", "airport_blue",
                "2", "airport_red",
                "airport-15"
            ],
            "icon-size":0.1
        },
        "paint":{

        }
    });

    // load icons


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
                "coordinates":[
                    parseFloat(airbase.longitude), 
                    parseFloat(airbase.latitude)
                ]
            },
            properties:airbase
        }

        featureCollection.features.push(feature);
    });

    console.log(featureCollection);
    return featureCollection;
}