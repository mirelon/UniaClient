var OrdersView = function() {
    this.index = 1;
    this.initialize = function() {
        this.el = $('<div/>');
    };

    this.render = function () {
        this.el.html(OrdersView.template());
        return this;
    };

    this.loadData = function () {
        var self = this;

        $('.orders-list').hide();
        app.waiting();
        var orders = Service.orders;

        if (orders && orders.Items) {
            $('.orders-list').html(OrdersView.liTemplate(orders.Items));
        }
        if (self.iscroll)
            self.iscroll.refresh();
        else
            self.iscroll = new iScroll($('.scroll', self.el)[0], { hScrollbar: false, vScrollbar: false });

        app.waiting(false);

        $(".up").click(function () { self.changeOffer($(this).parent(), "Up"); });
        $(".down").click(function () { self.changeOffer($(this).parent(), "Down"); });
        $(".content").click(function () { self.detail($(this).parent()); });
        
        $('.orders-list').show();
    };
    this.changeOffer = function (btn, action) {
        var self = this;
        if (action == "Up") {
            Service.newOrder(btn.attr("data_localId"));
        }
        else {
            Service.removeOrder(btn.attr("data_localId"), function ()
            {
                self.loadData();
            })
        }
    };
    this.detail = function (btn) {
        var self = this;
        Service.detail(btn.attr("data_localId"));
    };
    this.onShow = function () {
        if (!navigator.app)
            $('#appExit').hide();
        $("#taxiHeader").click(function () { app.refreshData(["orders", "transporters"]); });
        this.loadData();
    };
    this.initialize();
}

OrdersView.template = Handlebars.compile($("#orders-tpl").html());
OrdersView.liTemplate = Handlebars.compile($("#orders-li-tpl").html());
OrdersView.unbreakTemplate = Handlebars.compile($("#orders-unbreak").html());