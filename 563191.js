class Database {
    static SupplierReports(suppliers, source) {
        return new Promise((resolve) => {
            const results = [];
            const request = Public.API("DBI_Get_Supplier_Reports", source);

            request.AddParameter("SupplierID", suppliers.map(s => s.SupplierID).join("^"), ECP.EC_Operator.Equals);

            request.Submit().then((response) => {
                const data = Server.parseResponse(response) || [];

                for (let i = 0; i < data.length; i++) {
                    const { ...row } = data[i];

                    results.push({
                        ReportType: row.ReportType,
                        Location: row.Location,
                        Supplier: row.Supplier,
                        DistributorNum: row.DistributorNum,
                        LastSent: row.LastSent && row.LastSent !== "" ? new Date(row.LastSent) : null
                    });
                }
            }).finally(() => {
                resolve(results);
            }).catch((error) => {
                Server.log(error);
            });
        });
    }

    static TransmissionLog(reports, source) {
        return new Promise((resolve) => {
            const results = [];
            const request = Public.API("DBI_Get_Transmission_Log", source);

            request.AddParameter("ReportType", ([...new Set(reports.map(rep => rep.ReportType))]).join("^"), ECP.EC_Operator.Equals);

            request.Submit().then((response) => {
                const data = Server.parseResponse(response) || [];

                /*
                {
                    TimeCreated,
                    ReportType,
                    Status,
                    File,
                    Memo
                }
                */

                for (let i = 0; i < data.length; i++) {
                    const { ...row } = data[i];
                    const link = $(row.File);

                    results.push({
                        TimeCreated: new Date(row.TimeCreated),
                        ReportType: row.ReportType,
                        Status: (row.Status || "").replace(/(<([^>]+)>)/ig, ""),
                        File: link.html(),
                        Download: link.attr("href"),
                        Memo: row.Memo
                    });
                }
            }).finally(() => {
                resolve(results);
            }).catch((error) => {
                Server.log(error);
            });
        });
    }

    static Distributors(suppliers) {
        suppliers = suppliers || [];

        return new Promise((resolve) => {
            const key = btoa(`DBI:Distributors:${suppliers.map(s => s.SupplierID).join("^")}`);

            let results = DSDLink.getCache(key);

            if (!results) {
                const sources = {};
                const request = Server.createRequest("DBI_Supplier_Vendors");

                request.AddParameter("SupplierID", suppliers.map(s => s.SupplierID).join("^"), ECP.EC_Operator.Equals);

                request.Submit().then((response) => {
                    const data = Server.parseResponse(response) || [];

                    /*
                    {
                        LocationID,
                        EDBLSourceID,
                        EDBLSource,
                        DistributorNum,
                        DBA,
                        Address,
                        City,
                        State,
                        PostalCode,
                        Phone,
                        Contact,
                        Email,
                        ServerURL
                    }
                    */

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
                    results = [];

                    const keys = Object.keys(sources);

                    keys.sort();

                    for (let i = 0; i < keys.length; i++) {
                        results.push(sources[keys[i]]);
                    }

                    if (results.length > 0) {
                        DSDLink.setCache(key, results, 1000 * 60 * 30);
                    }

                    resolve(results);
                }).catch((error) => {
                    Server.log(error);
                });
            } else {
                resolve(results);
            }
        });
    }

    static LookupCustomer(source) {
        return new Promise((resolve) => {
            const result = {};
            const request = Public.API("DBI_Lookup_Customer", "Support");

            request.AddParameter("ShortName", source, ECP.EC_Operator.Equals);

            request.Submit().then((response) => {
                const data = (Server.parseResponse(response) || [])[0] || {};

                result.CustomerID = data.CustomerID && data.CustomerID !== "" ? parseInt(data.CustomerID, 10) : null;
                result.Company = data.Company;
            }).finally(() => {
                resolve(result);
            }).catch((error) => {
                Server.log(error);
            });
        });
    }

    static UserDetails() {
        return new Promise((resolve) => {
            const request = Public.API("DBI_Lookup_Authentication", "DSDLink");

            request.AddParameter("AuthenticationID", AuthenticationID, ECP.EC_Operator.Equals);

            let result = {
                UserID,
                AuthenticationID
            };

            request.Submit().then((response) => {
                const record = (Server.parseResponse(response) || [])[0] || {};

                result = {
                    UserID,
                    AuthenticationID,
                    Name: record.Name,
                    Email: record.Email
                };
            }).finally(() => {
                resolve(result);
            }).catch((error) => {
                Server.log(error);
            });
        });
    }

    static async Sales(report, source, suppliers) {
        Server.log(suppliers);

        const year = new Date().getFullYear();
        const request = new ECP.EC_Request(`DBI_Distributor_Sales_${report}`);

        request.AddParameter("EDBLSourceID", source);
        request.AddParameter("SupplierID", suppliers.join("^"));

        return {
            years: [
                (year - 1),
                year
            ],
            data: Server.parseResponse(await request.Submit()) || []
        };
    }

    static async Rebates(source, suppliers) {
        Server.log(suppliers);

        const request = new ECP.EC_Request("DBI_Distributor_Rebates");

        request.AddParameter("EDBLSource", source);
        request.AddParameter("SupplierID", suppliers.join("^"));

        return Server.parseResponse(await request.Submit()) || [];
    }

    static Inventory(source, start, end, suppliers, location) {
        Server.log(suppliers);
        Server.log(location);

        return new Promise((resolve) => {
            const key = btoa(`DBI:Products:${source}:${suppliers.map(s => s.SupplierID).join("^")}`);

            const commands = [
                {
                    command: "DBI_Starting_Inventory",
                    paramaters: [
                        {
                            name: "StartDate",
                            value: start
                        }
                    ]
                },
                {
                    command: "DBI_Inventory_Sales",
                    paramaters: [
                        {
                            name: "StartDate",
                            value: start
                        },
                        {
                            name: "EndDate",
                            value: end
                        }
                    ]
                },
                {
                    command: "DBI_Inventory_Purchases",
                    paramaters: [
                        {
                            name: "StartDate",
                            value: start
                        },
                        {
                            name: "EndDate",
                            value: end
                        }
                    ]
                },
                {
                    command: "DBI_Current_Inventory"
                }
            ];

            const queue = [];
            const results = [];

            let processed = DSDLink.getCache(key);

            const report = function () {
                Server.log(processed);

                for (let i = 0; i < commands.length; i++) {
                    queue.push(true);

                    const request = new ECP.EC_Request(commands[i].command);

                    request.AddParameter("EDBLSourceID", source);
                    request.AddParameter("SupplierID", suppliers.join("^"));

                    for (let j = 0; j < (commands[i].paramaters || []).length; j++) {
                        request.AddParameter(commands[i].paramaters[j].name, commands[i].paramaters[j].value);
                    }

                    request.Submit().then((response) => {
                        const data = (Server.parseResponse(response) || []).filter(item => item.LocationID === `${location}`);

                        for (let j = 0; j < data.length; j++) {
                            const { ...row } = data[j];
                            const product = row.ProductID;

                            if (processed[product]) {
                                switch (commands[i].command) {
                                    case "DBI_Starting_Inventory":
                                        /*
                                        {
                                            Inventory
                                        }
                                        */

                                        processed[product].Starting += parseFloat(row.Inventory) || 0;
                                        break;

                                    case "DBI_Inventory_Sales":
                                        /*
                                        {
                                            Sales,
                                            WeeklyAvg,
                                            DailyAvg
                                        }
                                        */

                                        processed[product].Sales += parseFloat(row.Sales) || 0;

                                        if ((parseFloat(row.DailyAvg) || 0) > processed[product].Daily) {
                                            processed[product].Daily = parseFloat(row.DailyAvg) || 0;
                                        }

                                        if ((parseFloat(row.WeeklyAvg) || 0) > processed[product].Weekly) {
                                            processed[product].Weekly = parseFloat(row.WeeklyAvg) || 0;
                                        }

                                        break;

                                    case "DBI_Inventory_Purchases":
                                        /*
                                        {
                                            Shipments,
                                            Transfers,
                                            LastReceived
                                        }
                                        */

                                        processed[product].Shipments += parseFloat(row.Shipments) || 0;
                                        processed[product].Transfers += parseFloat(row.Transfers) || 0;

                                        if (row.LastReceived && row.LastReceived !== "" && (!processed[product].LastReceived || new Date(row.LastReceived).getTime() > processed[product].LastReceived.getTime())) {
                                            processed[product].LastReceived = new Date(row.LastReceived);
                                        }

                                        break;

                                    case "DBI_Current_Inventory":
                                        /*
                                        {
                                            OnFloor,
                                            PreSales
                                        }
                                        */

                                        processed[product].OnFloor += parseFloat(row.OnFloor) || 0;
                                        processed[product].PreSales += parseFloat(row.PreSales) || 0;
                                        break;
                                }
                            }
                        }
                    }).finally(() => {
                        queue.pop();

                        if (queue.length === 0) {
                            const keys = Object.keys(processed);

                            for (let j = 0; j < keys.length; j++) {
                                processed[keys[j]].Available = processed[keys[j]].OnFloor - processed[keys[j]].PreSales;

                                if (processed[keys[j]].Daily > 0 && processed[keys[j]].Available > 0 && processed[keys[j]].Available / processed[keys[j]].Daily > 0) {
                                    processed[keys[j]].DOI = Math.floor(processed[keys[j]].Available / processed[keys[j]].Daily);
                                    processed[keys[j]].RunOutDate = new Date();
                                    processed[keys[j]].RunOutDate.setDate(processed[keys[j]].RunOutDate.getDate() + processed[keys[j]].DOI);
                                }

                                const adjustment = parseFloat(((processed[keys[j]].Starting + processed[keys[j]].Shipments + processed[keys[j]].Transfers) - processed[keys[j]].Sales).toFixed(2));
                                const difference = parseFloat((processed[keys[j]].OnFloor - adjustment).toFixed(2));

                                processed[keys[j]].Transfers += difference;

                                results.push(processed[keys[j]]);
                            }

                            results.sort((a, b) => {
                                if (a.Product.toUpperCase() < b.Product.toUpperCase()) {
                                    return -1;
                                }

                                if (a.Product.toUpperCase() > b.Product.toUpperCase()) {
                                    return 1;
                                }

                                return 0;
                            });

                            resolve(results);
                        }
                    }).catch((error) => {
                        Server.log(error);
                    });
                }

                if (queue.length === 0) {
                    resolve(results);
                }
            };

            if (!processed) {
                processed = {};

                const request = new ECP.EC_Request("DBI_Distributor_Product_List");

                request.AddParameter("EDBLSourceID", source);
                request.AddParameter("SupplierID", suppliers.join("^"));

                request.Submit().then((initial) => {
                    const products = (Server.parseResponse(initial) || []).filter(item => item.LocationID === `${location}`);

                    /*
                    {
                        LocationID,
                        ProductID,
                        ProductNum,
                        Product,
                        Brand,
                        Segment
                    }
                    */

                    for (let i = 0; i < products.length; i++) {
                        const { ...product } = products[i];

                        processed[product.ProductID] = {
                            Number: product.ProductNum,
                            Product: product.Product,
                            Brand: product.Brand,
                            Segment: product.Segment,
                            Starting: 0,
                            Sales: 0,
                            Daily: 0,
                            Weekly: 0,
                            Shipments: 0,
                            Transfers: 0,
                            LastReceived: null,
                            OnFloor: 0,
                            PreSales: 0
                        };
                    }

                    DSDLink.setCache(key, processed, 1000 * 60 * 30);
                }).finally(() => {
                    report();
                }).catch((error) => {
                    Server.log(error);
                });
            } else {
                report();
            }
        });
    }

    static async QualityStats(source, suppliers) {
        Server.log(suppliers);

        let request = null;

        const data = {};

        request = new ECP.EC_Request("DBI_Quality_Unmatched_Count");

        request.AddParameter("EDBLSourceID", source);
        request.AddParameter("SupplierID", suppliers.join("^"));

        data.Unmatched = ((Server.parseResponse(await request.Submit()) || [])[0] || {}).Unmatched || 0;

        request = new ECP.EC_Request("DBI_Quality_Mismatched_Count");

        request.AddParameter("EDBLSourceID", source);
        request.AddParameter("SupplierID", suppliers.join("^"));

        data.Mismatched = ((Server.parseResponse(await request.Submit()) || [])[0] || {}).Mismatched || 0;

        return data;
    }

    static async QualityReport(report, source, suppliers) {
        Server.log(suppliers);

        const request = new ECP.EC_Request(`DBI_Quality_${report}`);

        request.AddParameter("EDBLSourceID", source);
        request.AddParameter("SupplierID", suppliers.join("^"));

        return Server.parseResponse(await request.Submit()) || [];
    }

    static async CreateTask(data) {
        let content = "";

        /*
        {
            Task,
            ObjectiveTypeID,
            ObjectiveID,
            TaskStatusID,
            CustomField505,
            AssignToUserID,
            CustomerID,
            StartDate,
            Deadline,
            TaskDetail
        }
        */

        content += "\"Task\",\"ObjectiveTypeID\",\"ObjectiveID\",\"TaskStatusID\",\"CustomField505\",\"AssignToUserID\",\"CustomerID\",\"StartDate\",\"Deadline\",\"TaskDetail\"\n";

        for (let i = 0; i < data.length; i++) {
            const { ...row } = data[i];

            content += `"${row.Task}","${row.ObjectiveTypeID}","${row.ObjectiveID}","${row.TaskStatusID}","${row.CustomField505}","${row.AssignToUserID}","${row.CustomerID}","${row.StartDate}","${row.Deadline}","${row.TaskDetail}"\n`;
        }

        try {
            const body = new FormData();

            body.append("FileName", "Task.csv");
            body.append("File", content);

            const response = await Public.Request("DBI_Create_Task", "Support", null, {
                method: "POST",
                mode: "no-cors",
                body
            });

            return await response.text();
        } catch (error) {
            Server.log(error);

            return null;
        }
    }
}

class Main {
    constructor(app) {
        this.key = new Date().getTime() + Math.random();

        this.dsd = new DSDLink(app, async (application, state, family) => {
            application.content.html(application.spinner);

            ARGS.EDBLSourceID = parseInt(state.EDBLSourceID, 10);
            ARGS.Query = decodeURIComponent(state.Query || "");

            if (Number.isNaN(ARGS.EDBLSourceID)) {
                ARGS.EDBLSourceID = null;
            }

            if (family && family !== "") {
                ARGS.SupplierFamilies = family.join(",");
            }

            DSDLink.tabsState();

            if (family && family.length > 0) {
                this.suppliers = await DSDLink.Supplier(family);
            } else {
                this.suppliers = await DSDLink.Supplier();
            }

            this.distributors = await Database.Distributors(this.suppliers);

            Server.log(this.suppliers);
            Server.log(this.distributors);

            this.display(ARGS.EDBLSourceID, ARGS.Query);
        }, (_application, state) => {
            ARGS.EDBLSourceID = parseInt(state.EDBLSourceID, 10);
            ARGS.Query = decodeURIComponent(state.Query || "");

            if (Number.isNaN(ARGS.EDBLSourceID)) {
                ARGS.EDBLSourceID = null;
            }

            this.display(ARGS.EDBLSourceID, ARGS.Query);
        });
    }

    display(value, query) {
        this.dsd.app.content[0].scrollTo(0, 0);
        this.dsd.app.content.html(this.dsd.app.spinner);

        this.key = new Date().getTime() + Math.random();

        ARGS.EDBLSourceID = value;
        ARGS.Query = query;

        this.displayDistributors(this.key, ARGS.EDBLSourceID, ARGS.Query);
    }

    displayDistributors(key, distributor, query) {
        if (key === this.key) {
            const components = this.dsd.appendSearch(query);

            this.searchDistributors(components, components.search.val() || "", this.key);
            this.displayDistributor(components, distributor, this.key);

            components.form.on("submit", (event) => {
                event.preventDefault();

                ARGS.Query = components.search.val() || "";
                ARGS.EDBLSourceID = null;

                this.key = new Date().getTime() + Math.random();

                DSDLink.logState();

                this.searchDistributors(components, ARGS.Query, this.key);
            });

            components.data.off("click");

            components.data.on("click", ".show-distributor", (event) => {
                const target = $(event.currentTarget);

                ARGS.EDBLSourceID = parseInt(target.attr("value"), 10);

                this.key = new Date().getTime() + Math.random();

                DSDLink.logState();

                this.displayDistributor(components, ARGS.EDBLSourceID, this.key);
            });

            DSDLink.logState();
        }
    }

    searchDistributors(components, query, key) {
        if (key === this.key) {
            query = (query || "").toUpperCase();

            components.details.hide();
            components.data.removeClass("data-left");
            components.data.removeClass("svs-mobile-hide");
            components.search.parent().parent().removeClass("svs-mobile-hide");
            components.data.html(this.dsd.app.spinner);

            this.filtered = this.distributors.filter((item) => {
                if (query.length < 2) {
                    return true;
                }

                if (
                    item.EDBLSourceID === parseInt(query, 10) || (item.EDBLSource || "").toUpperCase().indexOf(query) >= 0 || (item.Locations || []).findIndex((loc) => {
                        if (
                            (loc.DBA || "").toUpperCase().indexOf(query) >= 0
                         || (loc.City || "").toUpperCase().indexOf(query) >= 0
                         || (loc.State || "").toUpperCase().indexOf(query) >= 0
                         || (loc.DistributorNum || "").toUpperCase().indexOf(query) >= 0
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

                html += `
                    <tr class="show-distributor" value="${row.EDBLSourceID}">
                        <td class="dbi-parent-cell"></td>
                        <td>${row.EDBLSource}</td>
                        <td class="svs-em-cell left-compact">${([...new Set(row.Locations.filter(loc => loc.DistributorNum && loc.DistributorNum !== "").map(loc => loc.DistributorNum))]).join("<br>")}</td>
                        <td class="left-compact-hide svs-mobile-hide">${([...new Set(row.Locations.map(loc => loc.DBA))]).join("<br>")}</td>
                        <td class="left-compact-hide svs-mobile-hide">${([...new Set(row.Locations.map(loc => `${loc.City}, ${loc.State}`))]).join("<br>")}</td>
                    </tr>
                `;
            }

            if (html !== "") {
                components.data.html(`
                    <table class="svs-table" cellspacing="0">
                        <thead class="svs-mobile-hide">
                            <tr>
                                <th class="dbi-spacer-cell"></th>
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
                components.data.html(`
                    <div class="empty">
                        <div class="message">
                            No results.
                        </div>
                    </div>
                `);
            }

            if (this.filtered && this.filtered.length === 1) {
                ARGS.EDBLSourceID = this.filtered[0].EDBLSourceID;

                this.key = new Date().getTime() + Math.random();

                DSDLink.logState();

                this.displayDistributor(components, ARGS.EDBLSourceID, this.key);
            }

            components.data[0].scrollTo(0, 0);
        }
    }

    async displayDistributor(components, id, key) {
        const now = new Date();

        if (key === this.key && !Number.isNaN(parseInt(id, 10))) {
            components.data.addClass("data-left");
            components.data.addClass("svs-mobile-hide");
            components.search.parent().parent().addClass("svs-mobile-hide");
            components.details.off("click");
            components.details.html(this.dsd.app.spinner);
            components.details.show();

            const distributor = this.distributors.filter(row => row.EDBLSourceID === id)[0];
            const reports = await Database.SupplierReports(this.suppliers, distributor.EDBLSource);
            const srs = (reports && reports.length > 0 && reports.findIndex(r => r.ReportType === "SRS") >= 0);

            let html = "";

            /*
            {
                ReportType,
                Location,
                Supplier,
                DistributorNum,
                LastSent
            }
            */

            for (let i = 0; i < reports.length; i++) {
                const { ...row } = reports[i];

                html += `
                    <tr>
                        <td class="svs-em-cell">${row.ReportType}</td>
                        <td class="svs-mobile-hide">${row.Location}</td>
                        <td>${row.DistributorNum}</td>
                        <td>${row.Supplier}</td>
                        <td class="svs-mobile-hide">${Main.formatDate(row.LastSent, true)}</td>
                    </tr>
                `;
            }

            components.details.html(`
                <div class="svs-mobile-only">
                    <div class="row">
                        <div class="svs-button" id="close-details" style="margin: 7px 0 0 0;">Back</div>
                    </div>
                </div>

                <h1>Distributor</h1>

                <div class="fieldset">
                    <div class="dist-title">${distributor.EDBLSource}</div>
                    <div>${[...new Set(distributor.Locations.map(loc => `${loc.DBA}, ${loc.City}, ${loc.State}`))].join("</div><div>")}</div>
                </div>

                <div class="tiles">
                    <div class="tile report-tile" report="brand-sales">
                        <div class="tile-text">
                            <svg xmlns="http://www.w3.org/2000/svg" width="3rem" viewBox="0 0 24 24">
                                <path d="M23,8c0,1.1-0.9,2-2,2c-0.18,0-0.35-0.02-0.51-0.07l-3.56,3.55C16.98,13.64,17,13.82,17,14c0,1.1-0.9,2-2,2s-2-0.9-2-2 c0-0.18,0.02-0.36,0.07-0.52l-2.55-2.55C10.36,10.98,10.18,11,10,11s-0.36-0.02-0.52-0.07l-4.55,4.56C4.98,15.65,5,15.82,5,16 c0,1.1-0.9,2-2,2s-2-0.9-2-2s0.9-2,2-2c0.18,0,0.35,0.02,0.51,0.07l4.56-4.55C8.02,9.36,8,9.18,8,9c0-1.1,0.9-2,2-2s2,0.9,2,2 c0,0.18-0.02,0.36-0.07,0.52l2.55,2.55C14.64,12.02,14.82,12,15,12s0.36,0.02,0.52,0.07l3.55-3.56C19.02,8.35,19,8.18,19,8 c0-1.1,0.9-2,2-2S23,6.9,23,8z"></path>
                            </svg>
                            <span>Brand Sales</span>
                        </div>
                    </div>
                    <div class="tile report-tile" report="segment-sales">
                        <div class="tile-text">
                            <svg xmlns="http://www.w3.org/2000/svg" width="3rem" viewBox="0 0 24 24">
                                <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"></path>
                            </svg>
                            <span>Segment Sales</span>
                        </div>
                    </div>
                    <div class="tile report-tile" report="inventory">
                        <div class="tile-text">
                            <svg xmlns="http://www.w3.org/2000/svg" width="3rem" viewBox="0 0 24 24">
                                <path d="M13,9.5h5v-2h-5V9.5z M13,16.5h5v-2h-5V16.5z M19,21H5c-1.1,0-2-0.9-2-2V5 c0-1.1,0.9-2,2-2h14c1.1,0,2,0.9,2,2v14C21,20.1,20.1,21,19,21z M6,11h5V6H6V11z M7,7h3v3H7V7z M6,18h5v-5H6V18z M7,14h3v3H7V14z" fill-rule="evenodd"></path>
                            </svg>
                            <span>Inventory</span>
                        </div>
                    </div>
                    <div class="tile report-tile" report="rebates">
                        <div class="tile-text">
                            <svg xmlns="http://www.w3.org/2000/svg" width="3rem" viewBox="0 0 24 24">
                                <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"></path>
                            </svg>
                            <span>Rebates</span>
                        </div>
                    </div>
                </div>

                <h1>Data Integrity</h1>

                <div class="fieldset">
                    <div id="DataQuality" class="row">
                        <div class="dbi-quality-data-points">
                            <div class="dbi-quality-title">Brands with unmatched products</div>
                            <div class="dbi-quality-point">${this.dsd.app.spinner}</div>
                        </div>
                        <div class="dbi-quality-data-points">
                            <div class="dbi-quality-title">Products with mismatched suppliers</div>
                            <div class="dbi-quality-point">${this.dsd.app.spinner}</div>
                        </div>
                    </div>
                    <div class="row dbi-row-seperate svs-mobile-hide">
                        <div class="svs-button dbi-report" report="mismatched-products">Mismatched Products</div>
                        <div class="svs-button dbi-report" report="product-numbers">Invalid Product Numbers</div>
                    </div>
                </div>

                <h1 class="svs-mobile-hide">Export Data</h1>

                <div class="fieldset svs-mobile-hide">
                    <div class="row">
                        <div class="row fields">
                            <div class="field">
                                <span class="title">Start Date</span>
                                <input type="date" id="StartDate" value="${now.getFullYear()}-${Main.right(`0${(now.getMonth() + 1)}`, 2)}-01">
                            </div>

                            <div class="field">
                                <span class="title">End Date</span>
                                <input type="date" id="EndDate" value="${now.getFullYear()}-${Main.right(`0${(now.getMonth() + 1)}`, 2)}-${Main.right(`0${now.getDate()}`, 2)}">
                            </div>
                        </div>

                        <div class="field svs-mobile-hide"></div>
                    </div>

                    ${srs ? `
                        <div class="row">
                            <div class="row fields">
                                <div class="field">
                                    <span class="title">Dataset</span>
                                    <select id="FileType">
                                        <option value=""></option>
                                        <option value="SLS">SRS Sales</option>
                                        <option value="OUT">SRS Retail Outlet</option>
                                        <option value="INV">SRS Inventory</option>
                                        <option value="ITM">SRS Item Reference</option>
                                        <option value="SLM">SRS Salesperson</option>
                                    </select>
                                </div>
                            </div>

                            <div class="field svs-mobile-hide"></div>
                        </div>
                    ` : ""}

                    <div class="row">
                        <div class="svs-button svs-button-primary export" type="sales">Export Sales</div>
                        <div class="svs-button svs-button-primary export" type="inventory">Export Inventory</div>
                        <div class="svs-button svs-button-primary export" type="products">Export Products</div>
                        <div class="svs-button svs-button-primary export" type="customers">Export Customers</div>
                        ${srs ? "<div class=\"svs-button export\" type=\"srs\">Resend SRS Data</div>" : ""}
                    </div>
                </div>

                ${reports.length > 0 ? `
                    <h1>Data Collection Interfaces</h1>

                    <div class="fieldset">
                        <table class="svs-table nested-table" cellspacing="0">
                            <thead class="svs-mobile-hide">
                                <tr>
                                    <th class="data-press">Type</th>
                                    <th class="data-press">Location</th>
                                    <th class="data-press">Distributor Num</th>
                                    <th class="data-press">Supplier</th>
                                    <th>Last Sent</th>
                                </tr>
                            </thead>

                            <tbody class="data-body">
                                ${html}
                            </tbody>
                        </table>

                        <div class="row">
                            <div id="TransmissionLog" class="svs-button svs-button-primary">Transmission Log</div>
                        </div>
                    </div>
                ` : ""}
            `);

            const dq = components.details.find("#DataQuality");

            Database.QualityStats(distributor.EDBLSourceID, [...new Set(this.suppliers.map(s => s.SupplierID))]).then((stats) => {
                dq.html(`
                    <div class="dbi-quality-data-points">
                        <div class="dbi-quality-title">Brands with unmatched products</div>
                        <div class="dbi-quality-point ${Main.parseDataPoint(stats.Unmatched || 0, 0, 20)}">${stats.Unmatched || 0}</div>
                    </div>
                    <div class="dbi-quality-data-points">
                        <div class="dbi-quality-title">Products with mismatched suppliers</div>
                        <div class="dbi-quality-point ${Main.parseDataPoint(stats.Mismatched || 0, 0, 5)}">${stats.Mismatched || 0}</div>
                    </div>
                `);
            });

            components.details.find(".tiles").on("click", ".tile", (event) => {
                this.key = new Date().getTime() + Math.random();

                const target = $(event.currentTarget);
                const report = target.attr("report");

                switch (report) {
                    case "rebates":
                        this.rebateReport(components, this.key, distributor);
                        break;

                    case "brand-sales":
                        this.brandSales(components, this.key, distributor);
                        break;

                    case "segment-sales":
                        this.segmentSales(components, this.key, distributor);
                        break;
                    case "inventory":
                        this.inventoryReport(components, this.key, distributor);
                        break;
                }
            });

            dq.parent().on("click", ".dbi-report", (event) => {
                this.key = new Date().getTime() + Math.random();

                const target = $(event.currentTarget);
                const report = target.attr("report");

                switch (report) {
                    case "product-numbers":
                        this.productNumbersReport(components, this.key, distributor);
                        break;

                    case "mismatched-products":
                        this.mismatchedReport(components, this.key, distributor);
                        break;
                }
            });

            components.details.on("click", "#close-details", () => {
                this.display(null, ARGS.Query);
            });

            components.details.find("#TransmissionLog").on("click", () => {
                this.key = new Date().getTime() + Math.random();

                this.transmissionLog(components, this.key, distributor, reports);
            });

            components.details.on("click", ".export", (event) => {
                this.key = new Date().getTime() + Math.random();

                const today = new Date();

                const target = $(event.currentTarget);
                const form = target.parent().parent();
                const type = target.attr("type");

                const data = {
                    start: null,
                    end: null,
                    dataset: null
                };

                let valid = false;
                let test = null;

                switch (type) {
                    case "srs":
                        valid = true;

                        data.start = form.find("#StartDate").val();
                        data.end = form.find("#EndDate").val();
                        data.dataset = form.find("#FileType").val();

                        if (valid && (!data.dataset || data.dataset === "")) {
                            valid = false;

                            this.dsd.app.alert("Dataset is required.");
                        }

                        if (valid) {
                            data.start = EC_Fmt.ToDate(data.start);
                            data.end = EC_Fmt.ToDate(data.end);

                            if (valid && data.start > data.end) {
                                valid = false;

                                this.dsd.app.alert("End Date must be greater then or equal to the Start Date.");
                            }

                            switch (data.dataset) {
                                case "INV":
                                    test = new Date(data.start);
                                    test.setDate(test.getDate() + 45);

                                    if (valid && !data.start) {
                                        valid = false;

                                        this.dsd.app.alert("Start Date is required.");
                                    }

                                    if (valid && !data.end) {
                                        valid = false;

                                        this.dsd.app.alert("End Date is required.");
                                    }

                                    if (valud && test < today) {
                                        valid = false;

                                        this.dsd.app.alert("Cannot resend more than 45 days of inventory.");
                                    }

                                    break;

                                default:
                                    test = new Date(data.start);
                                    test.setFullYear(test.getFullYear() + 2);

                                    if (valid && !data.start) {
                                        valid = false;

                                        this.dsd.app.alert("Start Date is required.");
                                    }

                                    if (valid && test < today) {
                                        valid = false;

                                        this.dsd.app.alert("Cannot send SRS farther back than 2 years.");
                                    }

                                    break;
                            }
                        }

                        if (valid) {
                            this.sendResendRequest(distributor, data, this.key);
                        }

                        break;

                    case "sales":
                        valid = true;

                        data.start = form.find("#StartDate").val();
                        data.end = form.find("#EndDate").val();

                        if (valid && (!data.start || data.start === "")) {
                            valid = false;

                            this.dsd.app.alert("Start Date is required.");
                        }

                        if (valid && (!data.end || data.end === "")) {
                            valid = false;

                            this.dsd.app.alert("End Date is required.");
                        }

                        if (valid) {
                            data.start = EC_Fmt.ToDate(data.start);
                            data.end = EC_Fmt.ToDate(data.end);

                            if (data.start > data.end) {
                                valid = false;

                                this.dsd.app.alert("End Date must be greater then or equal to the Start Date.");
                            } else if (Main.datediff(data.start, data.end) > 365) {
                                valid = false;

                                this.dsd.app.alert("Cannot export more than 1 year of sales data in a single file.");
                            }
                        }

                        if (valid) {
                            this.key = new Date().getTime() + Math.random();
                            this.download(components, distributor, this.key, `API.ashx?APICommand=FusionView&ReportID=5419233&Format=CSV&Parameters=F:Filter1~V:${Main.formatDate(data.start)}~O:E|F:Filter2~V:${Main.formatDate(data.end)}~O:E|F:Filter3~V:${distributor.EDBLSourceID}~O:E`, `Sales_${Main.uniqueFileName(data.start)}.csv`);
                        }

                        break;

                    case "inventory":
                        valid = true;

                        data.start = form.find("#StartDate").val();
                        data.end = form.find("#EndDate").val();

                        if (valid && (!data.start || data.start === "")) {
                            valid = false;

                            this.dsd.app.alert("Start Date is required.");
                        }

                        if (valid && (!data.end || data.end === "")) {
                            valid = false;

                            this.dsd.app.alert("End Date is required.");
                        }

                        if (valid) {
                            data.start = EC_Fmt.ToDate(data.start);
                            data.end = EC_Fmt.ToDate(data.end);

                            if (data.start > data.end) {
                                valid = false;

                                this.dsd.app.alert("End Date must be greater then or equal to the Start Date.");
                            } else if (Main.datediff(data.start, data.end) > 365) {
                                valid = false;

                                this.dsd.app.alert("Cannot export more than 1 year of inventory data in a single file.");
                            }
                        }

                        if (valid) {
                            this.key = new Date().getTime() + Math.random();
                            this.download(components, distributor, this.key, `API.ashx?APICommand=DBI_Distributor_Inventory&Format=CSV&Parameters=F:StartDate~V:${Main.formatDate(data.start)}~O:GE|F:EndDate~V:${Main.formatDate(data.end)}~O:LE|F:EDBLSourceID~V:${distributor.EDBLSourceID}~O:E|F:SupplierID~V:${([...new Set(this.suppliers.map(s => s.SupplierID))]).join("^")}~O:E`, `Inventory_${Main.uniqueFileName(data.end)}.csv`);
                        }

                        break;

                    case "products":
                        valid = true;

                        if (valid) {
                            this.key = new Date().getTime() + Math.random();
                            this.download(components, distributor, this.key, `API.ashx?APICommand=FusionView&ReportID=5423607&Format=CSV&Parameters=F:Filter1~V:${distributor.EDBLSourceID}~O:E`, `Products_${Main.uniqueFileName()}.csv`);
                        }

                        break;

                    case "customers":
                        valid = true;

                        if (valid) {
                            this.key = new Date().getTime() + Math.random();
                            this.download(components, distributor, this.key, `API.ashx?APICommand=FusionView&ReportID=5423770&Format=CSV&Parameters=F:EDBLSourceID~V:${distributor.EDBLSourceID}~O:E`, `Customers_${Main.uniqueFileName()}.csv`);
                        }

                        break;
                }
            });
        }
    }

    async sendResendRequest(distributor, data, key) {
        if (key === this.key) {
            const user = await Database.UserDetails();
            const customer = await Database.LookupCustomer(distributor.EDBLSource);

            const update = [];

            const start = encodeURIComponent(Main.formatDate(data.start, true));
            const end = encodeURIComponent(Main.formatDate(data.end, true));
            const codes = [...new Set(this.suppliers.filter(s => s.CodeType === "SRSSUPPID").map(s => s.ReportCode))];

            let report = "";

            report += "https://dsdlink.com/";
            report += "aspx1/";
            report += `Home.aspx?DashboardID=171239&EDBLSourceID=${distributor.EDBLSourceID}&StartDate=${start}&EndDate=${end}&SupplierCodes=${codes.join("^")}`;

            let body = "";

            body += "SRS Resend Request<br>";
            body += `<a href='${report}' target='_blank'>Balance Report</a><br>`;
            body += "<br>";
            body += "Supplier Requested<br>";
            body += `Requested By: ${user.Name}<br>`;

            if (user.Email) {
                body += `Email: ${user.Email}<br>`;
            }

            body += "<br>";
            body += `Start Date: ${Main.formatDate(data.start, true)}<br>`;
            body += `End Date: ${Main.formatDate(data.end, true)}<br>`;
            body += "<br>";
            body += "Supplier Report Codes:<br>";
            body += codes.join("<br>");
            body += "<br><br>";

            switch (data.dataset) {
                case "SLS":
                    body += "Dataset: Sales<br>";
                    break;

                case "OUT":
                    body += "Dataset: Sales & Retail Outlet<br>";
                    break;

                case "INV":
                    body += "Dataset: Inventory<br>";
                    break;

                case "ITM":
                    body += "Dataset: Item Cross Reference<br>";
                    break;

                case "SLM":
                    body += "Dataset: Salesperson<br>";
                    break;
            }

            body += "<br>";
            body += "Distributor Details<br>";
            body += `DSD Link ID: ${distributor.EDBLSource}<br>`;
            body += `Company: ${customer.Company}<br>`;

            update.push({
                Task: `SRS Resend Request (Supplier Requested) - ${customer.Company}`,
                ObjectiveTypeID: 6,
                ObjectiveID: 695,
                TaskStatusID: 27,
                CustomField505: 1887,
                AssignToUserID: 15495,
                CustomerID: customer.CustomerID,
                StartDate: data.start ? Main.formatDate(data.start) : null,
                Deadline: data.end ? Main.formatDate(data.end) : null,
                TaskDetail: body
            });

            if (key === this.key) {
                Database.CreateTask(update).then(() => {
                    this.dsd.app.alert("SRS resend request sent.");
                });
            }
        }
    }

    async transmissionLog(components, key, distributor, reports) {
        if (key === this.key) {
            components.details.off("click");
            components.details.html(this.dsd.app.spinner);

            const log = await Database.TransmissionLog(reports, distributor.EDBLSource);

            let html = "";

            /*
            {
                TimeCreated,
                ReportType,
                Status,
                File,
                Download,
                Memo
            }
            */

            for (let i = 0; i < log.length; i++) {
                const { ...row } = log[i];

                html += `
                    <tr>
                        <td>${EC_Fmt.ScreenFmt(row.TimeCreated, ECP.DataType._DateTime)}</td>
                        <td>${(row.ReportType || "").replace(/null/gi, "")}</td>
                        <td class="svs-em-cell">${row.Status}</td>
                        <td>${row.File}</td>
                        <td>${(row.Memo || "").replace(/null/gi, "")}</td>
                    </tr>
                `;
            }

            components.details.html(`
                <h1 class="svs-mobile-hide">Distributor</h1>

                <div class="fieldset svs-mobile-hide">
                    <div class="dist-title">${distributor.EDBLSource}</div>
                    <div>${[...new Set(distributor.Locations.map(loc => `${loc.DBA}, ${loc.City}, ${loc.State}`))].join("</div><div>")}</div>
                </div>

                <h1 class="svs-mobile-hide">Transmission Log</h1>

                <div class="fieldset nested-report">
                    <div class="row">
                        <div class="svs-button log-back">Back</div>
                    </div>

                    <table class="svs-table" cellspacing="0">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Type</th>
                                <th>Status</th>
                                <th>File</th>
                                <th>Notes</th>
                            </tr>
                        </thead>

                        <tbody class="data-body">
                            ${html}
                        </tbody>
                    </table>

                    <div class="row">
                        <div class="svs-button log-back">Back</div>
                    </div>
                </div>
            `);

            components.details.on("click", ".log-back", () => {
                this.display(ARGS.EDBLSourceID, ARGS.Query);
            });
        }
    }

    async brandSales(components, key, distributor) {
        if (key === this.key) {
            components.details.off("click");
            components.details.html(this.dsd.app.spinner);

            const report = await Database.Sales("Brand", distributor.EDBLSourceID, [...new Set(this.suppliers.map(s => s.SupplierID))]);

            let html = "";

            /*
            {
                years: [
                    (0),
                    (1)
                ]
                data: {
                    BrandMaster,
                    NumUnits: [
                        (0),
                        (1)
                    ],
                    NumUnitsPercentageDifference
                }
            }
            */

            const totals = {
                last: 0,
                current: 0
            };

            for (let i = 0; i < report.data.length; i++) {
                const { ...row } = report.data[i];

                const last = Main.parseNumber(row.NumUnits[0]);
                const current = Main.parseNumber(row.NumUnits[1]);
                const difference = Main.parseNumber(row.NumUnitsPercentageDifference);

                totals.last += last;
                totals.current += current;

                html += `
                    <tr>
                        <td class="svs-em-cell">${(row.BrandMaster || "(Unknown)")}</td>
                        <td style="text-align: right;">${Main.formatNumber(last)}</td>
                        <td style="text-align: right;">${Main.formatNumber(current)}</td>
                        <td style="text-align: right;">${Main.formatNumber(difference, 1, { suffix: "%" })}</td>
                    </tr>
                `;
            }

            components.details.html(`
                <h1 class="svs-mobile-hide">Distributor</h1>

                <div class="fieldset svs-mobile-hide">
                    <div class="dist-title">${distributor.EDBLSource}</div>
                    <div>${[...new Set(distributor.Locations.map(loc => `${loc.DBA}, ${loc.City}, ${loc.State}`))].join("</div><div>")}</div>
                </div>

                <h1 class="svs-mobile-hide">Brand Sales</h1>

                <div class="fieldset nested-report">
                    <div class="row">
                        <div class="svs-button brand-sales-back">Back</div>
                    </div>

                    <table class="svs-table" cellspacing="0">
                        <thead>
                            <tr>
                                <th>Brand</th>
                                <th style="text-align: right;">${report.years[0]}</th>
                                <th style="text-align: right;">${report.years[1]}</th>
                                <th style="text-align: right;">Difference</th>
                            </tr>
                        </thead>

                        <tbody class="data-body">
                            <tr class="total-row">
                                <td></td>
                                <td style="text-align: right;">${Main.formatNumber(totals.last)}</td>
                                <td style="text-align: right;">${Main.formatNumber(totals.current)}</td>
                                <td style="text-align: right;">${Main.formatNumber(((totals.current - totals.last) / Math.abs(totals.last)) * 100, 1, { suffix: "%" })}</td>
                            </tr>
                            ${html}
                            <tr class="total-row">
                                <td></td>
                                <td style="text-align: right;">${Main.formatNumber(totals.last)}</td>
                                <td style="text-align: right;">${Main.formatNumber(totals.current)}</td>
                                <td style="text-align: right;">${Main.formatNumber(((totals.current - totals.last) / Math.abs(totals.last)) * 100, 1, { suffix: "%" })}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            `);

            components.details.on("click", ".brand-sales-back", () => {
                this.display(ARGS.EDBLSourceID, ARGS.Query);
            });
        }
    }

    async segmentSales(components, key, distributor) {
        if (key === this.key) {
            components.details.off("click");
            components.details.html(this.dsd.app.spinner);

            const report = await Database.Sales("Segment", distributor.EDBLSourceID, [...new Set(this.suppliers.map(s => s.SupplierID))]);

            let html = "";

            /*
            {
                years: [
                    (0),
                    (1)
                ]
                data: {
                    Segment,
                    NumUnits: [
                        (0),
                        (1)
                    ],
                    NumUnitsPercentageDifference
                }
            }
            */

            const totals = {
                last: 0,
                current: 0
            };

            for (let i = 0; i < report.data.length; i++) {
                const { ...row } = report.data[i];

                const last = Main.parseNumber(row.NumUnits[0]);
                const current = Main.parseNumber(row.NumUnits[1]);
                const difference = Main.parseNumber(row.NumUnitsPercentageDifference);

                totals.last += last;
                totals.current += current;

                html += `
                    <tr>
                        <td class="svs-em-cell">${(row.Segment || "(Unknown)")}</td>
                        <td style="text-align: right;">${Main.formatNumber(last)}</td>
                        <td style="text-align: right;">${Main.formatNumber(current)}</td>
                        <td style="text-align: right;">${Main.formatNumber(difference, 1, { suffix: "%" })}</td>
                    </tr>
                `;
            }

            components.details.html(`
                <h1 class="svs-mobile-hide">Distributor</h1>

                <div class="fieldset svs-mobile-hide">
                    <div class="dist-title">${distributor.EDBLSource}</div>
                    <div>${[...new Set(distributor.Locations.map(loc => `${loc.DBA}, ${loc.City}, ${loc.State}`))].join("</div><div>")}</div>
                </div>

                <h1 class="svs-mobile-hide">Segment Sales</h1>

                <div class="fieldset nested-report">
                    <div class="row">
                        <div class="svs-button brand-sales-back">Back</div>
                    </div>

                    <table class="svs-table" cellspacing="0">
                        <thead>
                            <tr>
                                <th>Segment</th>
                                <th style="text-align: right;">${report.years[0]}</th>
                                <th style="text-align: right;">${report.years[1]}</th>
                                <th style="text-align: right;">Difference</th>
                            </tr>
                        </thead>

                        <tbody class="data-body">
                            <tr class="total-row">
                                <td></td>
                                <td style="text-align: right;">${Main.formatNumber(totals.last)}</td>
                                <td style="text-align: right;">${Main.formatNumber(totals.current)}</td>
                                <td style="text-align: right;">${Main.formatNumber(((totals.current - totals.last) / Math.abs(totals.last)) * 100, 1, { suffix: "%" })}</td>
                            </tr>
                            ${html}
                            <tr class="total-row">
                                <td></td>
                                <td style="text-align: right;">${Main.formatNumber(totals.last)}</td>
                                <td style="text-align: right;">${Main.formatNumber(totals.current)}</td>
                                <td style="text-align: right;">${Main.formatNumber(((totals.current - totals.last) / Math.abs(totals.last)) * 100, 1, { suffix: "%" })}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            `);

            components.details.on("click", ".brand-sales-back", () => {
                this.display(ARGS.EDBLSourceID, ARGS.Query);
            });
        }
    }

    async rebateReport(components, key, distributor) {
        if (key === this.key) {
            components.details.off("click");
            components.details.html(this.dsd.app.spinner);

            const data = await Database.Rebates(distributor.EDBLSource, [...new Set(this.suppliers.map(s => s.SupplierID))]);

            let html = "";

            /*
            {
                Brand,
                Units,
                Price,
                Discount,
                Participation
            }
            */

            const totals = {
                units: 0,
                price: 0,
                discount: 0,
                participation: 0
            };

            for (let i = 0; i < data.length; i++) {
                const { ...row } = data[i];

                const units = Main.parseNumber(row.Units);
                const price = Main.parseNumber(row.Price);
                const discount = Main.parseNumber(row.Discount);
                const participation = Main.parseNumber(row.Participation);

                totals.units += units;
                totals.price += price;
                totals.discount += discount;
                totals.participation += participation;

                html += `
                    <tr>
                        <td class="svs-em-cell">${(row.Brand || "(Unknown)")}</td>
                        <td style="text-align: right;">${Main.formatNumber(units)}</td>
                        <td style="text-align: right;">${Main.formatNumber(price, 2, { prefix: "$" })}</td>
                        <td style="text-align: right;">${Main.formatNumber(discount, 2, { prefix: "$" })}</td>
                        <td style="text-align: right;">${Main.formatNumber(participation, 2, { prefix: "$" })}</td>
                    </tr>
                `;
            }

            components.details.html(`
                <h1 class="svs-mobile-hide">Distributor</h1>

                <div class="fieldset svs-mobile-hide">
                    <div class="dist-title">${distributor.EDBLSource}</div>
                    <div>${[...new Set(distributor.Locations.map(loc => `${loc.DBA}, ${loc.City}, ${loc.State}`))].join("</div><div>")}</div>
                </div>

                <h1 class="svs-mobile-hide">Rebates (Last Month)</h1>

                <div class="fieldset nested-report">
                    <div class="row">
                        <div class="svs-button rebates-back">Back</div>
                    </div>

                    <table class="svs-table" cellspacing="0">
                        <thead>
                            <tr>
                                <th>Brand</th>
                                <th style="text-align: right;">Units Sold</th>
                                <th style="text-align: right;">Price</th>
                                <th style="text-align: right;">Discount</th>
                                <th style="text-align: right;">Participation</th>
                            </tr>
                        </thead>

                        <tbody class="data-body">
                            <tr class="total-row">
                                <td></td>
                                <td style="text-align: right;">${Main.formatNumber(totals.units)}</td>
                                <td style="text-align: right;">${Main.formatNumber(totals.price, 2, { prefix: "$" })}</td>
                                <td style="text-align: right;">${Main.formatNumber(totals.discount, 2, { prefix: "$" })}</td>
                                <td style="text-align: right;">${Main.formatNumber(totals.participation, 2, { prefix: "$" })}</td>
                            </tr>
                            ${html}
                            <tr class="total-row">
                                <td></td>
                                <td style="text-align: right;">${Main.formatNumber(totals.units)}</td>
                                <td style="text-align: right;">${Main.formatNumber(totals.price, 2, { prefix: "$" })}</td>
                                <td style="text-align: right;">${Main.formatNumber(totals.discount, 2, { prefix: "$" })}</td>
                                <td style="text-align: right;">${Main.formatNumber(totals.participation, 2, { prefix: "$" })}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            `);

            components.details.on("click", ".rebates-back", () => {
                this.display(ARGS.EDBLSourceID, ARGS.Query);
            });
        }
    }

    async inventoryReport(components, key, distributor, location) {
        if (key === this.key) {
            components.details.off("click");
            components.details.html(this.dsd.app.spinner);

            if (!location) {
                location = distributor.Locations[0].LocationID;
            }

            location = parseInt(location, 10) || location;

            const start = new Date();
            const end = new Date();

            start.setDate(end.getDate() - 14);

            const data = await Database.Inventory(
                distributor.EDBLSourceID,
                Main.formatDate(start),
                Main.formatDate(end),
                [...new Set(this.suppliers.map(s => s.SupplierID))],
                location
            );

            let html = "";
            let locations = "";

            /*
            {
                Number,
                Product,
                Brand,
                Segment,
                Starting,
                Sales,
                Daily,
                Weekly,
                Shipments,
                Transfers,
                LastReceived,
                OnFloor,
                PreSales,
                Available,
                DOI,
                RunOutDate
            }
            */

            const totals = {
                starting: 0,
                sales: 0,
                shipments: 0,
                transfers: 0,
                inventory: 0,
                presold: 0,
                available: 0
            };

            for (let i = 0; i < data.length; i++) {
                const { ...row } = data[i];

                const last = row.LastReceived;
                const starting = Main.parseNumber(row.Starting) || 0;
                const sales = Main.parseNumber(row.Sales) || 0;
                const shipments = Main.parseNumber(row.Shipments) || 0;
                const transfers = Main.parseNumber(row.Transfers) || 0;
                const inventory = Main.parseNumber(row.OnFloor) || 0;
                const presold = Main.parseNumber(row.PreSales) || 0;
                const available = Main.parseNumber(row.Available) || 0;

                totals.starting += starting;
                totals.sales += sales;
                totals.shipments += shipments;
                totals.transfers += transfers;
                totals.inventory += inventory;
                totals.presold += presold;
                totals.available += available;

                let status = "";

                if (row.DOI && row.DOI > 0) {
                    if (row.DOI < 7) {
                        status = "bad";
                    } else if (row.DOI < 14) {
                        status = "warning";
                    } else {
                        status = "good";
                    }
                }

                if (starting !== 0 || inventory !== 0 || available !== 0) {
                    html += `
                        <tr>
                            <td>${(row.Number || "")}</td>
                            <td class="svs-em-cell" style="word-break: break-word;">${row.Product}</td>
                            <td style="text-align: right;">${Main.formatNumber(starting)}</td>
                            <td class="svs-mobile-hide" style="text-align: right;">${last ? Main.formatDate(last, true) : ""}</td>
                            <td style="text-align: right;">${Main.formatNumber(shipments)}</td>
                            <td style="text-align: right;">${Main.formatNumber(sales)}</td>
                            <td class="svs-mobile-hide" style="text-align: right;">${Main.formatNumber(transfers)}</td>
                            <td class="svs-mobile-hide" style="text-align: right;">${Main.formatNumber(inventory)}</td>
                            <td class="svs-mobile-hide" style="text-align: right;">${Main.formatNumber(presold)}</td>
                            <td style="text-align: right;">${Main.formatNumber(available)}</td>
                            <td class="svs-mobile-hide" style="text-align: right;">${row.DOI && row.DOI > 0 ? `
                                <div class="doi ${status}">${row.DOI}</div><br>
                                <div class="runout-date">${Main.formatDate(row.RunOutDate, true)}</div>
                            ` : ""}</td>
                        </tr>
                    `;
                }
            }

            const unique = [];

            for (let i = 0; i < distributor.Locations.length; i++) {
                const { ...row } = distributor.Locations[i];

                if (unique.indexOf(row.LocationID) === -1) {
                    locations += `<option value="${row.LocationID}"${row.LocationID === location ? " selected" : ""}>${row.City}, ${row.State}</option>`;

                    unique.push(row.LocationID);
                }
            }

            components.details.html(`
                <h1 class="svs-mobile-hide">Distributor</h1>

                <div class="fieldset svs-mobile-hide">
                    <div class="dist-title">${distributor.EDBLSource}</div>
                    <div>${[...new Set(distributor.Locations.map(loc => `${loc.DBA}, ${loc.City}, ${loc.State}`))].join("</div><div>")}</div>
                </div>

                <h1 class="svs-mobile-hide">Current Inventory</h1>

                <div class="fieldset nested-report">
                    <div class="row">
                        <div class="field auto-width" style="padding-top: 19px;">
                            <div class="svs-button inventory-back">Back</div>
                        </div>

                        <div class="field auto-width" style="min-width: 300px;">
                            <span class="title">Location</span>
                            <select id="Location">${locations}</select>
                        </div>
                    </div>

                    <table class="svs-table" cellspacing="0">
                        <thead>
                            <tr>
                                <th></th>
                                <th style="vertical-align: bottom;">Product</th>
                                <th style="text-align: right; vertical-align: bottom;">${Main.formatDate(start, true)} Inventory</th>
                                <th class="svs-mobile-hide" style="text-align: right; vertical-align: bottom;">Last Received</th>
                                <th style="text-align: right; vertical-align: bottom;">Shipments</th>
                                <th style="text-align: right; vertical-align: bottom;">Sales</th>
                                <th class="svs-mobile-hide" style="text-align: right; vertical-align: bottom;">Other</th>
                                <th class="svs-mobile-hide" style="text-align: right; vertical-align: bottom;">On Floor</th>
                                <th class="svs-mobile-hide" style="text-align: right; vertical-align: bottom;">Pre Sold</th>
                                <th style="text-align: right; vertical-align: bottom;">Available</th>
                                <th class="svs-mobile-hide" style="text-align: right; vertical-align: bottom;">DOI<br>Runout Date</th>
                            </tr>
                        </thead>

                        <tbody class="data-body">
                            <tr class="total-row">
                                <td></td>
                                <td></td>
                                <td style="text-align: right;">${Main.formatNumber(totals.starting)}</td>
                                <td class="svs-mobile-hide"></td>
                                <td style="text-align: right;">${Main.formatNumber(totals.shipments)}</td>
                                <td style="text-align: right;">${Main.formatNumber(totals.sales)}</td>
                                <td class="svs-mobile-hide" style="text-align: right;">${Main.formatNumber(totals.transfers)}</td>
                                <td class="svs-mobile-hide" style="text-align: right;">${Main.formatNumber(totals.inventory)}</td>
                                <td class="svs-mobile-hide" style="text-align: right;">${Main.formatNumber(totals.presold)}</td>
                                <td style="text-align: right;">${Main.formatNumber(totals.available)}</td>
                                <td class="svs-mobile-hide"></td>
                            </tr>
                            ${html}
                            <tr class="total-row">
                                <td></td>
                                <td></td>
                                <td style="text-align: right;">${Main.formatNumber(totals.starting)}</td>
                                <td class="svs-mobile-hide"></td>
                                <td style="text-align: right;">${Main.formatNumber(totals.shipments)}</td>
                                <td style="text-align: right;">${Main.formatNumber(totals.sales)}</td>
                                <td class="svs-mobile-hide" style="text-align: right;">${Main.formatNumber(totals.transfers)}</td>
                                <td class="svs-mobile-hide" style="text-align: right;">${Main.formatNumber(totals.inventory)}</td>
                                <td class="svs-mobile-hide" style="text-align: right;">${Main.formatNumber(totals.presold)}</td>
                                <td style="text-align: right;">${Main.formatNumber(totals.available)}</td>
                                <td class="svs-mobile-hide"></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            `);

            components.details.find("#Location").on("change", () => {
                this.inventoryReport(components, this.key, distributor, components.details.find("#Location").val());
            });

            components.details.on("click", ".inventory-back", () => {
                this.display(ARGS.EDBLSourceID, ARGS.Query);
            });
        }
    }

    async mismatchedReport(components, key, distributor) {
        if (key === this.key) {
            components.details.off("click");
            components.details.html(this.dsd.app.spinner);

            const suppliers = [...new Set(this.suppliers.map(s => s.SupplierID))];
            const data = await Database.QualityReport("Mismatched", distributor.EDBLSourceID, suppliers);
            const current = await Database.QualityReport("VendorProducts", distributor.EDBLSourceID, suppliers);

            let html = "";

            /*
            {
                ProductID,
                BrandID,
                SupplierID,
                Supplier,
                Product,
                ProductNum,
                MappedProductNum,
                MappedSupplier
            }
            */

            for (let i = 0; i < data.length; i++) {
                const { ...row } = data[i];
                const vendorProduct = (current.find(r => r.ProductID === row.ProductID) || {});

                data[i].VendorProductID = vendorProduct.VendorProductID;
                data[i].SameFamily = suppliers.indexOf(parseInt(row.SupplierID, 10)) >= 0;
                data[i].Propagating = vendorProduct.MappedSupplier === row.SupplierID;

                if (!data[i].SameFamily) {
                    html += `
                        <tr index="${i}">
                            <td class="dbi-mapping-marker dbi-mapping-bad"></td>
                            <td class="svs-em-cell">${row.Product}</td>
                            <td>${row.ProductNum}</td>
                            <td>${row.Supplier}</td>
                            <td>${row.MappedProductNum}</td>
                            <td>${row.MappedSupplier}</td>
                            <td class="dbi-report-mapping" title="Report Issue" style="cursor: pointer;">
                                <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M20 8h-2.81c-.45-.78-1.07-1.45-1.82-1.96L17 4.41 15.59 3l-2.17 2.17C12.96 5.06 12.49 5 12 5c-.49 0-.96.06-1.41.17L8.41 3 7 4.41l1.62 1.63C7.88 6.55 7.26 7.22 6.81 8H4v2h2.09c-.05.33-.09.66-.09 1v1H4v2h2v1c0 .34.04.67.09 1H4v2h2.81c1.04 1.79 2.97 3 5.19 3s4.15-1.21 5.19-3H20v-2h-2.09c.05-.33.09-.66.09-1v-1h2v-2h-2v-1c0-.34-.04-.67-.09-1H20V8zm-6 8h-4v-2h4v2zm0-4h-4v-2h4v2z" />
                                </svg>
                            </td>
                        </tr>
                    `;
                } else if (data[i].Propagating) {
                    html += `
                        <tr>
                            <td class="dbi-mapping-marker dbi-mapping-good"></td>
                            <td class="svs-em-cell">${row.Product}</td>
                            <td>${row.ProductNum}</td>
                            <td>${row.Supplier}</td>
                            <td></td>
                            <td>(Propagating)</td>
                            <td></td>
                        </tr>
                    `;
                } else if (data[i].VendorProductID) {
                    html += `
                        <tr>
                            <td class="dbi-mapping-marker dbi-mapping-warn"></td>
                            <td class="svs-em-cell">${row.Product}</td>
                            <td>${row.ProductNum}</td>
                            <td>${row.Supplier}</td>
                            <td>${row.MappedProductNum}</td>
                            <td>${row.MappedSupplier}</td>
                            <td></td>
                        </tr>
                    `;
                } else {
                    html += `
                        <tr>
                            <td class="dbi-mapping-marker"></td>
                            <td class="svs-em-cell">${row.Product}</td>
                            <td>${row.ProductNum}</td>
                            <td>${row.Supplier}</td>
                            <td>${row.MappedProductNum}</td>
                            <td>${row.MappedSupplier}</td>
                            <td></td>
                        </tr>
                    `;
                }
            }

            components.details.html(`
                <h1 class="svs-mobile-hide">Distributor</h1>

                <div class="fieldset svs-mobile-hide">
                    <div class="dist-title">${distributor.EDBLSource}</div>
                    <div>${[...new Set(distributor.Locations.map(loc => `${loc.DBA}, ${loc.City}, ${loc.State}`))].join("</div><div>")}</div>
                </div>

                <h1 class="svs-mobile-hide">Mismatched Products</h1>

                <div class="fieldset nested-report">
                    <div class="row">
                        <div class="svs-button mismatch-back">Back</div>
                    </div>

                    <table class="svs-table" cellspacing="0">
                        <thead>
                            <tr>
                                <th class="dbi-mapping-header"></th>
                                <th>Product</th>
                                <th>Product Number</th>
                                <th>Supplier</th>
                                <th>Invalid Product Number</th>
                                <th>Invalid Supplier</th>
                                <th></th>
                            </tr>
                        </thead>

                        <tbody class="data-body">
                            ${html}
                        </tbody>
                    </table>

                    <!--
                    <div class="row">
                        <div id="FixMapping" class="svs-button svs-button-primary">Fix Mapping</div>
                    </div>
                    -->
                </div>
            `);

            components.details.on("click", ".mismatch-back", () => {
                this.display(ARGS.EDBLSourceID, ARGS.Query);
            });

            components.details.on("click", ".dbi-report-mapping", async (event) => {
                const target = $(event.currentTarget).parent();
                const record = data[parseInt(target.attr("index"), 10)];

                const update = [];

                if (record) {
                    const user = await Database.UserDetails();
                    const customer = await Database.LookupCustomer(distributor.EDBLSource);
                    const start = new Date();
                    const deadline = new Date();

                    deadline.setDate(deadline.getDate() + 7);

                    let link = "https";

                    link += "://";
                    link += "dsdlink.com/";
                    link += "aspx1";
                    link += "/Home?DashboardID=100100";
                    link += "&TableName=Products";
                    link += "&SubTableJoinID=ZZ_VendorProducts_Products";
                    link += `&Parameters=F:ProductID~V:${record.ProductID}~O:E`;

                    let body = "";

                    body += "Data Integrity Alert<br>";

                    if (user.Name) {
                        body += "<br>";
                        body += `Reported By: ${user.Name}<br>`;
                    }

                    if (user.Email) {
                        body += `Email: ${user.Email}<br>`;
                    }

                    body += "<br>";
                    body += "Distributor Details<br>";
                    body += `DSD Link ID: ${distributor.EDBLSource}<br>`;
                    body += `Company: ${customer.Company}<br>`;

                    body += "<br>";
                    body += "Product Details<br>";
                    body += `Product ID: ${record.ProductID}<br>`;
                    body += `Product: <a href='${link}'>${record.Product}</a><br>`;
                    body += `Supplier Product Number: ${record.ProductNum}<br>`;
                    body += `Supplier ID: ${record.SupplierID}<br>`;
                    body += `Supplier: ${record.Supplier}<br>`;
                    body += `Brand ID: ${record.BrandID}<br>`;

                    body += "<br>";
                    body += "Current Mapping (Invalid)<br>";
                    body += `Product ID: ${record.ProductID}<br>`;
                    body += `Product: ${record.Product}<br>`;
                    body += `Supplier Product Number: ${record.MappedProductNum}<br>`;
                    body += `Supplier: ${record.MappedSupplier}<br>`;

                    update.push({
                        Task: `Data Integrity Missmapped Product - ${customer.Company}`,
                        ObjectiveTypeID: 6,
                        ObjectiveID: 432,
                        TaskStatusID: 27,
                        CustomField505: 1924,
                        AssignToUserID: 15495,
                        CustomerID: customer.CustomerID,
                        StartDate: Main.formatDate(start),
                        Deadline: Main.formatDate(deadline),
                        TaskDetail: body
                    });
                }

                Server.log(update);

                Database.CreateTask(update).then(() => {
                    this.dsd.app.alert("Mismapping reported.");
                });
            });
        }
    }

    async productNumbersReport(components, key, distributor) {
        if (key === this.key) {
            components.details.off("click");
            components.details.html(this.dsd.app.spinner);

            const data = await Database.QualityReport("ProductNumbers", distributor.EDBLSourceID, [...new Set(this.suppliers.map(s => s.SupplierID))]);

            let html = "";

            /*
            {
                ProductID,
                Product,
                ProductNum,
                MappedProductNum
            }
            */

            for (let i = 0; i < data.length; i++) {
                const { ...row } = data[i];

                html += `
                    <tr>
                        <td class="svs-em-cell">${row.Product}</td>
                        <td>${row.ProductNum}</td>
                        <td>${row.MappedProductNum}</td>
                    </tr>
                `;
            }

            components.details.html(`
                <h1 class="svs-mobile-hide">Distributor</h1>

                <div class="fieldset svs-mobile-hide">
                    <div class="dist-title">${distributor.EDBLSource}</div>
                    <div>${[...new Set(distributor.Locations.map(loc => `${loc.DBA}, ${loc.City}, ${loc.State}`))].join("</div><div>")}</div>
                </div>

                <h1 class="svs-mobile-hide">Invalid Product Numbers</h1>

                <div class="fieldset nested-report">
                    <div class="row">
                        <div class="svs-button product-num-back">Back</div>
                    </div>

                    <table class="svs-table" cellspacing="0">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Product Number</th>
                                <th>Invalid Product Number</th>
                            </tr>
                        </thead>

                        <tbody class="data-body">
                            ${html}
                        </tbody>
                    </table>
                </div>
            `);

            components.details.on("click", ".product-num-back", () => {
                this.display(ARGS.EDBLSourceID, ARGS.Query);
            });
        }
    }

    download(components, distributor, key, url, filename) {
        if (key === this.key) {
            components.details.off("click");

            EC_Fmt.DownloadFileFromURL(url, filename);

            components.details.html(`
                <h1 class="svs-mobile-hide">Distributor</h1>

                <div class="fieldset svs-mobile-hide">
                    <div class="dist-title">${distributor.EDBLSource}</div>
                    <div>${[...new Set(distributor.Locations.map(loc => `${loc.DBA}, ${loc.City}, ${loc.State}`))].join("</div><div>")}</div>
                </div>

                <h1 class="svs-mobile-hide">Downloading</h1>

                <div class="fieldset">
                    <div class="row">
                        This could take several minutes.<br />
                        <br />
                        Preparing the data for export, this can take some time.<br />
                        Your download will start once the data is ready.<br />
                        <br />
                        You will need to keep this tab open until the download starts.<br />
                        <br />
                    </div>

                    <div class="row">
                        <div class="svs-button export-back">Back</div>
                    </div>
                </div>
            `);

            components.details.on("click", ".export-back", () => {
                this.display(ARGS.EDBLSourceID, ARGS.Query);
            });
        }
    }

    static parseDataPoint(value, good, warning) {
        if (value <= good) {
            return "dbi-quality-good";
        }

        if (value <= warning) {
            return "dbi-quality-warn";
        }

        return "dbi-quality-bad";
    }

    static parseNumber(value) {
        value = `${value || "0"}`;

        const sign = value.indexOf("(") >= 0 || value.indexOf("-") >= 0 ? "-" : "";

        value = value.replace(/\$/gi, "");
        value = value.replace(/%/gi, "");
        value = value.replace(/\(/gi, "");
        value = value.replace(/\)/gi, "");
        value = value.replace(/-/gi, "");
        value = value.replace(/,/gi, "");
        value = value.replace(/ /gi, "");

        return parseFloat(`${sign}${value}`);
    }

    static formatNumber(value, percesion, options) {
        if (value < 0) {
            return `<span style="color: #b00b0b;">(${(options || {}).prefix || ""}${value.toFixed(percesion || 0).replace(/-/gi, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",")}${(options || {}).suffix || ""})</span>`;
        }

        return `${(options || {}).prefix || ""}${value.toFixed(percesion || 0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}${(options || {}).suffix || ""}`;
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

        return `${date.getFullYear()}-${Main.right(`0${(date.getMonth() + 1)}`, 2)}-${Main.right(`0${date.getDate()}`, 2)}`;
    }

    static datediff(first, second) {
        return Math.round((second - first) / (1000 * 60 * 60 * 24));
    }

    static uniqueFileName(date) {
        const now = new Date();

        if (date && date !== "") {
            date = EC_Fmt.ToDate(date);

            return `${date.getFullYear()}_${date.getMonth()}_${date.getDate()}_${now.getFullYear()}${now.getMonth()}${now.getDate()}`;
        }

        return `${now.getFullYear()}${now.getMonth()}${now.getDate()}`;
    }
}
