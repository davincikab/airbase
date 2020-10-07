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
            "icon-size":0.1,
            "icon-rotate": ["get", "altitude"]
        },
        "paint":{

        }
    });

    // load data
    loadData();

    // hover effect
    map.on('mouseenter', 'airbase', function () {
        map.getCanvas().style.cursor = 'pointer';
    });
    
    map.on('mouseleave', 'airbase', function () {
        map.getCanvas().style.cursor = '';
    });

    // interactivity
    map.on("click", "airbase", function(e) {
        let features = map.queryRenderedFeatures(e.point, {
            layers:['airbase']
        });

        if(features[0]) {
            let feature = features[0];

            updateSectionInfo(feature);
        }
    });
});

function loadData() {
    d3.csv("LongBow_CSV.csv")
    .then(data => {
        console.log(data);
        // create geojson
        let geoJson = createGeojson(data);

        // update sources
        map.getSource("airbases").setData(geoJson);

        // update with Damascus
        let damascus = geoJson.features.find(feature => feature.properties.airportName = "Damascus");
        updateSectionInfo(damascus);
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
        airbase.altitude = parseFloat(airbase.altitude);

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

var airbaseTitle = document.getElementById("airbase-title");
var ammoProgress = document.getElementById("ammo-progress");
var defenceProgress = document.getElementById("defence-progress");
var fuelProgress = document.getElementById("fuel-progress");

var ammoText = document.getElementById("ammo-text");
var defenceText = document.getElementById("defence-text");
var fuelText = document.getElementById("fuel-text");

function updateSectionInfo(feature) {
    // update the title
    airbaseTitle.innerHTML = feature.properties.airportName;

    // update indicators
    ammoProgress.style.width = feature.properties.ammo + "%";
    ammoProgress.setAttribute("aria-valuenow", feature.properties.ammo);

    defenceProgress.style.width = feature.properties.defences + "%";
    defenceProgress.setAttribute("aria-valuenow", feature.properties.defences);

    fuelProgress.style.width = feature.properties.fuel + "%";
    fuelProgress.setAttribute("aria-valuenow", feature.properties.fuel);

    // text
    ammoText.innerHTML = feature.properties.ammo + "%";
    defenceText.innerHTML = feature.properties.defences + "%";
    fuelText.innerHTML = feature.properties.fuel + "%";
    
}