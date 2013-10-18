var OrderDetail = function () {

    this.index = 4;
    this.initialize = function () {
        this.el = $('<div/>');
    };

    this.render = function() {
        this.el.html(OrderDetail.template());
        return this;
    };

    this.onShow = function () {
        var self = this;
        Map.initialize($("#orderDetailMap"));
        $("#orderDetailBack").click(function () { app.home(); });
        $("#orderDetailClaim").click(function () { self.claim(); });
        $("#orderDetailRate").click(function () { self.rate(); });
        this.loadData();

    };

    this.loadData = function () {
        this.order = Service.orders.Current;
        ////mhp nefunguje
        if (this.order.noclaim && this.order.GUID) 
            $("#orderDetailClaim").show();
        else
            $("#orderDetailClaim").hide();

        if (this.order.norate && this.order.GUID)
            $("#orderDetailRate").show();
        else
            $("#orderDetailRate").hide();


        $("#orderDetailForm").html(OrderDetail.detailTemplate(this.order));
        if (this.order.StartLatitude)
            try {
                Map.setMap(this.order.StartLatitude, this.order.StartLongitude, this.order.TaxiLatitude, this.order.TaxiLongitude);
            } catch (err) {
                Map.mapDiv.html("Mapy sú nedostupné");

            }

    };

    //ratung
    this.rate = function (btn) {
        Service.rate(Service.orders.Current.localId);
    };

    //reklamacia
    this.claim = function (btn) {
        Service.claim(Service.orders.Current.localId);
    };


    this.initialize();
}

OrderDetail.template = Handlebars.compile($("#orderDetail-tpl").html());
OrderDetail.detailTemplate = Handlebars.compile($("#orderDetailForm-tpl").html());