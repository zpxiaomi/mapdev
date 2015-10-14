var data = [4, 8, 15, 16, 23, 42];
/*var x = d3.scale.linear()
    .domain([0, d3.max(data)])
    .range([0, 420]);

d3.select(".chart")
  .selectAll("div")
    .data(data)
  .enter().append("div")
    .style("width", function(d) { return x(d) + "px"; })
    .text(function(d) { return d; }); */

/*var svgContainer = d3.select("body").append("svg").attr("width", 200).attr("height", 200);
var circles = svgContainer.selectAll("circle").data(jsonCircles).enter().append("circle");
var circleAttributes = circles
                       .attr("cx", function (d) { return d.x_axis; })
                       .attr("cy", function (d) { return d.y_axis; })
                       .attr("r", function (d) { return d.radius; })
                       .style("fill", function(d) { return d.color; });*/
//var nodes = document.getElementsByTagName('button');
//var n;
//function clickHandler(k){
//   return function(){
//    console.log('You clicked element #' + k);
// }
//} 
//
//for (var i = 0; i < nodes.length; i++) {
//   nodes[i].addEventListener('click', clickHandler(i));
//}
                       
//alert("Hello World!");
function bounce(t) {
  var s = 7.5625, p = 2.75, l;
  if (t < (1 / p)) {
    l = s * t * t;
  } else {
    if (t < (2 / p)) {
      t -= (1.5 / p);
      l = s * t * t + 0.75;
    } else {
      if (t < (2.5 / p)) {
        t -= (2.25 / p);
        l = s * t * t + 0.9375;
      } else {
        t -= (2.625 / p);
        l = s * t * t + 0.984375;
      }
    }
  }
  return l;
}

var view = new ol.View({
    center: ol.proj.transform([112.2091, 30.3319], 'EPSG:4326', 'EPSG:3857'),
    zoom: 16  
  });

var map = new ol.Map({
  target: 'map',
  layers: [
     //new ol.layer.Tile({
     //   source: new ol.source.MapQuest({layer: 'sat'})
     //}),
     //new ol.layer.Tile({
     //   source: new ol.source.Stamen({
     //     layer: 'toner'
     //   }) 
     //}),
     new ol.layer.Tile({
      source: new ol.source.OSM()
    })
  ],
  view: view
});

var bern = ol.proj.fromLonLat([112.22, 30.34]);

var flyToBern = document.getElementById('fly-to-jz');
flyToBern.addEventListener('click', function() {
  var duration = 2000;
  var start = +new Date();
  var pan = ol.animation.pan({
    duration: duration,
    source: /** @type {ol.Coordinate} */ (view.getCenter()),
    start: start
  });
  var bounce = ol.animation.bounce({
    duration: duration,
    resolution: 4 * view.getResolution(),
    start: start
  });
  map.beforeRender(pan, bounce);
  view.setCenter(bern);
}, false);

//get geo location from HTML5 geolocation API
var geolocation = new ol.Geolocation({
  projection: view.getProjection(),
  tracking: true
});

var markerPosition = new ol.Geolocation({
  projection: view.getProjection()
});

//add features  
var positionFeature = new ol.Feature();
positionFeature.setStyle(new ol.style.Style({
  image: new ol.style.Circle({
    radius: 6,
    fill: new ol.style.Fill({
      color: '#3399CC'
    }),
    stroke: new ol.style.Stroke({
      color: '#fff',
      width: 2
    })
  })
}));
var point = new ol.geom.Point(ol.proj.transform([112.2125, 30.3301], 'EPSG:4326', 'EPSG:3857'));     
positionFeature.setGeometry(point);
var featureSource = new ol.source.Vector();//provide a source of features for vector layers
featureSource.addFeature(positionFeature);
var featureLayer = new ol.layer.Vector({
  source: featureSource  
});
map.addLayer(featureLayer);
//3.add simulation functionalities
//add marker
var markerEl = document.getElementById("marker");
var marker = new ol.Overlay({
  positioning: 'center-center',
  element: markerEl,
  stopEvent: false
});
map.addOverlay(marker);

//add the animation
map.beforeRender(function(map, frameState){
  //if(frameState!==null){
    var view = frameState.viewState;
    if(markerPosition.getPosition()){
      var position = markerPosition.getPosition();
      view.center = [position[0], position[1]];
      marker.setPosition(position);
    }
  //}
  return true;
});

var simulationData;
$.getJSON("gpsTrack.json", function(data){
   simulationData = data.data;
});
var simulationBtn = document.getElementById('live-tracking');
simulationBtn.addEventListener('click', function(){
  var coordinates = simulationData;
  var firstCoord = coordinates.shift();
  setMarkerPosition(firstCoord);
  var prevDate = firstCoord.timestamp;
  function setlocationData(){
     var position = coordinates.shift();
     if(!position){
        return;
     }
     var newDate = position.timestamp;
     setMarkerPosition(position);
     window.setTimeout(function(){
        prevDate = newDate;
        setlocationData();
     }, (newDate - prevDate)/0.5);
  }
  setlocationData();//this is the key difference between static and animation!why? At first, it was only defined but never invoked
  map.on('postcompose', render);
  map.render();
}, false);

function setMarkerPosition(pos){
  var coords = pos.coords;
  var position_ = [coords.longitude, coords.latitude];
  var projectedPosition = ol.proj.transform(position_, 'EPSG:4326',
      'EPSG:3857');
  markerPosition.set('position', projectedPosition); 
}
// postcompose callback
function render() {
  map.render();
}

// add clicklisener to map for GPS data collection
//create simulation data using points
//map.on('singleclick', function(evt){
//   var coordinate = evt.coordinate;
//   var projectedCoord = ol.proj.transform(coordinate, 'EPSG:3857', 'EPSG:4326');
//   console.log(projectedCoord);
// } );
//create visualization for collecting the coordinates
var collectData = document.getElementById('csData');
var vectorSource = new ol.source.Vector();
var vectorLayer = new ol.layer.Vector({
  source: vectorSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({
      color: 'rgba(255, 255, 255, 0.2)'
    }),
    stroke: new ol.style.Stroke({
      color: '#ffcc33',
      width: 2
    }),
    image: new ol.style.Circle({
      radius: 7,
      fill: new ol.style.Fill({
        color: '#ffcc33'
      })
    })
  })
});
map.addLayer(vectorLayer);
var drawAndCollect;
function addDrawAndCollect(){
  drawAndCollect = new ol.interaction.Draw({
     source: vectorSource,
     type: 'Point'
  });
  drawAndCollect.on('drawend', function(evt){
   var coordinate  = evt.feature.getGeometry().getCoordinates();
   var projectedCoord = ol.proj.transform(coordinate, 'EPSG:3857', 'EPSG:4326');
   console.log(projectedCoord);
  });
  map.addInteraction(drawAndCollect);
}

if(collectData.checked == true){
   addDrawAndCollect();
}
collectData.onchange = function(){
  if(collectData.checked == true){
    addDrawAndCollect();
  } else{
    map.removeInteraction(drawAndCollect);
  }

  
}