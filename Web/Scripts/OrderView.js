var OrderView = function () {
    this.index = 5;
    this.order = {};
    this.initialize = function() {
        this.el = $('<div/>');
    };

    this.render = function() {
        return this;
    };

    this.onShow = function () {
        var self = this;
        this.el.html(OrderView.template());
        $("#orderForm").hide();
        app.waiting();
        $("#orderSave").click(function () { if (!$(this).hasClass("transparent")) self.save(); });
        $("#orderBack").click(function () { if (!$(this).hasClass("transparent")) self.back(); });
                
        this.loadForm();
    };
    this.back = function () {
        switch (this.order.step) {
            case "fTaxiCompany":
                app.home();
                return;
            case "fOrderToDate":
                if (Service.oneCompany) {
                    app.home();
                    return;
                }
                else {
                    this.order.step = "fTaxiCompany";
                    break;
                }
            case "fStartAddress":
                this.order.step = "fOrderToDate";
                break;
            case "fEndAddress":
                this.order.step = "fStartAddress";
                break;
            case "fCustomerPhone":
                this.order.step = "fEndAddress";
                break;
            case "fSpecialConditions":
                this.order.step = "fCustomerPhone";
                break;
            case "fOrderSave":
                return;
                break;
            case "fOrderOk":
                app.home();
                return;
            case "fOrderError":
                app.home();
                return;
            default:
                return;
        }
        $("#orderForm fieldset").hide();
        $("#" + (this.order.step)).show();
    };
    this.save = function () {
        var self = this;
        $("#OrderFormError").empty();
        switch (this.order.step) {
            case "fTaxiCompany":
                if (!$("#TaxiCompanyLocalId").val()) {
                    $("#OrderFormError").html("Vyberte taxislužbu");
                    return;
                }
                this.order.step = "fOrderToDate";
                break;
            case "fOrderToDate":

                var d = Service.parseDate($("#OrderToDate").val());
                var now = new Date();
                if (d < now)
                {
                    $("#OrderFormError").html("Zvoľte vyšší dátum a čas");
                    return;
                }
                this.order.step = "fStartAddress";
                break;
            case "fStartAddress":
                if (!$("#StartCity").val() || !$("#StartAddress").val()) {
                    $("#OrderFormError").html("Zadajte kompletnú adresu");
                    return;
                }
                this.order.step = "fEndAddress";
                break;
            case "fEndAddress":
                this.order.step = "fCustomerPhone";
                break;
            case "fCustomerPhone":
                if (!$("#CustomerPhone").val()) {
                    $("#OrderFormError").html("Zadajte Váš telefón");
                    return;
                }
                if (!$("#CustomerName").val()) {
                    $("#OrderFormError").html("Zadajte Vaše meno");
                    return;
                }
                this.order.step = "fSpecialConditions";
                break;
            case "fSpecialConditions":
                this.order.step = "fOrderSave";
                $("#orderSave").hide();
                $("#orderBack").hide();
                $("#orderWaiting").show();
                $("#orderForm fieldset").hide();
                $("#" + (this.order.step)).show();
                //$("#orderForm").hide();
                //app.waiting();
                var d = $("#orderForm-form").serializeArray();

                var addressChanged = false;
                $.each(d, function (i, v) {
                    if (v.name == "StartCity" && v.value != self.order.StartCity || v.name == "StartAddress" && v.value != self.order.StartAddress)
                        addressChanged = true;
                    self.order[v.name] = v.value;
                });
                
                var send = function () {
                    Service.sendOrder(self.order, function (data) {
                        self.order.step = "fOrderOk";
                        $("#orderForm fieldset").hide();
                        $("#" + (self.order.step)).show();
                        $("#orderWaiting").hide();
                        $("#orderBack").show();
                    }, function (data) {
                        $("#fOrderErrorOutput").html(data.ErrorMessage);
                        self.order.step = "fOrderError";
                        $("#orderForm fieldset").hide();
                        $("#" + (self.order.step)).show();
                        $("#orderWaiting").hide();
                        $("#orderBack").show();
                        //$("#orderSave").show();
                    });
                }

                if (addressChanged) {
                    Map.geocode({ address: self.order.StartAddress + ", " + self.order.StartCity }, function (a) {
                        self.order.StartLatitude = a.lat;
                        self.order.StartLongitude = a.lng;
                        send();
                    });
                }
                else send();

                return;
                break;
            default:
                this.order.step = Service.oneCompany ? "fOrderToDate" : "fTaxiCompany";
                break;
        }

        $("#orderForm fieldset").hide();
        $("#" + (this.order.step)).show();
    };

    this.loadForm = function () {
        var self = this;
        this.order = Service.orders.Current;
        this.order.geocodeStatus = false;
        
        if (this.order.IsNew) {
            Map.geocode({ 'latLng': new google.maps.LatLng(PositionService.lat, PositionService.lng) }, function (a) {
                self.order.StartCity = a.City;
                self.order.EndCity = a.City;
                self.order.StartAddress = a.Address;
                self.order.geocodeStatus = a.Status;
                self.order.StartLatitude = PositionService.lat;
                self.order.StartLongitude = PositionService.lng;
                self.showForm();
            });
        }
        else self.showForm();
    };

    this.showForm = function () {
            app.waiting(false);
            this.order.step = this.order.step || (Service.oneCompany ? "fOrderToDate" : "fTaxiCompany");
            var self = this;
            if (Service.companies) {
                this.order.companiesItems = Service.companies.Items;
                $.each(Service.companies.Items, function () {
                    if (this.selected)
                        self.order.TaxiCompanyLocalId = this.localId;

                });
            }
            $("#orderForm").html(OrderView.templateForm(this.order));
            $("#orderWaiting").hide();
            $('input').on('focus', function () {
                document.body.scrollTop = $(this).offset().top;
            });

            var now = new Date();
            var minDate = now;// new Date(now.getFullYear(),now.getMonth(),now.getDate());
            var maxDate = new Date();
            maxDate.setHours(maxDate.getHours() + 24);
            
            
            var scr = $("#OrderToDate").scroller({ mode: "clickpick", showNow: true, display: "inline", theme: "default", preset: 'datetime', lang: "sk", minDate: minDate, maxDate: maxDate, stepMinute: 5 });
            $("#OrderToDateNow").click(function () {
                var date = Service.getDateForNweOrder();
                $("#OrderToDate").val(Service.formatDate(date));
                $("#OrderToDate").scroller('setDate', date);
                return false;
            });
        
            $("#orderForm fieldset").hide();
            $("#" + (this.order.step)).show();
            $("#orderForm").show();
            $("#orderSave").removeClass("transparent");
            $(".radio").click(function () { self.radioCompanyClick($(this)); });
    };
    this.radioCompanyClick = function (btn) {
        var localId = btn.attr("data_localId");
        $(".radio").removeClass("selected");
        btn.addClass("selected");
        $("#TaxiCompanyLocalId").val(localId);
    };

    this.initialize();
}

OrderView.template = Handlebars.compile($("#order-tpl").html());
OrderView.templateForm = Handlebars.compile($("#orderForm-tpl").html());