mapboxgl.accessToken = 'pk.eyJ1IjoiZGF1ZGk5NyIsImEiOiJjanJtY3B1bjYwZ3F2NGFvOXZ1a29iMmp6In0.9ZdvuGInodgDk7cv-KlujA';

var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/dark-v10',
    center: {lng: 37.13453913170133, lat: 34.968030128763615},
    zoom: 6.5,
    maxBounds:[[32.584585895746955, 31.7253009930011],[40.601966193972146, 38.17451439042071]]
        
});

var dummyGeojson = {
    "type": "FeatureCollection",
    "features":[]
};

var modalImageIndex = 0;
var carouselImagesLength;
var modalImage = document.getElementById("img-modal");

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
            "icon-image":["get", "icon"],
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
        let ciCtr = airbase.coaltion_in_control;

        // update the icon name
        if(airbase.type == "1") {
            airbase.icon =  ciCtr == "0" ? "airport_neutral" : ciCtr == "1" ? "airport_blue" :"airport_red";
        } else {
            airbase.icon =  ciCtr == "0" ? "farp_neutral" : ciCtr == "2" ? "farp_red" : "airport_blue" ; 
        }

        // create a feature
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

// Airbase info section 
var airbaseTitle = document.getElementById("airbase-title");
var airbaseTitleContainer = document.getElementById("title-contaier");

// progress bars
var ammoProgress = document.getElementById("ammo-progress");
var defenceProgress = document.getElementById("defence-progress");
var fuelProgress = document.getElementById("fuel-progress");

var ammoText = document.getElementById("ammo-text");
var defenceText = document.getElementById("defence-text");
var fuelText = document.getElementById("fuel-text");

// sections
var runawaySection = $("#runaway");
var frequencySection = $("#frequency");
var navaidsSection = $("#navaids");
var aircraftsSection = $("#aircrafts");
var otherInfoSection = $("#other-info");

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

    // runaway info
    let runawayInfo = [
        feature.properties.runway1,	
        feature.properties.runway2,	
        feature.properties.runway3,
    ];

    runawayInfo = runawayInfo.filter(rwi => rwi);

    let content = runawayInfo[0] ? runawayInfo.reduce((a,b) => "<p>"+a+"</p><p>"+b+"</p>") : "";

    runawaySection.empty();
    runawaySection.html(content);

    // frequency info
    let freq = [
        feature.properties.frequencie1,	
        feature.properties.frequencie2,	
        feature.properties.frequencie3,
    ];

    freq = freq.filter(fq => fq);

    let contentFreq = freq[0] ? freq.reduce((a,b) => (
        "<p class='section-p'><span>"+a+"</span></p>"+
        "<p class='section-p'><span>"+b+"</span></p>"
        )
    ) : "";

    frequencySection.empty();
    frequencySection.html(contentFreq);

    // navaids
    let navaid = [
        feature.properties.navaid1,	
        feature.properties.navaid2,	
        feature.properties.navaid3,	
        feature.properties.navaid4,
    ];

    navaid = navaid.filter(naid => naid);

    let contentNavaid = navaid[0] ? navaid.reduce((a,b) => (
        "<p class='section-p'><span>"+a+"</span></p>"+
        "<p class='section-p'><span>"+b+"</span></p>"
        )
    ) : "";;
    
    navaidsSection.empty();
    navaidsSection.html(contentNavaid);

    // aircrafts available
    let contentAir = [
        feature.properties['a/c_type1'],
        feature.properties['a/c_type2'],
        feature.properties['a/c_type3'],	
        feature.properties['a/c_type4']
    ];

    contentAir = contentAir.filter(ca => ca);

    let aircraftQuantities = [
        feature.properties['a/c_quantity1'],
        feature.properties['a/c_quantity2'],	
        feature.properties['a/c_quantity3'],
        feature.properties['a/c_quantity4']
    ];

    aircraftQuantities = aircraftQuantities.filter(aq => aq);


    let contentAircraft = contentAir[0] ? contentAir.reduce((a,b) => (
        "<span><img src='icons/airport-15.svg' alt='airplane'>&times;"+a+"</span>"+
        "<span><img src='icons/airport-15.svg' alt='airplane'>&times;"+b+"</span>"
        )
    ) : "";
    
    aircraftsSection.empty();
    aircraftsSection.html(contentAircraft);

    // other information
    let otherInfo = [];
    let contentOtherInfo = otherInfo[0] ? otherInfo.reduce((a,b) => "<p>"+a+"</p><p>"+b+"</p>") : "";

    otherInfoSection.empty();
    otherInfoSection.html(contentOtherInfo);

    // update carousel imges
    triggerImageModalListener();
}

// progress timer
var timeFrame = 8 * 60 * 60 * 1000;
var timeProgessBar = document.getElementById("time-progress");
setInterval(function(e){
    // convert 8hrs to milliseconds
    let time = 8 * 60 * 60 * 1000;
    let currentTime = new Date();
    timeFrame = timeFrame - 1000;

    if(timeFrame < 0) {
        timeFrame = time;
    }

    // update the text
    countDown.innerHTML = getYoutubeLikeToDisplay(timeFrame);

    // update the progess bar
    timeProgessBar.style.width = (time- timeFrame) * 100 / time  + "%";

}, 1000);

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
});



// Image modal
function triggerImageModalListener() {
    var carouselImages = document.querySelectorAll(".carousel-item img");
    

    carouselImagesLength = carouselImages.length - 1;
    carouselImages.forEach((image,i) => {
        image.addEventListener('click', function(e) {
            modalImage.src = this.src;
            $('#imageModal').modal('show');
            modalImageIndex = i;
        });
    });
}

$(".modal-body .carousel-control-prev").on("click", function(e) {
    modalImageIndex -= 1;
    modalImageIndex = modalImageIndex < 0 ? carouselImagesLength : modalImageIndex;

    console.log(modalImageIndex);
    updateModalImage(modalImageIndex);
});

$(".modal-body .carousel-control-next").on("click", function(e) {
    modalImageIndex++;
    modalImageIndex = modalImageIndex > carouselImagesLength ? 0 : modalImageIndex;

    console.log(modalImageIndex);
    updateModalImage(modalImageIndex);
});

function updateModalImage(index) {
    let carouselImages = document.querySelectorAll(".carousel-item img");
    let targetImage = carouselImages[index];
    modalImage.src = targetImage.src;
}


$('.modal-body').on("click", function(e) {
    console.log("Body");
    e.stopPropagation();
});

$('.modal-content').on("click", function(e) {
    $('#imageModal').modal('hide');
});