class Database {
    static SupplierFamilies() {
        return new Promise((resolve) => {
            const results = [];
            const request = Public.API("DBI_Get_SupplierFamily");

            request.AddParameter("UserID", UserID, ECP.EC_Operator.Equals);

            request.Submit().then((response) => {
                const data = Server.parseResponse(response) || [];

                for (let i = 0; i < data.length; i++) {
                    const SupplierFamilyID = parseInt(data[i]["SuppliersUsers_Suppliers^Suppliers_SupplierFamilies^SupplierFamilies.SupplierFamilyID"], 10);

                    if (results.indexOf(SupplierFamilyID) === -1) {
                        results.push(SupplierFamilyID);
                    }
                }
            }).finally(() => {
                resolve(results);
            }).catch((error) => {
                Server.log(error);
            });
        });
    }

    static Suppliers(query, families) {
        return new Promise((resolve) => {
            const results = [];
            const request = Public.API("SBF_Suppliers");

            if (families && families !== "") {
                request.AddParameter("SupplierFamilyID", families, ECP.EC_Operator.Like);
            }

            if (query && query !== "") {
                request.AddParameter("Query", query, ECP.EC_Operator.Like);
            }

            request.Submit().then((response) => {
                const data = Server.parseResponse(response) || [];

                for (let j = 0; j < data.length; j++) {
                    const { ...row } = data[j];

                    let brands = (row.Brands || "").split("|");

                    brands = brands.map((item) => {
                        const values = (item || "").split("^");

                        return {
                            StrengthIndex: parseInt(values[0], 10),
                            Brand: values[1]
                        };
                    });

                    const elipse = brands.length > 4;

                    brands.sort((a, b) => (a.StrengthIndex > b.StrengthIndex ? -1 : 1));
                    brands = brands.map(item => item.Brand);
                    brands = brands.slice(0, 4);

                    if (elipse) {
                        brands.push("...");
                    }

                    results.push({
                        SupplierID: parseInt(row.SupplierID, 10),
                        Supplier: row.Supplier,
                        Logo: row.Logo,
                        Brands: brands
                    });
                }
            }).catch((error) => {
                Server.log(error);
            }).finally(() => {
                resolve(results);
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
                map: this.app.find(".map").hide(),
                content: this.app.find(".content").hide(),
                dialog: this.app.find(".svs-dialog").hide(),
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

            this.map = new DSDLinkMap(this.app.map, this.history, {
                back: () => {
                    this.display();
                }
            });

            (async () => {
                if (UserType === "Supplier") {
                    this.history.value("SupplierFamilies", (await Database.SupplierFamilies()).join("^"));
                }

                this.tabsState();
                this.display();
            })();

            window.addEventListener("popstate", () => {
                this.key = new Date().getTime() + Math.random();
                this.history.load();
                this.tabsState();
                this.display();
            });
        }
    }

    display() {
        this.key = new Date().getTime() + Math.random();

        if ((this.history.value("SupplierID") || "") !== "") {
            $("#MainLayoutHeader").hide();

            this.app.content.html("").hide();
            this.app.map.html("").show();

            this.map.displayMap();
        } else {
            this.displaySuppliers(this.key);
        }
    }

    async displaySuppliers(key) {
        if (key === this.key) {
            this.app.map.html("").hide();
            this.app.content.html(this.app.spinner).show();

            $("#MainLayoutHeader").show();

            const components = {
                content: $("<div class=\"content\"></div>"),
                form: $("<form class=\"search\" method=\"get\"></form>"),
                data: $(`<div id="data" class="data">${this.app.spinner}</div>`),
                layout: $("<div class=\"layout\"></div>"),
                search: $(`<input type="text" id="search" value="${this.history.encoded("Query") || ""}" placeholder="Search" />`)
            };

            const field = $(`
                <div class="field">
                    <div class="icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
                            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                        </svg>
                    </div>
                </div>
            `);

            field.append(components.search);

            field.append(`
                <button type="submit" class="submit">
                    Search
                </button>
            `);

            components.layout.append(components.data);

            components.form.append(field);

            components.content.append(components.form);
            components.content.append(components.layout);

            this.app.content.html("").append(components.content);
            this.suppliers = await Database.Suppliers(null, this.history.value("SupplierFamilies"));

            components.form.on("submit", async (event) => {
                event.preventDefault();

                this.history.encoded("Query", components.search.val());
                this.key = new Date().getTime() + Math.random();
                this.searchSuppliers(components, this.key);
            });

            components.data.on("click", ".show-map", (event) => {
                this.history.value("SupplierID", $(event.currentTarget).attr("value"));
                this.display();
            });

            components.data.on("click", ".show-share", (event) => {
                event.stopPropagation();

                const supplier = parseInt($(event.currentTarget).parent().attr("value"), 10);
                const url = `${"https"}://${"dsdlink.com"}/aspx1/Home?DashboardID=175197&SupplierID=${supplier}`;

                const embedded = `<iframe\n    width="100%"\n    height="100%"\n    src="${url}"\n    frameborder="0"\n    allowfullscreen\n></iframe>`;

                this.app.dialog.open(`
                    <div class="svs-dialog-title">Embedded Map</div>
                    <div class="svs-dialog-content">
                        <p class="dialog-message">
                            You can use the following embedded code to add this map to
                            your website, or use the URL to directly link to this map.
                        </p>
                        <div class="fieldset">
                            <div class="row">
                                <div class="field">
                                    <span class="title">Embedded Code</span>
                                    <textarea style="white-space: pre;" readonly>${Main.htmlEntities(embedded)}</textarea>
                                </div>
                            </div>
                            <div class="row">
                                <div class="field">
                                    <span class="title">Link URL</span>
                                    <input type="text" value="${url}" readonly>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="svs-dialog-actions">
                        <div id="CloseShare" class="svs-button svs-button-primary">Close</div>
                    </div>
                `);

                this.app.dialog.find(".svs-dialog-inner").css("width", "650px");

                this.app.dialog.action("#CloseShare", () => {
                    this.app.dialog.close();
                });
            });

            this.searchSuppliers(components, this.key);
        }
    }

    async searchSuppliers(components, key) {
        if (key === this.key) {
            components.data.html(this.app.spinner);

            this.filtered = this.suppliers;

            const query = this.history.encoded("Query");

            if (query && query !== "") {
                this.filtered = await Database.Suppliers(query, this.history.value("SupplierFamilies"));
            }

            let html = "";

            for (let i = 0; i < this.filtered.length; i++) {
                const { ...row } = this.filtered[i];

                html += `
                    <tr class="show-map" value="${row.SupplierID}">
                        <td class="dbi-parent-cell"></td>
                        <td class="svs-mobile-hide data-center data-shrink">
                            ${row.Logo && row.Logo !== "" ? `<img src="${row.Logo}">` : ""}
                        </td>
                        <td class="svs-em-cell">${Data.titleCase(row.Supplier)}</td>
                        <td class="svs-mobile-hide">${row.Brands.map(brand => Data.titleCase(brand)).join("<br>")}</td>
                        <td class="show-share data-shrink svs-mobile-hide">
                            <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
                                <path fill="#000" d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" />
                            </svg>
                        </td>
                    </tr>
                `;
            }

            if (html !== "") {
                components.data.html(`
                    <table class="svs-table" cellspacing="0">
                        <thead class="svs-mobile-hide">
                            <tr>
                                <th class="dbi-spacer-cell"></th>
                                <th class="svs-mobile-hide"></th>
                                <th>Supplier</th>
                                <th class="svs-mobile-hide">Brands</th>
                                <th></th>
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

            components.data[0].scrollTo(0, 0);
        }
    }

    tabsState() {
        $(".MainLayoutTabs a").each((index, element) => {
            const url = $(element).attr("href");

            if (url && (url.split("?")[0] || "").toLowerCase() === "home") {
                const params = url.split("?").pop().split("&").filter(p => (p.split("=")[0] || "").toLowerCase() !== "supplierfamilies" && (p.split("=")[0] || "").toLowerCase() !== "debug");

                if (UserType !== "Supplier" && (this.history.parameters.SupplierFamilies || "") !== "" && (this.history.parameters.SupplierFamilies || "") !== "NaN") {
                    params.push(`SupplierFamilies=${this.history.parameters.SupplierFamilies}`);
                }

                if (window.debug) {
                    params.push("Debug=True");
                }

                $(element).attr("href", `Home?${params.join("&")}`);
            }
        });
    }

    static htmlEntities(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }
}
