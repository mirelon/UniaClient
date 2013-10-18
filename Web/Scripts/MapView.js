var MapView = function (store) {

    this.index = 4;
    this.initialize = function () {
        this.el = $('<div/>');
    };

    this.render = function () {
        //this.el.html(MapView.template(store));
        ViewMap.initialize(this.el);
        return this;
    };

    this.onShow = function () {
        ViewMap.showPosition();
    }

    this.initialize();
}

//MapView.template = Handlebars.compile($("#map-tpl").html());

var ViewMap = {
    date: null,
    marker: null,
    map: null,
    mapOut: null,
    mapMessage: null,
    mapDiv: null,
    mess: null,
    messError: null,

    initialize: function (el) {
        var header = $('<div class="header"><button data-route="orders" class="icon ico_back">&nbsp;</button></div>').appendTo(el);
        var sc = $('<div class="scrollBottom"/>').appendTo(header);
        ViewMap.mapDiv = $('<div id="mapDiv"/>').appendTo(sc);
        ViewMap.mapMessage = $('<div id="mapMessage">Waiting ...</div>').appendTo(sc);
        ViewMap.mapOut = $('<div id="mapOut"/>').appendTo(header);

        if (ViewMap.mess) {
            ViewMap.message(ViewMap.mess, ViewMap.messError);
        }
    },

    success: function (position) {
        ViewMap.date = new Date().toTimeString();
        ViewMap.message("Pozícia " + ViewMap.date);
        var d = 'Latitude: ' + position.coords.latitude + '<br />' +
       'Longitude: ' + position.coords.longitude + '<br />' +
        "Presnosť pozície: " + position.coords.accuracy + "m";
        //'Altitude: ' + position.coords.altitude + '<br />' +
        //'Accuracy: ' + position.coords.accuracy + '<br />' +
        //'Altitude Accuracy: ' + position.coords.altitudeAccuracy + '<br />' +
        //'Heading: ' + position.coords.heading + '<br />' +
        //'Speed: ' + Math.ceil(position.coords.speed * 3.6) + ' km/h<br />';// +
        //'Timestamp: ' + new Date(position.timestamp) + '<br />';
        ViewMap.mapOut.html(d);
        ViewMap.setMap(position);
        PositionService.lat = position.coords.latitude;
        PositionService.lng = position.coords.longitude;
    },
    error: function (err) {
        ViewMap.message("Error: " + err.message, true);
    },
    message: function (t, err) {
        if (ViewMap.mapMessage) {
            ViewMap.mapMessage.html(t);
            ViewMap.mapMessage.css("color", err ? "red" : "black");
        }
        else {
            ViewMap.mess = t;
            ViewMap.messError = err;
        }
    },
    setMap: function (position) {
        try {
            if (Map.apiIsOk) {
                ViewMap.point = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                if (!ViewMap.marker) {
                    ViewMap.mapDiv.css("display", "block");
                    ViewMap.map = new google.maps.Map(ViewMap.mapDiv[0], { zoom: 15, disableDefaultUI: true, mapTypeId: google.maps.MapTypeId.ROADMAP });
                    ViewMap.map.setCenter(ViewMap.point);
                    ViewMap.marker = new google.maps.Marker({
                        clickable: false,
                        map: ViewMap.map
                    });
                }
                google.maps.event.trigger(ViewMap.map, "resize");
                ViewMap.map.setCenter(ViewMap.point);
                ViewMap.marker.setPosition(ViewMap.point);
            }
            else {
                ViewMap.message("Mapy sú nedostupné", true);
            }
        }
        catch (err) {
            ViewMap.message(err.message, true);
        }
    },
    showPosition: function () {
        ViewMap.message("Hľadám pozíciu ...");
        try {
            navigator.geolocation.getCurrentPosition(ViewMap.success, ViewMap.error, { enableHighAccuracy: true }); //, { frequency: 2000 }
        }
        catch (err) {
            ViewMap.message(err.message, true);
        }
    }
};