var app = {
    currentPage: null,
    currentPageName: null,
    isDevice: false,
    mediaNew : null,
    mediaAlert : null,
    pages: {},
    showAlert: function (message, title) {

        var ierr = ErrorStorage.hasError(message);


        if (navigator.notification) {
            if (ierr == 0) {
                ErrorStorage.addError(message);
                navigator.notification.alert(message, alertDismissed(message), title, 'OK');
            }
        }
        else {

            if (ierr == 0) {
                ErrorStorage.addError(message);
                alert(title ? (title + ": " + message) : message);
                ErrorStorage.removeError(message);
            }
        }
    },
    alertDismissed: function (message) {
        ErrorStorage.removeError(message);
    },
    showConfirm: function (message, title, okCallback, cancelCallback) {
        if (navigator.notification) {
            var _callback = function (btn) {
                if (btn === 1) {
                    if (okCallback) okCallback();
                }
                else {
                    if (cancelCallback) cancelCallback();
                }
            }
            navigator.notification.confirm(message, _callback, title, 'OK,Cancel');
        } else {
            if (confirm(title ? (title + ": " + message) : message)) {
                if (okCallback) okCallback();
            }
            else {
                if (cancelCallback) cancelCallback();
            }
        }
    },
    playNew: function(){
        if(app.mediaNew)
            app.mediaNew.play();
    },
    info: function(t){
        $("#taxiInfo").html(t);
    },
    waiting: function (show) {
        if (show == false)
            $(".waitingDiv").empty().hide();
        else
            $(".waitingDiv").show();
    },
    log: function (t) {
        if ($(".waitingDiv").is(":visible"))
            $(".waitingDiv").html(t);
    },
    end: function (callback) {
            if (navigator.app) {
                        app.showConfirm("Ukončiť aplikáciu?", "Ukončenie aplikácie", function () {
                            app.log("app.exitApp");
                            navigator.app.exitApp();
                        }, callback);
            }
            else callback();
    },
    registerEvents: function () {
        app.log("app.registerEvents");
        var self = this;

        $('body').on('touchmove', function (event) { event.preventDefault(); });
        $('body').on('click', '[data-route]', function (event) { app.route($(this).attr("data-route")); });
        $('body').on('click', '#newOrder', function (event) { Service.newOrder(); });
        if (navigator.app)
            $('body').on('click', '#appExit', function () { app.end(function () { app.home(); }); });
        //deviceready
        //pause
        //resume
        //online
        //offline
        //backbutton
        //menubutton
        //searchbutton
        try {
            document.addEventListener('backbutton', function (e) {
                if (app.currentPage && app.currentPage.back)
                {
                    app.currentPage.back();
                }
                else if (app.currentPageName != "orders") {
                    e.preventDefault();
                    app.home();
                }
            }, false);
            document.addEventListener('pause', function () { app.info("Pause"); }, false);
            document.addEventListener('resume', function () { app.info("Resume"); }, false);
            document.addEventListener("offline", function () { app.info("Offline"); }, false);
            document.addEventListener("online", function () { app.info("Online"); }, false);
            //document.addEventListener("unload", function () {
            //    app.info("Unload");
            //    cordova.require('cordova/plugin/powermanagement').release(
            //                function () { app.info("powermanagement Release"); },
            //                function () { app.info("powermanagement Error Release"); }
            //        );
            //}, false);

        } catch (err) {
            app.log(err);
        }

        try {
            if (app.isDevice)
                self.mediaNew = new Media(app.getPhoneGapPath() + "audio/sound1.mp3");
            else
                self.mediaNew = new Audio("audio/sound1.mp3");
        }
        catch (err) {
            app.log("Media: " + err);
        }
    },
    home: function (refresh) {
        app.route("orders");
        if (refresh)
            app.currentPage.loadData();
    },
    settings: function () {
        if (this.currentPageName != "settings")
            this.route("settings");
    },
    route: function (p) {
        app.log("app.route: " + p);
        var self = this;
        var page = this.pages[p];
        if (!page) {
            switch (p) {
                case "orders": page = new OrdersView().render(); this.homePage = page; break;
                case "detail": page = new OrderDetail().render(); break;
                case "order": page = new OrderView().render(); break;
                case "claim": page = new ClaimDetail().render(); break;
                case "rate": page = new RateDetail().render(); break;
                case "map": page = new MapView().render(); break;
                case "help": page = new HelpView().render(); break;

                default: this.showAlert("Undefined page:" + p, "ERROR"); return;
            }
            this.pages[p] = page;
        }
        this.currentPageName = p;
        this.slidePage(page);
    },
    slidePage: function (page) {
        var currentPageDest, self = this;

        if (!this.currentPage) {
            //$(page.el).attr('class', 'page stage-center');
            $('body').append(page.el);
            this.currentPage = page;
            setTimeout(function () {
                if (page.onShow) 
                    page.onShow();
                else
                    app.waiting(false);
            });
            return;
        }

        if (this.currentPage === page)
            return;

        //if (page.index < this.currentPage.index) {
        //    $(page.el).attr('class', 'page stage-left');
        //    currentPageDest = "stage-right";
        //} else {
        //    $(page.el).attr('class', 'page stage-right');
        //    currentPageDest = "stage-left";
        //}

        $('body').append(page.el);
        
        setTimeout(function () {
            $(self.currentPage.el).hide();
            $(page.el).show();
            //$(self.currentPage.el).attr('class', 'page transition ' + currentPageDest);
            //$(page.el).attr('class', 'page stage-center transition');
            if (page.onShow)
                page.onShow();
            else
                self.waiting(true);
            self.currentPage = page;
            //$('.stage-right, .stage-left').remove();
        });
    },
    scrollTop: function () {
            window.scrollTo(0, 0);
        document.body.scrollTop = 0;
    },
    refreshData: function (dataIds, callback) {
        var isCallback = false;
        if (dataIds) {
            $.each(dataIds, function () {
                if(this == "orders"){
                    if (app.currentPageName == "orders") {
                        app.currentPage.loadData();
                    }
                    if (app.currentPageName == "detail") {
                        app.currentPage.loadData();
                    }
                }
            });
        }
        if (!isCallback && callback)
            callback();
    },
    getPhoneGapPath: function () {
        if (app.isDevice) {
            var path = window.location.pathname;
            path = path.substr(path, path.length - 10);
            return 'file://' + path;
        }
        else return "";
    },
    initialize: function () {
        app.log("app.initialize");
        app.log("app.isDevice: " + this.isDevice);
        var self = this;
        this.pages = {};
        this.registerEvents();

        //check GPS:
        app.checkGPS();


        Service.initialize(function () {
            self.home();
        });
    },

    checkGPS: function () {
        if (!this.isDevice) return;
    }
}



function onLoad() {
    app.isDevice = navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry)/);
    if (app.isDevice) {
        document.addEventListener("deviceready", function () { app.initialize(); }, false);
    } else {
        app.initialize();
    }
    
}

function fillEndCity()
{
    var endc = document.getElementById("EndCity");
    var startc = document.getElementById('StartCity');
    if (startc == null) return;
    if (endc == null || endc.value=='')
        endc.value = startc.value;

    
}
