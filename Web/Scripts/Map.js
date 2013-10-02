var Map = {
    date: null,
    marker: null,
    tmarker: null,
    map: null,
    //mapOut: null,
    //mapMessage: null,
    mapDiv: null,
    mess: null,
    messError: null,
    apiIsOk: false,
    geocoder: null,
    initialize: function (mapOut) {
        //var header = $('<div class="header"><button data-route="orders" class="icon ico_back">&nbsp;</button></div>').appendTo(el);
        //var sc = $('<div class="scrollBottom"/>').appendTo(header);
        //Map.mapDiv = $('<div id="mapDiv"/>').appendTo(sc);
        //Map.mapMessage = $('<div id="mapMessage">Waiting ...</div>').appendTo(sc);
        //Map.mapOut = $('<div id="mapOut"/>').appendTo(header);
        Map.mapDiv = mapOut;
        Map.map = null;
    },
    apiOK: function () {
        Map.apiIsOk = true;
        Map.geocoder = new google.maps.Geocoder();
    },
    geocode: function (props, postback) {
        var self = this, a = {}, lat, lng;
        if (self.geocoder)
        self.geocoder.geocode(props, function (results, status) {
                if (status == google.maps.GeocoderStatus.OK) {
                    if (results[0]) {
                        a = self.placeToAddress(results[0]);
                        lat = a.Latitude;
                        lng = a.Longitude;
                    }
                }

                if (postback) {
                    postback({
                        lat: lat, lng: lng,
                        City: a.City,
                        Status: status,
                        Address: (a.Street ? a.Street + " " + (a.StreetNumber ? a.StreetNumber : "") : (a.PointOfInterest ? a.PointOfInterest + " " : ""))
                    });
                }
            });
        else
            postback({});
    },
    placeToAddress: function (place) {
        var address = {};
        if (place.geometry) {
            address.Latitude = place.geometry.location.lat();
            address.Longitude = place.geometry.location.lng();
        }
        $(place.address_components).each(
            function () {
                var a = this;
                if (a.types.length > 0)
                    switch (a.types[0]) {
                        case "country":
                            address.Country = a.long_name;
                            address.CountryShortName = a.short_name;
                            break;
                        case "locality":
                            address.City = a.long_name;
                            break;
                        case "sublocality":
                            address.sublocality = a.long_name;
                            break;
                        case "postal_code":
                            address.PostalCode = a.long_name;
                            break;
                        case "route":
                            address.Street = a.long_name;
                            break;
                        case "street_number":
                            address.StreetNumber = a.long_name;
                            break;
                        case "point_of_interest":
                            address.PointOfInterest = a.long_name;
                            break;
                        case "establishment":
                            address.PointOfInterest = a.long_name;
                            break;
                    }
            }
        );
        return address;
    },
    setMap: function (lat, lng, tlat, tlng) {
        //try {
            if (Map.apiIsOk) {
                Map.point = new google.maps.LatLng(lat, lng);

                if (!Map.map) {
                    Map.mapDiv.css("display", "block");
                    Map.map = new google.maps.Map(Map.mapDiv[0], { zoom: 15, disableDefaultUI: true, mapTypeId: google.maps.MapTypeId.ROADMAP });
                    Map.map.setCenter(Map.point);
                    Map.marker = new google.maps.Marker({
                        clickable: false,
                        icon: { url: "http://maps.gstatic.com/mapfiles/ms2/micons/man.png" },
                        shadow: new google.maps.MarkerImage("http://maps.gstatic.com/mapfiles/ms2/micons/man.shadow.png",
                        new google.maps.Size(59.0, 32.0),
                        new google.maps.Point(0, 0),
                        new google.maps.Point(16.0, 32.0)
                        ),
                        map: Map.map
                    });
                    Map.tmarker = new google.maps.Marker({

                        icon: { url: "http://maps.gstatic.com/mapfiles/ms2/micons/cabs.png" },
                        shadow: new google.maps.MarkerImage("http://maps.gstatic.com/mapfiles/ms2/micons/cabs.shadow.png",
                        new google.maps.Size(59.0, 32.0),
                        new google.maps.Point(0, 0),
                        new google.maps.Point(16.0, 32.0)
                        ),
                        clickable: false,
                        map: Map.map
                    });
                }

                google.maps.event.trigger(Map.map, "resize");
                Map.map.setCenter(Map.point);
                Map.marker.setPosition(Map.point);
                if (tlat && tlng) {
                    var tPoint = new google.maps.LatLng(tlat, tlng);
                    var bounds = new google.maps.LatLngBounds();
                    bounds.extend(Map.point);
                    bounds.extend(tPoint);
                    Map.tmarker.setPosition(tPoint);
                    Map.map.fitBounds(bounds);
                }
            }
            else {
                //Map.message("Mapy sú nedostupné", true);
            }
        //}
        //catch (err) {
            
        //}
    }
};