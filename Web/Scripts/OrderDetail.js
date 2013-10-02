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
        Map.initialize($("#orderDetailMap"));
        $("#orderDetailBack").click(function () { app.home(); });
        this.loadData();
    };

    this.loadData = function () {
        this.order = Service.orders.Current;
        $("#orderDetailForm").html(OrderDetail.detailTemplate(this.order));
        if (this.order.StartLatitude)
            Map.setMap(this.order.StartLatitude, this.order.StartLongitude, this.order.TaxiLatitude, this.order.TaxiLongitude);
    };

    this.initialize();
}

OrderDetail.template = Handlebars.compile($("#orderDetail-tpl").html());
OrderDetail.detailTemplate = Handlebars.compile($("#orderDetailForm-tpl").html());