class Database {
    static Campaigns(filters) {
        return new Promise((resolve) => {
            Server.log(filters.suppliers.map(s => s.SupplierID));

            const results = [];
            const request = Server.createRequest("DBI_Supplier_Ads");

            request.AddParameter("SupplierID", filters.suppliers.map(s => s.SupplierID).join("^"), ECP.EC_Operator.Equals);

            if (filters.query && filters.query !== "") {
                request.AddFilter("Query", filters.query, ECP.EC_Operator.Like);
            }

            request.Submit().then((response) => {
                const data = Server.parseResponse(response) || [];

                /*
                {
                    CampaignID,
                    MapType,
                    MapValue,
                    MapDisplay,
                    AdType,
                    StartDate,
                    EndDate,
                    DocumentID,
                    URL,
                    ThumbnailURL,
                    Description,
                    TimeCreated
                }
                */

                for (let i = 0; i < data.length; i++) {
                    const { ...row } = data[i];

                    results.push({
                        CampaignID: parseInt(row.AdID, 10),
                        AdType: {
                            Value: parseInt(row.AdType, 10),
                            Values: {
                                1: "Inline",
                                2: "Banner"
                            }
                        },
                        StartDate: row.StartDate && row.StartDate !== "" ? new Date(row.StartDate) : null,
                        EndDate: row.StartDate && row.EndDate !== "" ? new Date(row.EndDate) : null,
                        MapType: {
                            Value: parseInt(row.MapType, 10),
                            Values: {
                                1: "Supplier",
                                2: "Brand Family",
                                3: "Brand"
                            }
                        },
                        Mapping: {
                            Value: parseInt(row.MapValue, 10),
                            Display: row.MapDisplay
                        },
                        Media: {
                            DocumentID: row.DocumentID,
                            Image: row.URL,
                            Thumbnail: row.ThumbnailURL
                        },
                        Description: row.Description,
                        TimeCreated: new Date(row.TimeCreated)
                    });
                }
            }).finally(() => {
                resolve(results);
            }).catch((error) => {
                Server.log(error);
            });
        });
    }

    static Campaign(id) {
        return new Promise((resolve) => {
            const request = new ECP.EC_TableView("ZZ_Ads");

            request.AddColumn("Description");
            request.AddColumn("AdType");
            request.AddColumn("SupplierID");
            request.AddColumn("BrandFamilyID");
            request.AddColumn("BrandID");

            request.AddFilter("AdID", id, ECP.EC_Operator.Equals);

            request.SetFormat("JSON");

            let results = null;

            request.GetResults().then((response) => {
                const data = Server.parseResponse(response) || [];

                if (data && data.length > 0) {
                    let type = 1;
                    let mapping = parseInt(data[0].SupplierID_DBValue, 10) || null;

                    if (data[0].BrandFamilyID_DBValue && data[0].BrandFamilyID_DBValue !== "") {
                        type = 2;
                        mapping = parseInt(data[0].BrandFamilyID_DBValue, 10) || null;
                    } else if (data[0].BrandID_DBValue && data[0].BrandID_DBValue !== "") {
                        type = 3;
                        mapping = parseInt(data[0].BrandID_DBValue, 10) || null;
                    }

                    results = {
                        Description: data[0].Description_DBValue,
                        AdType: parseInt(data[0].AdType_DBValue, 10) || null,
                        MapType: type,
                        Mapping: mapping
                    }
                }
            }).finally(() => {
                resolve(results);
            }).catch((error) => {
                Server.log(error);
            });
        });
    }

    static CreateCampaign(data, media) {
        return new Promise(async (resolve) => {
            Server.log(data);

            const campaign = JSON.parse(JSON.stringify(data));

            /*
            {
                Description,
                AdType,
                SupplierID,
                BrandFamilyID, 
                BrandID
            }
            */

            data.Description = new Date().getTime() + Math.random();

            try {
                const body = new FormData();
    
                body.append("FileName", "create-campaign.json");
                body.append("File", JSON.stringify(data));
    
                const response = await Public.Request("DBI_Edit_Ad", "DSDLink", null, {
                    method: "POST",
                    mode: "no-cors",
                    body
                });

                await response.text();

                campaign.CampaignID = await Database.FindCampaign(data.Description);

                await Database.UpdateCampaign(campaign, campaign, media)

                resolve({
                    success: true,
                    campaign: campaign.CampaignID
                });
            } catch (error) {
                Server.log(error);
    
                resolve({
                    success: false
                });
            }
        });
    }

    static UpdateCampaign(campaign, data, media) {
        return new Promise(async (resolve) => {
            Server.log(campaign.CampaignID);
            Server.log(data);

            /*
            {
                CampaignID,
                Description,
                AdType,
                SupplierID,
                BrandFamilyID, 
                BrandID
            }
            */

            try {
                const body = new FormData();

                body.append("FileName", "update-campaign.json");
                body.append("File", JSON.stringify(data));

                const response = await Public.Request("DBI_Edit_Ad", "DSDLink", null, {
                    method: "POST",
                    mode: "no-cors",
                    body
                });

                await response.text();
                await Database.UploadCampaignMedia(campaign, media);

                resolve(true);
            } catch (error) {
                Server.log(error);

                resolve(false);
            }
        });
    }

    static UploadCampaignMedia(campaign, media) {
        return new Promise((resolve) => {
            if (media) {
                const data = new FormData();

                data.append("File", media);

                if (campaign.DocumentID) {
                    fetch(`API.ashx?APICommand=SalesComm_UploadDocument&Distributor=${window.encompassId}&DocumentID=${campaign.DocumentID}&DocumentTypeID=0`, {
                        method: "POST",
                        body: data
                    }).finally(() => {
                        resolve();
                    });
                } else {
                    fetch(`API.ashx?APICommand=SalesComm_UploadDocument&Distributor=${window.encompassId}&AttachmentTable=ZZ_Ads&AttachmentKeyValue=${campaign.CampaignID}&DocumentTypeID=0`, {
                        method: "POST",
                        body: data
                    }).finally(() => {
                        resolve();
                    });
                }
            } else {
                resolve();
            }
        });
    }

    static FindCampaign(key) {
        return new Promise((resolve) => {
            const request = new ECP.EC_TableView("ZZ_Ads");

            request.AddColumn("AdID");
            request.SetFormat("JSON");
            request.SetMaxRecords(1);

            request.AddFilter("Description", key, ECP.EC_Operator.Equals);

            let results = null;

            request.GetResults().then((response) => {
                results = (Server.parseResponse(response) || [])[0].AdID;
            }).finally(() => {
                resolve(results);
            }).catch((error) => {
                Server.log(error);
            });
        });
    }

    static DeleteCampaign(campaign) {
        return new Promise(async (resolve) => {
            Server.log(campaign.CampaignID);

            try {
                const body = new FormData();

                body.append("FileName", "delete-campaign.json");

                body.append("File", JSON.stringify({
                    CampaignID: campaign.CampaignID
                }));

                const response = await Public.Request("DBI_Delete_Ad", "DSDLink", null, {
                    method: "POST",
                    mode: "no-cors",
                    body
                });

                await response.text();

                resolve(true);
            } catch (error) {
                Server.log(error);

                resolve(false);
            }
        });
    }

    static CampaignSchedule(campaign) {
        return new Promise((resolve) => {
            const results = [];

            const request = new ECP.EC_TableView("ZZ_AdsSchedule");

            request.AddColumn("AdsScheduleID");
            request.AddColumn("EDBLSourceID");
            request.AddColumn("StartDate");
            request.AddColumn("EndDate");
            request.AddColumn("IndVolume");
            request.AddColumn("OnPremise");
            request.AddColumn("TradeChannelID");
            request.AddColumn("ChainID");
            request.AddColumn("DraftPackage");
            request.AddColumn("HasDisplays");
            request.AddColumn("HasPlanogram");
            request.AddColumn("TimeCreated");

            request.AddFilter("AdID", campaign.CampaignID, ECP.EC_Operator.Equals);

            request.SetFormat("JSON");
            request.AddSelectSort("TimeCreated", ECP.EC_SortOrder.Desc);

            request.GetResults().then((response) => {
                const data = Server.parseResponse(response) || [];

                for (let i = 0; i < data.length; i++) {
                    const { ...row } = data[i];

                    if (!row.EndDate || row.EndDate === "" || new Date(row.EndDate).getTime() >= new Date()) {
                        results.push({
                            ScheduleID: parseInt(row.AdsScheduleID, 10),
                            EDBLSourceID: row.EDBLSourceID_DBValue && row.EDBLSourceID_DBValue !== "" ? parseInt(row.EDBLSourceID_DBValue, 10) : null,
                            EDBLSource: row.EDBLSourceID_DBValue && row.EDBLSourceID_DBValue !== "" ? $(row.EDBLSourceID).html() : null,
                            StartDate: row.StartDate && row.StartDate !== "" ? new Date(row.StartDate) : null,
                            EndDate: row.EndDate && row.EndDate !== "" ? new Date(row.EndDate) : null,
                            IndVolume: {
                                Value: row.IndVolume_DBValue,
                                Values: {
                                    A: "A",
                                    B: "B",
                                    C: "C"
                                }
                            },
                            OnPremise: {
                                Value: row.OnPremise_DBValue && row.OnPremise_DBValue !== "" ? parseInt(row.OnPremise_DBValue, 10) : null,
                                Values: {
                                    0: "Off Premise",
                                    1: "On Premise"
                                }
                            },
                            TradeChannelID: row.TradeChannelID_DBValue && row.TradeChannelID_DBValue !== "" ? parseInt(row.TradeChannelID_DBValue, 10) : null,
                            TradeChannel: row.TradeChannelID_DBValue && row.TradeChannelID_DBValue !== "" ? $(row.TradeChannelID).html() : null,
                            ChainID: row.ChainID_DBValue && row.ChainID_DBValue !== "" ? parseInt(row.ChainID_DBValue, 10) : null,
                            Chain: row.ChainID_DBValue && row.ChainID_DBValue !== "" ? $(row.ChainID).html() : null,
                            DraftPackage: {
                                Value: row.DraftPackage_DBValue,
                                Values: {
                                    2: "Draft & Package",
                                    1: "Draft Only",
                                    3: "Package Only"
                                }
                            },
                            HasDisplays: `${row.HasDisplays_DBValue}`,
                            HasPlanogram: `${row.HasPlanogram_DBValue}`,
                            TimeCreated: new Date(row.TimeCreated)
                        });
                    }
                }
            }).finally(() => {
                resolve(results);
            }).catch((error) => {
                Server.log(error);
            });
        });
    }

    static CreateSchedule(data) {
        return new Promise(async (resolve) => {
            Server.log(data);

            /*
            {
                CampaignID,
                StartDate,
                EndDate,
                EDBLSourceID,
                ChainID,
                TradeChannelID,
                OnPremise,
                IndVolume,
                DraftPackage,
                HasDisplays,
                HasPlanogram
            }
            */

            try {
                const body = new FormData();

                body.append("FileName", "create-schedule.json");
                body.append("File", JSON.stringify(data));

                const response = await Public.Request("DBI_Edit_Ad_Schedule", "DSDLink", null, {
                    method: "POST",
                    mode: "no-cors",
                    body
                });

                await response.text();

                resolve(true);
            } catch (error) {
                Server.log(error);

                resolve(false);
            }
        });
    }

    static UpdateSchedule(schedule, data) {
        return new Promise(async (resolve) => {
            Server.log(schedule);
            Server.log(data);

            /*
            {
                AdScheduleID,
                CampaignID,
                StartDate,
                EndDate,
                EDBLSourceID,
                ChainID,
                TradeChannelID,
                OnPremise,
                IndVolume,
                DraftPackage,
                HasDisplays,
                HasPlanogram
            }
            */

            try {
                const body = new FormData();

                body.append("FileName", "update-schedule.json");
                body.append("File", JSON.stringify(data));

                const response = await Public.Request("DBI_Edit_Ad_Schedule", "DSDLink", null, {
                    method: "POST",
                    mode: "no-cors",
                    body
                });

                await response.text();

                resolve(true);
            } catch (error) {
                Server.log(error);

                resolve(false);
            }
        });
    }

    static DeleteSchedule(schedule) {
        return new Promise(async (resolve) => {
            Server.log(schedule);

            try {
                const body = new FormData();

                body.append("FileName", "delete-schedule.json");

                body.append("File", JSON.stringify({
                    AdScheduleID: schedule
                }));

                const response = await Public.Request("DBI_Delete_Ad_Schedule", "DSDLink", null, {
                    method: "POST",
                    mode: "no-cors",
                    body
                });

                await response.text();

                resolve(true);
            } catch (error) {
                Server.log(error);

                resolve(false);
            }
        });
    }

    static Stats(campaign) {
        return new Promise((resolve) => {
            const results = {
                Impressions: 0,
                Clicks: 0,
                Conversions: 0
            };

            const request = Server.createRequest("DBI_Ad_Stats");

            request.AddParameter("AdID", campaign.CampaignID, ECP.EC_Operator.Equals);

            request.Submit().then((response) => {
                const data = Server.parseResponse(response) || [];

                /*
                {
                    Impressions,
                    Clicks,
                    Conversions
                }
                */

                if (data && data.length > 0) {
                    results.Impressions = data[0].Impressions;
                    results.Clicks = data[0].Clicks;
                    results.Conversion = data[0].Conversions;
                }
            }).finally(() => {
                resolve(results);
            }).catch((error) => {
                Server.log(error);
            });
        });
    }

    static Interactions(campaign) {
        return new Promise((resolve) => {
            const results = [];
            const request = Server.createRequest("DBI_Ad_Interactions");

            request.AddParameter("AdID", campaign.CampaignID, ECP.EC_Operator.Equals);

            request.Submit().then((response) => {
                const data = Server.parseResponse(response) || [];

                /*
                {
                    User,
                    Interactions
                }
                */

                for (let i = 0; i < data.length; i++) {
                    const { ...row } = data[i];

                    results.push({
                        User: row.User,
                        Interactions: parseInt(row.Interactions, 10)
                    });
                }
            }).finally(() => {
                resolve(results);
            }).catch((error) => {
                Server.log(error);
            });
        });
    }

    static Right(value, number) {
        value = value || "";

        if (number >= value.length) {
            return value;
        }

        return value.substring(value.length - number, value.length);
    }

    static FormatDate(date, display) {
        if (!date || date === "") {
            return "";
        }

        date = EC_Fmt.ToDate(date);

        if (!date || date === "") {
            return "";
        }

        if (display) {
            return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
        }

        return `${date.getFullYear()}-${Database.Right(`0${(date.getMonth() + 1)}`, 2)}-${Database.Right(`0${date.getDate()}`, 2)}`;
    }

    static ValueElipse(value, length) {
        value = value || "";

        if (value.length <= length) {
            return value;
        }

        return `${value.slice(0, length)}...`;
    }
}

class Main {
    constructor(app) {
        this.key = new Date().getTime() + Math.random();

        this.dsd = new DSDLink(app, async (application, state, family) => {
            application.content.html(application.spinner);

            ARGS.CampaignID = parseInt(state.CampaignID, 10);
            ARGS.Query = decodeURIComponent(state.Query || "");

            if (Number.isNaN(ARGS.CampaignID)) {
                ARGS.CampaignID = null;
            }

            DSDLink.tabsState();

            if (family && family !== "") {
                ARGS.SupplierFamilies = family.join(",");
            }

            if (family && family.length > 0) {
                this.suppliers = await DSDLink.Supplier(family);
            } else {
                this.suppliers = await DSDLink.Supplier();
            }

            this.ads = await Database.Campaigns({ suppliers: this.suppliers });

            Server.log(this.suppliers);
            Server.log(this.ads);

            this.display(ARGS.CampaignID, ARGS.Query);
        }, (_application, state) => {
            ARGS.CampaignID = parseInt(state.CampaignID, 10);
            ARGS.Query = decodeURIComponent(state.Query || "");

            if (Number.isNaN(ARGS.CampaignID)) {
                ARGS.CampaignID = null;
            }

            this.display(ARGS.CampaignID, ARGS.Query);
        });
    }

    display(value, query) {
        this.dsd.app.content[0].scrollTo(0, 0);
        this.dsd.app.content.html(this.dsd.app.spinner);

        this.key = new Date().getTime() + Math.random();

        ARGS.CampaignID = value;
        ARGS.Query = query;

        this.displayCampaigns(this.key, ARGS.CampaignID, ARGS.Query);
    }

    async displayCampaigns(key, campaign, query) {
        if (key === this.key) {
            const components = this.dsd.appendSearch(query, "New Campaign");

            await this.searchCampaigns(components, components.search.val() || "", this.key);
            await this.displayCampaign(components, campaign, this.key);

            components.form.on("submit", async (event) => {
                event.preventDefault();

                ARGS.Query = components.search.val() || "";
                ARGS.CampaignID = null;

                this.key = new Date().getTime() + Math.random();

                DSDLink.logState();

                await this.searchCampaigns(components, ARGS.Query, this.key);
            });

            components.data.off("click");

            components.data.on("click", ".show-campaign", (event) => {
                const target = $(event.currentTarget);

                ARGS.CampaignID = parseInt(target.attr("value"), 10);

                this.key = new Date().getTime() + Math.random();

                DSDLink.logState();

                this.displayCampaign(components, ARGS.CampaignID, this.key);
            });

            components.add.on("click", () => {
                this.createCampaign(components, this.key);
            });

            DSDLink.logState();
        }
    }

    async searchCampaigns(components, query, key) {
        if (key === this.key) {
            query = (query || "").toUpperCase();

            components.details.hide();
            components.data.removeClass("data-left");
            components.data.removeClass("svs-mobile-hide");
            components.search.parent().parent().removeClass("svs-mobile-hide");
            components.data.html(this.dsd.app.spinner);

            this.filtered = this.ads.filter((item) => {
                if (query.length < 2) {
                    return true;
                }

                if (
                    item.Mapping.Display.toUpperCase().indexOf(query) >= 0
                 || item.Description.toUpperCase().indexOf(query) >= 0
                ) {
                    return true;
                }

                return false;
            });

            if (this.ads.length >= 500 && query && query !== "") {
                this.filtered = await Database.Campaigns({ query, suppliers: this.suppliers });
            }

            let html = "";

            /*
            {
                CampaignID,
                AdType: {
                    Value,
                    Values
                },
                StartDate,
                EndDate,
                MapType: {
                    Value,
                    Values
                },
                Mapping: {
                    Value,
                    Display
                },
                Media: {
                    DocumentID,
                    Image,
                    Thumbnail
                },
                Description,
                TimeCreated
            }
            */

            for (let i = 0; i < Math.min(this.filtered.length, 500); i++) {
                const { ...row } = this.filtered[i];

                html += `
                    <tr class="show-campaign" value="${row.CampaignID}">
                        <td class="dbi-parent-cell"></td>
                        <td class="data-center data-shrink">
                            ${row.Media.Thumbnail && row.Media.Thumbnail !== "" ? `<img src="${row.Media.Thumbnail}" loading="lazy">` : ""}
                        </td>
                        <td>${Database.ValueElipse(row.Description, 50)}</td>
                        <td class="left-compact-hide svs-em-cell svs-mobile-hide">${row.Mapping.Display || ""}</td>
                        <td class="left-compact-hide svs-mobile-hide">${Database.FormatDate(row.StartDate, true) || "N/A"}</td>
                        <td class="left-compact-hide svs-mobile-hide">${Database.FormatDate(row.EndDate, true) || "N/A"}</td>
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
                                <th>Description</th>
                                <th class="left-compact-hide">Brand</th>
                                <th class="left-compact-hide">Start Date</th>
                                <th class="left-compact-hide">End Date</th>
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
                ARGS.CampaignID = this.filtered[0].CampaignID;

                this.key = new Date().getTime() + Math.random();

                DSDLink.logState();

                this.displayCampaign(components, ARGS.CampaignID, this.key);
            }

            components.data[0].scrollTo(0, 0);
        }
    }

    async displayCampaign(components, id, key) {
        if (key === this.key && !Number.isNaN(parseInt(id, 10))) {
            id = parseInt(id, 10);

            components.data.addClass("data-left");
            components.data.addClass("svs-mobile-hide");
            components.search.parent().parent().addClass("svs-mobile-hide");
            components.details.off("change").off("click");
            components.details.html(this.dsd.app.spinner);
            components.details.show();

            const campaign = this.ads.find(a => a.CampaignID === id);
            const schedule = await Database.CampaignSchedule(campaign);

            components.details.html(`
                <div class="svs-mobile-only">
                    <div class="row">
                        <div class="svs-button" id="close-details" style="margin: 7px 0 0 0;">Back</div>
                    </div>
                </div>
            `);

            const live = await Database.Campaign(campaign.CampaignID);

            const files = {
                media: null
            };

            let deleting = false;

            if (live) {
                campaign.Description = live.Description;
                campaign.AdType.Value = live.AdType;
                campaign.MapType.Value = live.MapType;
                campaign.Mapping.Value = live.Mapping;
            } else {
                deleting = true;
            }

            if (deleting) {
                components.details.append(`
                    <div class="fieldset">
                        This ad campaign is currently deleting.
                    </div>
                `);
            }

            Server.log(campaign);

            let html = "";

            /*
            {
                ScheduleID,
                EDBLSourceID,
                EDBLSource,
                StartDate,
                EndDate,
                IndVolume: {
                    Value,
                    Values
                },
                OnPremise: {
                    Value,
                    Values
                },
                TradeChannelID,
                TradeChannel,
                ChainID,
                Chain,
                DraftPackage: {
                    Value,
                    Values
                },
                HasDisplays,
                HasPlanogram,
                TimeCreated
            }
            */

            if (!deleting) {
                const types = Object.keys(campaign.AdType.Values);
                const mappings = Object.keys(campaign.MapType.Values);

                components.details.append(`
                    <h1>Ad Campaign</h1>

                    <div class="fieldset">
                        <div class="section">
                            <div class="fields">
                                <div class="row row-full">
                                    <div class="field" style="min-height: 200px;">
                                        <span class="title">Description</span>
                                        <textarea id="Description" class="text-full">${campaign.Description || ""}</textarea>
                                    </div>
                                </div>

                                <div class="row">
                                    <div class="field" style="width: 30%; flex: unset;">
                                        <span class="title">Type</span>
                                        <select id="AdType">${types.map(o => `<option value="${o}"${`${o}` === `${campaign.AdType.Value}` ? " selected" : ""}>${campaign.AdType.Values[o]}</option>`).join("")}</select>
                                    </div>

                                    <div class="field">
                                        <span class="title">Mapping</span>
                                        <div class="map-type-field">
                                            <select id="MapType" style="width: 120px;">${mappings.map(o => `<option value="${o}"${`${o}` === `${campaign.MapType.Value}` ? " selected" : ""}>${campaign.MapType.Values[o]}</option>`).join("")}</select>
                                            <div class="map-value" type="supplier">
                                                <placeholder type="supplier" id="SupplierID" value="${campaign.Mapping.Value}" display="${campaign.Mapping.Display}">
                                            </div>
                                            <div class="map-value" type="family">
                                                <placeholder type="family" id="BrandFamilyID" value="${campaign.Mapping.Value}" display="${campaign.Mapping.Display}">
                                            </div>
                                            <div class="map-value" type="brand">
                                                <placeholder type="brand" id="BrandID" value="${campaign.Mapping.Value}" display="${campaign.Mapping.Display}">
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="row">
                                    <div id="campaign-save" class="svs-button svs-button-primary">Save Changes</div>
                                    <div class="fields"></div>
                                    <div id="campaign-delete" class="svs-button">Delete</div>
                                </div>
                            </div>

                            <div class="sidecar">
                                <div class="field row-full">
                                    <span class="title">Media</span>

                                    <div class="logo media">
                                        <img src="${campaign.Media.Image || "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="}" id="MediaDisplay" loading="lazy">
                                        <div class="actions">
                                            <div class="svs-button svs-button-primary">Edit</div>
                                            <input type="file" id="Media" accept="image/*" image="media">
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `);
            }

            const stats = await Database.Stats(campaign);

            components.details.append(`
                <h1>Ad Campaign Stats</h1>

                <div class="fieldset">
                    <table class="svs-table nested-table" cellspacing="0">
                        <tbody class="data-body">
                            <tr>
                                <td class="svs-em-cell">Impressions</td>
                                <td style="width: 80%;">${stats.Impressions}</td>
                            </tr>
                            <tr>
                                <td class="svs-em-cell">Clicks</td>
                                <td style="width: 80%;">${stats.Clicks}</td>
                            </tr>
                            <tr>
                                <td class="svs-em-cell">Conversions</td>
                                <td style="width: 80%;">${stats.Conversions}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            `);

            if (!deleting) {
                for (let i = 0; i < Math.min(schedule.length, 50); i++) {
                    const { ...row } = schedule[i];

                    const start = row.StartDate ? `${row.StartDate.getFullYear()}-${Database.Right(`0${(row.StartDate.getMonth() + 1)}`, 2)}-${Database.Right(`0${row.StartDate.getDate()}`, 2)}` : "";
                    const end = row.EndDate ? `${row.EndDate.getFullYear()}-${Database.Right(`0${(row.EndDate.getMonth() + 1)}`, 2)}-${Database.Right(`0${row.EndDate.getDate()}`, 2)}` : "";

                    const premise = Object.keys(row.OnPremise.Values);
                    const volume = Object.keys(row.IndVolume.Values);
                    const draft = Object.keys(row.DraftPackage.Values);

                    html += `
                        <tr class="show-schedule" value="${row.ScheduleID}">
                            <td class="svs-em-cell">${Database.FormatDate(row.StartDate, true) || "N/A"}</td>
                            <td class="svs-em-cell">${Database.FormatDate(row.EndDate, true) || "N/A"}</td>
                            <td class="svs-mobile-hide">${row.Chain || "N/A"}</td>
                            <td class="svs-mobile-hide">${row.TradeChannel || "N/A"}</td>
                            <td class="svs-mobile-hide">${row.OnPremise.Values[row.OnPremise.Value] || "N/A"}</td>
                            <td>${row.EDBLSource || "N/A"}</td>
                        </tr>

                        <tr class="row-form" value="${row.ScheduleID}">
                            <td colspan="6">
                                <form class="fieldset">
                                    <div class="row">
                                        <div class="field">
                                            <span class="title">Start Date</span>
                                            <input type="date" id="StartDate_${row.ScheduleID}" value="${start}">
                                        </div>
                                        <div class="field">
                                            <span class="title">End Date</span>
                                            <input type="date" id="EndDate_${row.ScheduleID}" value="${end}">
                                        </div>
                                    </div>
                                    <div class="row">
                                        <div class="field">
                                            <span class="title">Distributor</span>
                                            <placeholder type="edbl-source" id="EDBLSourceID_${row.ScheduleID}" parent="${row.ScheduleID}" value="${row.EDBLSourceID}" display="${row.EDBLSource}">
                                        </div>
                                        <div class="field">
                                            <span class="title">Chain</span>
                                            <placeholder type="chain" id="ChainID_${row.ScheduleID}" parent="${row.ScheduleID}" value="${row.ChainID}" display="${row.Chain}">
                                        </div>
                                    </div>
                                    <div class="row">
                                        <div class="field">
                                            <span class="title">Trade Channel</span>
                                            <placeholder type="trade-channel" id="TradeChannelID_${row.ScheduleID}" parent="${row.ScheduleID}" value="${row.TradeChannelID}" display="${row.TradeChannel}">
                                        </div>
                                        <div class="field">
                                            <span class="title">On/Off Premise</span>
                                            <select id="Premise_${row.ScheduleID}">
                                                <option value=""${!row.OnPremise.Value && row.OnPremise.Value === "" ? " selected" : ""}></option>
                                                ${premise.map(o => `<option value="${o}"${`${o}` === `${row.OnPremise.Value}` ? " selected" : ""}>${row.OnPremise.Values[o]}</option>`).join("")}
                                            </select>
                                        </div>
                                        <div class="field">
                                            <span class="title">Industry Volume</span>
                                            <select id="IndVolume_${row.ScheduleID}">
                                                <option value=""${!row.IndVolume.Value && row.IndVolume.Value === "" ? " selected" : ""}></option>
                                                ${volume.map(o => `<option value="${o}"${`${o}` === `${row.IndVolume.Value}` ? " selected" : ""}>${row.IndVolume.Values[o]}</option>`).join("")}
                                            </select>
                                        </div>
                                    </div>
                                    <div class="row">
                                        <div class="field">
                                            <span class="title">Draft/Package</span>
                                            <select id="DraftPackage_${row.ScheduleID}">
                                                <option value=""${!row.DraftPackage.Value && row.DraftPackage.Value === "" ? " selected" : ""}></option>
                                                ${draft.map(o => `<option value="${o}"${`${o}` === `${row.DraftPackage.Value}` ? " selected" : ""}>${row.DraftPackage.Values[o]}</option>`).join("")}
                                            </select>
                                        </div>
                                        <div class="field">
                                            <span class="title">Displays</span>
                                            <select id="HasDisplays_${row.ScheduleID}">
                                                <option value=""${row.HasDisplays === "" ? " selected" : ""}></option>
                                                <option value="1"${row.HasDisplays === "1" ? " selected" : ""}>True</option>
                                                <option value="0"${!row.HasDisplays === "0" ? " selected" : ""}>False</option>
                                            </select>
                                        </div>
                                        <div class="field">
                                            <span class="title">Planogram</span>
                                            <select id="HasPlanogram_${row.ScheduleID}">
                                                <option value=""${row.HasPlanogram === "" ? " selected" : ""}></option>
                                                <option value="1"${row.HasPlanogram === "1" ? " selected" : ""}>True</option>
                                                <option value="0"${!row.HasPlanogram === "0" ? " selected" : ""}>False</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="row">
                                        <div id="schedule-save" class="svs-button svs-button-primary">Save Changes</div>
                                        <div id="schedule-cancel" class="svs-button">Cancel</div>
                                        <div class="fields"></div>
                                        <div id="schedule-delete" class="svs-button">Delete</div>
                                    </div>
                                </form>
                            </td>
                        </tr>
                    `;
                }

                components.details.append(`
                    <h1>Ad Targeting</h1>

                    <div class="fieldset">
                        <table class="svs-table nested-table" cellspacing="0">
                            <thead class="svs-mobile-hide">
                                <tr>
                                    <th>Start Date</th>
                                    <th>End Date</th>
                                    <th>Chain</th>
                                    <th>Trade Channel</th>
                                    <th>On/Off Premise</th>
                                    <th>Distributor</th>
                                </tr>
                            </thead>

                            <tbody class="data-body">
                                ${html}
                            </tbody>
                        </table>

                        <div class="row">
                            <div id="schedule-add" class="svs-button svs-button-primary">Add Schedule</div>
                        </div>
                    </div>
                `);
            }

            const interactions = await Database.Interactions(campaign);

            let users = "";

            for (let i = 0; i < interactions.length; i++) {
                const { ...row } = interactions[i];

                users += `
                    <tr>
                        <td class="svs-em-cell">${row.User}</td>
                        <td>${row.Interactions}</td>
                    </tr>
                `;
            }

            if (users && users !== "") {
                components.details.append(`
                    <h1>Ad Interactions</h1>

                    <div class="fieldset">
                        <table class="svs-table nested-table" cellspacing="0">
                            <thead class="svs-mobile-hide">
                                <tr>
                                    <th>User</th>
                                    <th>Interactions</th>
                                </tr>
                            </thead>

                            <tbody class="data-body">
                                ${users}
                            </tbody>
                        </table>
                    </div>
                `);
            }

            if (!deleting) {
                switch (campaign.MapType.Value) {
                    case 3:
                        components.details.find(".map-value[type='brand']").show();
                        break;

                    case 2:
                        components.details.find(".map-value[type='family']").show();
                        break;

                    default:
                        components.details.find(".map-value[type='supplier']").show();
                        break;
                }

                components.details.find("placeholder").each((_index, element) => {
                    const target = $(element);
                    const type = target.attr("type");
                    const parent = parseInt(target.attr("parent"), 10);

                    const value = parseInt(target.attr("value"), 10);
                    const display = target.attr("display");

                    switch (type) {
                        case "supplier":
                            UI.setupAutocomplete(target, "SupplierID", "", true, "Suppliers", "SupplierID", ECP.DataType._Integer, "Supplier", ECP.DataType._Text).then((response) => {
                                if (campaign.MapType.Value === 1 && !Number.isNaN(value)) {
                                    response.element.find("#SupplierIDHidden").val(value);
                                    response.input.val(display);

                                    response.input.attr("displayval", display);
                                    response.input.attr("keyvalue", value);
                                }
                            });

                            break;

                        case "family":
                            UI.setupAutocomplete(target, "BrandFamilyID", "", true, "BrandFamilies", "BrandFamilyID", ECP.DataType._Integer, "BrandFamily", ECP.DataType._Text).then((response) => {
                                if (campaign.MapType.Value === 2 && !Number.isNaN(value)) {
                                    response.element.find("#BrandFamilyIDHidden").val(value);
                                    response.input.val(display);

                                    response.input.attr("displayval", display);
                                    response.input.attr("keyvalue", value);
                                }
                            });

                            break;

                        case "brand":
                            UI.setupAutocomplete(target, "BrandID", "", true, "Brands", "BrandID", ECP.DataType._Integer, "Brand", ECP.DataType._Text).then((response) => {
                                if (campaign.MapType.Value === 3 && !Number.isNaN(value)) {
                                    response.element.find("#BrandIDHidden").val(value);
                                    response.input.val(display);

                                    response.input.attr("displayval", display);
                                    response.input.attr("keyvalue", value);
                                }
                            });

                            break;

                        case "trade-channel":
                            UI.setupAutocomplete(target, `TradeChannelID_${parent}`, "", true, "TradeChannels", "TradeChannelID", ECP.DataType._Integer, "TradeChannel", ECP.DataType._Text).then((response) => {
                                if (!Number.isNaN(value)) {
                                    response.element.find(`#TradeChannelID_${parent}Hidden`).val(value);
                                    response.input.val(display);

                                    response.input.attr("displayval", display);
                                    response.input.attr("keyvalue", value);
                                }
                            });

                            break;

                        case "edbl-source":
                            UI.setupAutocomplete(target, `EDBLSourceID_${parent}`, "", true, "EDBLSources", "EDBLSourceID", ECP.DataType._Integer, "EDBLSource", ECP.DataType._Text).then((response) => {
                                if (!Number.isNaN(value)) {
                                    response.element.find(`#EDBLSourceID_${parent}Hidden`).val(value);
                                    response.input.val(display);

                                    response.input.attr("displayval", display);
                                    response.input.attr("keyvalue", value);
                                }
                            });

                            break;

                        case "chain":
                            UI.setupAutocomplete(target, `ChainID_${parent}`, "", true, "Chains", "ChainID", ECP.DataType._Integer, "Chain", ECP.DataType._Text).then((response) => {
                                if (!Number.isNaN(value)) {
                                    response.element.find(`#ChainID_${parent}Hidden`).val(value);
                                    response.input.val(display);

                                    response.input.attr("displayval", display);
                                    response.input.attr("keyvalue", value);
                                }
                            });

                            break;
                    }
                });

                components.details.find("#MapType").on("change", (event) => {
                    components.details.find(".map-value").hide();

                    switch (parseInt($(event.currentTarget).val(), 10)) {
                        case 3:
                            components.details.find(".map-value[type='brand']").show();
                            break;

                        case 2:
                            components.details.find(".map-value[type='family']").show();
                            break;

                        default:
                            components.details.find(".map-value[type='supplier']").show();
                            break;
                    }
                });

                components.details.on("change", "input[type='file']", (event) => {
                    const target = $(event.currentTarget);

                    if (target[0].files && target[0].files[0] && target.attr("accept") === "image/*") {
                        let image = null;

                        switch (target.attr("image")) {
                            case "media":
                                files.media = target[0].files[0];
                                image = components.details.find("#MediaDisplay");
                                break;
                        }

                        if (image) {
                            const reader = new FileReader();

                            reader.onload = (stream) => {
                                image.attr("src", stream.target.result);
                            };

                            reader.readAsDataURL(target[0].files[0]);
                        }
                    }
                });

                components.details.on("click", ".show-schedule", (event) => {
                    const trigger = $(event.currentTarget);
                    const container = trigger.parent();

                    container.find(".show-schedule").show();
                    container.find(".row-form").hide();

                    container.find(`.show-schedule[value='${trigger.attr("value")}']`).hide();
                    container.find(`.row-form[value='${trigger.attr("value")}']`).show();
                });

                components.details.on("click", "#campaign-save", (event) => {
                    const form = $(event.currentTarget).parent().parent();

                    const data = {
                        CampaignID: campaign.CampaignID,
                        EDBLSourceID: 43,
                        Description: form.find("#Description").val(),
                        AdType: parseInt(form.find("#AdType").val() || "2", 10)
                    };

                    switch (form.find("#MapType").val()) {
                        case "3":
                            data.SupplierID = null;
                            data.BrandFamilyID = null;
                            data.BrandID = parseInt(form.find("#BrandIDHidden").val() || "0", 10);
                            break;

                        case "2":
                            data.SupplierID = null;
                            data.BrandFamilyID = parseInt(form.find("#BrandFamilyIDHidden").val() || "0", 10);
                            data.BrandID = null;
                            break;

                        default:
                            data.SupplierID = parseInt(form.find("#SupplierIDHidden").val() || "0", 10);
                            data.BrandFamilyID = null;
                            data.BrandID = null;
                            break;
                    }

                    let valid = true;

                    if (valid && !data.CampaignID) {
                        this.dsd.app.alert("Invalid Campaign ID.");

                        valid = false;
                    }

                    if (valid && (!data.Description || data.Description === "")) {
                        this.dsd.app.alert("A description is required.");

                        valid = false;
                    }

                    if (valid && !data.AdType) {
                        this.dsd.app.alert("Invalid ad type.");

                        valid = false;
                    }

                    if (valid) {
                        switch (form.find("#MapType").val()) {
                            case "3":
                                if (!data.BrandID) {
                                    this.dsd.app.alert("A brand is required.");

                                    valid = false;
                                }

                                break;
        
                            case "2":
                                if (!data.BrandFamilyID) {
                                    this.dsd.app.alert("A brand family is required.");

                                    valid = false;
                                }

                                break;
        
                            default:
                                if (!data.SupplierID) {
                                    this.dsd.app.alert("A supplier is required.");

                                    valid = false;
                                }

                                break;
                        }
                    }

                    if (valid) {
                        Database.UpdateCampaign(campaign, data, files.media).then(async (success) => {
                            if (success) {
                                this.ads = await Database.Campaigns({ suppliers: this.suppliers });
                                this.display(ARGS.CampaignID, ARGS.Query);
                            } else {
                                this.dsd.app.alert("Unable to update campaign.");
                            }
                        });
                    }
                });

                components.details.on("click", "#campaign-delete", () => {
                    Database.DeleteCampaign(campaign).then((success) => {
                        if (success) {
                            this.display(null, ARGS.Query);
                        } else {
                            this.dsd.app.alert("Unable to delete campaign.");
                        }
                    });
                });

                components.details.on("click", "#schedule-add", () => {
                    this.createSchedule(components, campaign, this.key);
                });

                components.details.on("click", "#schedule-save", (event) => {
                    const form = $(event.currentTarget)
                        .parent()
                        .parent();

                    const row = form.parent().parent();
                    const value = parseInt(row.attr("value"), 10);

                    const data = {
                        AdScheduleID: value,
                        CampaignID: campaign.CampaignID,
                        StartDate: Database.FormatDate(form.find(`#StartDate_${value}`).val()) || null,
                        EndDate: Database.FormatDate(form.find(`#EndDate_${value}`).val()) || null,
                        EDBLSourceID: form.find(`#EDBLSourceID_${value}Hidden`) !== "" ? parseInt(form.find(`#EDBLSourceID_${value}Hidden`).val(), 10) : null,
                        ChainID: form.find(`#ChainID_${value}Hidden`) !== "" ? parseInt(form.find(`#ChainID_${value}Hidden`), 10) : null,
                        TradeChannelID: form.find(`#TradeChannelID_${value}Hidden`) !== "" ? parseInt(form.find(`#TradeChannelID_${value}Hidden`).val(), 10) : null,
                        OnPremise: form.find(`#Premise_${value}`) !== "" ? parseInt(form.find(`#Premise_${value}`).val(), 10) : null,
                        IndVolume: form.find(`#IndVolume_${value}`) !== "" ? form.find(`#IndVolume_${value}`).val() : null,
                        DraftPackage: form.find(`#DraftPackage_${value}`) !== "" ? parseInt(form.find(`#DraftPackage_${value}`).val(), 10) : null,
                        HasDisplays: form.find(`#HasDisplays_${value}`) !== "" ? parseInt(form.find(`#HasDisplays_${value}`).val(), 10) : null,
                        HasPlanogram: form.find(`#HasPlanogram_${value}`) !== "" ? parseInt(form.find(`#HasPlanogram_${value}`).val(), 10) : null
                    };

                    let valid = true;

                    if (valid && !data.AdScheduleID) {
                        this.dsd.app.alert("Invalid schedule ID.");

                        valid = false;
                    }

                    if (valid && !data.StartDate) {
                        this.dsd.app.alert("Start date is required.");

                        valid = false;
                    }

                    if (valid && !data.EndDate) {
                        this.dsd.app.alert("End date is required.");

                        valid = false;
                    }

                    if (valid && (new Date(data.StartDate)).getTime() > (new Date(data.EndDate)).getTime()) {
                        this.dsd.app.alert("End Date must be greater then or equal to the Start Date.");

                        valid = false;
                    }

                    if (valid) {
                        Database.UpdateSchedule(value, data).then((success) => {
                            if (success) {
                                this.display(ARGS.CampaignID, ARGS.Query);
                            } else {
                                this.dsd.app.alert("Unable to update scuedule.");
                            }
                        });
                    }
                });

                components.details.on("click", "#schedule-delete", (event) => {
                    const form = $(event.currentTarget)
                        .parent()
                        .parent();

                    const row = form.parent().parent();
                    const value = parseInt(row.attr("value"), 10);

                    Database.DeleteSchedule(value).then((success) => {
                        if (success) {
                            this.display(ARGS.CampaignID, ARGS.Query);
                        } else {
                            this.dsd.app.alert("Unable to delete scuedule.");
                        }
                    });
                });

                components.details.on("click", "#schedule-cancel", (event) => {
                    const form = $(event.currentTarget)
                        .parent()
                        .parent();

                    const container = form.parent().parent().parent();

                    form[0].reset();

                    container.find(".show-schedule").show();
                    container.find(".row-form").hide();
                });
            }

            components.details.on("click", "#close-details", () => {
                this.display(null, ARGS.Query);
            });
        }
    }

    async createCampaign(components, key) {
        if (key === this.key) {
            components.data.addClass("data-left");
            components.data.addClass("svs-mobile-hide");
            components.search.parent().parent().addClass("svs-mobile-hide");
            components.details.off("change").off("click");
            components.details.show();

            components.details.html(`
                <h1>Create Ad Campaign</h1>

                <div class="fieldset">
                    <div class="section">
                        <div class="fields">
                            <div class="row row-full">
                                <div class="field" style="min-height: 200px;">
                                    <span class="title">Description</span>
                                    <textarea id="Description" class="text-full"></textarea>
                                </div>
                            </div>

                            <div class="row">
                                <div class="field" style="width: 30%; flex: unset;">
                                    <span class="title">Type</span>
                                    <select id="AdType">
                                        <option value="1">Inline</option>
                                        <option value="2">Banner</option>
                                    </select>
                                </div>

                                <div class="field">
                                    <span class="title">Mapping</span>
                                    <div class="map-type-field">
                                        <select id="MapType" style="width: 120px;">
                                            <option value="1">Supplier</option>
                                            <option value="2">Brand Family</option>
                                            <option value="3">Brand</option>
                                        </select>
                                        <div class="map-value" type="supplier">
                                            <placeholder type="supplier" id="SupplierID">
                                        </div>
                                        <div class="map-value" type="family">
                                            <placeholder type="family" id="BrandFamilyID">
                                        </div>
                                        <div class="map-value" type="brand">
                                            <placeholder type="brand" id="BrandID">
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="row">
                                <div id="campaign-add" class="svs-button svs-button-primary">Create Campaign</div>
                                <div id="campaign-cancel" class="svs-button">Cancel</div>
                            </div>
                        </div>

                        <div class="sidecar">
                            <div class="field row-full">
                                <span class="title">Media</span>

                                <div class="logo media">
                                    <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=" id="MediaDisplay" loading="lazy">
                                    <div class="actions">
                                        <div class="svs-button svs-button-primary">Edit</div>
                                        <input type="file" id="Media" accept="image/*" image="media">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `);

            const files = {
                media: null
            };

            components.details.find(".map-value[type='supplier']").show();

            components.details.find("placeholder").each((_index, element) => {
                const target = $(element);
                const type = target.attr("type");

                switch (type) {
                    case "supplier":
                        UI.setupAutocomplete(target, "SupplierID", "", true, "Suppliers", "SupplierID", ECP.DataType._Integer, "Supplier", ECP.DataType._Text);
                        break;

                    case "family":
                        UI.setupAutocomplete(target, "BrandFamilyID", "", true, "BrandFamilies", "BrandFamilyID", ECP.DataType._Integer, "BrandFamily", ECP.DataType._Text);
                        break;

                    case "brand":
                        UI.setupAutocomplete(target, "BrandID", "", true, "Brands", "BrandID", ECP.DataType._Integer, "Brand", ECP.DataType._Text);
                        break;
                }
            });

            components.details.find("#MapType").on("change", (event) => {
                components.details.find(".map-value").hide();

                switch (parseInt($(event.currentTarget).val(), 10)) {
                    case 3:
                        components.details.find(".map-value[type='brand']").show();
                        break;

                    case 2:
                        components.details.find(".map-value[type='family']").show();
                        break;

                    default:
                        components.details.find(".map-value[type='supplier']").show();
                        break;
                }
            });

            components.details.on("change", "input[type='file']", (event) => {
                const target = $(event.currentTarget);

                if (target[0].files && target[0].files[0] && target.attr("accept") === "image/*") {
                    let image = null;

                    switch (target.attr("image")) {
                        case "media":
                            files.media = target[0].files[0];
                            image = components.details.find("#MediaDisplay");
                            break;
                    }

                    if (image) {
                        const reader = new FileReader();

                        reader.onload = (stream) => {
                            image.attr("src", stream.target.result);
                        };

                        reader.readAsDataURL(target[0].files[0]);
                    }
                }
            });

            components.details.on("click", "#campaign-cancel", () => {
                this.displayCampaigns(this.key, ARGS.CampaignID, ARGS.Query);
            });

            components.details.on("click", "#campaign-add", (event) => {
                const form = $(event.currentTarget).parent().parent();

                const data = {
                    CampaignID: null,
                    EDBLSourceID: 43,
                    Description: form.find("#Description").val(),
                    AdType: parseInt(form.find("#AdType").val() || "2", 10)
                };

                switch (form.find("#MapType").val()) {
                    case "3":
                        data.SupplierID = null;
                        data.BrandFamilyID = null;
                        data.BrandID = parseInt(form.find("#BrandIDHidden").val() || "0", 10);
                        break;

                    case "2":
                        data.SupplierID = null;
                        data.BrandFamilyID = parseInt(form.find("#BrandFamilyIDHidden").val() || "0", 10);
                        data.BrandID = null;
                        break;

                    default:
                        data.SupplierID = parseInt(form.find("#SupplierIDHidden").val() || "0", 10);
                        data.BrandFamilyID = null;
                        data.BrandID = null;
                        break;
                }

                let valid = true;

                if (valid && (!data.Description || data.Description === "")) {
                    this.dsd.app.alert("A description is required.");

                    valid = false;
                }

                if (valid && !data.AdType) {
                    this.dsd.app.alert("Invalid ad type.");

                    valid = false;
                }

                if (valid) {
                    switch (form.find("#MapType").val()) {
                        case "3":
                            if (!data.BrandID) {
                                this.dsd.app.alert("A brand is required.");

                                valid = false;
                            }

                            break;
    
                        case "2":
                            if (!data.BrandFamilyID) {
                                this.dsd.app.alert("A brand family is required.");

                                valid = false;
                            }

                            break;
    
                        default:
                            if (!data.SupplierID) {
                                this.dsd.app.alert("A supplier is required.");

                                valid = false;
                            }

                            break;
                    }
                }

                if (valid) {
                    Database.CreateCampaign(data, files.media).then(async (results) => {
                        if (results.success) {
                            this.ads = await Database.Campaigns({ suppliers: this.suppliers });
                            this.display(results.campaign, ARGS.Query);
                        } else {
                            this.dsd.app.alert("Unable to create campaign.");
                        }
                    });
                }
            });
        }
    }

    async createSchedule(components, campaign, key) {
        if (key === this.key) {
            components.data.addClass("data-left");
            components.data.addClass("svs-mobile-hide");
            components.search.parent().parent().addClass("svs-mobile-hide");
            components.details.off("change").off("click");
            components.details.show();

            components.details.html(`
                <h1>Add Schedule</h1>

                <div class="fieldset">
                    <div class="row">
                        <div class="field">
                            <span class="title">Start Date</span>
                            <input type="date" id="StartDate">
                        </div>
                        <div class="field">
                            <span class="title">End Date</span>
                            <input type="date" id="EndDate">
                        </div>
                    </div>
                    <div class="row">
                        <div class="field">
                            <span class="title">Distributor</span>
                            <placeholder type="edbl-source" id="EDBLSourceID">
                        </div>
                        <div class="field">
                            <span class="title">Chain</span>
                            <placeholder type="chain" id="ChainID">
                        </div>
                    </div>
                    <div class="row">
                        <div class="field">
                            <span class="title">Trade Channel</span>
                            <placeholder type="trade-channel" id="TradeChannelID">
                        </div>
                        <div class="field">
                            <span class="title">On/Off Premise</span>
                            <select id="Premise">
                                <option value=""></option>
                                <option value="A">A</option>
                                <option value="B">B</option>
                                <option value="C">C</option>
                            </select>
                        </div>
                        <div class="field">
                            <span class="title">Industry Volume</span>
                            <select id="IndVolume">
                                <option value=""></option>
                                <option value="0">Off Premise</option>
                                <option value="1">On Premise</option>
                            </select>
                        </div>
                    </div>
                    <div class="row">
                        <div class="field">
                            <span class="title">Draft/Package</span>
                            <select id="DraftPackage">
                                <option value=""></option>
                                <option value="2">Draft & Package</option>
                                <option value="1">Draft Only</option>
                                <option value="3">Package Only</option>
                            </select>
                        </div>
                        <div class="field">
                            <span class="title">Displays</span>
                            <select id="HasDisplays">
                                <option value=""></option>
                                <option value="1">True</option>
                                <option value="0">False</option>
                            </select>
                        </div>
                        <div class="field">
                            <span class="title">Planogram</span>
                            <select id="HasPlanogram">
                                <option value=""></option>
                                <option value="1">True</option>
                                <option value="0">False</option>
                            </select>
                        </div>
                    </div>
                    <div class="row">
                        <div id="submit-schedule-add" class="svs-button svs-button-primary">Add Targeting</div>
                        <div id="add-schedule-cancel" class="svs-button">Cancel</div>
                    </div>
                </div>
            `);

            components.details.find("placeholder").each((_index, element) => {
                const target = $(element);
                const type = target.attr("type");

                switch (type) {
                    case "trade-channel":
                        UI.setupAutocomplete(target, "TradeChannelID", "", true, "TradeChannels", "TradeChannelID", ECP.DataType._Integer, "TradeChannel", ECP.DataType._Text);
                        break;

                    case "edbl-source":
                        UI.setupAutocomplete(target, "EDBLSourceID", "", true, "EDBLSources", "EDBLSourceID", ECP.DataType._Integer, "EDBLSource", ECP.DataType._Text);
                        break;

                    case "chain":
                        UI.setupAutocomplete(target, "ChainID", "", true, "Chains", "ChainID", ECP.DataType._Integer, "Chain", ECP.DataType._Text);
                        break;
                }
            });

            components.details.on("click", "#add-schedule-cancel", () => {
                this.displayCampaigns(this.key, ARGS.CampaignID, ARGS.Query);
            });

            components.details.on("click", "#submit-schedule-add", (event) => {
                const form = $(event.currentTarget).parent().parent();

                const data = {
                    CampaignID: campaign.CampaignID,
                    StartDate: Database.FormatDate(form.find("#StartDate").val()) || null,
                    EndDate: Database.FormatDate(form.find("#EndDate").val()) || null,
                    EDBLSourceID: form.find("#EDBLSourceIDHidden") !== "" ? parseInt(form.find("#EDBLSourceIDHidden").val(), 10) : null,
                    ChainID: form.find("#ChainIDHidden") !== "" ? parseInt(form.find("#ChainIDHidden").val(), 10) : null,
                    TradeChannelID: form.find("#TradeChannelIDHidden") !== "" ? parseInt(form.find("#TradeChannelIDHidden").val(), 10) : null,
                    OnPremise: form.find("#Premise") !== "" ? parseInt(form.find("#Premise").val(), 10) : null,
                    IndVolume: form.find("#IndVolume") !== "" ? form.find("#IndVolume").val() : null,
                    DraftPackage: form.find("#DraftPackage") !== "" ? parseInt(form.find("#DraftPackage").val(), 10) : null,
                    HasDisplays: form.find("#HasDisplays") !== "" ? parseInt(form.find("#HasDisplays").val(), 10) : null,
                    HasPlanogram: form.find("#HasPlanogram") !== "" ? parseInt(form.find("#HasPlanogram").val(), 10) : null
                };

                let valid = true;

                if (valid && !data.CampaignID) {
                    this.dsd.app.alert("Invalid campaign ID.");

                    valid = false;
                }

                if (valid && !data.StartDate) {
                    this.dsd.app.alert("Start date is required.");

                    valid = false;
                }

                if (valid && !data.EndDate) {
                    this.dsd.app.alert("End date is required.");

                    valid = false;
                }

                if (valid && (new Date(data.StartDate)).getTime() > (new Date(data.EndDate)).getTime()) {
                    this.dsd.app.alert("End Date must be greater then or equal to the Start Date.");

                    valid = false;
                }

                if (valid) {
                    Database.CreateSchedule(data).then((success) => {
                        if (success) {
                            this.display(ARGS.CampaignID, ARGS.Query);
                        } else {
                            this.dsd.app.alert("Unable to create scuedule.");
                        }
                    });
                }
            });
        }
    }
}
