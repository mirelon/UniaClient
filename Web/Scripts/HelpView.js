var HelpView = function (store) {
    this.helpContent = $;
    this.index = 4;
    this.initialize = function () {
        this.el = $('<div/>');
        var header = $('<div class="header"><button data-route="orders" class="icon ico_back">&nbsp;</button></div>').appendTo(this.el);
        this.helpContent = $('<div id="helpcontent" />').addClass("scrollBottom").appendTo(this.el);
        //$('<div/>').append(this.helpContent).appendTo(this.el);
    };

    this.render = function () {
        var self = this;
        jQuery.get('apphelp.html', function (data) {

            self.helpContent.html(data);

            if (self.iscroll)
                self.iscroll.refresh();
            else
                self.iscroll = new iScroll(self.helpContent[0], { hScrollbar: false, vScrollbar: false });

        });
        return this;
    };

    this.onShow = function () {
        
    }

    this.initialize();


}

