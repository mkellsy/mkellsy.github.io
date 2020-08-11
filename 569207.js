class Database {
    static Brands(segment, key) {
        return new Promise((resolve, reject) => {
            if (Object.keys(segment.Brands).length === 0) {
                const request = Public.API("DBF_Segment_Brands");

                request.AddParameter("SegmentID", segment.SegmentID, ECP.EC_Operator.Equals);
                request.AddParameter("Status", 1, ECP.EC_Operator.Equals);

                request.Submit().then((response) => {
                    const data = Server.parseResponse(response) || [];

                    for (let i = 0; i < data.length; i++) {
                        const { ...row } = data[i];

                        if (row.BrandID && row.BrandID !== "") {
                            segment.Brands[`Brand${row.BrandID}`] = {
                                BrandID: row.BrandID,
                                Brand: row.Brand,
                                SupplierID: parseInt(row.SupplierID_DBValue, 10),
                                BrandImage: row["Brand Logo_DBValue"] && row["Brand Logo_DBValue"] !== "" ? row["Brand Logo_DBValue"].split("|")[2] : null,
                                Style: row.Style,
                                AlcoholByVolume: row.AlcoholByVolume,
                                BrandCountry: row.BrandCountry,
                                BrandRegion: row.BrandRegion,
                                BrandDescription: row.BrandDescription_DBValue,
                                BrandStrengthIndex: parseInt(row.BrandStrengthIndex, 10)
                            };
                        }
                    }

                    resolve({
                        key,
                        data: segment.Brands
                    });
                }).catch((error) => {
                    reject(error);
                });
            } else {
                resolve({
                    key,
                    data: segment.Brands
                });
            }
        });
    }

    static TopBrands(key, start) {
        return new Promise((resolve, reject) => {
            const results = {};
            const request = Public.API("DBF_Top_Brands");

            request.AddParameter("SegmentID", "Other", ECP.EC_Operator.NotEquals);
            request.AddRequestVariable("StartRecordCount", start);

            request.Submit().then((response) => {
                const data = Server.parseResponse(response) || [];

                for (let i = 0; i < data.length; i++) {
                    const { ...row } = data[i];

                    if (row.BrandID && row.BrandID !== "") {
                        results[`Brand${row.BrandID}`] = {
                            BrandID: row.BrandID,
                            Brand: row.Brand,
                            SupplierID: parseInt(row.SupplierID_DBValue, 10),
                            BrandImage: row["Brand Logo_DBValue"] && row["Brand Logo_DBValue"] !== "" ? row["Brand Logo_DBValue"].split("|")[2] : null,
                            Style: row.Style,
                            AlcoholByVolume: row.AlcoholByVolume,
                            BrandCountry: row.BrandCountry,
                            BrandRegion: row.BrandRegion,
                            BrandDescription: row.BrandDescription_DBValue,
                            BrandStrengthIndex: parseInt(row.BrandStrengthIndex, 10)
                        };
                    }
                }

                resolve({
                    key,
                    data: results
                });
            }).catch((error) => {
                reject(error);
            });
        });
    }

    static SearchBrands(search, key) {
        const queue = [];

        return new Promise((resolve) => {
            const brands = {};
            const commands = (search || "").split("|");
            const query = [];

            let display = "";

            for (let i = 0; i < commands.length; i++) {
                const parts = commands[i].split("^");

                if (parts.length >= 2) {
                    switch (parts[0].toLowerCase()) {
                        case "k":
                        case "key":
                            query.push({
                                command: "DBF_Load_Brand",
                                field: "BrandID",
                                operator: ECP.EC_Operator.Equals,
                                value: parseInt(parts[1].replace(/brand/gi, ""), 10),
                                multiplier: 1
                            });

                            display = parts[1];
                            break;

                        case "s":
                        case "style":
                            query.push({
                                command: "Our_Products_Style_Brands",
                                field: "Style",
                                operator: ECP.EC_Operator.Equals,
                                value: parts[1],
                                multiplier: 1
                            });

                            display = parts[1];
                            break;

                        case "c":
                        case "country":
                            query.push({
                                command: "Our_Products_Country_Brands",
                                field: "BrandCountry",
                                operator: ECP.EC_Operator.Equals,
                                value: parts[1],
                                multiplier: 1
                            });

                            display = parts[1];
                            break;

                        case "r":
                        case "region":
                            query.push({
                                command: "Our_Products_Region_Brands",
                                field: "BrandRegion",
                                operator: ECP.EC_Operator.Equals,
                                value: parts[1],
                                multiplier: 1
                            });

                            display = parts[1];
                            break;

                        case "q":
                        case "query":
                            query.push({
                                command: "DBF_Search_Brands",
                                field: "Brand",
                                operator: ECP.EC_Operator.Equals,
                                value: parts[1],
                                multiplier: 10000
                            });

                            query.push({
                                command: "DBF_Search_Brands",
                                field: "Brand",
                                operator: ECP.EC_Operator.Like,
                                value: parts[1].replace(/ /gi, "*"),
                                multiplier: 1000
                            });

                            query.push({
                                command: "DBF_Search_Styles",
                                field: "Style",
                                operator: ECP.EC_Operator.Like,
                                value: parts[1].replace(/ /gi, "*"),
                                multiplier: 100
                            });

                            query.push({
                                command: "DBF_Search_Country",
                                field: "BrandCountry",
                                operator: ECP.EC_Operator.Like,
                                value: parts[1].replace(/ /gi, "*"),
                                multiplier: 10
                            });

                            query.push({
                                command: "DBF_Search_Region",
                                field: "BrandRegion",
                                operator: ECP.EC_Operator.Like,
                                value: parts[1].replace(/ /gi, "*"),
                                multiplier: 1
                            });

                            display = parts[1];
                            break;
                    }
                }
            }

            for (let i = 0; i < query.length; i++) {
                const { ...row } = query[i];
                const query_request = Public.API(row.command);

                query_request.AddParameter(row.field, row.value, row.operator);
                query_request.AddParameter("Status", 1, ECP.EC_Operator.Equals);

                queue.push(true);

                query_request.Submit().then((query_response) => {
                    const query_data = Server.parseResponse(query_response) || [];

                    for (let j = 0; j < query_data.length; j++) {
                        const { ...row_query } = query_data[j];

                        if (row_query.BrandID && row_query.BrandID !== "") {
                            const key_query = `Brand${row_query.BrandID}`;

                            if (!brands[key_query]) {
                                brands[key_query] = {
                                    BrandID: row_query.BrandID,
                                    Brand: row_query.Brand,
                                    SupplierID: parseInt(row_query.SupplierID_DBValue, 10),
                                    BrandImage: row_query["Brand Logo_DBValue"] && row_query["Brand Logo_DBValue"] !== "" ? row_query["Brand Logo_DBValue"].split("|")[2] : null,
                                    Style: row_query.Style,
                                    AlcoholByVolume: row_query.AlcoholByVolume,
                                    BrandCountry: row_query.BrandCountry,
                                    BrandRegion: row_query.BrandRegion,
                                    BrandDescription: row_query.BrandDescription_DBValue,
                                    BrandStrengthIndex: parseInt(row_query.BrandStrengthIndex, 10) * row.multiplier
                                };
                            } else if (parseInt(row_query.BrandStrengthIndex, 10) * row.multiplier > brands[key_query].BrandStrengthIndex) {
                                brands[key_query].BrandStrengthIndex = parseInt(row_query.BrandStrengthIndex, 10) * row.multiplier;
                            }
                        }
                    }
                }).finally(() => {
                    queue.pop();

                    if (queue.length === 0) {
                        const sorted = Database.SortBrands(brands);

                        Server.log(sorted);

                        resolve({
                            key,
                            display,
                            data: sorted
                        });
                    }
                });
            }

            if (queue.length === 0) {
                resolve({
                    key,
                    display,
                    data: brands
                });
            }
        });
    }

    static SortBrands(brands) {
        const keys = Object.keys(brands);

        let lookup = [];

        for (let j = 0; j < keys.length; j++) {
            lookup.push({
                key: keys[j],
                index: brands[keys[j]].BrandStrengthIndex
            });
        }

        lookup = lookup.sort((a, b) => {
            if (b.index > a.index) {
                return 1;
            }

            return (b.index < a.index) ? -1 : 0;
        });

        const sorted = {};

        for (let j = 0; j < lookup.length; j++) {
            sorted[lookup[j].key] = brands[lookup[j].key];
        }

        return sorted;
    }

    static Segments() {
        return new Promise((resolve, reject) => {
            const key = `DBF:Segments_${Distributor}`;

            if (window.localStorage && localStorage.getItem(key)) {
                const cache = Server.parseJson(localStorage.getItem(key));

                if (cache.Segments && ((new Date().getTime() - cache.CacheTime) / 1000 / 3600) < 0.5) {
                    resolve(cache.Segments);

                    return;
                }
            }

            localStorage.removeItem(key);

            const segments = {};
            const request = Public.API("DBF_Segments");

            request.Submit().then((response) => {
                const data = Server.parseResponse(response) || [];
                const sorted = [];

                for (let i = 0; i < data.length; i++) {
                    const { ...row } = data[i];

                    if (row.Segment === "Other") {
                        sorted.push({
                            SegmentID: parseInt(row.SegmentID, 10),
                            Segment: row.Segment
                        });
                    } else {
                        sorted.unshift({
                            SegmentID: parseInt(row.SegmentID, 10),
                            Segment: row.Segment
                        });
                    }
                }

                for (let i = 0; i < sorted.length; i++) {
                    const { ...row } = sorted[i];

                    segments[`Segment${row.SegmentID}`] = {
                        SegmentID: row.SegmentID,
                        Segment: row.Segment,
                        Image: null,
                        Brands: {}
                    };
                }

                localStorage.setItem(key, JSON.stringify({
                    EncompassID: "DSDLink",
                    CacheTime: (new Date()).getTime(),
                    Segments: segments
                }));

                resolve(segments);
            }).catch((error) => {
                reject(error);
            });
        });
    }
}

class Main {
    constructor(app) {
        if (window.location.href.toLowerCase().indexOf("dashboardedit") === -1) {
            this.app = app;
            this.history = new History();

            this.app.extend({
                nav: this.app.find(".svs-nav"),
                featured: this.app.find(".op-featured"),
                header: this.app.find(".svs-sections"),
                content: this.app.find(".op-content"),
                cards: this.app.find(".op-cards"),
                details: this.app.find(".op-brand"),
                map: this.app.find(".op-map").hide(),
                spinner: `
                    <div class="spinner">
                        <div class="inner">
                            <div class="grid">
                                <div></div>
                                <div></div>
                                <div></div>
                                <div></div>
                                <div></div>
                                <div></div>
                                <div></div>
                                <div></div>
                                <div></div>
                            </div>
                        </div>
                    </div>
                `
            });

            this.app.extend({
                tabs: this.app.header.find(".svs-tabs")
            });

            this.app.map.extend({
                retailer: this.app.map.find(".op-retailer"),
                display: this.app.map.find(".op-map-display")
            });

            this.app.map.retailer.extend({
                image: this.app.map.retailer.find(".op-retailer-image"),
                details: this.app.map.retailer.find(".op-retailer-details")
            });

            this.menus = {
                segment: this.app.find(".svs-menu-content").hide()
            };

            this.search = new SearchField(this.app, "op-search", (search) => {
                this.display("Search", `q^${search.replace(/|/gi, "").replace(/^/gi, "")}`);
            });

            this.data = {
                segments: {
                    data: null,
                    keys: null
                },
                search: null,
                page: 0
            };

            this.map = new DSDLinkMap(this.app.map.find(".op-map-display"), this.history, {
                back: () => {
                    this.history.load();
                    this.display("Detail", this.history.value("BrandID"));
                },
                backTitle: "Close",
                hideBrands: true
            });

            Database.Segments().then((results) => {
                this.data.segments.data = results;
                this.data.segments.keys = Object.keys(this.data.segments.data);

                let html = "";

                for (let i = 0; i < this.data.segments.keys.length; i++) {
                    const { ...segment } = this.data.segments.data[this.data.segments.keys[i]];

                    html += `<div class="svs-menu-item" action="Brands" value="${segment.SegmentID}">${segment.Segment}</div>`;
                }

                this.menus.segment.html(html);

                switch (this.history.value("Action")) {
                    case "Brands":
                        this.display(this.history.value("Action"), this.history.value("SegmentID"));
                        break;

                    case "Detail":
                        this.display(this.history.value("Action"), this.history.value("BrandID"));
                        break;

                    case "Map":
                        this.display(this.history.value("Action"), this.history.value("BrandID"), this.history.value("SupplierID"));
                        break;

                    case "Search":
                        this.display(this.history.value("Action"), this.history.encoded("Query"));
                        break;

                    default:
                        this.display(this.history.value("Action"));
                        break;
                }
            }).finally(() => {
                this.app.loader.hide();
            });

            window.addEventListener("popstate", () => {
                this.history.load();

                switch (this.history.value("Action")) {
                    case "Brands":
                        this.display(this.history.value("Action"), this.history.value("SegmentID"));
                        break;

                    case "Detail":
                        this.display(this.history.value("Action"), this.history.value("BrandID"));
                        break;

                    case "Map":
                        this.display(this.history.value("Action"), this.history.value("BrandID"), this.history.value("SupplierID"));
                        break;

                    case "Search":
                        this.display(this.history.value("Action"), this.history.encoded("Query"));
                        break;

                    default:
                        this.display(this.history.value("Action"));
                        break;
                }
            });

            if (EC_Fmt.isMobile) {
                $("#Dashboard").css({
                    width: `${$("#Content").width()}px`
                });

                $(window).on("resize", () => {
                    $("#Dashboard").css({
                        width: `${$("#Content").width()}px`
                    });

                    const target = this.search.display.parent();
                    const position = target.position();

                    this.search.menu.css({
                        top: `${position.top}px`,
                        left: `${position.left}px`,
                        width: `${target.outerWidth() - 1}px`
                    });
                });
            }

            this.app.off("click touchstart touchmove touchend");

            this.app.on("click", () => {
                this.app.tabs.find(".svs-menu-on").removeClass("svs-menu-on");
                this.menus.segment.hide();
            }).on("click", ".svs-menu", (e) => {
                e.stopPropagation();

                const trigger = $(e.currentTarget).removeClass("svs-menu-on");

                this.menus.segment.toggle();

                if (this.menus.segment.is(":visible")) {
                    trigger.addClass("svs-menu-on");
                }
            }).on("click", ".svs-tab, .op-card, .svs-menu-item, .op-action-link", (e) => {
                const trigger = $(e.currentTarget);

                this.display(trigger.attr("action"), trigger.attr("value"), trigger.attr("secondary"));
            }).on("touchstart touchmove touchend", (event) => {
                event.stopPropagation();

                if (event.originalEvent.touches.length > 1) {
                    event.preventDefault();
                    return false;
                }

                return true;
            });

            this.app.content.off("click");

            this.app.content.on("click", ".op-search-link", (e) => {
                e.stopPropagation();

                const trigger = $(e.currentTarget);

                switch (trigger.attr("type")) {
                    case "style":
                        this.display("Search", `s^${trigger.html().replace(/|/gi, "").replace(/^/gi, "")}`);
                        break;

                    case "country":
                        this.display("Search", `c^${trigger.html().replace(/|/gi, "").replace(/^/gi, "")}`);
                        break;

                    case "region":
                        this.display("Search", `r^${trigger.html().replace(/|/gi, "").replace(/^/gi, "")}`);
                        break;
                }

                return false;
            });
        }
    }

    display(action, value, secondary) {
        this.app.nav.show();
        this.app.header.show();

        this.app.details.hide();
        this.app.content.show();

        this.app.map.hide();

        this.app.content.off("scroll");
        this.app.tabs.find(".svs-active-tab").removeClass("svs-active-tab");
        this.app.featured.html("").hide();

        this.search.hide = true;
        this.search.resetSearch();

        this.key = new Date().getTime() + Math.random();

        switch (action) {
            case "Map":
                this.history.value("Action", action);
                this.history.value("BrandID", value);
                this.history.value("SupplierID", secondary);

                this.app.content.hide();
                this.app.header.hide();
                this.app.nav.hide();
                this.app.map.show();

                this.resetSearch();
                this.map.displayMap();
                break;

            case "Brands":
                this.app.content[0].scrollTo(0, 0);

                this.history.value("Action", action);
                this.history.value("SegmentID", value);
                this.history.value("BrandID", null);
                this.history.value("SupplierID", null);
                this.history.encoded("Query", null);

                this.data.search = null;
                this.search.setState("");
                this.app.cards.show().html("");

                this.displayBrands(this.data.segments.data[`Segment${this.history.value("SegmentID")}`]);
                break;

            case "Detail":
                this.app.content[0].scrollTo(0, 0);

                this.history.value("Action", action);
                this.history.value("BrandID", value);
                this.history.value("SupplierID", null);

                this.app.cards.hide();
                this.app.loader.hide();
                this.app.featured.show();
                this.app.featured.css("display", "flex");

                this.resetSearch();

                this.getBrandObject((brand, key) => {
                    this.displayBrand(brand, key);
                });

                break;

            case "Search":
                this.app.content[0].scrollTo(0, 0);

                this.history.value("Action", action);
                this.history.value("SegmentID", null);
                this.history.value("BrandID", null);
                this.history.value("SupplierID", null);
                this.history.encoded("Query", value);

                this.app.cards.show().html("");
                this.displaySearch(this.history.encoded("Query"));

                break;

            default:
                this.app.content[0].scrollTo(0, 0);

                this.history.value("Action", null);
                this.history.value("SegmentID", null);
                this.history.value("BrandID", null);
                this.history.value("SupplierID", null);
                this.history.encoded("Query", null);

                this.data.page = 0;
                this.data.search = null;
                this.search.setState("");
                this.app.cards.show().html("");
                this.app.tabs.find(".svs-tab[action='Top']").addClass("svs-active-tab");

                this.displayTopBrands();

                this.app.content.on("scroll", () => {
                    if (
                        (Math.round(this.app.content[0].scrollTop) + Math.round(this.app.content[0].offsetHeight) === this.app.content[0].scrollHeight)
                     || (Math.ceil(this.app.content[0].scrollTop) + Math.ceil(this.app.content[0].offsetHeight) === this.app.content[0].scrollHeight)
                    ) {
                        this.displayTopBrands();
                    }
                });

                break;
        }
    }

    getBrandObject(callback) {
        if (this.history.value("SegmentID") && this.history.value("SegmentID") !== "") {
            Server.log("Load from Segment");

            Database.Brands(this.data.segments.data[`Segment${this.history.value("SegmentID")}`], this.key).then((results) => {
                if (results.key === this.key) {
                    callback(this.data.segments.data[`Segment${this.history.value("SegmentID")}`].Brands[`Brand${this.history.value("BrandID")}`], this.key);
                }
            });
        } else if (this.data.search) {
            Server.log("Load from Search");

            callback(this.data.search[`Brand${this.history.value("BrandID")}`], this.key);
        } else if (this.history.encoded("Query") || "" !== "") {
            Server.log("Execute Search and Load from Search");

            Database.SearchBrands(this.history.encoded("Query"), this.key).then((results) => {
                if (results.key === this.key) {
                    this.data.search = results.data;

                    callback(this.data.search[`Brand${this.history.value("BrandID")}`], this.key);
                }
            });
        } else if (this.history.value("BrandID") && this.history.value("BrandID") !== "") {
            Server.log(`Load from Brand ID ${this.history.value("BrandID")}`);

            Database.SearchBrands(`key^${this.history.value("BrandID")}`, this.key).then((results) => {
                if (results.key === this.key) {
                    this.data.search = results.data;

                    callback(this.data.search[`Brand${this.history.value("BrandID")}`], this.key);
                }
            });
        } else {
            Server.log("Load from Top Brands");

            Database.TopBrands(this.key).then((results) => {
                if (results.key === this.key) {
                    this.data.search = results.data;

                    callback(this.data.search[`Brand${this.history.value("BrandID")}`], this.key);
                }
            });
        }
    }

    displayCards(brands, action, empty, append) {
        const keys = Object.keys(brands);

        if (append) {
            this.data.search = this.data.search || {};

            if (Object.keys(this.data.search).length === 0) {
                append = false;
            }

            Object.assign(this.data.search, brands);
        }

        this.app.cards.css("height", "unset");

        if (!append) {
            this.app.cards.html("");
        }

        if (keys.length > 0) {
            for (let i = 0; i < keys.length; i++) {
                const { ...brand } = brands[keys[i]];

                this.app.cards.append(`
                    <div class="op-card op-brand-card" action="${action}" value="${brand.BrandID}">
                        <div class="op-brand-image" style="background-image: url('${brand.BrandImage || "https://images.encompass8.com/GlobalDocs/124290.png"}');"></div>
                        <div class="op-card-body">
                            <h4 class="op-title" title="${brand.Brand}">
                                ${brand.Brand}
                            </h4>
                            <p class="op-region">
                                ${brand.BrandRegion}
                            </p>
                            <p class="aps-country">
                                ${brand.BrandCountry}
                            </p>
                        </div>
                    </div>
                `);
            }
        } else if (!append) {
            this.app.cards.html(`
                <div class="svs-empty">
                    <span>${empty}</span>
                </div>
            `);
        }
    }

    displayTopBrands() {
        if (Object.keys(this.data.search || {}).length > 0) {
            this.app.loader.snack.show();
        } else {
            this.app.cards.css("height", "100%");
            this.app.cards.html(this.app.spinner);
        }

        Database.TopBrands(this.key, this.data.page * 24).then((results) => {
            if (this.history.value("Action") || "" === "" && results.key === this.key) {
                this.displayCards(results.data, "Detail", "No Results", true);
                this.data.page += 1;

                if (this.app.cards[0].scrollHeight <= this.app.content[0].clientHeight) {
                    this.displayTopBrands();
                }
            }
        }).finally(() => {
            this.app.loader.hide();
        });
    }

    displayBrands(segment) {
        this.app.cards.css("height", "100%");
        this.app.cards.html(this.app.spinner);

        Database.Brands(segment, this.key).then((results) => {
            if (this.history.value("Action") === "Brands" && results.key === this.key) {
                this.displayCards(segment.Brands, "Detail", "This Segment Has No Brands");
            }
        }).finally(() => {
            this.app.loader.hide();
        });
    }

    displayBrand(brand, key) {
        if (this.history.value("Action") === "Detail" && key === this.key) {
            this.app.loader.hide();
            this.app.details.show();

            let terms = [];

            if (brand && brand.Brand) {
                const brandSearch = (brand.Brand).replace("&", "%26");

                terms = terms.concat(brandSearch.split(" "));
            }

            if (brand && brand.Style) {
                terms = terms.concat(brand.Style.split(" "));
            }

            this.app.details.find("#op-brand-manager, #op-edit-brand").attr("href", "").hide();
            this.app.details.find("#op-location").html("");
            this.app.details.find("#op-style").html("");

            this.app.featured.html(brand.Brand);

            if (UserType.startsWith("Employee")) {
                this.app.details.find("#op-brand-manager").attr("href", `Home.aspx?DashboardID=164072&BrandKeyValue=${brand.BrandID}&TableName=Brands`).show();
                this.app.details.find("#op-edit-brand").attr("href", `TableEdit.aspx?Action=Edit&TableEdit=Brands&KeyValue=${brand.BrandID}&CurValue=${brand.BrandID}&TableName=Brands`).show();
            }

            if (brand.BrandImage && brand.BrandImage !== "") {
                this.app.details.find("#op-brand-image").html(`<img async class="op-brand-img" src="${brand.BrandImage}">`).show();
            } else {
                this.app.details.find("#op-brand-image").hide();
            }

            let location = "";

            if (brand.BrandRegion) {
                if (location !== "") {
                    location += "&nbsp;&nbsp;|&nbsp;&nbsp;";
                }

                location += `<span class="op-search-link" type="region">${brand.BrandRegion}</span>`;
            }

            if (brand.BrandCountry) {
                if (location !== "") {
                    location += "&nbsp;&nbsp;|&nbsp;&nbsp;";
                }

                location += `<span class="op-search-link" type="country">${brand.BrandCountry}</span>`;
            }

            if (location !== "") {
                this.app.details.find("#op-location").html(`<span class="op-icon ews-icon-location"></span> ${location}`);
            }

            let style = "";

            if (brand.Style) {
                if (style !== "") {
                    style += "&nbsp;&nbsp;|&nbsp;&nbsp;";
                }

                style += `<span class="op-search-link" type="style">${brand.Style}</span>`;
            }

            if (brand.AlcoholByVolume && brand.AlcoholByVolume !== "0.00%" && brand.AlcoholByVolume !== "0.0%" && brand.AlcoholByVolume !== "0%") {
                if (style !== "") {
                    style += "&nbsp;&nbsp;|&nbsp;&nbsp;";
                }

                style += `ABV ${brand.AlcoholByVolume}`;
            }

            if (style !== "") {
                this.app.details.find("#op-style").html(style);
            }

            this.app.details.find("#op-description").text(brand.BrandDescription && brand.BrandDescription !== "" ? brand.BrandDescription : "No brand description available.");
            this.app.details.find("#op-where-to-buy").attr("value", brand.BrandID).attr("secondary", brand.SupplierID);

            Server.log(terms);

            this.app.details.find("#op-google-search").attr("href", `https://www.google.com/search?q=${[...new Set(terms)].join("+")}`);
        }
    }

    displaySearch(search) {
        this.app.cards.css("height", "100%");
        this.app.cards.html(this.app.spinner);

        Database.SearchBrands(search, this.key).then((results) => {
            if (this.history.value("Action") === "Search" && results.key === this.key) {
                this.search.setState(results.display);
                this.data.search = results.data;

                this.displayCards(this.data.search, "Detail", "No Results");
            }
        }).finally(() => {
            this.app.loader.hide();
        });
    }

    resetSearch() {
        let search = this.history.encoded("Query");

        if (search && search !== "") {
            search = (search || "").split("|")[0].split("^");

            if (search.length > 0) {
                search = search[search.length - 1];
            } else {
                search = null;
            }

            this.search.setState(search);
        }
    }
}
