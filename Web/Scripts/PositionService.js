var PositionService = {
    lat:0,
    lng: 0,
    accuracy: 0,
    _lat: 0,
    _lng: 0,
    poolID: undefined,
    watchID: undefined,
    startWatch: function () {
        PositionService.startPool();

        setTimeout(function () {
            if (this.watchID)
                navigator.geolocation.clearWatch(this.watchID);

            this.watchID = navigator.geolocation.watchPosition(function (position) {
                app.info("Presnosť pozície: " + position.coords.accuracy + "m");
                PositionService.accuracy = position.coords.accuracy;
                PositionService.lat = position.coords.latitude;
                PositionService.lng = position.coords.longitude;
            }, function (err) {
                app.info(err.message);
            },
            {
                enableHighAccuracy: true,
                maximumAge: 3000,
                timeout: 27000
            });
        }
        , 1000);
    },
    startPool: function () {
        if (this.poolID)
            clearTimeout(this.poolID);
        this.poolID = setTimeout(PositionService.pool, 10000);
    },
    stopWatch: function () {
        if (this.poolID)
            clearTimeout(this.poolID);
        if (this.watchID)
            navigator.geolocation.clearWatch(this.watchID);
        this.poolID = undefined;
    },
    pool: function () {
        this.poolID = undefined;
            PositionService.callService();
    },
    callService: function () {
        var list_IdOrder = Service.waitingOffers();
        if (list_IdOrder.length > 0) {
            try {
                var posChanged = PositionService._lat != PositionService.lat && PositionService._lng != PositionService.lng;
                if (posChanged) {
                    PositionService._lat = PositionService.lat;
                    PositionService._lng = PositionService.lng;
                }

                Service.callService("pool", {
                    list_IdOrder: list_IdOrder.join("||"),
                    Id: Service.settings.sessionId,
                    Lat: posChanged ? PositionService.lat : 0,
                    Lng: posChanged ? PositionService.lng : 0
                },
                function (d) { PositionService.startPool(); PositionService.refreshVersionData(d, list_IdOrder); },
                function (d) { PositionService.startPool(); if (d.ErrorMessage) app.info(d.ErrorMessage); });
            }
            catch (err) {
                PositionService.startPool();
                app.info(err.message);
            }
        }
        else
            PositionService.startPool();
    },
    refreshVersionData: function (d, list_IdOrder) {
        if (!d.Items)
            d.Items = [];
        
        $.each(list_IdOrder, function () {
            var guid = this;
            var r = d.Items.filter(function (a) { return a.GUID == guid; });
            if (r.length == 0)
                d.Items.push({ GUID: guid, StatusOrder: "" });
        });
        if (d.Items) {
            var play = false;
            $.each(d.Items, function () {
                play |= Service.updateOrder(this);
            });
            if (play) {
                app.playNew();
            }
            if (Service.orders.IsChanged) {
                Service.saveOrders();
                app.refreshData(["orders"]);
            }
        }
    }
}