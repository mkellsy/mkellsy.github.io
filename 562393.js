class Database {
    static ParseNumber(value) {
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

    static ParsePeriod(period) {
        switch (period) {
            case "Month":
                return 25;

            case "Week":
                return 7;

            default:
                return 41;
        }
    }

    static ParsePrefix(value) {
        switch (value) {
            case "Price":
                return "$";

            default:
                return "";
        }
    }

    static ParsePrecision(value) {
        switch (value) {
            case "Price":
                return 2;

            default:
                return 0;
        }
    }

    static async Sales(suppliers, groupby, period, value, refresh) {
        const key = btoa(`DBI:LZC:Sales:B:${period}:${suppliers.join("^")}`);

        Server.log(suppliers);

        const totals = {};
        const years = [];

        let records = DSDLink.getCompress(key);

        if (!records || refresh) {
            const request = new ECP.EC_Request("DBI_Sales");

            request.AddParameter("Period", Database.ParsePeriod(period));
            request.AddParameter("SupplierID", suppliers.join("^"));

            records = Server.parseResponse(await request.Submit()) || [];

            DSDLink.setCompress(key, records, 1000 * 60 * 60 * 3);
        }

        const data = [];

        for (let i = 0; i < records.length; i++) {
            const { ...row } = records[i];
            const parent = data.findIndex(r => r.GroupBy === (row[groupby] || "(Unknown)"));

            if (years.indexOf(Database.ParseNumber(row.Year)) === -1) {
                years.push(Database.ParseNumber(row.Year));
            }

            if (parent >= 0) {
                const child = data[parent].Locations.findIndex(r => r.GroupBy === (row.EDBLSource || "(Unknown)"));

                if (child >= 0) {
                    data[parent].Locations[child][row.Year] = data[parent].Locations[child][row.Year] || 0;
                    data[parent].Locations[child][row.Year] += Database.ParseNumber(row[value]) || 0;

                    data[parent][row.Year] = data[parent][row.Year] || 0;
                    data[parent][row.Year] += Database.ParseNumber(row[value]) || 0;
                } else {
                    const sub = {
                        GroupBy: row.EDBLSource || "(Unknown)",
                        GroupByID: parseInt(row.EDBLSourceID) || 0
                    };

                    sub[row.Year] = sub[row.Year] || 0;
                    sub[row.Year] += Database.ParseNumber(row[value]) || 0;

                    data[parent][row.Year] = data[parent][row.Year] || 0;
                    data[parent][row.Year] += Database.ParseNumber(row[value]) || 0;

                    data[parent].Locations.push(sub);
                }
            } else {
                const sub = {
                    GroupBy: row.EDBLSource || "(Unknown)",
                    GroupByID: parseInt(row.EDBLSourceID) || 0
                };

                sub[row.Year] = sub[row.Year] || 0;
                sub[row.Year] += Database.ParseNumber(row[value]) || 0;

                const record = {
                    GroupBy: row[groupby] || "(Unknown)",
                    GroupByID: parseInt(row[`${groupby}ID`]) || 0,
                    Locations: [sub]
                };

                record[row.Year] = record[row.Year] || 0;
                record[row.Year] += Database.ParseNumber(row[value]) || 0;

                data.push(record);
            }

            totals[row.Year] = totals[row.Year] || 0;
            totals[row.Year] += Database.ParseNumber(row[value]) || 0;
        }

        years.sort();

        return {
            years: years.map(y => y.toString()),
            data,
            totals
        };
    }

    static async CustomerSales(source, suppliers, parent, groupby, period, value) {
        const data = [];

        const request = new ECP.EC_Request("DBI_Customer_Sales");

        request.AddParameter("Period", Database.ParsePeriod(period));
        request.AddParameter("SupplierID", suppliers.join("^"));
        request.AddParameter("EDBLSourceID", source);

        Server.log(source);
        Server.log(groupby);
        Server.log(parent);

        switch (groupby) {
            case "Segment":
                request.AddParameter("SegmentID", parent);
                request.AddParameter("BrandID", "");
                request.AddParameter("ProductID", "");
                break;

            case "Brand":
                request.AddParameter("SegmentID", "");
                request.AddParameter("BrandID", parent);
                request.AddParameter("ProductID", "");
                break;

            case "Product":
                request.AddParameter("SegmentID", "");
                request.AddParameter("BrandID", "");
                request.AddParameter("ProductID", parent);
                break;
        }

        request.AddParameter(`${groupby}ID`, parent);

        const records = Server.parseResponse(await request.Submit()) || [];

        for (let i = 0; i < records.length; i++) {
            const { ...row } = records[i];

            const parent = data.findIndex(r => r.GroupByID === (parseInt(row.CustomerID, 10) || 0));

            if (parent >= 0) {
                data[parent][row.Year] = data[parent][row.Year] || 0;
                data[parent][row.Year] += Database.ParseNumber(row[value]) || 0;
            } else {
                const record = {
                    GroupBy: row.Customer || "(Unknown)",
                    GroupByID: parseInt(row.CustomerID, 10) || 0
                };

                record[row.Year] = record[row.Year] || 0;
                record[row.Year] += Database.ParseNumber(row[value]) || 0;

                data.push(record);
            }
        }

        return data;
    }

    static PercentDiff(last, current) {
        if ((last || 0) === 0 && (current || 0) === 0) {
            return 0;
        }

        if ((last || 0) === 0) {
            return (current || 0) >= 0 ? 100 : -100;
        }

        return (((current || 0) - (last || 0)) / Math.abs(last || 1)) * 100;
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
            parent: {
                X: 0,
                Y: 0
            },
            child: {
                X: 0,
                Y: 0
            }
        };

        this.level = "parent";
        this.parent = 0;
        this.child = 0;

        this.dsd = new DSDLink(app, async (application, state, family) => {
            this.tiles = application.find(".tiles");

            ARGS.GroupBy = state.GroupBy;
            ARGS.Period = state.Period;
            ARGS.Value = state.Value;
            ARGS.Sort = state.Sort;
            ARGS.Direction = state.Direction;

            if (!ARGS.GroupBy || ARGS.GroupBy === "") {
                ARGS.GroupBy = "Brand";
            }

            if (!ARGS.Period || ARGS.Period === "") {
                ARGS.Period = "YTD";
            }

            if (!ARGS.Value || ARGS.Value === "") {
                ARGS.Value = "Unit";
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

            this.display(ARGS.GroupBy, ARGS.Period, ARGS.Value, ARGS.Sort, ARGS.Direction, false);
        }, (application, state) => {
            this.tiles = application.find(".tiles");

            ARGS.GroupBy = state.GroupBy;
            ARGS.Period = state.Period;
            ARGS.Value = state.Value;
            ARGS.Sort = state.Sort;
            ARGS.Direction = state.Direction;

            if (!ARGS.GroupBy || ARGS.GroupBy === "") {
                ARGS.GroupBy = "Brand";
            }

            if (!ARGS.Period || ARGS.Period === "") {
                ARGS.Period = "YTD";
            }

            if (!ARGS.Value || ARGS.Value === "") {
                ARGS.Value = "Unit";
            }

            if (ARGS.Sort !== undefined || ARGS.Sort === "") {
                ARGS.Sort = 1;
            }

            if (!ARGS.Direction || ARGS.Direction === "") {
                ARGS.Direction = "Desc";
            }

            this.display(ARGS.GroupBy, ARGS.Period, ARGS.Value, ARGS.Sort, ARGS.Direction, false);
        });
    }

    async display(groupby, period, value, sort, direction, refresh) {
        this.tiles.find(".tile-parent").show();
        this.tiles.find(".tile-child").hide();
        this.tiles.addClass("svs-mobile-hide");
        this.dsd.app.content.removeClass("svs-mobile-hide");

        this.level = "parent";
        this.parent = 0;
        this.child = 0;

        const components = this.dsd.appendSearch();

        components.form.hide();
        components.details.hide();
        components.data.html(this.dsd.app.spinner);

        this.key = new Date().getTime() + Math.random();

        this.tiles.find(".tile").each((_index, element) => {
            $(element).removeClass("tile-active").find("path").attr("d", this.toggle.off);
        });

        this.tiles.find(`.tile[action='GroupBy'][value='${groupby}']`).addClass("tile-active").find("path").attr("d", this.toggle.on);
        this.tiles.find(`.tile[action='Period'][value='${period}']`).addClass("tile-active").find("path").attr("d", this.toggle.on);
        this.tiles.find(`.tile[action='Value'][value='${value}']`).addClass("tile-active").find("path").attr("d", this.toggle.on);

        const report = await Database.Sales([...new Set(this.suppliers.map(s => s.SupplierID))], groupby, period, value, refresh);

        direction = direction || "Desc";
        sort = sort || report.years[report.years.length - 1];

        Server.log(sort);
        Server.log(direction);

        report.data.sort((a, b) => (a[sort] || 0) - (b[sort] || 0));

        if (direction === "Desc") {
            report.data.reverse();
        }

        let html = "";

        for (let i = 0; i < report.data.length; i++) {
            const { ...row } = report.data[i];

            let values = "";

            for (let j = 0; j < report.years.length; j++) {
                values += `<td style="text-align: right;">${Database.FormatNumber(row[report.years[j]] || 0, Database.ParsePrecision(value), { prefix: Database.ParsePrefix(value) })}</td>`;
            }

            html += `
                <tr level="parent" index="${i}">
                    <td class="dbi-parent-cell"></td>
                    <td class="svs-em-cell drill-cell">${row.GroupBy}</td>
                    ${values}
                    ${report.years.length > 1 ? `<td style="text-align: right;">${Database.FormatNumber(Database.PercentDiff(row[report.years[report.years.length - 2]] || 0, row[report.years[report.years.length - 1]] || 0), 1, { suffix: "%" })}</td>` : ""}
                </tr>
            `;
        }

        let columns = "";

        for (let i = 0; i < report.years.length; i++) {
            columns += `<th style="text-align: right;">${report.years[i]}</th>`;
        }

        let totals = "";

        for (let i = 0; i < report.years.length; i++) {
            totals += `<td style="text-align: right;">${Database.FormatNumber(report.totals[report.years[i]] || 0, Database.ParsePrecision(value), { prefix: Database.ParsePrefix(value) })}</td>`;
        }

        components.data.html(`
            <div class="svs-mobile-only">
                <div class="row">
                    <div class="svs-button svs-button-primary mobile-only-button" action="Controls" style="margin: 7px 0 0 0;">Edit Report</div>
                </div>
            </div>

            <table class="svs-table dbi-report" cellspacing="0">
                <thead>
                    <tr>
                        <th class="dbi-spacer-cell"></th>
                        <th>${groupby}</th>
                        ${columns}
                        ${report.years.length > 1 ? "<th style=\"text-align: right;\">Difference</th>" : ""}
                    </tr>
                </thead>

                <tbody class="data-body">
                    <tr class="total-row">
                        <td class="dbi-spacer-cell"></td>
                        <td></td>
                        ${totals}
                        ${report.years.length > 1 ? `<td style="text-align: right;">${Database.FormatNumber(Database.PercentDiff(report.totals[report.years[report.years.length - 2]] || 0, report.totals[report.years[report.years.length - 1]] || 0), 1, { suffix: "%" })}</td>` : ""}
                    </tr>
                    ${html}
                    <tr class="total-row">
                        <td class="dbi-spacer-cell"></td>
                        <td></td>
                        ${totals}
                        ${report.years.length > 1 ? `<td style="text-align: right;">${Database.FormatNumber(Database.PercentDiff(report.totals[report.years[report.years.length - 2]] || 0, report.totals[report.years[report.years.length - 1]] || 0), 1, { suffix: "%" })}</td>` : ""}
                    </tr>
                </tbody>
            </table>
        `);

        components.data[0].scrollTo(this.scroll.parent.X || 0, this.scroll.parent.Y || 0);

        components.data.off("click").on("click", ".drill-cell", (event) => {
            const trigger = $(event.currentTarget).parent();
            const level = trigger.attr("level");
            const index = parseInt(trigger.attr("index"));

            this.key = new Date().getTime() + Math.random();

            switch (level) {
                case "parent":
                    this.scroll.parent.X = components.data[0].scrollLeft;
                    this.scroll.parent.Y = components.data[0].scrollTop;
                    this.scroll.child.X = 0;
                    this.scroll.child.Y = 0;

                    this.parent = index;
                    this.child = 0;

                    this.displayDistributors(components, report, groupby, columns, value, sort, direction, this.key);
                    break;

                case "child":
                    this.scroll.child.X = components.data[0].scrollLeft;
                    this.scroll.child.Y = components.data[0].scrollTop;

                    this.child = index;

                    this.displayCustomers(components, report, groupby, columns, period, value, sort, direction, this.key);
                    break;
            }
        }).on("click", ".mobile-only-button", (event) => {
            const target = $(event.currentTarget);
            const action = target.attr("action");

            switch (action) {
                case "Back":
                    switch (this.level) {
                        case "detail":
                            this.displayDistributors(components, report, groupby, columns, value, sort, direction, this.key);
                            break;

                        default:
                            this.display(ARGS.GroupBy, ARGS.Period, ARGS.Value, ARGS.Sort, ARGS.Direction, false);
                            break;
                    }

                    break;

                case "Controls":
                    this.tiles.removeClass("svs-mobile-hide");
                    this.dsd.app.content.addClass("svs-mobile-hide");
                    break;
            }
        });

        this.tiles.off("click").on("click", ".tile", (event) => {
            this.tiles.addClass("svs-mobile-hide");
            this.dsd.app.content.removeClass("svs-mobile-hide");

            const target = $(event.currentTarget);
            const action = target.attr("action");
            const value = target.attr("value");

            switch (action) {
                case "Back":
                    switch (this.level) {
                        case "detail":
                            this.displayDistributors(components, report, groupby, columns, value, sort, direction, this.key);
                            break;

                        default:
                            this.display(ARGS.GroupBy, ARGS.Period, ARGS.Value, ARGS.Sort, ARGS.Direction, false);
                            break;
                    }

                    break;

                case "Cancel":
                    this.tiles.addClass("svs-mobile-hide");
                    this.dsd.app.content.removeClass("svs-mobile-hide");
                    break;

                case "Refresh":
                    this.display(ARGS.GroupBy, ARGS.Period, ARGS.Value, ARGS.Sort, ARGS.Direction, true);
                    break;

                case "Value":
                    ARGS.Value = value;

                    DSDLink.logState();

                    this.display(ARGS.GroupBy, ARGS.Period, ARGS.Value, ARGS.Sort, ARGS.Direction, false);
                    break;

                case "Period":
                    ARGS.Period = value;

                    DSDLink.logState();

                    this.display(ARGS.GroupBy, ARGS.Period, ARGS.Value, ARGS.Sort, ARGS.Direction, false);
                    break;

                default:
                    ARGS.GroupBy = value;

                    DSDLink.logState();

                    this.display(ARGS.GroupBy, ARGS.Period, ARGS.Value, ARGS.Sort, ARGS.Direction, false);
                    break;
            }
        });
    }

    displayDistributors(components, report, _groupby, columns, value, sort, direction, key) {
        if (key === this.key) {
            this.tiles.find(".tile-parent").hide();
            this.tiles.find(".tile-child").show();

            this.level = "child";

            components.data.html(this.dsd.app.spinner);

            direction = direction || "Desc";
            sort = sort || report.years[report.years.length - 1];

            const { ...data } = report.data[this.parent];

            data.Locations.sort((a, b) => (a[sort] || 0) - (b[sort] || 0));

            if (direction === "Desc") {
                data.Locations.reverse();
            }

            let html = "";
            let values = "";

            for (let i = 0; i < data.Locations.length; i++) {
                const { ...row } = data.Locations[i];

                values = "";

                for (let j = 0; j < report.years.length; j++) {
                    values += `<td style="text-align: right;">${Database.FormatNumber(row[report.years[j]] || 0, Database.ParsePrecision(value), { prefix: Database.ParsePrefix(value) })}</td>`;
                }

                html += `
                    <tr level="child" index="${i}">
                        <td class="dbi-child-cell"></td>
                        <td class="dbi-indent-cell drill-cell">${row.GroupBy}</td>
                        ${values}
                        ${report.years.length > 1 ? `<td style="text-align: right;">${Database.FormatNumber(Database.PercentDiff(row[report.years[report.years.length - 2]] || 0, row[report.years[report.years.length - 1]] || 0), 1, { suffix: "%" })}</td>` : ""}
                    </tr>
                `;
            }

            values = "";

            for (let i = 0; i < report.years.length; i++) {
                values += `<td style="text-align: right;">${Database.FormatNumber(data[report.years[i]] || 0, Database.ParsePrecision(value), { prefix: Database.ParsePrefix(value) })}</td>`;
            }

            components.data.html(`
                <div class="svs-mobile-only">
                    <div class="row">
                        <div class="svs-button mobile-only-button" action="Back" style="margin: 7px 0 0 0;">Back</div>
                    </div>
                </div>

                <table class="svs-table dbi-report" cellspacing="0">
                    <thead>
                        <th class="dbi-spacer-cell"></th>
                        <th>Distributor</th>
                        ${columns}
                        ${report.years.length > 1 ? "<th style=\"text-align: right;\">Difference</th>" : ""}
                    </thead>

                    <tbody class="data-body">
                        <tr>
                            <td class="dbi-parent-cell"></td>
                            <td class="svs-em-cell">${data.GroupBy}</td>
                            ${values}
                            ${report.years.length > 1 ? `<td style="text-align: right;">${Database.FormatNumber(Database.PercentDiff(data[report.years[report.years.length - 2]] || 0, data[report.years[report.years.length - 1]] || 0), 1, { suffix: "%" })}</td>` : ""}
                        </tr>
                        ${html}
                        <tr class="total-row">
                            <td class="dbi-spacer-cell"></td>
                            <td></td>
                            ${values}
                            ${report.years.length > 1 ? `<td style="text-align: right;">${Database.FormatNumber(Database.PercentDiff(data[report.years[report.years.length - 2]] || 0, data[report.years[report.years.length - 1]] || 0), 1, { suffix: "%" })}</td>` : ""}
                        </tr>
                    </tbody>
                </table>
            `);

            components.data[0].scrollTo(this.scroll.child.X || 0, this.scroll.child.Y || 0);
        }
    }

    async displayCustomers(components, report, groupby, columns, period, value, sort, direction, key) {
        if (key === this.key) {
            this.tiles.find(".tile-parent").hide();
            this.tiles.find(".tile-child").show();

            this.level = "detail";

            components.data.html(this.dsd.app.spinner);

            const { ...parent } = report.data[this.parent];
            const { ...child } = parent.Locations[this.child];

            let html = "";
            let values = "";
            let customers = [];

            if (parent.GroupByID && child.GroupByID) {
                customers = await Database.CustomerSales(child.GroupByID, [...new Set(this.suppliers.map(s => s.SupplierID))], parent.GroupByID, groupby, period, value);
            }

            direction = direction || "Desc";
            sort = sort || report.years[report.years.length - 1];

            customers.sort((a, b) => (a[sort] || 0) - (b[sort] || 0));

            if (direction === "Desc") {
                customers.reverse();
            }

            for (let i = 0; i < customers.length; i++) {
                const { ...row } = customers[i];

                values = "";

                for (let j = 0; j < report.years.length; j++) {
                    values += `<td style="text-align: right;">${Database.FormatNumber(row[report.years[j]] || 0, Database.ParsePrecision(value), { prefix: Database.ParsePrefix(value) })}</td>`;
                }

                html += `
                    <tr index="${i}">
                        <td class="dbi-child-cell"></td>
                        <td class="dbi-indent-cell">${row.GroupBy}</td>
                        ${values}
                        ${report.years.length > 1 ? `<td style="text-align: right;">${Database.FormatNumber(Database.PercentDiff(row[report.years[report.years.length - 2]] || 0, row[report.years[report.years.length - 1]] || 0), 1, { suffix: "%" })}</td>` : ""}
                    </tr>
                `;
            }

            values = "";

            for (let i = 0; i < report.years.length; i++) {
                values += `<td style="text-align: right;">${Database.FormatNumber(child[report.years[i]] || 0, Database.ParsePrecision(value), { prefix: Database.ParsePrefix(value) })}</td>`;
            }

            components.data.html(`
                <div class="svs-mobile-only">
                    <div class="row">
                        <div class="svs-button mobile-only-button" action="Back" style="margin: 7px 0 0 0;">Back</div>
                    </div>
                </div>

                <table class="svs-table dbi-report" cellspacing="0">
                    <thead>
                        <th class="dbi-spacer-cell"></th>
                        <th>Retailer</th>
                        ${columns}
                        ${report.years.length > 1 ? "<th style=\"text-align: right;\">Difference</th>" : ""}
                    </thead>

                    <tbody class="data-body">
                        <tr>
                            <td class="dbi-parent-cell"></td>
                            <td class="svs-em-cell">${child.GroupBy}</td>
                            ${values}
                            ${report.years.length > 1 ? `<td style="text-align: right;">${Database.FormatNumber(Database.PercentDiff(child[report.years[report.years.length - 2]] || 0, child[report.years[report.years.length - 1]] || 0), 1, { suffix: "%" })}</td>` : ""}
                        </tr>
                        ${html}
                        <tr class="total-row">
                            <td class="dbi-spacer-cell"></td>
                            <td></td>
                            ${values}
                            ${report.years.length > 1 ? `<td style="text-align: right;">${Database.FormatNumber(Database.PercentDiff(child[report.years[report.years.length - 2]] || 0, child[report.years[report.years.length - 1]] || 0), 1, { suffix: "%" })}</td>` : ""}
                        </tr>
                    </tbody>
                </table>
            `);

            components.data[0].scrollTo(this.scroll.child.X || 0, this.scroll.child.Y || 0);
        }
    }
}
