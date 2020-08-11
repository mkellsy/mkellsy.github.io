class Database {
    static async EarliestDate(suppliers) {
        const key = btoa(`DBI:InvEarliestDate:${suppliers.map(s => s.SupplierID).join("^")}`);
        const request = new ECP.EC_Request("DBI_Inventory_Earliest");

        let date = DSDLink.getCache(key);

        if (!date) {
            request.AddParameter("SupplierID", suppliers.join("^"));

            date = (Server.parseResponse(await request.Submit()) || [])[0].Date;
            DSDLink.setCache(key, date, 1000 * 60 * 60 * 3);
        }

        return new Date(date);
    }

    static Inventory(suppliers, period, refresh) {
        Server.log(suppliers);

        return new Promise((resolve) => {
            const key = btoa(`DBI:LZC:Depletions:${period}:${suppliers.map(s => s.SupplierID).join("^")}`);

            let start = null;
            let end = null;

            switch (period) {
                case "YTD":
                    end = new Date();
                    start = new Date(`1/1/${end.getFullYear()}`);
                    break;

                case "Month":
                    end = new Date();
                    start = new Date(`1/${end.getMonth() + 1}/${end.getFullYear()}`);
                    break;

                default:
                    end = new Date();
                    start = new Date();
                    start.setDate(end.getDate() - 91);
                    break;
            }

            Database.EarliestDate(suppliers).then((earliest) => {
                if (earliest && start && earliest.getTime() > start.getTime()) {
                    start = earliest;
                }

                Server.log(start);
                Server.log(end);

                const commands = [
                    {
                        command: "DBI_Starting_Inventory",
                        paramaters: [
                            {
                                name: "StartDate",
                                value: Database.formatDate(start)
                            }
                        ]
                    },
                    {
                        command: "DBI_Inventory_Sales",
                        paramaters: [
                            {
                                name: "StartDate",
                                value: Database.formatDate(start)
                            },
                            {
                                name: "EndDate",
                                value: Database.formatDate(end)
                            }
                        ]
                    },
                    {
                        command: "DBI_Inventory_Purchases",
                        paramaters: [
                            {
                                name: "StartDate",
                                value: Database.formatDate(start)
                            },
                            {
                                name: "EndDate",
                                value: Database.formatDate(end)
                            }
                        ]
                    },
                    {
                        command: "DBI_Current_Inventory"
                    }
                ];

                const queue = [];
                const processed = {};

                let results = DSDLink.getCompress(key);

                if (!results || refresh) {
                    results = [];

                    const request = new ECP.EC_Request("DBI_Distributor_Product_List");

                    request.AddParameter("SupplierID", suppliers.join("^"));

                    request.Submit().then((response) => {
                        const data = (Server.parseResponse(response) || []);

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

                        for (let i = 0; i < data.length; i++) {
                            const { ...row } = data[i];

                            if (!processed[row.ProductID]) {
                                processed[row.ProductID] = {
                                    ProductID: parseInt(row.ProductID, 10),
                                    Number: row.ProductNum,
                                    Product: row.Product,
                                    Starting: 0,
                                    Sales: 0,
                                    Shipments: 0,
                                    Transfers: 0,
                                    OnFloor: 0,
                                    PreSales: 0,
                                    Available: 0,
                                    Locations: {}
                                };
                            }

                            processed[row.ProductID].Locations[row.LocationID] = {
                                LocationID: parseInt(row.LocationID, 10),
                                EDBLSource: row.EDBLSource,
                                DBA: row.DBA,
                                Starting: 0,
                                Sales: 0,
                                Daily: 0,
                                Shipments: 0,
                                Transfers: 0,
                                LastReceived: null,
                                OnFloor: 0,
                                PreSales: 0,
                                Available: 0
                            };
                        }
                    }).finally(() => {
                        for (let i = 0; i < commands.length; i++) {
                            Server.log(commands[i]);

                            queue.push(true);

                            const sub_request = new ECP.EC_Request(commands[i].command);

                            sub_request.AddParameter("SupplierID", suppliers.join("^"));

                            for (let j = 0; j < (commands[i].paramaters || []).length; j++) {
                                sub_request.AddParameter(commands[i].paramaters[j].name, commands[i].paramaters[j].value);
                            }

                            sub_request.Submit().then((response) => {
                                const data = (Server.parseResponse(response) || []);

                                for (let j = 0; j < data.length; j++) {
                                    const { ...row } = data[j];

                                    if (processed[row.ProductID]) {
                                        switch (commands[i].command) {
                                            case "DBI_Starting_Inventory":
                                                processed[row.ProductID].Starting += parseFloat(row.Inventory) || 0;
                                                break;

                                            case "DBI_Inventory_Sales":
                                                processed[row.ProductID].Sales += parseFloat(row.Sales) || 0;
                                                break;

                                            case "DBI_Inventory_Purchases":
                                                processed[row.ProductID].Shipments += parseFloat(row.Shipments) || 0;
                                                processed[row.ProductID].Transfers += parseFloat(row.Transfers) || 0;
                                                break;

                                            case "DBI_Current_Inventory":
                                                processed[row.ProductID].OnFloor += parseFloat(row.OnFloor) || 0;
                                                processed[row.ProductID].PreSales += parseFloat(row.PreSales) || 0;
                                                break;
                                        }

                                        if (processed[row.ProductID].Locations[row.LocationID]) {
                                            switch (commands[i].command) {
                                                case "DBI_Starting_Inventory":
                                                    processed[row.ProductID].Locations[row.LocationID].Starting += parseFloat(row.Inventory) || 0;
                                                    break;

                                                case "DBI_Inventory_Sales":
                                                    processed[row.ProductID].Locations[row.LocationID].Sales += parseFloat(row.Sales) || 0;
                                                    break;

                                                case "DBI_Inventory_Purchases":
                                                    processed[row.ProductID].Locations[row.LocationID].Shipments += parseFloat(row.Shipments) || 0;
                                                    processed[row.ProductID].Locations[row.LocationID].Transfers += parseFloat(row.Transfers) || 0;
                                                    break;

                                                case "DBI_Current_Inventory":
                                                    processed[row.ProductID].Locations[row.LocationID].OnFloor += parseFloat(row.OnFloor) || 0;
                                                    processed[row.ProductID].Locations[row.LocationID].PreSales += parseFloat(row.PreSales) || 0;
                                                    break;
                                            }
                                        }
                                    }
                                }
                            }).finally(() => {
                                queue.pop();

                                if (queue.length === 0) {
                                    const keys = Object.keys(processed);

                                    for (let j = 0; j < keys.length; j++) {
                                        const product = processed[keys[j]];
                                        const locations = [];

                                        const sub_keys = Object.keys(product.Locations);

                                        for (let k = 0; k < sub_keys.length; k++) {
                                            const location = product.Locations[sub_keys[k]];

                                            location.Available = (location.OnFloor - location.PreSales);

                                            locations.push(location);
                                        }

                                        product.Available = (product.OnFloor - product.PreSales);
                                        product.Locations = locations;

                                        results.push(product);
                                    }

                                    if (results.length > 0) {
                                        DSDLink.setCompress(key, results, 1000 * 60 * 60 * 3);
                                    }

                                    resolve(results);
                                }
                            }).catch((error) => {
                                Server.log(error);
                            });
                        }
                    }).catch((error) => {
                        Server.log(error);
                    });
                } else {
                    resolve(results);
                }
            });
        });
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

        return `${date.getFullYear()}-${Database.right(`0${(date.getMonth() + 1)}`, 2)}-${Database.right(`0${date.getDate()}`, 2)}`;
    }

    static FormatNumber(value, percesion, options) {
        if (value < 0) {
            return `<span style="color: #b00b0b;">(${(options || {}).prefix || ""}${value.toFixed(percesion || 0).replace(/-/gi, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",")}${(options || {}).suffix || ""})</span>`;
        }

        return `${(options || {}).prefix || ""}${value.toFixed(percesion || 0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}${(options || {}).suffix || ""}`;
    }
}

class Main {
    constructor(app) {
        this.key = new Date().getTime() + Math.random();

        this.toggle = {
            on: "M17 7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h10c2.76 0 5-2.24 5-5s-2.24-5-5-5zm0 8c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z",
            off: "M17 7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h10c2.76 0 5-2.24 5-5s-2.24-5-5-5zM7 15c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"
        };

        this.scroll = {
            X: 0,
            Y: 0
        };

        this.dsd = new DSDLink(app, async (application, state, family) => {
            this.tiles = application.find(".tiles");

            ARGS.Period = state.Period;
            ARGS.Sort = state.Sort;
            ARGS.Direction = state.Direction;

            if (!ARGS.Period || ARGS.Period === "") {
                ARGS.Period = "Week";
            }

            if (ARGS.Sort !== undefined || ARGS.Sort === "") {
                ARGS.Sort = 1;
            }

            if (!ARGS.Direction || ARGS.Direction === "") {
                ARGS.Direction = "Desc";
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

            Server.log(this.suppliers);

            this.tiles.on("click", ".tile", (event) => {
                this.tiles.addClass("svs-mobile-hide");
                this.dsd.app.content.removeClass("svs-mobile-hide");

                const target = $(event.currentTarget);
                const action = target.attr("action");
                const value = target.attr("value");

                switch (action) {
                    case "Back":
                        this.display(ARGS.Period, ARGS.Sort, ARGS.Direction, false);
                        break;

                    case "Cancel":
                        this.tiles.addClass("svs-mobile-hide");
                        this.dsd.app.content.removeClass("svs-mobile-hide");
                        break;

                    case "Refresh":
                        DSDLink.logState();

                        this.display(ARGS.Period, ARGS.Sort, ARGS.Direction, true);
                        break;

                    default:
                        ARGS.Period = value;

                        DSDLink.logState();

                        this.display(ARGS.Period, ARGS.Sort, ARGS.Direction, false);
                        break;
                }
            });

            this.display(ARGS.Period, ARGS.Sort, ARGS.Direction, false);
        }, (application, state) => {
            this.tiles = application.find(".tiles");

            ARGS.Period = state.Period;
            ARGS.Sort = state.Sort;
            ARGS.Direction = state.Direction;

            if (!ARGS.Period || ARGS.Period === "") {
                ARGS.Period = "YTD";
            }

            if (ARGS.Sort !== undefined || ARGS.Sort === "") {
                ARGS.Sort = 1;
            }

            if (!ARGS.Direction || ARGS.Direction === "") {
                ARGS.Direction = "Desc";
            }

            this.display(ARGS.Period, ARGS.Sort, ARGS.Direction, false);
        });
    }

    async display(period, sort, direction, refresh) {
        this.tiles.find(".tile-parent").show();
        this.tiles.find(".tile-child").hide();
        this.tiles.addClass("svs-mobile-hide");
        this.dsd.app.content.removeClass("svs-mobile-hide");

        const components = this.dsd.appendSearch();

        components.form.hide();
        components.details.hide();
        components.data.html(this.dsd.app.spinner);

        this.key = new Date().getTime() + Math.random();

        this.tiles.find(".tile").each((_index, element) => {
            $(element).removeClass("tile-active").find("path").attr("d", this.toggle.off);
        });

        this.tiles.find(`.tile[action='Period'][value='${period}']`).addClass("tile-active").find("path").attr("d", this.toggle.on);

        const report = await Database.Inventory([...new Set(this.suppliers.map(s => s.SupplierID))], period, refresh);

        direction = direction || "Desc";
        sort = sort || "Available";

        Server.log(sort);
        Server.log(direction);

        report.sort((a, b) => (a[sort] || 0) - (b[sort] || 0));

        if (direction === "Desc") {
            report.reverse();
        }

        let html = "";

        /*
        {
            ProductID,
            Number,
            Product,
            Starting,
            Sales,
            Shipments,
            Transfers,
            OnFloor,
            PreSales,
            Available,
            Locations
        }
        */

        const totals = {
            Starting: 0,
            Shipments: 0,
            Sales: 0,
            Transfers: 0,
            OnFloor: 0,
            PreSales: 0,
            Available: 0
        };

        for (let i = 0; i < report.length; i++) {
            const { ...row } = report[i];

            const adjustment = parseFloat(((row.Starting + row.Shipments + row.Transfers) - row.Sales).toFixed(2));
            const difference = parseFloat((row.OnFloor - adjustment).toFixed(2));

            totals.Starting += row.Starting;
            totals.Shipments += row.Shipments;
            totals.Sales += row.Sales;
            totals.Transfers += row.Transfers;
            totals.OnFloor += row.OnFloor;
            totals.PreSales += row.PreSales;
            totals.Available += row.Available;

            html += `
                <tr index="${i}">
                    <td class="dbi-parent-cell"></td>
                    <td class="drill-cell">${row.Number}</td>
                    <td class="svs-em-cell drill-cell">${row.Product}</td>
                    <td style="text-align: right;">${Database.FormatNumber(row.Starting)}</td>
                    <td style="text-align: right;">${Database.FormatNumber(row.Shipments)}</td>
                    <td style="text-align: right;">${Database.FormatNumber(row.Sales)}</td>
                    <td style="text-align: right;">${Database.FormatNumber(row.Transfers + difference)}</td>
                    <td style="text-align: right;">${Database.FormatNumber(row.OnFloor)}</td>
                    <td style="text-align: right;">${Database.FormatNumber(row.PreSales)}</td>
                    <td style="text-align: right;">${Database.FormatNumber(row.Available)}</td>
                </tr>
            `;
        }

        const total_adjustment = parseFloat(((totals.Starting + totals.Shipments + totals.Transfers) - totals.Sales).toFixed(2));
        const total_difference = parseFloat((totals.OnFloor - total_adjustment).toFixed(2));

        components.data.html(`
            <div class="svs-mobile-only">
                <div class="row">
                    <div class="svs-button svs-button-primary mobile-only-button" action="Controls" style="margin: 7px 0 0 0;">Edit Report</div>
                </div>
            </div>

            <table class="svs-table dbi-report" cellspacing="0">
                <thead>
                    <th class="dbi-spacer-cell"></th>
                    <th></th>
                    <th>Product</th>
                    <th style="text-align: right;">Starting</th>
                    <th style="text-align: right;">Shipments</th>
                    <th style="text-align: right;">Sales</th>
                    <th style="text-align: right;">Other</th>
                    <th style="text-align: right;">On Floor</th>
                    <th style="text-align: right;">Pre Sold</th>
                    <th style="text-align: right;">Available</th>
                </thead>

                <tbody class="data-body">
                    <tr class="total-row">
                        <td class="dbi-spacer-cell"></td>
                        <td></td>
                        <td></td>
                        <td style="text-align: right;">${Database.FormatNumber(totals.Starting)}</td>
                        <td style="text-align: right;">${Database.FormatNumber(totals.Shipments)}</td>
                        <td style="text-align: right;">${Database.FormatNumber(totals.Sales)}</td>
                        <td style="text-align: right;">${Database.FormatNumber(totals.Transfers + total_difference)}</td>
                        <td style="text-align: right;">${Database.FormatNumber(totals.OnFloor)}</td>
                        <td style="text-align: right;">${Database.FormatNumber(totals.PreSales)}</td>
                        <td style="text-align: right;">${Database.FormatNumber(totals.Available)}</td>
                    </tr>
                    ${html}
                    <tr class="total-row">
                        <td class="dbi-spacer-cell"></td>
                        <td></td>
                        <td></td>
                        <td style="text-align: right;">${Database.FormatNumber(totals.Starting)}</td>
                        <td style="text-align: right;">${Database.FormatNumber(totals.Shipments)}</td>
                        <td style="text-align: right;">${Database.FormatNumber(totals.Sales)}</td>
                        <td style="text-align: right;">${Database.FormatNumber(totals.Transfers + total_difference)}</td>
                        <td style="text-align: right;">${Database.FormatNumber(totals.OnFloor)}</td>
                        <td style="text-align: right;">${Database.FormatNumber(totals.PreSales)}</td>
                        <td style="text-align: right;">${Database.FormatNumber(totals.Available)}</td>
                    </tr>
                </tbody>
            </table>
        `);

        components.data[0].scrollTo(this.scroll.X || 0, this.scroll.Y || 0);

        components.data.off("click").on("click", ".mobile-only-button", (event) => {
            const target = $(event.currentTarget);
            const action = target.attr("action");

            switch (action) {
                case "Back":
                    this.display(ARGS.Period, ARGS.Sort, ARGS.Direction, false);
                    break;

                case "Controls":
                    this.tiles.removeClass("svs-mobile-hide");
                    this.dsd.app.content.addClass("svs-mobile-hide");
                    break;
            }
        });

        components.data.on("click", ".drill-cell", (event) => {
            const index = parseInt($(event.currentTarget).parent().attr("index"));

            this.scroll.X = components.data[0].scrollLeft;
            this.scroll.Y = components.data[0].scrollTop;

            this.key = new Date().getTime() + Math.random();
            this.displayDistributors(components, report, index, sort, direction, this.key);
        });
    }

    displayDistributors(components, report, index, sort, direction, key) {
        if (key === this.key) {
            this.tiles.find(".tile-parent").hide();
            this.tiles.find(".tile-child").show();

            direction = direction || "Desc";
            sort = sort || "Available";

            Server.log(index);

            const { ...data } = report[index];

            data.Locations.sort((a, b) => (a[sort] || 0) - (b[sort] || 0));

            if (direction === "Desc") {
                data.Locations.reverse();
            }

            let html = "";

            /*
            {
                LocationID,
                EDBLSource,
                DBA,
                Starting,
                Sales,
                Daily,
                Shipments,
                Transfers,
                LastReceived,
                OnFloor,
                PreSales,
                Available
            }
            */

            for (let i = 0; i < data.Locations.length; i++) {
                const { ...row } = data.Locations[i];

                const adjustment = parseFloat(((row.Starting + row.Shipments + row.Transfers) - row.Sales).toFixed(2));
                const difference = parseFloat((row.OnFloor - adjustment).toFixed(2));

                html += `
                    <tr>
                        <td class="dbi-child-cell"></td>
                        <td></td>
                        <td>${row.DBA}</td>
                        <td style="text-align: right;">${Database.FormatNumber(row.Starting)}</td>
                        <td style="text-align: right;">${Database.FormatNumber(row.Shipments)}</td>
                        <td style="text-align: right;">${Database.FormatNumber(row.Sales)}</td>
                        <td style="text-align: right;">${Database.FormatNumber(row.Transfers + difference)}</td>
                        <td style="text-align: right;">${Database.FormatNumber(row.OnFloor)}</td>
                        <td style="text-align: right;">${Database.FormatNumber(row.PreSales)}</td>
                        <td style="text-align: right;">${Database.FormatNumber(row.Available)}</td>
                    </tr>
                `;
            }

            const parent_adjustment = parseFloat(((data.Starting + data.Shipments + data.Transfers) - data.Sales).toFixed(2));
            const parent_difference = parseFloat((data.OnFloor - parent_adjustment).toFixed(2));

            components.data.html(`
                <div class="svs-mobile-only">
                    <div class="row">
                        <div class="svs-button mobile-only-button" action="Back" style="margin: 7px 0 0 0;">Back</div>
                    </div>
                </div>

                <table class="svs-table dbi-report" cellspacing="0">
                    <thead>
                        <th class="dbi-spacer-cell"></th>
                        <th></th>
                        <th>Location</th>
                        <th style="text-align: right;">Starting</th>
                        <th style="text-align: right;">Shipments</th>
                        <th style="text-align: right;">Sales</th>
                        <th style="text-align: right;">Other</th>
                        <th style="text-align: right;">On Floor</th>
                        <th style="text-align: right;">Pre Sold</th>
                        <th style="text-align: right;">Available</th>
                    </thead>

                    <tbody class="data-body">
                        <tr>
                            <td class="dbi-parent-cell"></td>
                            <td>${data.Number}</td>
                            <td class="svs-em-cell">${data.Product}</td>
                            <td style="text-align: right;">${Database.FormatNumber(data.Starting)}</td>
                            <td style="text-align: right;">${Database.FormatNumber(data.Shipments)}</td>
                            <td style="text-align: right;">${Database.FormatNumber(data.Sales)}</td>
                            <td style="text-align: right;">${Database.FormatNumber(data.Transfers + parent_difference)}</td>
                            <td style="text-align: right;">${Database.FormatNumber(data.OnFloor)}</td>
                            <td style="text-align: right;">${Database.FormatNumber(data.PreSales)}</td>
                            <td style="text-align: right;">${Database.FormatNumber(data.Available)}</td>
                        </tr>
                        ${html}
                    </tbody>
                </table>
            `);

            components.data[0].scrollTo(0, 0);
        }
    }
}
