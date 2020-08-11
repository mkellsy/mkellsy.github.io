class DSDLinkMap {
    constructor(container, history, options) {
        this.container = container;
        this.history = history;
        this.options = options || {};

        this.spinner = `
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
        `;
    }

    static Geolocation() {
        return new Promise((resolve) => {
            Geolocation.getGeolocation().then((results) => {
                resolve(results);
            }).catch(() => {
                resolve({
                    latitude: 40.59,
                    longitude: -105.08
                });
            });
        });
    }

    static Retailers(geolocation, supplier, brand, distance) {
        return new Promise((resolve) => {
            if (!distance) {
                distance = 160.934;
            }

            const geofence = Geolocation.getGeofence(geolocation, distance);

            const results = [];
            const request = Public.API("SBF_Find_Retailers", "DSDLink");

            request.AddParameter("SupplierID", supplier, ECP.EC_Operator.Equals);

            if (brand) {
                request.AddParameter("BrandID", brand, ECP.EC_Operator.Equals);
            }

            request.AddParameter("MinLatitude", geofence.latitude.min, ECP.EC_Operator.GreaterThanEquals);
            request.AddParameter("MaxLatitude", geofence.latitude.max, ECP.EC_Operator.LessThanEquals);
            request.AddParameter("MinLongitude", geofence.longitude.min, ECP.EC_Operator.GreaterThanEquals);
            request.AddParameter("MaxLongitude", geofence.longitude.max, ECP.EC_Operator.LessThanEquals);

            request.Submit().then((response) => {
                const data = Server.parseResponse(response) || [];

                for (let j = 0; j < data.length; j++) {
                    const { ...row } = data[j];

                    results.push({
                        CustomerID: parseInt(row.CustomerID, 10),
                        Company: row.Company,
                        Address: row.Address,
                        City: row.City,
                        State: row.State,
                        PostalCode: row.PostalCode,
                        OnPremise: parseInt(row.Premise, 10) === 1,
                        Position: {
                            Latitude: parseFloat(row.Latitude),
                            Longitude: parseFloat(row.Longitude)
                        }
                    });
                }
            }).catch((error) => {
                Server.log(error);
            }).finally(() => {
                resolve(results);
            });
        });
    }

    static SupplierBrands(supplier) {
        return new Promise((resolve) => {
            const results = [];
            const request = Public.API("SBF_Supplier_Brands", "DSDLink");

            request.AddParameter("SupplierID", supplier, ECP.EC_Operator.Equals);
            request.AddParameter("Status", 1, ECP.EC_Operator.Equals);

            request.Submit().then((response) => {
                const data = Server.parseResponse(response) || [];

                for (let i = 0; i < data.length; i++) {
                    const { ...row } = data[i];

                    results.push({
                        BrandID: parseInt(row.BrandID, 10),
                        Brand: row.Brand,
                        Logo: row["Brand Logo_DBValue"] && row["Brand Logo_DBValue"] !== "" ? row["Brand Logo_DBValue"].split("|")[2] : null,
                        Style: row.Style,
                        ABV: row.AlcoholByVolume,
                        Country: row.BrandCountry,
                        Region: row.BrandRegion,
                        Description: row.BrandDescription_DBValue
                    });
                }
            }).catch((error) => {
                Server.log(error);
            }).finally(() => {
                resolve(results);
            });
        });
    }

    static RetailerBrands(supplier, customer) {
        return new Promise((resolve) => {
            const results = [];
            const request = Public.API("SBF_Retailer_Brands", "DSDLink");

            request.AddParameter("SupplierID", supplier, ECP.EC_Operator.Equals);
            request.AddParameter("CustomerID", customer, ECP.EC_Operator.Equals);

            request.Submit().then((response) => {
                const data = Server.parseResponse(response) || [];

                for (let i = 0; i < data.length; i++) {
                    const { ...row } = data[i];

                    results.push({
                        BrandID: parseInt(row.BrandID, 10),
                        Brand: row.Brand,
                        Logo: row.Logo && row.Logo !== "" ? row.Logo : null
                    });
                }
            }).catch((error) => {
                Server.log(error);
            }).finally(() => {
                resolve(results);
            });
        });
    }

    async displayMap() {
        this.container.html(this.spinner);

        const position = await DSDLinkMap.Geolocation();

        this.position = position;
        this.distance = parseFloat(this.history.value("Distance")) || 160.934;

        this.map = new GoogleMap(this.container.parent(), "map", this.position, {
            zoom: 14,
            fullscreenControl: false,
            mapTypeControl: false,
            gestureHandling: "greedy",
            autoGroup: true,
            styles: [{
                featureType: "poi.attraction",
                stylers: [{ visibility: "off" }]
            }, {
                featureType: "poi.business",
                stylers: [{ visibility: "off" }]
            }, {
                featureType: "poi.government",
                stylers: [{ visibility: "off" }]
            }, {
                featureType: "poi.medical",
                stylers: [{ visibility: "off" }]
            }, {
                featureType: "poi.park",
                stylers: [{ visibility: "off" }]
            }, {
                featureType: "poi.place_of_worship",
                stylers: [{ visibility: "off" }]
            }, {
                featureType: "poi.school",
                stylers: [{ visibility: "off" }]
            }, {
                featureType: "poi.sports_complex",
                stylers: [{ visibility: "off" }]
            }]
        }, () => {
            let controls = "";

            if (this.options.back) {
                controls += `<div id="BackCallback" class="svs-button">${this.options.backTitle || "<"}</div>`;
            }

            if (!this.options.hideBrands) {
                controls += "<div id=\"BrandFilter\" class=\"svs-button\">Brands</div>";
            }

            if (controls !== "") {
                controls = `<div class="button-group">${controls}</div>`
            }

            this.container.append(`
                <div class="loader">
                    ${this.spinner}
                </div>
                <div class="place-overlay">
                    <div class="place">
                        <div class="image"></div>
                        <div class="details"></div>
                        <div class="actions">
                            <a id="GoogleSearch" class="svs-button" target="_blank" href="https://www.google.com">Open on Google</a>
                            <div id="CloseRetailer" class="svs-button svs-button-primary">Close</div>
                        </div>
                    </div>
                </div>
                <div class="brand-overlay">
                    <div class="brands">
                        <div class="current"></div>
                        <div class="available"></div>
                        <div class="actions">
                            <div id="ResetBrands" class="svs-button">Reset</div>
                            <div id="CloseBrands" class="svs-button svs-button-primary">Cancel</div>
                        </div>
                    </div>
                </div>
                <div class="search-field">
                    ${controls}
                    <input type="text" id="LocationSearch" placeholder="Postal Code or City and State">
                    <div class="location-search ews-icon-search"></div>
                </div>
                <a href="https://dsdlink.com" target="_blank" id="OpenDSDLink" class="powered-by">
                    <img src="https://images.encompass8.com/GlobalDocs/520502.png">
                </a>
            `);

            this.container.find(".loader").show();

            this.retailer = this.container.find(".place-overlay");
            this.brands = this.container.find(".brand-overlay");

            this.retailer.extend({
                image: this.retailer.find(".image"),
                details: this.retailer.find(".details"),
                actions: this.retailer.find(".actions")
            });

            this.retailer.extend({
                search: this.retailer.actions.find("#GoogleSearch")
            });

            this.brands.extend({
                current: this.brands.find(".current"),
                available: this.brands.find(".available"),
                actions: this.brands.find(".actions")
            });

            this.retailer.find("#CloseRetailer").on("click", () => {
                this.closeRetailer();
            });

            this.container.find("#BrandFilter").on("click", () => {
                if (this.brands && this.brands.is(":visible")) {
                    this.closeBrands();
                } else {
                    this.displayBrands();
                }
            });

            this.container.find("#BackCallback").on("click", () => {
                this.history.value("BrandID", null);
                this.history.value("SupplierID", null);
                this.history.value("ShowBrands", null);

                if (this.options.back) {
                    this.options.back();
                }
            });

            this.brands.find("#CloseBrands").on("click", () => {
                this.closeBrands();
            });

            this.brands.find("#ResetBrands").on("click", () => {
                this.closeBrands();
                this.displayMarkers();
            });

            this.brands.available.on("click", ".brand", (event) => {
                const brand = $(event.currentTarget).attr("value");

                this.closeBrands();
                this.displayMarkers(brand);
            });

            this.container.find("#LocationSearch").on("click touchend", ".location-search", () => {
                const query = this.container.find("#LocationSearch").val();

                if (query !== "") {
                    this.closeRetailer();

                    this.map.locationSearch(query).then((position) => {
                        this.position = position;
                        this.map.moveToLocation(position, 14);
                        this.displayMarkers(this.history.value("BrandID"));
                    }).catch((error) => {
                        Server.log(error.message);
                    });
                }
            });

            this.container.find("#LocationSearch").on("keypress", (event) => {
                const query = $(event.currentTarget).val();

                if (event.which === 13 && query !== "") {
                    this.closeRetailer();

                    this.map.locationSearch(query).then((position) => {
                        this.position = position;
                        this.map.moveToLocation(position, 14);
                        this.displayMarkers(this.history.value("BrandID"));

                        $(event.currentTarget).blur();
                    }).catch((error) => {
                        Server.log(error.message);
                    });
                }
            });

            this.displayMarkers(this.history.value("BrandID"));

            if (this.history.value("ShowBrands") === "True") {
                this.displayBrands();
            }
        });
    }

    async displayMarkers(brand) {
        this.history.value("BrandID", brand);

        this.container.find(".loader").show();

        if (this.map) {
            this.map.removeAllMarkers();

            const retailers = await DSDLinkMap.Retailers(this.position, this.history.value("SupplierID"), this.history.value("BrandID"), this.distance);

            for (let j = 0; j < retailers.length; j++) {
                const { ...row } = retailers[j];

                let icon = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA3NSAxMDAiIHdpZHRoPSIyNCIgaGVpZ2h0PSIzMiI+PHBhdGggZmlsbD0iI2U4NDUzYyIgZD0iTTMzLjY2IDk3Ljk3Yy0yOC4zOCwtNDEuMTMgLTMzLjY2LC00NS4zNCAtMzMuNjYsLTYwLjQ3IDAsLTIwLjcxIDE2Ljc5LC0zNy41IDM3LjUsLTM3LjUgMjAuNzEsMCAzNy41LDE2Ljc5IDM3LjUsMzcuNSAwLDE1LjEzIC01LjI4LDE5LjM1IC0zMy42Niw2MC40NyAtMC44NiwxLjI3IC0yLjMsMi4wMyAtMy44NCwyLjAzIC0xLjU0LDAgLTIuOTgsLTAuNzYgLTMuODQsLTIuMDNsMCAweiIgLz48cGF0aCBmaWxsPSIjZmZmIiBkPSJNMzEuMjUgNDguMzdjLTEuNzIsMCAtMy4xMSwxLjQxIC0zLjExLDMuMTMgMCwxLjcyIDEuMzksMy4xMyAzLjExLDMuMTMgMS43MiwwIDMuMTMsLTEuNDEgMy4xMywtMy4xMyAwLC0xLjcyIC0xLjQxLC0zLjEzIC0zLjEzLC0zLjEzbDAgMHptLTkuMzggLTI1bDAgMy4xMyAzLjEzIDAgNS42MiAxMS44NiAtMi4xIDMuODNjLTAuMjUsMC40MyAtMC4zOSwwLjk1IC0wLjM5LDEuNSAwLDEuNzIgMS40LDMuMTIgMy4xMiwzLjEybDE4Ljc1IDAgMCAtMy4xMiAtMTguMDkgMGMtMC4yMiwwIC0wLjM5LC0wLjE3IC0wLjM5LC0wLjM5bDAuMDQgLTAuMTkgMS40MSAtMi41NSAxMS42NCAwYzEuMTcsMCAyLjIsLTAuNjQgMi43MywtMS42MWw1LjYgLTEwLjE0YzAuMTIsLTAuMjIgMC4xOSwtMC40OCAwLjE5LC0wLjc1IDAsLTAuODYgLTAuNzEsLTEuNTYgLTEuNTcsLTEuNTZsLTIzLjExIDAgLTEuNDcgLTMuMTMgLTUuMTEgMHptMjUgMjVjLTEuNzEsMCAtMy4xLDEuNDEgLTMuMSwzLjEzIDAsMS43MiAxLjM5LDMuMTMgMy4xLDMuMTMgMS43MiwwIDMuMTMsLTEuNDEgMy4xMywtMy4xMyAwLC0xLjcyIC0xLjQxLC0zLjEzIC0zLjEzLC0zLjEzeiIgLz48L3N2Zz4=";

                if (row.OnPremise) {
                    icon = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA3NSAxMDAiIHdpZHRoPSIyNCIgaGVpZ2h0PSIzMiI+PHBhdGggZmlsbD0iIzYzOGU0NiIgZD0iTTMzLjY2IDk3Ljk3Yy0yOC4zOCwtNDEuMTMgLTMzLjY2LC00NS4zNCAtMzMuNjYsLTYwLjQ3IDAsLTIwLjcxIDE2Ljc5LC0zNy41IDM3LjUsLTM3LjUgMjAuNzEsMCAzNy41LDE2Ljc5IDM3LjUsMzcuNSAwLDE1LjEzIC01LjI4LDE5LjM1IC0zMy42Niw2MC40NyAtMC44NiwxLjI3IC0yLjMsMi4wMyAtMy44NCwyLjAzIC0xLjU0LDAgLTIuOTgsLTAuNzYgLTMuODQsLTIuMDNsMCAweiIgLz48cGF0aCBmaWxsPSIjZmZmIiBkPSJNMzUuNzYgMzIuMjlsLTMuNDcgMCAwIC0xMi4xNSAtMy40NyAwIDAgMTIuMTUgLTMuNDcgMCAwIC0xMi4xNSAtMy40OCAwIDAgMTIuMTVjMCwzLjY4IDIuODksNi42NyA2LjUyLDYuOWwwIDE1LjY3IDQuMzQgMCAwIC0xNS42OGMzLjYyLC0wLjIyIDYuNTEsLTMuMjEgNi41MSwtNi44OWwwIC0xMi4xNSAtMy40OCAwIDAgMTIuMTUgMCAwem04LjY4IC01LjIxbDAgMTMuODkgNC4zNCAwIDAgMTMuODkgNC4zNSAwIDAgLTM0LjcyYy00LjgsMCAtOC42OCwzLjg5IC04LjY4LDYuOTRsLTAuMDEgMHoiIC8+PC9zdmc+";
                }

                this.map.addPlace(`${row.Position.Longitude},${row.Position.Latitude}`, {
                    company: row.Company,
                    address: row.Address,
                    city: row.City,
                    state: row.State,
                    postalCode: row.PostalCode,
                    position: {
                        latitude: row.Position.Latitude,
                        longitude: row.Position.Longitude
                    }
                }, {
                    icon
                }, (place) => {
                    this.displayRetailer(place, row);
                }, () => {
                    this.resetRetailer();
                });
            }

            this.container.find(".loader").hide();
        } else {
            this.container.find(".loader").hide();
        }
    }

    async displayBrands() {
        if (this.brands) {
            this.resetBrands();
            this.brands.available.html(this.spinner);

            const brands = await DSDLinkMap.SupplierBrands(this.history.value("SupplierID"));
            const selected = brands.find(brand => brand.BrandID === parseInt(this.history.value("BrandID"), 10));
            const available = brands.filter(brand => brand.BrandID !== parseInt(this.history.value("BrandID"), 10));

            if (selected) {
                this.brands.current.html(`
                    <h1>Currently Selected</h1>

                    <div class="fieldset">
                        <table class="svs-table" cellspacing="0">
                            <tbody class="data-body">
                                <tr>
                                    <td class="data-center data-shrink">
                                        ${selected.Logo && selected.Logo !== "" ? `<img src="${selected.Logo}">` : ""}
                                    </td>
                                    <td>
                                        <div class="brand-name">${Data.titleCase(selected.Brand)}</div>
                                        <div class="brand-description">${selected.Description}</div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                `);

                this.brands.current.show();
            }

            let html = "";

            for (let i = 0; i < available.length; i++) {
                const { ...row } = available[i];

                html += `
                    <tr class="brand" value="${row.BrandID}">
                        <td class="dbi-parent-cell"></td>
                        <td class="data-center data-shrink">
                            ${row.Logo && row.Logo !== "" ? `<img src="${row.Logo}">` : ""}
                        </td>
                        <td>
                            <div class="brand-name">${Data.titleCase(row.Brand)}</div>
                            <div class="brand-description">${row.Description}</div>
                        </td>
                    </tr>
                `;
            }

            this.brands.available.html(`
                <table class="svs-table" cellspacing="0">
                    <tbody class="data-body">
                        ${html}
                    </tbody>
                </table>
            `);
        }
    }

    async displayRetailer(data, retailer) {
        if (this.retailer) {
            this.resetRetailer();

            Server.log(retailer);

            if (data.photos && data.photos.length > 0) {
                this.retailer.image.css({
                    "background-image": `url('${data.photos[0]}')`
                }).addClass("image-on");
            } else {
                this.retailer.image.css({
                    "background-image": "url('https://images.encompass8.com/Support/S3Images/717507.jpg')"
                }).addClass("image-on");
            }

            const address = [];

            if (data.postOfficeBox) {
                address.push(data.postOfficeBox);
            }

            if (data.streetAddress) {
                address.push(data.streetAddress);
            }

            if (data.extendedAddress) {
                address.push(data.extendedAddress);
            }

            if (data.city && data.state && data.postalCode && data.country) {
                address.push(`${data.city}, ${data.state}, ${data.postalCode}, ${data.country}`);
            }

            const open = data.open ? "<i class=\"ews-icon-circleclosed open-icon\"></i>&nbsp;&nbsp;Open now" : "<i class=\"ews-icon-circleclosed closed-icon\"></i>&nbsp;&nbsp;Closed";

            let stars = "";

            if (data.rating !== undefined && data.reviewCount !== undefined) {
                const rating = Math.round(data.rating);

                stars += `${Math.round(data.rating * 10) / 10}&nbsp;&nbsp;`;

                for (let i = 0; i < 5; i++) {
                    if ((i + 1) <= rating) {
                        stars += "<i class=\"ews-icon-favoriteon rating-star\"></i>";
                    } else {
                        stars += "<i class=\"ews-icon-favoriteoff rating-star\"></i>";
                    }
                }

                stars += `(${data.reviewCount})`;
            }

            this.retailer.details.html(`
                <div class="company">${data.company}</div>
                <div class="rating">${stars}</div>
                <div class="address">${address.join("<br>")}</div>
                <div class="open">${data.open !== undefined ? open : ""}</div>
                <div class="hours-title">${data.hours ? "Hours" : ""}</div>
                <div class="hours">${data.hours ? data.hours.join("<br>") : ""}</div>
                <div class="available-brands-title">Available Brands</div>
                <div class="available-brands">
                    <div class="available-brands-loading">Loading...</div>
                </div>
            `);

            this.retailer.search.attr("href", `https://www.google.com/search?q=${encodeURIComponent(`${data.company} ${address.join(" ")}`)}`);

            const brands = await DSDLinkMap.RetailerBrands(this.history.value("SupplierID"), retailer.CustomerID);

            let html = "";

            for (let i = 0; i < brands.length; i++) {
                const { ...row } = brands[i];

                html += `
                    <tr>
                        <td class="dbi-parent-cell"></td>
                        <td class="data-center data-shrink">
                            ${row.Logo && row.Logo !== "" ? `<img src="${row.Logo}">` : ""}
                        </td>
                        <td>
                            <div class="brand-name">${Data.titleCase(row.Brand)}</div>
                        </td>
                    </tr>
                `;
            }

            if (html !== "") {
                this.retailer.details.find(".available-brands").html(`
                    <table class="svs-table" cellspacing="0">
                        <tbody class="data-body">
                            ${html}
                        </tbody>
                    </table>
                `);
            } else {
                this.retailer.details.find(".available-brands-title").html("");
                this.retailer.details.find(".available-brands").html("");
            }
        }
    }

    resetRetailer() {
        if (this.retailer) {
            this.retailer.image.removeAttr("style").removeClass("image-on");
            this.retailer.search.attr("href", "https://www.google.com");
            this.retailer.details.html("");
            this.closeBrands();
            this.retailer.show();
        }
    }

    closeRetailer() {
        if (this.retailer) {
            this.retailer.image.removeAttr("style").removeClass("image-on");
            this.retailer.search.attr("href", "https://www.google.com");
            this.retailer.details.html("");
            this.retailer.hide();
        }
    }

    resetBrands() {
        if (this.brands) {
            this.history.value("ShowBrands", "True");
            this.brands.current.html("");
            this.brands.available.html("");
            this.closeRetailer();
            this.brands.current.hide();
            this.brands.show();
        }
    }

    closeBrands() {
        if (this.brands) {
            this.history.value("ShowBrands", null);
            this.brands.current.html("");
            this.brands.available.html("");
            this.brands.current.hide();
            this.brands.hide();
        }
    }
}
