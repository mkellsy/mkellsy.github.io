class SearchField {
    constructor(app, name, callback) {
        this.name = name;
        this.app = $(app);
        this.hide = true;

        if (this.app.find(".svs-search-history").length > 0) {
            this.app.find(".svs-search-history").remove();
        }

        if (this.app.find(".svs-search-display").length > 0) {
            this.layout = this.app.find(".svs-search-display");
            this.display = this.layout.find("input[type='text']");
        } else {
            this.layout = $("<div class=\"svs-search-display\"><i class=\"ews-icon-search\"></i></div>");
            this.display = $("<input type=\"text\" placeholder=\"Search\" value=\"\">");

            this.app.find(`#${this.name}`).replaceWith(this.layout);
            this.layout.append(this.display);
        }

        this.menu = $("<div class=\"svs-search-history\"></div>");
        this.container = $("<div class=\"svs-search-input\"><i class=\"ews-icon-search\"></i></div>");
        this.input = $(`<input type="search" id="${this.name}" placeholder="Search" value="">`);
        this.list = $("<div class=\"svs-search-list\"></div>");

        this.app.append(this.menu);
        this.menu.append(this.container);
        this.menu.append(this.list);
        this.container.append(this.input);

        this.history = Server.getCookie(`${this.name}-history`);

        if (!Array.isArray(this.history)) {
            this.history = [];
        }

        this.layout.removeClass("svs-search-input-on").removeClass("svs-search-input-off");

        $(window).unbind("resize");

        $(window).on("resize", () => {
            const $target = this.display.parent();
            const $position = $target.position();

            this.menu.css({
                top: `${$position.top}px`,
                left: `${$position.left}px`,
                width: `${$target.outerWidth() - 1}px`
            });
        });

        this.input.unbind("blur keypress keyup");

        this.input.on("blur", () => {
            this.resetSearch();
        }).on("keypress", (event) => {
            const search = this.input.val();

            if (event.which === 13 && search !== "") {
                this.recordSearchHistory(search.toLowerCase());

                if (callback) {
                    callback(search.toLowerCase());
                }
            }
        }).on("keyup", () => {
            window.setTimeout(() => {
                this.display.val(this.input.val().toLowerCase());

                if (this.display.val() !== "") {
                    this.layout.addClass("svs-search-input-on");
                } else {
                    this.layout.removeClass("svs-search-input-on");
                }
            }, 10);
        });

        this.display.unbind("focus keydown");

        this.display.on("focus", (event) => {
            event.stopPropagation();

            $(event.currentTarget).blur();

            const $position = this.layout.position();

            this.menu.css({
                top: `${$position.top}px`,
                left: `${$position.left}px`,
                width: `${this.layout.outerWidth()}px`
            }).show();

            this.displaySearchHistory();

            this.layout.addClass("svs-search-input-off");
            this.input.focus();

            setTimeout(() => {
                this.input.focus();
            }, 100);
        }).on("keydown", () => false);

        this.menu.unbind("mouseenter mouseleave click");

        this.menu.on("mouseenter", (event) => {
            this.hide = false;
        }).on("mouseleave", (event) => {
            this.hide = true;
        }).on("click", ".svs-search-list-item", (event) => {
            this.hide = true;

            const $target = $(event.currentTarget);
            const search = Data.htmlDecode($target.find(".svs-search-value").html());

            if (search !== "") {
                this.input.val(search);
                this.display.val(search);

                this.recordSearchHistory(search);

                if (callback) {
                    callback(search.toLowerCase());
                }
            }

            this.resetSearch();
        });
    }

    displaySearchHistory() {
        this.list.html("").hide();

        if (this.history.length > 0) {
            for (let i = 0; i < this.history.length; i++) {
                this.list.append(`<div class="svs-search-list-item"><div class="svs-history"></div><span class="svs-search-value">${this.history[i]}</span></div>`);
            }

            this.list.show();
        }
    }

    recordSearchHistory(search) {
        const index = this.history.indexOf(search);

        if (index >= 0) {
            this.history.splice(index, 1);
        }

        this.history.unshift(search);

        while (this.history.length > 7) {
            this.history.pop();
        }

        Server.setCookie(`${this.name}-history`, this.history, 180);
    }

    resetSearch() {
        if (this.hide) {
            this.menu.hide();
            this.layout.removeClass("svs-search-input-off");
        }

        this.hide = true;
    }

    setState(value) {
        if (value && value !== "") {
            this.input.val(value);
            this.display.val(value);
            this.layout.addClass("svs-search-input-on");
        } else {
            this.input.val("");
            this.display.val("");
            this.layout.removeClass("svs-search-input-on");
        }
    }
}
