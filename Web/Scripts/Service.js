var Service = {
    online: false,
    connectionError: undefined,
    orders: undefined,
    companies: undefined,
    oneCompany: false,
    settings: {
        userId: undefined,
        userPhone: undefined,
        userName: undefined,
        url: "http://localhost/disp",
        sessionId: undefined,
        enableHighAccuracy: true
    },
    initialize: function (callback) {
        app.log("Service.initialize");
        
        //Cross domain !!!
        $.support.cors = true;
        $.ajaxSetup({
            cache: false,
            timeout: 30000,
            error: function (jqXHR, textStatus, errorThrown) {
                switch (jqXHR.status) {
                    case 403: Service.connectionError = "Chybné prihlásenie"; break;
                    case 404: Service.connectionError = "Služba sa nenašla: " + this.url; break;
                    default: Service.connectionError = errorThrown; break;
                }
            }
        });
        
        this.getSettings();
        this.getOrders();
        this.getCompanies();

        if (window.device)
            this.settings.sessionId = window.device.platform + "_" + window.device.uuid;
        else
            this.settings.sessionId = "";

        //this.login(callback);

        PositionService.startWatch();
        if (callback)
            callback();
    },
    waitingOffers: function () {
        var ret = [], self = this;
        $.each(this.orders.Items, function () {
            if (this.GUID && self.isOrderInProcess(this))
                ret.push(this.GUID);
        });
        return ret;
    },
    login: function (callback) {
        app.log("Service.login");
        Service.isAuthenticated = false;
        this.callService("login", { UserName: this.settings.name, Password: this.settings.password, RememberMe: true, TransporterId: this.settings.transporterId }, function (d) {
            Service.isAuthenticated = true;
            Service.settings.userId = d.userId;
            Service.settings.sessionId = d.sessionId;
            Service.saveSettings();
            PositionService.startWatch();
            if (callback) callback();

        }, function (d) {
            //PositionService.stopWatch();
            if (d.ErrorMessage)
                Service.connectionError = d.ErrorMessage;
            else
                Service.connectionError = "Chybné prihlásenie";
            Service.isAuthenticated = false;
            if (callback)
                callback();
        });
    },
    detail: function(id){
        var order = this.findOrder(id);
        if (order) {
            this.orders.Current = order;
            app.route("detail");
        }
    },
 

    claim: function (id) {
        var order = this.findOrder(id);
        if (order) {
            this.orders.Current = order;
            app.route("claim");
        }
    },

    sendclaim: function (data, callback) {
        if (data) {
            Service.callService("ClaimReport", data, function (d) {
                Service.orders.Current.noclaim = false;
                Service.orders.Current.claimDescription = data.Description;
                Service.saveOrders();
                if (callback)
                    callback(d);
            });
        }
    },

    rate: function (id) {
        var order = this.findOrder(id);
        if (order) {
            this.orders.Current = order;
            app.route("rate");
        }
    },

    sendrate: function (data, callback) {
        if (data) {
            Service.callService("rate", data, function (d) {
                Service.orders.Current.norate = false;
                Service.orders.Current.rateValue = data.RateValue;
                Service.orders.Current.rateDescription = data.Description;
                Service.saveOrders();
                if (callback)
                    callback(d);
            });

        }
    },

    showHelp: function (id) {

        alert('help');
    },

    newOrder: function (id) {
        var order = this.findOrder(id);
        if (order) {
            if (this.isOrderInProcess(order)) {
                order = $.extend({}, order);
                order.IsNew = true;
            }
            else
                order.IsNew = false;

        }
        else {
            order = {};
            order.IsNew = true;
        }
        order.GUID = undefined;
        order.Status = "";
        order.OrderSource = "Phone";
        order.localId = "o_" + this.getUid();
        order.step = "";
        order.ErrorMessage = "";

        order.Date = this.getDateForNweOrder();
        order.OrderToDate = Service.formatDate(order.Date);
        this.setOrderDescription(order);
        if (this.settings.userPhone)
            order.CustomerPhone = this.settings.userPhone;
        if (this.settings.userName)
            order.CustomerName = this.settings.userName;

        this.orders.Current = order;
        app.route("order");
    },

    isOrderInProcess: function(order){
        return order && order.Status && (order.Status == "New" || order.Status == "Offered" || order.Status == "Reserved" || order.Status == "Waiting");
    },
    setOrderDescription: function (order) {
        if (!order.GUID)
            order.Status = "";
        switch (order.Status) {
            case "New": order.StatusDescription = "Poslaná"; break;
            case "Offered": order.StatusDescription = "Ponúknutá"; break;
            case "Reserved": order.StatusDescription = "Rezervovaná"; break;
            case "Waiting": order.StatusDescription = "Pristavené"; break;
            case "Cancel": order.StatusDescription = "Zrušená"; break;
            default : order.StatusDescription = "Vybavená"; break;
        }
        //order.FormatedDate = Service.formatDate(order.OrderToDate);
    },
    removeOrder: function (id, callback) {
        var order = this.findOrder(id), self = this;
        if (order) {
            if (order.Status != "" && order.GUID)
                app.showConfirm("Chcete zrušiť objednávku?","Objednávka", function () {
                    self.callService("OrderAction", { Action: "TaxiCustomerCancelOrder", GUID_TransporterOrder: order.GUID }, function () {
                        $.each(self.orders.Items, function () {
                            self.setOrderDescription(this);
                        });
                        self.saveOrders();
                        callback();
                    });
                });
            else {
                app.showConfirm("Zmazať z histórie?", "Objednávka", function () {
                    var o = self.orders;
                    o.Items = $.grep(self.orders.Items, function (o) { return o.localId && o.localId != id; })
                    self.saveOrders();
                    callback();
                });
            }
        }
        else
            callback();
    },
    findOrder: function(id){
        var r = $.grep(this.orders.Items, function (o) { return o.localId == id; });
        if (r.length > 0)
            return r[0];
        return undefined;
    },
    updateOrder: function (order) {
        var ret = false, self = this;
        $.each(this.orders.Items, function () {
            if (this.GUID == order.GUID) {

                if (this.Status != order.StatusOrder) {
                    self.orders.IsChanged = true;
                    this.Status = order.StatusOrder;
                    if (!self.isOrderInProcess(this))
                        this.Status = "";
                    else
                        ret |= true;
                }

                //mhp spz
                this.SPZ = order.SPZ;
                this.TimeToFree = order.TimeToFree;

                if (order.Latitude && order.Longitude && (this.TaxiLatitude != order.Latitude || this.TaxiLongitude != order.Longitude))
                {
                    this.TaxiLatitude = order.Latitude;
                    this.TaxiLongitude = order.Longitude;
                    self.orders.IsChanged = true;
                }

                if (self.orders.IsChanged)
                    self.setOrderDescription(this);
            }
        });
        return ret;
    },
    sendOrder: function (order, callback, errCalback) {
        var saveOrders = false, self = this;

        order.Date = Service.parseDate(order.OrderToDate);

        if (order.IsNew)
        {
            order.IsNew = false;
            this.orders.Items.push(order);
            this.orders.Items = this.orders.Items.slice(0, 10);
        }

        this.orders.Items.sort(function (a, b) {
            if (b.Date < a.Date)
                    return -1;
            if (b.Date > a.Date)
                    return 1;
                return 0;
            });

        if (order.CustomerPhone && this.settings.userPhone != order.CustomerPhone) {
            this.settings.userPhone = order.CustomerPhone;

            if (order.CustomerName && this.settings.userName != order.CustomerName) {
                this.settings.userName = order.CustomerName;

                this.saveSettings();

            }
        }
                
        var company = this.findCompany(order.TaxiCompanyLocalId);
        order.TaxiCompany = company.GUID_sysCompany;
        order.TaxiCompanyDescription = company.Title + " " + company.Town;

        $.each(this.companies.Items, function () {
            this.selected = this.localId == company.localId;
        });

        Service.saveCompanies();

        order.Status = "New";
        order.GUID = null;

        Service.callService("order", order, function (d) {
            order.GUID = d.Id;
            self.setOrderDescription(order);
            Service.saveOrders();
            callback(d);
        }, function (d) {
            order.Status = "";
            self.setOrderDescription(order);
            Service.saveOrders();
            errCalback(d);
        });
    },
    getOrders: function () {
        if (!this.orders) {
            var s = window.localStorage.getItem("orders");
            if (s) {
                this.orders = JSON.parse(s);
                $.each(this.orders.Items, function () {

                    if (this.rateValue == undefined)
                        this.rateValue = 5;
                    if (this.rateDescription == undefined)
                        this.rateDescription = "";
                    if (this.claimDescription == undefined)
                        this.claimDescription = "";



                    if (this.Status == "") {
                        if (this.norate === undefined || this.norate === null)
                            this.norate = true;
                        if (this.noclaim === undefined || this.noclaim === null)
                            this.noclaim = true;
                    }
                    else {
                        this.norate = null;
                        this.noclaim = null;
                    }
                });
            }
            else
                this.orders = { Items: [], Current: {} };
        }
        return this.orders;
    },

    saveOrders: function () {
        window.localStorage.setItem("orders", JSON.stringify(this.orders));
        this.orders.IsChanged = false;
    },
    getDetail: function (entity, id, callback) {
        this.callService("itemmobile", { Id: entity + "_" + id }, callback, callback);
    },
    getSettings: function () {
        if (!Service.settings || !Service.settings.sessionId) {
            var s = window.localStorage.getItem("settings");
            if (s) {
                if (Service.settings)
                    Service.settings = $.extend(Service.settings, JSON.parse(s));
                else
                    Service.settings = JSON.parse(s);
            }
            else
                Service.settings = {};
        }
        if (TaxiClient) {
            Service.settings.url = TaxiClient.ServiceUrl;
        }
        return Service.settings;
    },
    saveSettings: function (data) {
        if(data)
            Service.settings = data;
        window.localStorage.setItem("settings", JSON.stringify(Service.settings));
    },
    getCompanies: function (version) {
        if (!this.companies) {
            var s = window.localStorage.getItem("companies");
            if (s) {
                this.companies = JSON.parse(s);
            }
            else
                this.companies = { Version: 0, Items: [] };

            var selectedId = "";
            if (TaxiClient.Companies && TaxiClient.Companies.Items && this.companies.Version != TaxiClient.Companies.Version) {
                
                $.each(this.companies.Items, function () {
                    if (this.selected)
                        selectedId = this.GUID_sysCompany + this.Town;
                });

                this.companies = TaxiClient.Companies;

                $.each(this.companies.Items, function () {
                    this.localId = this.GUID_sysCompany + this.Town;
                    this.selected = this.localId == selectedId;
                });

                this.saveCompanies();
            }
        }

        this.oneCompany = this.companies.Items.length < 2;

        return this.companies;
    },
    findCompany: function (id) {
        if (this.companies.Items.length == 1)
            return this.companies.Items[0];

        var r = $.grep(this.companies.Items, function (o) { return o.localId == id; });
        if (r.length > 0)
            return r[0];
        return undefined;
    },
    saveCompanies: function () {
        window.localStorage.setItem("companies", JSON.stringify(Service.companies));
    },
    callService: function (method, data, successDelegate, errorDelegate) {
        app.log("Service.callService: " + method);
        Service.connectionError = null;
        if (!this.settings.url) {
            Service.connectionError = "Chýba adresa servisu";
            if (data)
                data.ErrorMessage = Service.connectionError;
            if (errorDelegate)
                errorDelegate(data);
        }
        else {
            if (data) {
                data.UserTicket = this.settings.sessionId;
            }
            $.post(this.settings.url + "/mobileclient/" + method, data)
                .done(function (d) {
                    if (d) {
                        app.log(method + ": OK");
                        if (d.Message) {
                            app.info(d.Message);
                        }

                        if (d.ErrorMessage) {
                            app.log("Service.callService - ErrorMessage: " + d.ErrorMessage);
                            Service.connectionError = d.ErrorMessage + " " + this.url;
                            if (errorDelegate)
                                errorDelegate(d);
                            else
                                app.showAlert(d.ErrorMessage + " " + this.url, "Chyba");
                        }
                        else if (d.RefreshDataId) {
                            app.refreshData(d.RefreshDataId, function () { if (successDelegate) successDelegate(d); });
                        }
                        else if(successDelegate)
                            successDelegate(d);
                    }
                    else if (successDelegate)
                       successDelegate();
                 })
                .fail(function () {
                    app.log("Service.callService - " + Service.connectionError + ": " + this.url);
                    app.waiting(false);
                    //Service.connectionError = "Spojenie sa nepodarilo " + this.url;
                    if (errorDelegate)
                        errorDelegate({ ErrorMessage: Service.connectionError });
                    else
                        app.showAlert(Service.connectionError + ": " + this.url, "Chyba");
                });
        }
    },
    formatDate: function (d) {
            function pad(number) {
                var r = String(number);
                if (r.length === 1) {
                    r = '0' + r;
                }
                return r;
            }

        if (!d)
            return "";
        if (d.constructor === String)
            d = new Date(d);
        if (d)
            return pad(d.getDate()) + ". " + pad(d.getMonth() + 1) + ". " + d.getFullYear() + " " + pad(d.getHours()) + ":" + pad(d.getMinutes());
        return "";
    },
    getDateForNweOrder: function(){
        var coeff = 1000 * 60 * 5;
        var date = new Date();  //or use any other date
        date.setMinutes(date.getMinutes() + 3);
        return new Date(Math.round(date.getTime() / coeff) * coeff);
    },
    parseDate: function (d) {
        return new Date(parseInt(d.substring(8, 12), 10), parseInt(d.substring(4, 6), 10) - 1, parseInt(d.substring(0, 2), 10), parseInt(d.substring(13, 15), 10), parseInt(d.substring(16, 18), 10));
    },
    
    getUid: function () {
        return Math.random().toString(16).replace(".", "") + (new Date()).valueOf().toString(16);
    }
}