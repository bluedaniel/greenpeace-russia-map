/* jshint undef: true, unused: true */
/* global google */

'use strict';

var mapCanvasID = 'greenpeace-russia-map-canvas',
  googleDoc = '1uPTOGIHvRRNZ7JMyeD6dTNsXsORbMcuNmKx1LcP6hnM',
  bounds,
  mapOptions,
  map,
  infoWindow,
  markers = [];

var overlayHelper = new google.maps.OverlayView();
overlayHelper.onAdd = function() {};
overlayHelper.onRemove = function() {};
overlayHelper.draw = function() {};


var mapStyle = [{
  'featureType': 'landscape',
  'stylers': [{
    'saturation': -100
  }, {
    'lightness': 65
  }, {
    'visibility': 'on'
  }]
}, {
  'featureType': 'poi',
  'stylers': [{
    'saturation': -100
  }, {
    'lightness': 51
  }, {
    'visibility': 'simplified'
  }]
}, {
  'featureType': 'road.highway',
  'stylers': [{
    'saturation': -100
  }, {
    'visibility': 'simplified'
  }]
}, {
  'featureType': 'road.arterial',
  'stylers': [{
    'saturation': -100
  }, {
    'lightness': 30
  }, {
    'visibility': 'on'
  }]
}, {
  'featureType': 'road.local',
  'stylers': [{
    'saturation': -100
  }, {
    'lightness': 40
  }, {
    'visibility': 'on'
  }]
}, {
  'featureType': 'transit',
  'stylers': [{
    'saturation': -100
  }, {
    'visibility': 'simplified'
  }]
}, {
  'featureType': 'administrative.province',
  'stylers': [{
    'visibility': 'off'
  }]
}, {
  'featureType': 'water',
  'elementType': 'labels',
  'stylers': [{
    'visibility': 'on'
  }, {
    'lightness': -25
  }, {
    'saturation': -100
  }]
}, {
  'featureType': 'water',
  'elementType': 'geometry',
  'stylers': [{
    'hue': '#ffff00'
  }, {
    'lightness': -25
  }, {
    'saturation': -97
  }]
}];

function sidebarUnhighlight() {
  $('ul.locations li').removeClass('enabled');
}

function addMarker(marker, content) {
  google.maps.event.addListener(marker, 'click', function() {
    infoWindow.setContent('<div id="contentWindow">' +
      content.join('') + '</div>');
    infoWindow.open(map, marker);

    map.setZoom(5);
    map.setCenter(marker.getPosition());

    sidebarUnhighlight();
    $('ul.locations li a[data-id="' + this.sidebarID +
      '"]').parent().addClass('enabled');

  });
  return true;
}

function offsetCenter() {

  map.fitBounds(bounds);

  var mapCanvas = $('#' + mapCanvasID),
    controlLeft = 230,
    widestPoint = 0,
    point,
    projection = overlayHelper.getProjection();

  var newBounds = new google.maps.LatLngBounds();

  for (var m in markers) {
    point = projection.fromLatLngToContainerPixel(markers[m].getPosition());
    newBounds.extend(markers[m].getPosition());
    if (point.x < controlLeft && (point.x < widestPoint || !widestPoint)) {
      widestPoint = point.x;
    }
  }

  if (widestPoint > 0) {
    point = new google.maps.Point(-(controlLeft - widestPoint),
      mapCanvas.height() / 2);
    var latlng = projection.fromContainerPixelToLatLng(point);

    newBounds.extend(latlng);
    map.fitBounds(newBounds);
  } else {
    map.fitBounds(bounds);
  }
}

function initializeMap(mapData) {

  bounds = new google.maps.LatLngBounds();
  mapOptions = {
    center: new google.maps.LatLng(62.242350, 92.988281),
    zoom: 8,
    disableDefaultUI: true,
    draggable: false,
    disableDoubleClickZoom: true,
    styles: mapStyle
  };
  map = new google.maps.Map(document.getElementById(mapCanvasID), mapOptions);
  overlayHelper.setMap(map);

  infoWindow = new google.maps.InfoWindow();

  for (var i = 0; i < mapData.length; i++) {
    var item = mapData[i];

    var locations = item.latlng.split(';');

    // Split row latlng and add markers
    for (var j = 0; j < locations.length; j++) {

      var location = locations[j].split(',');

      var markerPosition = new google.maps.LatLng(location[0], location[1]);

      var icons = {
        oilplanned: 'images/oil-planned.png',
        oiloperational: 'images/oil-operational.png',
        gasplanned: 'images/gas-planned.png',
        gasoperational: 'images/gas-operational.png',
        gasoiloperational: 'images/gas-oil-operational.png',
        oilgasoperational: 'images/gas-oil-operational.png',
        gasoilplanned: 'images/gas-oil-planned.png',
        oilgasplanned: 'images/gas-oil-planned.png'
      };
      var markerIconUrl = icons[$.trim(item.icon).replace(/ /g, '')];

      var markerIcon = new google.maps.MarkerImage(
        markerIconUrl, null, null, null, new google.maps.Size(28, 28)
      );

      var marker = new google.maps.Marker({
        position: markerPosition,
        title: item.projectName,
        map: map,
        icon: markerIcon,
        sidebarID: i
      });

      var content = [];
      content.push('<span class="project">' + item.projectName + '</span>');

      var keyPoints = [];
      keyPoints.push('<b>Partners</b><span class="partners">' +
        item.partners + '</span>');
      keyPoints.push('<b>Stage</b><span class="stage">' +
        item.stage + '</span>');

      content.push('<div class="key-points">' + keyPoints.join('') + '</div>');

      content.push('<span class="info">' + item.size + '</span>');
      content.push('<span class="more-info"><a href="' + item.link +
        '" target="_blank">More Info</a></span>');

      addMarker(marker, content);

      markers.push(marker);
      bounds.extend(markerPosition);
    }

    $('ul.locations').append('<li><a href="#" data-id="' + i + '">' +
      item.project + '</a></li>');

  } // End of forEach markers

  google.maps.event.addListenerOnce(map, 'idle', function() {
    offsetCenter();
    // change

  });

  google.maps.event.addListener(infoWindow, 'closeclick', function() {
    // Zoom out on infoWindow close
    offsetCenter();
    sidebarUnhighlight();
  });
}

var doit;
window.onresize = function() {
  clearTimeout(doit);
  doit = setTimeout(offsetCenter, 200);
};


$(function() {

  $('ul.locations').on('click', 'li a', function() {
    sidebarUnhighlight();
    var markerID = $(this).data('id');
    google.maps.event.trigger(markers[markerID], 'click');
    $(this).parent().addClass('enabled');
    return false;
  });


  var rUrl = 'https://spreadsheets.google.com/feeds/list/';
  rUrl += googleDoc;
  rUrl += '/od6/public/values';

  $.getJSON(rUrl, {
    alt: 'json'
  }).done(function(data) {
    var mapData = [];
    for (var i = 0; i < data.feed.entry.length; i++) {
      var row = data.feed.entry[i];
      mapData.push({
        projectName: row.gsx$name.$t,
        partners: row.gsx$partners.$t,
        project: row.gsx$project.$t,
        link: row.gsx$link.$t,
        stage: row.gsx$stage.$t,
        size: row.gsx$size.$t,
        icon: row.gsx$icon.$t,
        latlng: row.gsx$latlng.$t
      });
    }
    initializeMap(mapData);
  });
});
