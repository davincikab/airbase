mapboxgl.accessToken = 'pk.eyJ1IjoiZGF1ZGk5NyIsImEiOiJjanJtY3B1bjYwZ3F2NGFvOXZ1a29iMmp6In0.9ZdvuGInodgDk7cv-KlujA';

var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/dark-v10',
    center: {lng: 37.13453913170133, lat: 34.968030128763615},
    zoom: 6.5,
    maxBounds:[[32.584585895746955, 31.7253009930011],[40.601966193972146, 38.17451439042071]]
    // new mapboxgl.LngLatBounds(
    //     new mapboxgl.LngLat[40.601966193972146, 38.17451439042071], 
    //     new mapboxgl.LngLat[32.584585895746955, 31.7253009930011]
    // )
        
});

var dummyGeojson = {
    "type": "FeatureCollection",
    "features":[]
};

var countDown = document.getElementById("restart-time");
var displaySidebar = document.getElementById("toggle-sidebar");
var sidebar = document.getElementById("section-plane");

var images = ["Airport_Blue", "Airport_Red", "Airport_Neutral", "Farp_Red", "Farp_Neutral"];
var startTime = new Date();


displaySidebar.addEventListener('click', function(e) {
    sidebar.classList.toggle("open");
});

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
    d3.csv("LongBow_Static_CSV.csv")
    .then(staticData => {
        // read the other data
        d3.csv("LongBow_Dynamic_CSV.csv")
        .then(dynamicData => {
            // console.log(dynamicData);
            // merge both data
            let data = staticData.map(sData => {
                let relatedData = dynamicData.find(dData => dData.airport_name == sData.airport_name);

                if(relatedData) {
                    // sData = {...sData, ...relatedData};
                    sData = $.extend({}, sData, relatedData);
                }

                return sData;
            });

            console.log(data);
            // create geojson
            let geoJson = createGeojson(data);

            // update sources
            map.getSource("airbases").setData(geoJson);

            // update with Damascus
            let damascus = geoJson.features.find(feature => feature.properties.airport_name == "Damascus");
            console.log(damascus);
            updateSectionInfo(damascus);
        })
        .catch(error => {
            console.error(error);
            throw new Error(error.message);
        });
        
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
var airbaseTitleContainer = document.getElementById("title-contaier");

var ammoProgress = document.getElementById("ammo-progress");
var defenceProgress = document.getElementById("defence-progress");
var fuelProgress = document.getElementById("fuel-progress");

var ammoText = document.getElementById("ammo-text");
var defenceText = document.getElementById("defence-text");
var fuelText = document.getElementById("fuel-text");

var bgColors = {
    "0":"bg-gradient-neutral",
    "1":"bg-gradient-blue",
    "2":"bg-gradient-red"
};

function updateSectionInfo(feature) {
    console.log(feature);
    // update the title
    airbaseTitle.innerHTML = feature.properties.airport_name;
    console.log(airbaseTitleContainer.classList);

    airbaseTitleContainer.classList.forEach(cssClass => {
        console.log(cssClass);
        if(cssClass && cssClass.includes("bg-gradient")) {
            airbaseTitleContainer.classList.remove(cssClass);
        }
    });

    airbaseTitleContainer.classList.add(
        bgColors[feature.properties.coaltion_in_control]
    );


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
    

    // update carousel
    let carouselContainer = $(".carousel-inner");
    let images = [
        feature.properties.picture1	,
        feature.properties.picture2	,
        feature.properties.picture3	,
        feature.properties.picture4
    ];

    images = images.filter(img => img);

    let htmlContent = "";

    images.forEach((image,i) => {
        if(i == 0) {
            htmlContent +=  '<div class="carousel-item active">'+
                '<img src="images/'+image+'" class="d-block w-100" alt="'+image.split(".")[0]+'">'+
                '</div>'
        } else {
            htmlContent +=  '<div class="carousel-item">'+
                '<img src="images/'+image+'" class="d-block w-100" alt="'+image.split(".")[0]+'">'+
                '</div>'
        }
        
    });

    carouselContainer.empty();
    carouselContainer.html(htmlContent);

}

setInterval(function(e){
    let currentTime = new Date();
    let dtime = currentTime - startTime;
    countDown.innerHTML = getYoutubeLikeToDisplay(dtime);
}, 1000);

// TODO:Handle database errors;
function getYoutubeLikeToDisplay(millisec) {
    var seconds = (millisec / 1000).toFixed(0);
    var minutes = Math.floor(seconds / 60);
    var hours = "";
    if (minutes > 59) {
        hours = Math.floor(minutes / 60);
        hours = (hours >= 10) ? hours : "0" + hours;
        minutes = minutes - (hours * 60);
        minutes = (minutes >= 10) ? minutes : "0" + minutes;
    }

    seconds = Math.floor(seconds % 60);
    seconds = (seconds >= 10) ? seconds : "0" + seconds;
    if (hours != "") {
        return hours + "hrs " + minutes + "min " + seconds + "s";
    }
    return minutes + "min " + seconds+ "s";
}

// Carousel: get active image
$('#airbaseCarousel').on('slid.bs.carousel', function () {
    // get active image
    let activeImage = $(".carousel-item.active").children()[0];
    $("#image-name").text(activeImage.alt);

    console.log(activeImage.alt);
})