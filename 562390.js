class Database {
    static Dashboards() {
        const results = [];

        $(".MainLayoutTabs").find(".PageTab").each((_index, element) => {
            const link = $(element).attr("href");
            const display = $(element).find(".InnerTab").html();

            if (link && link !== "") {
                const values = (link.split("?").pop() || "").split("&").map((item) => {
                    const parts = item.split("=");

                    return {
                        key: parts[0],
                        value: parts[1],
                        display
                    };
                });

                for (let i = 0; i < values.length; i++) {
                    if (values[i].key === "DashboardID" && !Number.isNaN(parseInt(values[i].value, 10))) {
                        results.push({
                            DashboardID: parseInt(values[i].value, 10),
                            Display: display
                        });
                    }
                }
            }
        });

        return results;
    }

    static DashboardTitle(dashboard) {
        switch (dashboard.DashboardID) {
            case 174380:
                return "Brand Identity";

            case 174381:
                return "Distributor Management";

            case 174533:
                return "Sales";

            case 176454:
                return "Inventory";

            case 174918:
                return "Ad Campaigns";

            default:
                return dashboard.Display;
        }
    }

    static DashboardIcon(dashboard) {
        switch (dashboard.DashboardID) {
            case 175124:
                return "M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z";

            case 174380:
                return "M13 12h7v1.5h-7zm0-2.5h7V11h-7zm0 5h7V16h-7zM21 4H3c-1.1 0-2 .9-2 2v13c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 15h-9V6h9v13z";

            case 174381:
                return "M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z";

            case 174533:
                return "M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z";

            case 174918:
                return "M3.24 6.15C2.51 6.43 2 7.17 2 8v12c0 1.1.89 2 2 2h16c1.11 0 2-.9 2-2V8c0-1.11-.89-2-2-2H8.3l8.26-3.34L15.88 1 3.24 6.15zM7 20c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm13-8h-2v-2h-2v2H4V8h16v4z";

            case 176454:
                return "M13,9.5h5v-2h-5V9.5z M13,16.5h5v-2h-5V16.5z M19,21H5c-1.1,0-2-0.9-2-2V5 c0-1.1,0.9-2,2-2h14c1.1,0,2,0.9,2,2v14C21,20.1,20.1,21,19,21z M6,11h5V6H6V11z M7,7h3v3H7V7z M6,18h5v-5H6V18z M7,14h3v3H7V14z";

            default:
                return "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z";
        }
    }
}

class Main {
    constructor(app) {
        this.key = new Date().getTime() + Math.random();

        this.dsd = new DSDLink(app, async (application, state, family) => {
            if (family && family !== "") {
                ARGS.SupplierFamilies = family.join(",");
            }

            DSDLink.tabsState();

            if (family && family.length > 0) {
                this.suppliers = await DSDLink.Supplier(family);
            } else {
                this.suppliers = await DSDLink.Supplier();
            }

            const dashboards = Database.Dashboards();

            Server.log(this.suppliers);
            Server.log(dashboards);

            let html = "";

            for (let i = 0; i < dashboards.length; i++) {
                const { ...row } = dashboards[i];

                html += `
                    <div class="tile" dashboard="${row.DashboardID}">
                        <div class="tile-text">
                            <svg xmlns="http://www.w3.org/2000/svg" width="3rem" viewBox="0 0 24 24">
                                <path d="${Database.DashboardIcon(row)}"></path>
                            </svg>
                            <span>${Database.DashboardTitle(row)}</span>
                        </div>
                    </div>
                `;
            }

            application.find(".tiles").html(html);

            application.on("click", ".tile", (event) => {
                const dashboard = $(event.currentTarget).attr("dashboard");
                const params = [];

                params.push(`DashboardID=${dashboard}`);

                if (UserType !== "Supplier") {
                    params.push(`SupplierFamilies=${ARGS.SupplierFamilies}`);
                }

                if (window.debug) {
                    params.push("Debug=True");
                }

                window.location.href = `Home?${params.join("&")}`;
            });
        });
    }
}
