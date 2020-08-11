class DSDLink {
    constructor(app, initilize, refresh) {
        if (window.location.href.toLowerCase().indexOf("dashboardedit") === -1) {
            this.app = app;

            this.app.extend({
                content: this.app.find(".content"),
                queue: this.app.find("#queue"),
                dialog: this.app.find(".svs-dialog").hide(),
                console: this.app.find(".debug").hide(),
            });

            this.app.extend({
                form: this.app.content.find("#form"),
                layout: this.app.content.find("#layout")
            });

            this.app.extend({
                search: this.app.form.find("#search"),
                data: this.app.layout.find("#data"),
                details: this.app.layout.find("#details").hide()
            });

            this.app.extend({
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

            this.app.dialog.extend({
                open: (html) => {
                    const content = this.app.dialog.find(".svs-dialog-inner");

                    content.html(html);
                    content.off("click");

                    this.app.dialog.show();
                },

                close: () => {
                    const content = this.app.dialog.find(".svs-dialog-inner");

                    content.html("");
                    content.off("click");

                    this.app.dialog.hide();
                },

                action: (selector, callback) => {
                    const content = this.app.dialog.find(".svs-dialog-inner");

                    content.on("click", selector, callback);
                }
            });

            this.app.extend({
                alert: (message) => {
                    this.app.dialog.open(`
                        <div class="svs-dialog-title">Message</div>
                        <div class="svs-dialog-content">
                            <div class="alert-message">${message}</div>
                        </div>
                        <div class="svs-dialog-actions">
                            <div id="alert-close" class="svs-button svs-button-primary">OK</div>
                        </div>
                    `);

                    this.app.dialog.action("#alert-close", () => {
                        this.app.dialog.close();
                    });
                }
            });

            this.app.console.extend({
                log: (data) => {
                    if (window.debug) {
                        Server.log(data);

                        this.app.console.find("#data").text(JSON.stringify(data, null, 4));
                        this.app.console.show();
                    }
                }
            });

            this.state = DSDLink.readState();

            (async () => {
                this.app.data.html(this.app.spinner);

                this.distributors = await DSDLink.Distributors();

                Server.log(this.distributors);

                ARGS.EDBLSourceID = parseInt(this.state.EDBLSourceID, 10);
                ARGS.Query = this.state.Query;

                if (Number.isNaN(ARGS.EDBLSourceID)) {
                    ARGS.EDBLSourceID = null;
                }

                initilize(this);
            })();

            window.addEventListener("popstate", () => {
                this.state = DSDLink.readState();

                ARGS.EDBLSourceID = parseInt(this.state.EDBLSourceID, 10);
                ARGS.Query = this.state.Query;

                if (Number.isNaN(ARGS.EDBLSourceID)) {
                    ARGS.EDBLSourceID = null;
                }

                if (refresh) {
                    refresh(this);
                }
            });

            this.app.console.on("click", ".close", () => {
                this.app.console.hide();
            });
        }
    }

    static Distributors() {
        return new Promise((resolve) => {
            const key = btoa("DDT:AllDistributors");

            let results = DSDLink.getCache(key);

            if (!results) {
                const sources = {};
                const request = Server.createRequest("DBI_All_Supplier_Vendors");

                request.Submit().then((response) => {
                    const data = Server.parseResponse(response) || [];

                    for (let i = 0; i < data.length; i++) {
                        const { ...row } = data[i];

                        if (!sources[row.EDBLSource]) {
                            sources[row.EDBLSource] = {
                                EDBLSourceID: parseInt(row.EDBLSourceID, 10),
                                EDBLSource: row.EDBLSource,
                                Locations: []
                            };
                        }

                        sources[row.EDBLSource].Locations.push({
                            LocationID: parseInt(row.LocationID, 10),
                            DBA: row.DBA,
                            DistributorNum: row.DistributorNum,
                            Address: row.Address,
                            City: row.City,
                            State: row.State,
                            PostalCode: row.PostalCode,
                            Phone: row.Phone,
                            Contact: row.Contact,
                            Email: row.Email,
                            ServerURL: row.ServerURL
                        });
                    }
                }).finally(() => {
                    const results = [];
                    const keys = Object.keys(sources);

                    keys.sort();

                    for (let i = 0; i < keys.length; i++) {
                        results.push(sources[keys[i]]);
                    }

                    DSDLink.setCache(key, results, 1000 * 60 * 60 * 12);

                    resolve(results); 
                }).catch((error) => {
                    Server.log(error);
                });
            } else {
                resolve(results);
            }
        });
    }

    static SendQueue() {
        return new Promise((resolve) => {
            const request = new ECP.EC_TableView("ZZ_SRSResendQueue");

            request.AddColumn("ZZ_SRSResendQueueID");
            request.AddColumn("ZZ_SRSResendQueue_EDBLSources^EDBLSources.EDBLSource");
            request.AddColumn("ReportType");
            request.AddColumn("SupplierReportCode");
            request.AddColumn("Status");
            request.AddColumn("Date");
            request.AddColumn("Date_1");
            request.AddColumn("FileType");

            request.SetFormat("JSON");
            request.SetMaxRecords(100);
            request.AddSelectSort("TimeCreated", ECP.EC_SortOrder.Asc);
            request.AddFilter("Status", "1^2", ECP.EC_Operator.Equals);

            const results = [];

            request.GetResults().then((response) => {
                const data = Server.parseResponse(response) || [];

                for (let i = 0; i < data.length; i++) {
                    const { ...row } = data[i];

                    results.push({
                        QueueID: parseInt(row.ZZ_SRSResendQueueID_DBValue, 10),
                        EDBLSource: row["ZZ_SRSResendQueue_EDBLSources^EDBLSources.EDBLSource"],
                        ReportType: row.ReportType,
                        ReportCodes: (row.SupplierReportCode || "").split(","),
                        Status: row.Status,
                        StartDate: row.Date && row.Date !== "" ? new Date(row.Date) : null,
                        EndDate: row.Date_1 && row.Date_1 !== "" ? new Date(row.Date_1) : null,
                        FileType: row.FileType
                    });
                }
            }).finally(() => {
                resolve(results);
            }).catch((error) => {
                Server.log(error);
            });
        });
    }

    static readState() {
        const parms = window.location.href.split("?").pop().split("&");
        const results = {};

        for (let i = 0; i < parms.length; i++) {
            const keyValue = parms[i].split("=");

            results[keyValue[0]] = keyValue[1];
        }

        return results;
    }

    static logState() {
        const current = window.location.href.split("/").pop();
        const keys = Object.keys(ARGS);
        const params = [];

        params.push(`DashboardID=${Settings.DashboardID}`);

        for (let i = 0; i < keys.length; i++) {
            if ((ARGS[keys[i]] || "") !== "" && (ARGS[keys[i]] || "") !== "NaN") {
                params.push(`${keys[i]}=${ARGS[keys[i]]}`);
            }
        }

        if (window.debug) {
            params.push("Debug=True");
        }

        if (current !== `Home?${params.join("&")}`) {
            window.history.pushState(ARGS, "Distributors", `Home?${params.join("&")}`);
        }

        DSDLink.tabsState();
    }

    static tabsState() {
        $(".MainLayoutTabs a").each((index, element) => {
            const url = $(element).attr("href");

            if (url && (url.split("?")[0] || "").toLowerCase() === "home") {
                const params = url.split("?").pop().split("&").filter(p => (p.split("=")[0] || "").toLowerCase() !== "edblsourceid" && (p.split("=")[0] || "").toLowerCase() !== "debug");

                if ((ARGS.EDBLSourceID || "") !== "" && (ARGS.EDBLSourceID || "") !== "NaN") {
                    params.push(`EDBLSourceID=${ARGS.EDBLSourceID}`);
                }

                if (window.debug) {
                    params.push("Debug=True");
                }

                $(element).attr("href", `Home?${params.join("&")}`);
            }
        });
    }

    static setCache(key, value, ttl) {
        const now = new Date()
        
        const item = {
            value: value,
            expiry: now.getTime() + ttl
        }

        localStorage.setItem(key, JSON.stringify(item));
    }

    static getCache(key) {
        const itemStr = localStorage.getItem(key)

        if (!itemStr) {
            return null;
        }

        const item = JSON.parse(itemStr);
        const now = new Date();

        if (now.getTime() > item.expiry) {
            localStorage.removeItem(key);

            return null;
        }

        return item.value;
    }

    static right(value, number) {
        value = value || "";

        if (number >= value.length) {
            return value;
        }

        return value.substring(value.length - number, value.length);
    }

    static formatDate(date, display) {
        date = EC_Fmt.ToDate(date);

        if (display) {
            return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
        }

        return `${date.getFullYear()}-${DSDLink.right(`0${(date.getMonth() + 1)}`, 2)}-${DSDLink.right(`0${date.getDate()}`, 2)}`;
    }

    queueHeartbeat() {
        this.updateQueue();

        setTimeout(() => {
            this.updateQueue();
        }, 1000 * 60 * 3);
    }

    async updateQueue() {
        const queue = await DSDLink.SendQueue();

        Server.log(queue);

        let html = "";

        /*
        {
            QueueID,
            EDBLSource,
            ReportType,
            ReportCodes,
            Status,
            StartDate,
            EndDate,
            FileType
        }
        */

        for (let i = 0; i < Math.min(queue.length, 100); i++) {
            const { ...row } = queue[i];

            let dates = "";

            if (row.StartDate && row.EndDate) {
                dates = `${DSDLink.formatDate(row.StartDate, true)} - ${DSDLink.formatDate(row.EndDate, true)}`;
            } else if (row.StartDate) {
                dates = `${DSDLink.formatDate(row.StartDate, true)} Forward`;
            } else {
                dates = "All Dates";
            }

            html += `
                <tr value=${row.QueueID}>
                    <td>
                        <h2>${row.EDBLSource}</h2>
                        <h3>${row.ReportType}</h3>
                        <h3>${row.ReportCodes.join(", ")}</h3>
                        <span class="queue-details">${row.FileType} ${dates}</span>
                        <span class="queue-status">${row.Status}</span>
                    </td>
                </tr>
            `;
        }

        if (html !== "") {
            this.app.queue.html(`
                <table class="queue-table" cellspacing="0">
                    <tbody>${html}</tbody>
                </table>
            `);
        } else {
            this.app.queue.html("<div class=\"queue-empty\">No Pending Requests</div>");
        }
    }

    display(callback, onsearch, query) {
        if (query === undefined) {
            query = ARGS.Query;
        }

        this.search(query);

        const current = this.distributors.filter(row => row.EDBLSourceID === ARGS.EDBLSourceID)[0];

        if (current) {
            callback(current);
        }

        this.app.form.off("submit");

        this.app.form.on("submit", (event) => {
            event.preventDefault();

            ARGS.EDBLSourceID = null;

            if (onsearch) {
                onsearch();
            }

            this.display(callback, onsearch, this.app.search.val() || "");

            DSDLink.logState();
        });

        this.app.data.off("click");

        this.app.data.on("click", ".show-distributor", (event) => {
            const target = parseInt($(event.currentTarget).attr("value"), 10);
            const next = this.distributors.filter(row => row.EDBLSourceID === target)[0];

            if (next) {
                ARGS.EDBLSourceID = next.EDBLSourceID;

                callback(next);

                DSDLink.logState();
            }
        });
    }

    search(query) {
        ARGS.Query = query;

        query = (query || "").toString().toUpperCase();

        this.app.data.show();
        this.app.details.hide();
        this.app.data.removeClass("data-left");
        this.app.data.html(this.app.spinner);

        this.filtered = this.distributors.filter((item) => {
            if (query.length < 2) {
                return true;
            }

            if (
                item.EDBLSourceID === parseInt(query, 10) || item.EDBLSource.toUpperCase().indexOf(query) >= 0 || item.Locations.findIndex((loc) => {
                    if (
                        (loc.DBA || "").toUpperCase().indexOf(query) >= 0
                        || (loc.City || "").toUpperCase().indexOf(query) >= 0
                        || (loc.State || "").toUpperCase().indexOf(query) >= 0
                        || (loc.DistributorNum || "").toUpperCase() === (query || "NULL").toUpperCase()
                    ) {
                        return true;
                    }

                    return false;
                }) >= 0
            ) {
                return true;
            }

            return false;
        });

        Server.log(this.filtered);

        let html = "";

        /*
        {
            EDBLSourceID,
            EDBLSource,
            Location: [{
                DBA,
                Address,
                City,
                State,
                PostalCode,
                Phone,
                Contact,
                Email,
                ServerURL
            }]
        }
        */

        for (let i = 0; i < Math.min(this.filtered.length, 500); i++) {
            const { ...row } = this.filtered[i];
            const numbers = ([...new Set(row.Locations.filter(loc => loc.DistributorNum && loc.DistributorNum !== "").map(loc => loc.DistributorNum))]);
            const names = ([...new Set(row.Locations.map(loc => loc.DBA))]);
            const locations = ([...new Set(row.Locations.map(loc => `${loc.City}, ${loc.State}`))]);

            html += `
                <tr class="show-distributor" value="${row.EDBLSourceID}">
                    <td>${row.EDBLSource}</td>
                    <td class="svs-em-cell left-compact">${numbers.slice(0, 5).join("<br>")}${numbers.length > 5 ? "<br><span class=\"text-dim\">...</span>" : ""}</td>
                    <td class="left-compact-hide">${names.slice(0, 5).join("<br>")}${names.length > 5 ? "<br><span class=\"text-dim\">...</span>" : ""}</td>
                    <td class="left-compact-hide">${locations.slice(0, 5).join("<br>")}${locations.length > 5 ? "<br><span class=\"text-dim\">...</span>" : ""}</td>
                </tr>
            `;
        }

        if (html !== "") {
            this.app.data.html(`
                <table class="svs-table" cellspacing="0">
                    <thead class="svs-mobile-hide">
                        <tr>
                            <th></th>
                            <th>Number</th>
                            <th class="data-press left-compact-hide">Distributor</th>
                            <th class="data-press left-compact-hide">Location</th>
                        </tr>
                    </thead>

                    <tbody class="data-body">
                        ${html}
                    </tbody>
                </table>
            `);
        } else {
            this.app.data.html(`
                <div class="empty">
                    <div class="message">
                        No results.
                    </div>
                </div>
            `);
        }

        this.app.data[0].scrollTo(0, 0);
    }
}
