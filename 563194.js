class Database {
    static Brands(filters) {
        return new Promise((resolve) => {
            const key = btoa(`DBI:DefaultBrands:${filters.suppliers.map(s => s.SupplierID).join("^")}`);

            let results = DSDLink.getCache(key);

            if (!results || filters.query) {
                const request = new ECP.EC_TableView("Brands");

                request.AddColumn("BrandID");
                request.AddColumn("Brand");
                request.AddColumn("Status");
                request.AddColumn("Brand Logo");
                request.AddColumn("SegmentID");
                request.AddColumn("AlcoholByVolume");
                request.AddColumn("Style");
                request.AddColumn("BrandCountry");
                request.AddColumn("BrandRegion");
                request.AddColumn("Appellation");
                request.AddColumn("Varietal");
                request.AddColumn("BrandStrengthIndex");
                request.AddColumn("BrandDescription");
                request.AddColumn("Sales13Week");
                request.AddColumn("Sales13WeekChange");
                request.AddColumn("SalesLastYear13WeekChange");
                request.AddColumn("Brands_GlobalDocuments_SellSheetGlobalDocumentID^GlobalDocuments.URL");

                request.SetFormat("JSON");
                request.AddSelectSort("Sales13Week", ECP.EC_SortOrder.Desc);
                request.AddSelectSort("Brand", ECP.EC_SortOrder.Asc);

                request.AddFilter("Status", "Active", ECP.EC_Operator.Equals);
                request.AddFilter("SupplierID", filters.suppliers.map(s => s.SupplierID).join("^"), ECP.EC_Operator.Equals);

                if (filters.query && filters.query !== "" && Number.isNaN(parseInt(filters.query, 10))) {
                    request.SetMaxRecords(25);
                    request.AddFilter("Brand", filters.query, ECP.EC_Operator.Like);
                } else if (!Number.isNaN(parseInt(filters.query, 10))) {
                    request.AddFilter("BrandID", filters.query, ECP.EC_Operator.Equals);
                } else {
                    request.SetMaxRecords(200);
                }

                results = [];

                request.GetResults().then((response) => {
                    results = (Server.parseResponse(response) || []).map((row) => {
                        const logo = (row["Brand Logo_DBValue"] || "").split("|");

                        return {
                            BrandID: parseInt(row.BrandID, 10),
                            Brand: row.Brand,
                            Status: {
                                Value: parseInt(row.Status_DBValue),
                                Values: {
                                    0: "Discontinued",
                                    1: "Active"
                                }
                            },
                            StrengthIndex: parseFloat(row.BrandStrengthIndex),
                            SegmentID: parseInt(row.SegmentID_DBValue, 10),
                            Segment: $(row.SegmentID).html(),
                            Style: row.Style,
                            Country: row.BrandCountry,
                            Region: row.BrandRegion,
                            Appellation: row.Appellation,
                            Varietal: row.Varietal,
                            AlcoholByVolume: parseFloat(row.AlcoholByVolume_DBValue || "0"),
                            Description: row.BrandDescription_DBValue,
                            Sales13Week: parseFloat(row.Sales13Week_DBValue),
                            Sales13WeekChange: parseFloat(row.Sales13WeekChange_DBValue),
                            SalesLastYear13WeekChange: parseFloat(row.SalesLastYear13WeekChange_DBValue),
                            Logo: logo[3] || null,
                            SellSheet: row["Brands_GlobalDocuments_SellSheetGlobalDocumentID^GlobalDocuments.URL_DBValue"]
                        };
                    });

                    if (!filters.query) {
                        DSDLink.setCache(key, results, 1000 * 60 * 30);
                    }
                }).finally(() => {
                    resolve(results);
                }).catch((error) => {
                    Server.log(error);
                });
            } else {
                resolve(results);
            }
        });
    }

    static GetBrandLogo(brand) {
        return new Promise((resolve) => {
            const request = new ECP.EC_TableView("Attachments");

            request.AddColumn("AttachmentID");
            request.AddColumn("Attachments_Documents^Documents.DocumentID");
            request.AddColumn("Attachments_Documents^Documents.URL");
            request.AddColumn("Attachments_Documents^Documents.ThumbnailURL");

            request.SetFormat("JSON");
            request.AddSelectSort("TimeUpdated", ECP.EC_SortOrder.Desc);

            request.AddFilter("Table", "Brands", ECP.EC_Operator.Equals);
            request.AddFilter("KeyValue", brand.BrandID, ECP.EC_Operator.Equals);
            request.AddFilter("Attachments_Documents^Documents.DocumentTypeID", 21, ECP.EC_Operator.Equals);

            let results = {};

            request.GetResults().then((response) => {
                const data = Server.parseResponse(response) || [];

                if (data && data.length > 0) {
                    results = {
                        AttachmentID: parseInt(data[0].AttachmentID, 10),
                        DocumentID: parseInt(data[0]["Attachments_Documents^Documents.DocumentID"], 10),
                        URL: data[0]["Attachments_Documents^Documents.URL"],
                        ThumbnailURL: data[0]["Attachments_Documents^Documents.ThumbnailURL"]
                    };
                }

                for (let i = 0; i < data.length; i++) {
                    const { ...row } = data[i];

                    if (row["Attachments_Documents^Documents.ThumbnailURL"] === brand.Logo) {
                        results = {
                            AttachmentID: parseInt(row.AttachmentID, 10),
                            DocumentID: parseInt(row["Attachments_Documents^Documents.DocumentID"], 10),
                            URL: row["Attachments_Documents^Documents.URL"],
                            ThumbnailURL: row["Attachments_Documents^Documents.ThumbnailURL"]
                        };
                    }
                }
            }).finally(() => {
                resolve(results);
            }).catch((error) => {
                Server.log(error);
            });
        });
    }

    static UpdateBrandLogo(brand) {
        return new Promise((resolve) => {
            Database.GetBrandLogo(brand).then((logo) => {
                if (logo.ThumbnailURL || logo.URL) {
                    let results = null;

                    fetch("API.ashx?APICommand=Update_Brand_Logo", {
                        method: "POST",
                        headers: new Headers({
                            "content-type": "application/json"
                        }),
                        body: JSON.stringify({
                            BrandMasterID: brand.BrandID,
                            BrandLogoURL: logo.ThumbnailURL || logo.URL
                        })
                    })
                        .then(response => response.text())
                        .then((response) => {
                            results = response;
                        })
                        .finally(() => {
                            resolve(results);
                        })
                        .catch((error) => {
                            Server.log(error);
                        });
                } else {
                    resolve(null);
                }
            });
        });
    }

    static SaveBrandLogo(brand, file, logo) {
        return new Promise((resolve) => {
            if (file) {
                const data = new FormData();

                data.append("File", file);

                if (logo.DocumentID) {
                    fetch(`API.ashx?APICommand=SalesComm_UploadDocument&Distributor=${window.encompassId}&DocumentID=${logo.DocumentID}&DocumentTypeID=21`, {
                        method: "POST",
                        body: data
                    }).finally(() => {
                        Database.UpdateBrandLogo(brand).then(() => {
                            resolve();
                        });
                    });
                } else {
                    fetch(`API.ashx?APICommand=SalesComm_UploadDocument&Distributor=${window.encompassId}&AttachmentTable=Brands&AttachmentKeyValue=${brand.BrandID}&DocumentTypeID=21`, {
                        method: "POST",
                        body: data
                    }).finally(() => {
                        Database.UpdateBrandLogo(brand).then(() => {
                            resolve();
                        });
                    });
                }
            } else {
                resolve();
            }
        });
    }

    static AddBrand(data, file) {
        return new Promise((resolve) => {
            let request = new ECP.EC_TableEdit("BrandFamilies");

            /*
            {
                SupplierID,
                Brand
            }
            */

            request.EditMemo = "Brand Identity Manager";
            request.AddRecord();
            request.UpdateRecord("BrandFamily", data.Brand);
            request.UpdateRecord("SupplierID", data.SupplierID);

            request.SaveRecord().then((family) => {
                data.BrandFamilyID = parseInt(family.Key, 10);
                request = new ECP.EC_TableEdit("Brands");

                /*
                {
                    SupplierID,
                    Brand,
                    BrandFamilyID,
                    AlcoholByVolume,
                    Style,
                    Varietal,
                    Appellation,
                    Country,
                    Region,
                    SegmentID,
                    Status,
                    Description
                }
                */

                request.EditMemo = "Brand Identity Manager";
                request.AddRecord();
                request.UpdateRecord("Brand", data.Brand);
                request.UpdateRecord("AlcoholByVolume", data.AlcoholByVolume);
                request.UpdateRecord("BrandFamilyID", data.BrandFamilyID);
                request.UpdateRecord("Style", data.Style);
                request.UpdateRecord("Varietal", data.Varietal);
                request.UpdateRecord("Appellation", data.Appellation);
                request.UpdateRecord("BrandCountry", data.Country);
                request.UpdateRecord("BrandRegion", data.Region);
                request.UpdateRecord("SegmentID", data.SegmentID);
                request.UpdateRecord("Status", data.Status);
                request.UpdateRecord("BrandDescription", data.Description);

                request.SaveRecord().then((brand) => {
                    data.BrandID = parseInt(brand.Key, 10);

                    Database.SaveBrandLogo(data, file, {}).then(() => {
                        resolve(data);
                    });
                }).catch((error) => {
                    Server.log(error);

                    resolve(null);
                });
            }).catch((error) => {
                Server.log(error);

                resolve(null);
            });
        });
    }

    static SaveBrand(data, file, logo) {
        return new Promise((resolve) => {
            Database.SaveBrandLogo(data, file, logo).then(() => {
                const request = new ECP.EC_TableEdit("Brands");

                /*
                {
                    SupplierID,
                    Brand,
                    BrandFamilyID,
                    AlcoholByVolume,
                    Style,
                    Varietal,
                    Appellation,
                    Country,
                    Region,
                    SegmentID,
                    Status,
                    Description
                }
                */

                request.EditMemo = "Brand Identity Manager";
                request.EditRecord(data.BrandID);
                request.UpdateRecord("Brand", data.Brand);
                request.UpdateRecord("AlcoholByVolume", data.AlcoholByVolume);
                request.UpdateRecord("Style", data.Style);
                request.UpdateRecord("Varietal", data.Varietal);
                request.UpdateRecord("Appellation", data.Appellation);
                request.UpdateRecord("BrandCountry", data.Country);
                request.UpdateRecord("BrandRegion", data.Region);
                request.UpdateRecord("SegmentID", data.SegmentID);
                request.UpdateRecord("Status", data.Status);
                request.UpdateRecord("BrandDescription", data.Description);

                request.SaveRecord().finally(() => {
                    resolve();
                }).catch((error) => {
                    Server.log(error);
                });
            });
        });
    }

    static SaveSellSheet(brand, file) {
        return new Promise((resolve) => {
            const uuid = Database.UUID();
            const body = new FormData();

            body.append("GlobalDocumentTitle", uuid);
            body.append("File", file);

            fetch(`API.ashx?APICommand=GlobalDocument_Add&Distributor=${window.encompassId}`, {
                method: "POST",
                body
            }).finally(() => {
                const lookup = new ECP.EC_TableView("GlobalDocuments");

                lookup.AddColumn("GlobalDocumentID");
                lookup.SetFormat("JSON");
                lookup.AddFilter("GlobalDocumentTitle", uuid, ECP.EC_Operator.Equals);

                lookup.SetMaxRecords(1);

                let results = null;

                lookup.GetResults().then((response) => {
                    const data = Server.parseResponse(response) || [];

                    if (data && data[0] && data[0].GlobalDocumentID) {
                        results = parseInt(data[0].GlobalDocumentID, 10);
                    }
                }).finally(() => {
                    if (results) {
                        const request = new ECP.EC_TableEdit("Brands");

                        request.EditMemo = "Brand Identity Manager";
                        request.EditRecord(brand);
                        request.UpdateRecord("SellSheetGlobalDocumentID", results);

                        request.SaveRecord().finally(() => {
                            resolve(true);
                        }).catch((error) => {
                            Server.log(error);
                        });
                    } else {
                        resolve(false);
                    }
                }).catch((error) => {
                    Server.log(error);
                });
            }).catch((error) => {
                Server.log(error);
            });
        });
    }

    static Products(brand) {
        return new Promise(async (resolve) => {
            const request = await Public.Request("DBI_Get_Products", "DSDLink", [
                `Parameters=F:Status~V:1^2~O:E|F:BrandID~V:${brand.BrandID}~O:E`
            ]);

            let results = [];

            request.json().then((response) => {
                results = (Server.parseResponse(response) || []).map((row) => {
                    const image = (row["Product Image_DBValue"] || "").split("|");

                    return {
                        ProductID: parseInt(row.ProductID, 10),
                        ProductName: row.ProductName_DBValue,
                        ProductNumber: row.SupplierProductNum_DBValue,
                        PackageID: parseInt(row.PackageID_DBValue, 10),
                        Package: $(row.PackageID).html(),
                        Status: {
                            Value: parseInt(row.Status_DBValue),
                            Values: {
                                0: "Discontinued",
                                1: "Active",
                                2: "Pre-order"
                            }
                        },
                        SeasonalStart: {
                            Month: row.SeasonalStartMonthDay_DBValue && row.SeasonalStartMonthDay_DBValue !== parseInt(row.SeasonalStartMonthDay_DBValue.split("/")[0], 10) ? "" : null,
                            Day: row.SeasonalStartMonthDay_DBValue && row.SeasonalStartMonthDay_DBValue !== parseInt(row.SeasonalStartMonthDay_DBValue.split("/")[1], 10) ? "" : null
                        },
                        SeasonalEnd: {
                            Month: row.SeasonalEndMonthDay_DBValue && row.SeasonalEndMonthDay_DBValue !== parseInt(row.SeasonalEndMonthDay_DBValue.split("/")[0], 10) ? "" : null,
                            Day: row.SeasonalEndMonthDay_DBValue && row.SeasonalEndMonthDay_DBValue !== parseInt(row.SeasonalEndMonthDay_DBValue.split("/")[1], 10) ? "" : null
                        },
                        Price: parseFloat(row.Price_DBValue || "0"),
                        OutletType: {
                            Value: parseInt(row.Premise_DBValue, 10),
                            Values: {
                                0: "Off Premise Only",
                                1: "On Premise Only",
                                2: "Both"
                            }
                        },
                        ProductTypeID: parseInt(row.ProductTypeID_DBValue, 10),
                        ProductType: $(row.ProductTypeID).html(),
                        SellableUnits: {
                            Value: parseInt(row.SellByCaseOnly_DBValue || "1", 10),
                            Values: {
                                0: "Consumable Units",
                                1: "Full Case",
                                2: "Fractional"
                            }
                        },
                        CodeDateType: {
                            Value: parseInt(row.CodeDateType_DBValue, 10),
                            Values: {
                                1: "Expiration Date",
                                2: "Born on Date",
                                3: "Born on Code",
                                4: "Expiration Code"
                            }
                        },
                        CodeDateFormat: {
                            Value: row.CodeDateFormat_DBValue,
                            Values: {
                                DDDY: "DDDY",
                                DDDYY: "DDDYY",
                                DDMMMYY: "DDMMMYY",
                                DDMMYY: "DDMMYY",
                                "MDDY Code": "MDDY Code",
                                MMDD: "MMDD",
                                MMDDY: "MMDDY",
                                MMDDYY: "MMDDYY",
                                MMMYY: "MMMYY",
                                MMYYYY: "MMYYYY",
                                YDDD: "YDDD",
                                YYDDD: "YYDDD",
                                YYMMDD: "YYMMDD",
                                YYYYDDMM: "YYYYDDMM",
                                CanadianDomestic: "Canadian Domestic",
                                Geloso: "Geloso",
                                Heineken: "Heineken",
                                HeinekenKeg: "Heineken Keg",
                                HeinekenCCM: "Heineken CCM",
                                Mikes: "Mikes",
                                Modelo: "Modelo",
                                NorthAmericanBrewery: "North American Brewery"
                            }
                        },
                        ShelfLife: parseInt(row.ShelfLifeDays_DBValue || "0", 10),
                        CasesPerPallet: parseInt(row.CasesPerPallet_DBValue || "0", 10),
                        CasesPerLayer: parseFloat(row.CasesPerLayer_DBValue || "0"),
                        Weight: parseFloat(row.Weight_DBValue || "0"),
                        Height: parseFloat(row.Height_DBValue || "0"),
                        Width: parseFloat(row.Width_DBValue || "0"),
                        Length: parseFloat(row.Length_DBValue || "0"),
                        CaseUPC: row.CaseUPC,
                        CarrierUPC: row.UPC,
                        UnitUPC: row.UnitUPC,
                        Image: image[3] || null
                    };
                });
            }).finally(() => {
                resolve(results);
            }).catch((error) => {
                Server.log(error);
            });
        });
    }

    static GetProductImage(product) {
        return new Promise((resolve) => {
            const request = new ECP.EC_TableView("Attachments");

            request.AddColumn("AttachmentID");
            request.AddColumn("Attachments_Documents^Documents.DocumentID");
            request.AddColumn("Attachments_Documents^Documents.URL");
            request.AddColumn("Attachments_Documents^Documents.ThumbnailURL");

            request.SetFormat("JSON");
            request.SetMaxRecords(1);

            request.AddFilter("Table", "Products", ECP.EC_Operator.Equals);
            request.AddFilter("KeyValue", product.ProductID, ECP.EC_Operator.Equals);
            request.AddFilter("Attachments_Documents^Documents.DocumentTypeID", 21, ECP.EC_Operator.Equals);

            let results = {};

            request.GetResults().then((response) => {
                const data = Server.parseResponse(response) || [];

                if (data && data.length > 0) {
                    results = {
                        AttachmentID: parseInt(data[0].AttachmentID, 10),
                        DocumentID: parseInt(data[0]["Attachments_Documents^Documents.DocumentID"], 10),
                        URL: data[0]["Attachments_Documents^Documents.URL"],
                        ThumbnailURL: data[0]["Attachments_Documents^Documents.ThumbnailURL"]
                    };
                }
            }).finally(() => {
                resolve(results);
            }).catch((error) => {
                Server.log(error);
            });
        });
    }

    static UpdateProductImage(product) {
        return new Promise((resolve) => {
            Database.GetProductImage(product).then((image) => {
                if (image.ThumbnailURL || image.URL) {
                    fetch("API.ashx?APICommand=Update_Product_Image", {
                        method: "POST",
                        headers: new Headers({
                            "content-type": "application/json"
                        }),
                        body: JSON.stringify({
                            ProductMasterID: product.ProductID,
                            ProductImageURL: image.ThumbnailURL || image.URL
                        })
                    }).finally(() => {
                        resolve();
                    }).catch((error) => {
                        Server.log(error);
                    });
                } else {
                    resolve();
                }
            });
        });
    }

    static SaveProductImage(product, file) {
        return new Promise((resolve) => {
            if (file) {
                const data = new FormData();

                data.append("File", file);

                fetch(`API.ashx?APICommand=SalesComm_UploadDocument&Distributor=${window.encompassId}&AttachmentTable=Products&AttachmentKeyValue=${product.ProductID}&DocumentTypeID=21`, {
                    method: "POST",
                    body: data
                }).finally(() => {
                    Database.UpdateProductImage(product).then(() => {
                        resolve();
                    });
                });
            } else {
                resolve();
            }
        });
    }

    static SaveProduct(data, file) {
        return new Promise((resolve) => {
            Database.SaveProductImage(data, file).then(() => {
                const request = new ECP.EC_TableEdit("Products");

                /*
                {
                    ProductID,
                    ProductName,
                    ProductNumber,
                    PackageID,
                    Status,
                    SeasonalStart,
                    SeasonalEnd,
                    CodeDateType,
                    CodeDateFormat,
                    ShelfLife,
                    CasesPerPallet,
                    CasesPerLayer,
                    Weight,
                    Height,
                    Width,
                    Length,
                    CaseUPC,
                    CarrierUPC,
                    UnitUPC
                }
                */

                request.EditMemo = "Brand Identity Manager";
                request.EditRecord(data.ProductID);
                request.UpdateRecord("ProductName", data.ProductName);
                request.UpdateRecord("SupplierProductName", data.ProductName);
                request.UpdateRecord("SupplierProductNum", data.ProductNumber);
                request.UpdateRecord("PackageID", data.PackageID);
                request.UpdateRecord("Status", data.Status);
                request.UpdateRecord("SeasonalStartMonthDay", data.SeasonalStart);
                request.UpdateRecord("SeasonalEndMonthDay", data.SeasonalEnd);
                request.UpdateRecord("CodeDateType", data.CodeDateType);
                request.UpdateRecord("CodeDateFormat", data.CodeDateFormat);
                request.UpdateRecord("ShelfLifeDays", data.ShelfLife);
                request.UpdateRecord("CasesPerPallet", data.CasesPerPallet);
                request.UpdateRecord("CasesPerLayer", data.CasesPerLayer);
                request.UpdateRecord("Weight", data.Weight);
                request.UpdateRecord("Height", data.Height);
                request.UpdateRecord("Width", data.Width);
                request.UpdateRecord("Length", data.Length);
                request.UpdateRecord("CaseUPC", data.CaseUPC);
                request.UpdateRecord("UPC", data.CarrierUPC);
                request.UpdateRecord("UnitUPC", data.UnitUPC);

                request.SaveRecord().finally(() => {
                    resolve();
                }).catch((error) => {
                    Server.log(error);
                });
            });
        });
    }

    static AddProduct(data, file) {
        return new Promise((resolve) => {
            const request = new ECP.EC_TableEdit("Products");

            /*
            {
                BrandID,
                ProductName,
                ProductNumber,
                PackageID,
                Status,
                SeasonalStart,
                SeasonalEnd,
                Price,
                OutletType,
                ProductTypeID,
                SellableUnits,
                CodeDateType,
                CodeDateFormat,
                ShelfLife,
                CasesPerPallet,
                CasesPerLayer,
                Weight,
                Height,
                Width,
                Length,
                CaseUPC,
                CarrierUPC,
                UnitUPC
            }
            */

            request.EditMemo = "Brand Identity Manager";
            request.AddRecord();
            request.UpdateRecord("ProductName", data.ProductName);
            request.UpdateRecord("BrandID", data.BrandID);
            request.UpdateRecord("SupplierProductName", data.ProductName);
            request.UpdateRecord("SupplierProductNum", data.ProductNumber);
            request.UpdateRecord("PackageID", data.PackageID);
            request.UpdateRecord("Status", data.Status);
            request.UpdateRecord("SeasonalStartMonthDay", data.SeasonalStart);
            request.UpdateRecord("SeasonalEndMonthDay", data.SeasonalEnd);
            request.UpdateRecord("Price", 0);
            request.UpdateRecord("Premise", 2);
            request.UpdateRecord("ProductTypeID", 28);
            request.UpdateRecord("SellByCaseOnly", 1);
            request.UpdateRecord("CodeDateType", data.CodeDateType);
            request.UpdateRecord("CodeDateFormat", data.CodeDateFormat);
            request.UpdateRecord("ShelfLifeDays", data.ShelfLife);
            request.UpdateRecord("CasesPerPallet", data.CasesPerPallet);
            request.UpdateRecord("CasesPerLayer", data.CasesPerLayer);
            request.UpdateRecord("Weight", data.Weight);
            request.UpdateRecord("Height", data.Height);
            request.UpdateRecord("Width", data.Width);
            request.UpdateRecord("Length", data.Length);
            request.UpdateRecord("CaseUPC", data.CaseUPC);
            request.UpdateRecord("UPC", data.CarrierUPC);
            request.UpdateRecord("UnitUPC", data.UnitUPC);

            request.SaveRecord().then((product) => {
                data.ProductID = parseInt(product.Key, 10);

                Database.SaveProductImage(data, file).then(() => {
                    resolve();
                });
            }).catch((error) => {
                Server.log(error);

                resolve();
            });
        });
    }

    static DeletePermissions(table, key) {
        return new Promise((resolve) => {
            const request = Server.createRequest("TableMerge_CheckDeletePermissions");

            request.SetReturnType(ECP.EC_ReturnType.Text);

            request.AddRequestVariable("MergeTable", table);
            request.AddRequestVariable("KeyValue", key);

            request.Submit().then((results) => {
                if (results === "") {
                    resolve(true);
                } else {
                    resolve(false);
                }
            });
        });
    }

    static MergeRecord(table, source, destination) {
        return new Promise((resolve) => {
            const request = Server.createRequest("TableMerge");

            request.SetReturnType(ECP.EC_ReturnType.Text);

            request.AddRequestVariable("Action", "ExecuteMerge");
            request.AddRequestVariable("MergeTable", table);
            request.AddRequestVariable("TableName", table);
            request.AddRequestVariable("KeyValue", source);
            request.AddRequestVariable("DestID", destination);

            request.Submit().then((response) => {
                try {
                    response = JSON.parse(response);
                } catch (_error) {
                    response = {};
                }

                if (response.status === "success") {
                    resolve(true);
                } else {
                    resolve(false);
                }
            });
        });
    }

    static UUID() {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0; // eslint-disable-line
            const v = c === "x" ? r : (r & 0x3 | 0x8); // eslint-disable-line

            return v.toString(16);
        });
    }
}

class Main {
    constructor(app) {
        this.key = new Date().getTime() + Math.random();

        this.dsd = new DSDLink(app, async (application, state, family) => {
            application.content.html(application.spinner);

            ARGS.BrandID = parseInt(state.BrandID, 10);
            ARGS.Query = decodeURIComponent(state.Query || "");

            if (Number.isNaN(ARGS.BrandID)) {
                ARGS.BrandID = null;
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

            this.brands = await Database.Brands({ suppliers: this.suppliers });

            Server.log(this.suppliers);
            Server.log(this.brands);

            this.display(ARGS.BrandID, ARGS.Query);
        }, (_application, state) => {
            ARGS.BrandID = parseInt(state.BrandID, 10);
            ARGS.Query = decodeURIComponent(state.Query || "");

            if (Number.isNaN(ARGS.BrandID)) {
                ARGS.BrandID = null;
            }

            this.display(ARGS.BrandID, ARGS.Query);
        });
    }

    display(value, query) {
        this.dsd.app.content[0].scrollTo(0, 0);
        this.dsd.app.content.html(this.dsd.app.spinner);

        this.key = new Date().getTime() + Math.random();

        ARGS.BrandID = value;
        ARGS.Query = query;

        this.displayBrands(this.key, ARGS.BrandID, ARGS.Query);
    }

    async displayBrands(key, brand, query) {
        if (key === this.key) {
            const components = this.dsd.appendSearch(query, "Add Brand");

            await this.searchBrands(components, components.search.val() || "", this.key);
            await this.displayBrand(components, brand, this.key);

            components.form.on("submit", async (event) => {
                event.preventDefault();

                ARGS.Query = components.search.val() || "";
                ARGS.BrandID = null;

                this.key = new Date().getTime() + Math.random();

                DSDLink.logState();

                await this.searchBrands(components, ARGS.Query, this.key);
            });

            components.data.off("click");

            components.data.on("click", ".show-brand", (event) => {
                const target = $(event.currentTarget);

                ARGS.BrandID = parseInt(target.attr("value"), 10);

                this.key = new Date().getTime() + Math.random();

                DSDLink.logState();

                this.displayBrand(components, ARGS.BrandID, this.key);
            });

            components.add.on("click", () => {
                this.displayAddBrand(components, this.key);
            });

            DSDLink.logState();
        }
    }

    async searchBrands(components, query, key) {
        if (key === this.key) {
            query = (query || "").toUpperCase();

            components.details.hide();
            components.data.removeClass("data-left");
            components.data.removeClass("svs-mobile-hide");
            components.search.parent().parent().removeClass("svs-mobile-hide");
            components.data.html(this.dsd.app.spinner);

            this.filtered = this.brands.filter((item) => {
                if (query.length < 2) {
                    return true;
                }

                if (item.BrandID === parseInt(query, 10) || item.Brand.toUpperCase().indexOf(query) >= 0) {
                    return true;
                }

                return false;
            });

            if (this.brands.length >= 200) {
                if (query && query !== "" && Number.isNaN(parseInt(query, 10)) && this.filtered.length <= 3) {
                    this.filtered = await Database.Brands({ query, suppliers: this.suppliers });
                } else if (!Number.isNaN(parseInt(query, 10)) && this.filtered.length === 0) {
                    this.filtered = await Database.Brands({ query, suppliers: this.suppliers });
                }
            }

            let html = "";

            /*
            {
                BrandID,
                Brand,
                Status: {
                    Value,
                    Values
                },
                StrengthIndex,
                SegmentID,
                Segment,
                Style,
                Country,
                Region,
                Appellation,
                Varietal,
                AlcoholByVolume,
                Description,
                Sales13Week,
                Sales13WeekChange,
                SalesLastYear13WeekChange,
                Logo
            }
            */

            for (let i = 0; i < Math.min(this.filtered.length, 500); i++) {
                const { ...row } = this.filtered[i];

                html += `
                    <tr class="show-brand" value="${row.BrandID}">
                        <td class="dbi-parent-cell"></td>
                        <td class="svs-mobile-hide data-center data-shrink">
                            ${row.Logo && row.Logo !== "" ? `<img src="${row.Logo}" loading="lazy">` : ""}
                        </td>
                        <td class="svs-em-cell">${Data.titleCase(row.Brand)}</td>
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
                                <th class="data-full-press">Brand</th>
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
                ARGS.BrandID = this.filtered[0].BrandID;

                this.key = new Date().getTime() + Math.random();

                DSDLink.logState();

                this.displayBrand(components, ARGS.BrandID, this.key);
            }

            components.data[0].scrollTo(0, 0);
        }
    }

    async displayBrand(components, id, key) {
        if (key === this.key && !Number.isNaN(parseInt(id, 10))) {
            components.data.addClass("data-left");
            components.data.addClass("svs-mobile-hide");
            components.search.parent().parent().addClass("svs-mobile-hide");
            components.details.off("change").off("click");
            components.details.html(this.dsd.app.spinner);
            components.details.show();

            const brand = this.filtered.filter(row => row.BrandID === id)[0];
            const products = await Database.Products(brand);
            const logo = await Database.GetBrandLogo(brand);

            let sku = "";

            /*
            {
                ProductID,
                ProductName,
                ProductNumber,
                PackageID,
                Package,
                Status: {
                    Value,
                    Values
                },
                SeasonalStart: {
                    Month,
                    Day
                },
                SeasonalEnd: {
                    Month,
                    Day
                },
                Price,
                OutletType: {
                    Value,
                    Values
                },
                ProductTypeID,
                ProductType,
                SellableUnits: {
                    Value,
                    Values
                },
                CodeDateType: {
                    Value,
                    Values
                },
                CodeDateFormat: {
                    Value,
                    Values
                },
                ShelfLife,
                CasesPerPallet,
                CasesPerLayer,
                Weight,
                Height,
                Width,
                Length,
                CaseUPC,
                CarrierUPC,
                UnitUPC,
                Image
            }
            */

            for (let i = 0; i < Math.min(products.length, 50); i++) {
                const { ...row } = products[i];

                const pstatus = Object.keys(row.Status.Values);
                const codes = Object.keys(row.CodeDateType.Values);
                const formats = Object.keys(row.CodeDateFormat.Values);

                sku += `
                    <tr class="show-product" value="${row.ProductID}">
                        <td class="svs-mobile-hide data-center data-shrink">
                            ${row.Image && row.Image !== "" ? `<img src="${row.Image}" loading="lazy">` : ""}
                        </td>

                        <td>${row.ProductNumber}</td>
                        <td class="svs-em-cell">${Data.titleCase(row.ProductName)}</td>
                        <td class="svs-mobile-hide">${row.Package}</td>
                        <td class="svs-mobile-hide">${row.CarrierUPC}</td>
                    </tr>

                    <tr class="row-form" value="${row.ProductID}">
                        <td colspan="5">
                            <form class="fieldset">
                                <div class="section">
                                    <div class="fields">
                                        <div class="row">
                                            <div class="field">
                                                <span class="title">Product Name</span>
                                                <input type="text" id="ProductName" value="${row.ProductName || ""}">
                                            </div>
                                        </div>

                                        <div class="row">
                                            <div class="field">
                                                <span class="title">Product Number</span>
                                                <input type="text" id="ProductNumber" value="${row.ProductNumber || ""}">
                                            </div>

                                            <div class="field">
                                                <span class="title">Package</span>
                                                <placeholder type="package" id="PackageID_${row.ProductID}" parent="${row.ProductID}" value="${row.PackageID}" display="${row.Package}">
                                            </div>

                                            <div class="field">
                                                <span class="title">Status</span>
                                                <select id="Status">${pstatus.map(o => `<option value="${o}"${`${o}` === `${row.Status.Value}` ? " selected" : ""}>${row.Status.Values[o]}</option>`).join("")}</select>
                                            </div>
                                        </div>

                                        <div class="row">
                                            <div class="field">
                                                <span class="title">Case UPC</span>
                                                <div class="marker-field">
                                                    <div class="marker">
                                                        <svg xmlns="http://www.w3.org/2000/svg" version="1.1" x="0px" y="0px" viewBox="0 0 95 95">
                                                            <polygon fill="#949494" points="67.918,85.036 85.548,69.649 85.548,12.529 67.918,27.915"></polygon>
                                                            <polygon fill="#949494" points="30.479,9.964 9.452,26.569 66.572,26.569 85.548,10.477"></polygon>
                                                            <path fill="#949494" d="
                                                                M9.452,85.036h57.12V27.915H9.452V85.036z M55.357,64.716l2.311-4.004l2.313,4.004l2.311,4.004h-2.935v11.027
                                                                c0,0.56-0.453,1.014-1.013,1.014h-1.352c-0.561,0-1.013-0.454-1.013-1.014V68.72h-2.936L55.357,64.716z M26.313,33.556
                                                                c0-0.85,0.688-1.539,1.538-1.539h19.232c0.85,0,1.538,0.689,1.538,1.539v3.077c0,0.85-0.688,1.539-1.538,1.539H27.852
                                                                c-0.85,0-1.538-0.689-1.538-1.539V33.556z
                                                            "></path>
                                                        </svg>
                                                    </div>
                                                    <input type="text" id="CaseUPC" value="${row.CaseUPC || ""}">
                                                </div>
                                            </div>

                                            <div class="field">
                                                <span class="title">Carrier UPC</span>
                                                <div class="marker-field">
                                                    <div class="marker">
                                                        <svg xmlns="http://www.w3.org/2000/svg" version="1.1" x="0px" y="0px" viewBox="0 0 100 100">
                                                            <path fill="#949494" d="
                                                                M21.412,29.325l11.351,5.357v60.29l-11.274-2.591L21.412,29.325z M21.489,92.381l11.274,2.591v-60.29
                                                                l-11.351-5.357L21.489,92.381z M21.489,92.381l11.274,2.591v-60.29l-11.351-5.357L21.489,92.381z M7.414,36.969v54.035l13.071,1.214
                                                                V29.325L7.414,36.969z M33.533,34.635c0.431-0.718,0.293,61.872,0.28,60.337l58.773-3.618V36.503L33.533,34.635z M33.533,34.635
                                                                c0.431-0.718,0.293,61.872,0.28,60.337l58.773-3.618V36.503L33.533,34.635z M33.533,34.635c0.431-0.718,0.293,61.872,0.28,60.337
                                                                l58.773-3.618V36.503L33.533,34.635z M92.272,35.033l-5.566-2.109c-0.001-0.006-0.001-0.012-0.002-0.018
                                                                c-0.497-4.582-0.767-9.106-1.078-14.279c0.284-0.625,0.565-1.366,0.644-1.796c0.012-0.024,0.02-0.073,0.021-0.097
                                                                c0.001-0.036,0.002-0.088,0-0.13c0-0.02,0.001-0.045,0-0.064c0-0.003-0.002-0.009-0.002-0.011c-0.037-0.632-0.341-1.814-0.651-2.883
                                                                c0.003-0.143,0.005-0.286,0.006-0.428c0.174,0.048,0.328,0.158,0.443,0.312c-0.015-0.181-0.053-0.381-0.107-0.587
                                                                c-0.055-0.207-0.126-0.421-0.211-0.632c-0.084-0.211-0.181-0.419-0.287-0.614c-0.105-0.194-0.218-0.375-0.335-0.532
                                                                c-0.116-0.157-0.236-0.22-0.354-0.318c-0.119-0.098-0.235-0.111-0.346-0.111c-0.701,0-1.402,0-2.103,0c-0.701,0-1.402,0-2.104,0
                                                                c-0.701,0-1.402,0-2.103,0s-1.402,0-2.103,0c-0.116,0-0.24,0.019-0.364,0.125c-0.124,0.107-0.25,0.216-0.371,0.386
                                                                c-0.122,0.169-0.239,0.346-0.347,0.554c-0.108,0.208-0.206,0.421-0.29,0.643c-0.084,0.223-0.152,0.442-0.2,0.654
                                                                c-0.046,0.205-0.069,0.406-0.082,0.617c0.109-0.231,0.291-0.408,0.508-0.484c0.002,0.25,0.007,0.499,0.013,0.75
                                                                c-0.251,0.974-0.477,1.982-0.505,2.548c0,0.002-0.001,0.003-0.001,0.005c-0.001,0.016-0.001,0.036-0.001,0.054
                                                                c-0.001,0.044-0.001,0.084,0.001,0.121c0.001,0.023,0.007,0.044,0.017,0.066c0.062,0.385,0.275,1.079,0.506,1.652
                                                                c-0.358,5.96-0.658,10.796-1.304,16.007l1.271,0.037c0.601-5.019,1.269-15.854,1.269-15.854l0.49,0.158
                                                                c0,0-0.668,10.69-1.268,15.707l8.837,0.321c-0.11-0.902-1.27-16.325-1.27-16.325c0.309-0.684,0.552-1.357,0.618-1.713
                                                                c0,0-0.238-1.886-0.625-3.221l0.775,0.272l0.554-0.272c0.391,1.347,0.605,3.31,0.58,3.387c-0.096,0.475-0.35,1.203-0.598,1.764
                                                                c0,0,1.224,15.31,1.325,16.131L92.272,35.033z M21.126,11.75v15.947l0.565,0.23V11.516L21.126,11.75z M21.637,10.447
                                                                c0,0,1.508,0.069,1.478-0.034c0.003-0.143,0.005-0.236,0.006-0.378c0.174,0.048,0.328,0.108,0.443,0.262
                                                                c-0.015-0.181-0.053-0.331-0.107-0.537c-0.055-0.207-0.126-0.421-0.211-0.632c-0.084-0.212-0.181-0.419-0.287-0.614
                                                                c-0.105-0.194-0.218-0.375-0.335-0.532c-0.116-0.157-0.236-0.22-0.354-0.318c-0.119-0.098-0.235-0.111-0.346-0.111
                                                                c-0.701,0-1.402,0-2.103,0s-1.402,0-2.104,0c-0.701,0-1.402,0-2.103,0c-0.701,0-1.402,0-2.103,0c-0.116,0-0.24,0.019-0.364,0.125
                                                                c-0.124,0.107-0.25,0.216-0.371,0.386c-0.122,0.169-0.239,0.346-0.347,0.554c-0.108,0.208-0.206,0.421-0.29,0.643
                                                                s-0.152,0.442-0.2,0.654c-0.046,0.205-0.069,0.406-0.082,0.617c0.109-0.231,0.291-0.408,0.508-0.484
                                                                c0.002,0.25,0.006,0.499,0.013,0.75c-0.251,0.974-0.477,1.982-0.505,2.548c0,0.002-0.001,0.003-0.001,0.005
                                                                c-0.001,0.016-0.001,0.036-0.001,0.054c-0.001,0.044-0.001,0.084,0.001,0.121c0.001,0.023,0.008,0.044,0.017,0.066
                                                                c0.062,0.385,0.275,1.079,0.506,1.652c-0.358,5.96-1.539,13.241-2.185,18.592l1.271-0.762c0.601-5.159,2.15-17.64,2.15-17.64
                                                                l0.49,0.158c0,0-1.549,12.307-2.149,17.325l8.281-4.941v-16.01v-0.875L21.637,10.447z M73.341,17.547
                                                                c-0.347,5.576-0.638,10.159-1.227,14.998c0,0-6.441,1.52-6.436,1.567l-1.615-0.051c-0.217-2.301-1.407-17.115-1.407-17.115
                                                                c0.269-0.607,0.544-1.395,0.648-1.909c0.027-0.083-0.204-2.207-0.627-3.665l-0.6,0.294l-0.839-0.294
                                                                c0.419,1.445,0.676,3.486,0.676,3.486c-0.072,0.386-0.335,1.113-0.669,1.854c0,0,1.125,14.887,1.345,17.303l-9.244-0.306
                                                                c0.64-5.547,1.336-16.698,1.336-16.698l-0.795-0.15c0,0-0.696,11.277-1.337,16.831l-1.363-0.039
                                                                c0.672-5.516,0.994-10.674,1.374-16.998c-0.25-0.62-0.48-1.371-0.548-1.787c-0.01-0.024-0.017-0.046-0.018-0.071
                                                                c-0.002-0.041-0.002-0.084-0.001-0.131c0-0.02,0-0.041,0.001-0.058c0-0.002,0.001-0.003,0.002-0.005
                                                                c0.03-0.613,0.275-1.704,0.546-2.757c-0.006-0.271-0.012-0.542-0.014-0.812c-0.235,0.083-0.432,0.273-0.55,0.524
                                                                c0.014-0.228,0.038-0.446,0.088-0.668c0.053-0.23,0.126-0.467,0.217-0.708c0.09-0.24,0.197-0.47,0.314-0.695s0.243-0.416,0.375-0.6
                                                                c0.131-0.184,0.267-0.302,0.401-0.417c0.134-0.115,0.268-0.135,0.394-0.135c0.759,0,1.517,0,2.276,0c0.759,0,1.517,0,2.276,0
                                                                c0.759,0,1.517,0,2.276,0c0.759,0,1.517,0,2.276,0c0.12,0,0.246,0.013,0.375,0.12c0.128,0.105,0.258,0.174,0.383,0.344
                                                                c0.126,0.17,0.248,0.365,0.362,0.575c0.114,0.21,0.219,0.435,0.31,0.664c0.092,0.228,0.17,0.46,0.229,0.684
                                                                c0.059,0.223,0.1,0.439,0.116,0.635c-0.125-0.167-0.291-0.286-0.48-0.338c-0.001,0.154-0.003,0.309-0.006,0.464
                                                                c0.022,0.077,0.043,0.155,0.065,0.233c0.608,0,3.896,0.054,4.274,0.111c0.44,0.066,1.179,1.676,1.262,1.881l-5.118-0.39
                                                                c0.117,0.508,0.194,1.07,0.179,0.96l7.819,0.547C72.582,15.146,72.665,16.84,73.341,17.547z M65.135,28.094l0.076,0.684
                                                                c1.129-0.129,3.445-0.414,3.372-4.507c0-0.022,0.026-1.71,0.082-2.883c0.021-0.441-0.216-1.155-0.67-1.746
                                                                c-0.82-0.57-2.007-0.747-3.53,0.186c0.001,0.021,0.002,0.046,0.003,0.063l0.027,0.375C64.684,22.86,64.923,25.641,65.135,28.094z
                                                                M69.324,21.967c0.024-0.446-0.219-1.157-0.708-1.752c0.198,0.441,0.303,0.875,0.288,1.186c-0.056,1.168-0.082,3.052-0.082,3.07
                                                                c0.077,4.324-2.498,4.62-3.598,4.746l-0.028,0.003c0.012,0.124,0.025,0.259,0.037,0.381c1.161-0.124,4.087-0.276,4-4.593
                                                                C69.232,25.009,69.261,23.138,69.324,21.967z M27.56,11.844c-0.009-0.027-0.018-0.174-0.017-0.227c0-0.022-0.001-0.045,0.001-0.065
                                                                c0-0.002,0.001-0.003,0.001-0.006c0.001-0.026,0.006-0.064,0.008-0.092l-2.494-0.22l-2.831,0.015v16.945l5.071,2.24
                                                                c0.482-5.49,0.893-10.226,1.196-16.587C28.273,13.153,27.62,12.311,27.56,11.844z M50.646,20.995
                                                                c0.074-1.396,0.146-2.833,0.221-4.341c-0.206-0.62-0.397-1.371-0.452-1.787c-0.008-0.024-0.014-0.046-0.015-0.071
                                                                c-0.002-0.041-0.002-0.084-0.001-0.131c0-0.02,0-0.041,0.001-0.058c0-0.002,0.001-0.003,0.001-0.005
                                                                c0.013-0.305,0.069-0.73,0.151-1.21l-7.093-0.6c0.063-0.201,0.115-0.387,0.143-0.537c0.014-0.028,0.024-0.087,0.025-0.116
                                                                c0.002-0.043,0.002-0.105,0-0.155c0.001-0.024,0.001-0.054,0-0.076c0-0.003-0.002-0.01-0.003-0.013c0-0.002-0.001-0.005-0.001-0.007
                                                                l5.852,0.356c-0.098-0.243-0.557-0.908-0.679-1.131c-0.124-0.23-0.258-0.443-0.396-0.629s-0.28-0.26-0.419-0.376
                                                                c-0.14-0.117-0.278-0.131-0.41-0.131c-0.83,0-3.704-0.08-4.311-0.08c-0.124-0.494-0.267-0.933-0.412-1.433
                                                                c0.003-0.17,0.005-0.34,0.007-0.51c0.207,0.057,0.39,0.188,0.528,0.372c-0.018-0.216-0.063-0.454-0.128-0.699
                                                                c-0.065-0.246-0.15-0.502-0.252-0.752c-0.101-0.252-0.216-0.499-0.341-0.73c-0.125-0.231-0.259-0.446-0.398-0.633
                                                                c-0.138-0.187-0.281-0.262-0.422-0.378C41.701,5.014,41.562,5,41.43,5c-0.835,0-1.669,0-2.504,0c-0.835,0-1.669,0-2.504,0
                                                                s-1.669,0-2.504,0c-0.835,0-1.669,0-2.504,0c-0.138,0-0.285,0.022-0.433,0.149c-0.148,0.127-0.297,0.257-0.442,0.459
                                                                c-0.145,0.202-0.284,0.412-0.413,0.66c-0.128,0.247-0.245,0.501-0.345,0.765c-0.099,0.265-0.181,0.526-0.238,0.779
                                                                c-0.055,0.244-0.082,0.484-0.097,0.734c0.13-0.276,0.347-0.485,0.605-0.576c0.002,0.297,0.008,0.594,0.015,0.893
                                                                c-0.298,1.159-0.601,2.591-0.601,3.033c0,0.442,0.346,1.576,0.621,2.258c-0.378,6.296-0.703,11.539-1.309,16.975l1.411,0.6
                                                                c0.667-6.393,1.343-17.349,1.343-17.349l0.846,0.165c0,0-0.693,11.104-1.366,17.44l2.214,1.115l7.901,0.236
                                                                c-0.222-2.359-1.488-19.12-1.488-19.12c0.368-0.815,0.657-1.615,0.736-2.039c0,0-0.283-2.245-0.744-3.835l0.923,0.324l0.66-0.323
                                                                c0.466,1.604,0.72,3.94,0.69,4.032c-0.114,0.565-0.417,1.432-0.712,2.1c0,0,1.493,18.267,1.555,18.913l6.992,0.209
                                                                c0.154-1.539,0.285-3.052,0.402-4.569l-6.092-0.398c0-0.004-0.001-0.009-0.001-0.014l0,0c0-0.003-0.016-0.17-0.04-0.441
                                                                c1.369,0.109,4.777,0.377,6.161,0.443l0.01-0.39l-6.193-0.391c-0.184-1.912-0.722-7.794-0.738-7.98
                                                                C45.346,20.965,50.646,20.995,50.646,20.995z
                                                            "></path>
                                                        </svg>
                                                    </div>
                                                    <input type="text" id="CarrierUPC" value="${row.CarrierUPC || ""}">
                                                </div>
                                            </div>

                                            <div class="field">
                                                <span class="title">Unit UPC</span>
                                                <div class="marker-field">
                                                    <div class="marker">
                                                        <svg xmlns="http://www.w3.org/2000/svg" version="1.1" x="0px" y="0px" viewBox="0 0 100 100">
                                                            <path fill="#949494" d="
                                                                M55.928,8.151c-0.062-0.245-0.222-0.758-0.59-1.364C54.979,6.195,52.217,6,49.994,6c-2.224,0-4.975,0.195-5.335,0.787
                                                                c-0.367,0.606-0.526,1.12-0.589,1.364c-0.021,0.046-0.034,0.098-0.034,0.154c0,0.194,0.14,0.351,0.312,0.351h5.646h5.656
                                                                c0.172,0,0.312-0.157,0.312-0.351C55.963,8.249,55.948,8.197,55.928,8.151z
                                                            "></path>
                                                            <path fill="#949494" d="
                                                                M63.771,82.315c-0.05-0.073-0.112-0.133-0.184-0.183v-36.34c0.312-0.011,0.562-0.265,0.562-0.58v-2.885
                                                                c0-0.639-0.119-1.246-0.328-1.811l0.005-0.001c-0.241-1.224-3.185-5.504-5.387-8.582h-0.001c-0.052-0.073-0.103-0.144-0.153-0.214
                                                                c-0.282-0.496-0.908-2.062-1.46-6.739c-0.001-0.002-0.001-0.005-0.001-0.005L55.248,11.63c0.361-0.012,0.652-0.308,0.652-0.673
                                                                c0-0.373-0.302-0.674-0.674-0.674h-0.138l-0.086-0.727h-4.982h-0.041h-4.983l-0.085,0.727h-0.138c-0.373,0-0.675,0.302-0.675,0.674
                                                                c0,0.365,0.29,0.661,0.652,0.673l-1.575,13.346c0,0-0.001,0.003-0.001,0.005c-0.553,4.677-1.178,6.243-1.46,6.739
                                                                c-0.051,0.07-0.101,0.141-0.153,0.214l0,0c-2.202,3.078-5.146,7.358-5.387,8.582l0.003,0.001c-0.208,0.565-0.327,1.172-0.327,1.811
                                                                v2.885c0,0.315,0.25,0.569,0.562,0.58v36.34c-0.072,0.05-0.136,0.109-0.184,0.183c-0.002-0.002-0.417-0.268-0.417,5.625
                                                                c0,1.46,0.636,2.768,1.642,3.675c0.003,0.002,0.006,0.005,0.008,0.009c1.812,1.961,8.521,2.322,11.694,2.381v0.009
                                                                c0,0,0.315,0.006,0.844,0.002c0.526,0.004,0.842-0.002,0.842-0.002l0.002-0.009c3.173-0.059,9.882-0.42,11.693-2.381
                                                                c0.002-0.004,0.004-0.007,0.007-0.009c1.006-0.907,1.644-2.215,1.644-3.675C64.188,82.048,63.771,82.313,63.771,82.315z
                                                                M38.62,46.625c-0.283,0-0.515-0.231-0.515-0.516c0-0.284,0.231-0.515,0.515-0.515c0.285,0,0.516,0.231,0.516,0.515
                                                                C39.136,46.393,38.905,46.625,38.62,46.625z M44.852,33.364l-0.153,0.214c-3.646,5.096-4.809,7.16-5.168,7.99l0.015,0.002
                                                                l-0.175,0.484c-0.198,0.54-0.3,1.097-0.3,1.655c0,0.249-0.201,0.451-0.45,0.451c-0.247,0-0.448-0.202-0.448-0.451
                                                                c0-0.643,0.111-1.285,0.333-1.907c0.211-1.035,2.048-3.979,5.461-8.748l0.154-0.214c0.145-0.202,0.425-0.249,0.628-0.104
                                                                C44.95,32.882,44.995,33.162,44.852,33.364z M60.098,48.591c0-0.248,0.202-0.449,0.45-0.449s0.45,0.201,0.45,0.449v29.227
                                                                c0,0.248-0.202,0.45-0.45,0.45s-0.45-0.202-0.45-0.45V48.591z M60.548,80.633c-0.284,0-0.515-0.232-0.515-0.516
                                                                c0-0.284,0.23-0.515,0.515-0.515s0.515,0.23,0.515,0.515C61.062,80.4,60.832,80.633,60.548,80.633z
                                                            "></path>
                                                        </svg>
                                                    </div>
                                                    <input type="text" id="UnitUPC" value="${row.UnitUPC || ""}">
                                                </div>
                                            </div>
                                        </div>

                                        <div class="row">
                                            <div class="field">
                                                <span class="title">Seasonal Start Month</span>
                                                <select id="SeasonalStartMonth">
                                                    <option value=""></option>
                                                    <option value="1"${`${row.SeasonalStart.Month}` === "1" ? " selected" : ""}>January</option>
                                                    <option value="2"${`${row.SeasonalStart.Month}` === "2" ? " selected" : ""}>February</option>
                                                    <option value="3"${`${row.SeasonalStart.Month}` === "3" ? " selected" : ""}>March</option>
                                                    <option value="4"${`${row.SeasonalStart.Month}` === "4" ? " selected" : ""}>April</option>
                                                    <option value="5"${`${row.SeasonalStart.Month}` === "5" ? " selected" : ""}>May</option>
                                                    <option value="6"${`${row.SeasonalStart.Month}` === "6" ? " selected" : ""}>June</option>
                                                    <option value="7"${`${row.SeasonalStart.Month}` === "7" ? " selected" : ""}>July</option>
                                                    <option value="8"${`${row.SeasonalStart.Month}` === "8" ? " selected" : ""}>August</option>
                                                    <option value="9"${`${row.SeasonalStart.Month}` === "9" ? " selected" : ""}>September</option>
                                                    <option value="10"${`${row.SeasonalStart.Month}` === "10" ? " selected" : ""}>October</option>
                                                    <option value="11"${`${row.SeasonalStart.Month}` === "11" ? " selected" : ""}>November</option>
                                                    <option value="12"${`${row.SeasonalStart.Month}` === "12" ? " selected" : ""}>December</option>
                                                </select>
                                            </div>

                                            <div class="field">
                                                <span class="title">Seasonal Start Day</span>
                                                <select id="SeasonalStartDay">
                                                    <option value=""></option>
                                                    <option value="1"${`${row.SeasonalStart.Day}` === "1" ? " selected" : "1"}>1st</option>
                                                    <option value="2"${`${row.SeasonalStart.Day}` === "2" ? " selected" : "2"}>2nd</option>
                                                    <option value="3"${`${row.SeasonalStart.Day}` === "3" ? " selected" : "3"}>3rd</option>
                                                    <option value="4"${`${row.SeasonalStart.Day}` === "4" ? " selected" : "4"}>4th</option>
                                                    <option value="5"${`${row.SeasonalStart.Day}` === "5" ? " selected" : "5"}>5th</option>
                                                    <option value="6"${`${row.SeasonalStart.Day}` === "6" ? " selected" : "6"}>6th</option>
                                                    <option value="7"${`${row.SeasonalStart.Day}` === "7" ? " selected" : "7"}>7th</option>
                                                    <option value="8"${`${row.SeasonalStart.Day}` === "8" ? " selected" : "8"}>8th</option>
                                                    <option value="9"${`${row.SeasonalStart.Day}` === "9" ? " selected" : "9"}>9th</option>
                                                    <option value="10"${`${row.SeasonalStart.Day}` === "10" ? " selected" : "10"}>10th</option>
                                                    <option value="11"${`${row.SeasonalStart.Day}` === "11" ? " selected" : "11"}>11th</option>
                                                    <option value="12"${`${row.SeasonalStart.Day}` === "12" ? " selected" : "12"}>12th</option>
                                                    <option value="13"${`${row.SeasonalStart.Day}` === "13" ? " selected" : "13"}>13th</option>
                                                    <option value="14"${`${row.SeasonalStart.Day}` === "14" ? " selected" : "14"}>14th</option>
                                                    <option value="15"${`${row.SeasonalStart.Day}` === "15" ? " selected" : "15"}>15th</option>
                                                    <option value="16"${`${row.SeasonalStart.Day}` === "16" ? " selected" : "16"}>16th</option>
                                                    <option value="17"${`${row.SeasonalStart.Day}` === "17" ? " selected" : "17"}>17th</option>
                                                    <option value="18"${`${row.SeasonalStart.Day}` === "18" ? " selected" : "18"}>18th</option>
                                                    <option value="19"${`${row.SeasonalStart.Day}` === "19" ? " selected" : "19"}>19th</option>
                                                    <option value="20"${`${row.SeasonalStart.Day}` === "20" ? " selected" : "20"}>20th</option>
                                                    <option value="21"${`${row.SeasonalStart.Day}` === "21" ? " selected" : "21"}>21st</option>
                                                    <option value="22"${`${row.SeasonalStart.Day}` === "22" ? " selected" : "22"}>22nd</option>
                                                    <option value="23"${`${row.SeasonalStart.Day}` === "23" ? " selected" : "23"}>23rd</option>
                                                    <option value="24"${`${row.SeasonalStart.Day}` === "24" ? " selected" : "24"}>24th</option>
                                                    <option value="25"${`${row.SeasonalStart.Day}` === "25" ? " selected" : "25"}>25th</option>
                                                    <option value="26"${`${row.SeasonalStart.Day}` === "26" ? " selected" : "26"}>26th</option>
                                                    <option value="27"${`${row.SeasonalStart.Day}` === "27" ? " selected" : "27"}>27th</option>
                                                    <option value="28"${`${row.SeasonalStart.Day}` === "28" ? " selected" : "28"}>28th</option>
                                                    <option value="29"${`${row.SeasonalStart.Day}` === "29" ? " selected" : "29"}>29th</option>
                                                    <option value="30"${`${row.SeasonalStart.Day}` === "30" ? " selected" : "30"}>30th</option>
                                                    <option value="31"${`${row.SeasonalStart.Day}` === "31" ? " selected" : "31"}>31st</option>
                                                </select>
                                            </div>

                                            <div class="field">
                                                <span class="title">Seasonal End Month</span>
                                                <select id="SeasonalEndMonth">
                                                    <option value=""></option>
                                                    <option value="1"${`${row.SeasonalEnd.Month}` === "1" ? " selected" : ""}>January</option>
                                                    <option value="2"${`${row.SeasonalEnd.Month}` === "2" ? " selected" : ""}>February</option>
                                                    <option value="3"${`${row.SeasonalEnd.Month}` === "3" ? " selected" : ""}>March</option>
                                                    <option value="4"${`${row.SeasonalEnd.Month}` === "4" ? " selected" : ""}>April</option>
                                                    <option value="5"${`${row.SeasonalEnd.Month}` === "5" ? " selected" : ""}>May</option>
                                                    <option value="6"${`${row.SeasonalEnd.Month}` === "6" ? " selected" : ""}>June</option>
                                                    <option value="7"${`${row.SeasonalEnd.Month}` === "7" ? " selected" : ""}>July</option>
                                                    <option value="8"${`${row.SeasonalEnd.Month}` === "8" ? " selected" : ""}>August</option>
                                                    <option value="9"${`${row.SeasonalEnd.Month}` === "9" ? " selected" : ""}>September</option>
                                                    <option value="10"${`${row.SeasonalEnd.Month}` === "10" ? " selected" : ""}>October</option>
                                                    <option value="11"${`${row.SeasonalEnd.Month}` === "11" ? " selected" : ""}>November</option>
                                                    <option value="12"${`${row.SeasonalEnd.Month}` === "12" ? " selected" : ""}>December</option>
                                                </select>
                                            </div>

                                            <div class="field">
                                                <span class="title">Seasonal End Day</span>
                                                <select id="SeasonalEndDay">
                                                    <option value=""></option>
                                                    <option value="1"${`${row.SeasonalEnd.Day}` === "1" ? " selected" : "1"}>1st</option>
                                                    <option value="2"${`${row.SeasonalEnd.Day}` === "2" ? " selected" : "2"}>2nd</option>
                                                    <option value="3"${`${row.SeasonalEnd.Day}` === "3" ? " selected" : "3"}>3rd</option>
                                                    <option value="4"${`${row.SeasonalEnd.Day}` === "4" ? " selected" : "4"}>4th</option>
                                                    <option value="5"${`${row.SeasonalEnd.Day}` === "5" ? " selected" : "5"}>5th</option>
                                                    <option value="6"${`${row.SeasonalEnd.Day}` === "6" ? " selected" : "6"}>6th</option>
                                                    <option value="7"${`${row.SeasonalEnd.Day}` === "7" ? " selected" : "7"}>7th</option>
                                                    <option value="8"${`${row.SeasonalEnd.Day}` === "8" ? " selected" : "8"}>8th</option>
                                                    <option value="9"${`${row.SeasonalEnd.Day}` === "9" ? " selected" : "9"}>9th</option>
                                                    <option value="10"${`${row.SeasonalEnd.Day}` === "10" ? " selected" : "10"}>10th</option>
                                                    <option value="11"${`${row.SeasonalEnd.Day}` === "11" ? " selected" : "11"}>11th</option>
                                                    <option value="12"${`${row.SeasonalEnd.Day}` === "12" ? " selected" : "12"}>12th</option>
                                                    <option value="13"${`${row.SeasonalEnd.Day}` === "13" ? " selected" : "13"}>13th</option>
                                                    <option value="14"${`${row.SeasonalEnd.Day}` === "14" ? " selected" : "14"}>14th</option>
                                                    <option value="15"${`${row.SeasonalEnd.Day}` === "15" ? " selected" : "15"}>15th</option>
                                                    <option value="16"${`${row.SeasonalEnd.Day}` === "16" ? " selected" : "16"}>16th</option>
                                                    <option value="17"${`${row.SeasonalEnd.Day}` === "17" ? " selected" : "17"}>17th</option>
                                                    <option value="18"${`${row.SeasonalEnd.Day}` === "18" ? " selected" : "18"}>18th</option>
                                                    <option value="19"${`${row.SeasonalEnd.Day}` === "19" ? " selected" : "19"}>19th</option>
                                                    <option value="20"${`${row.SeasonalEnd.Day}` === "20" ? " selected" : "20"}>20th</option>
                                                    <option value="21"${`${row.SeasonalEnd.Day}` === "21" ? " selected" : "21"}>21st</option>
                                                    <option value="22"${`${row.SeasonalEnd.Day}` === "22" ? " selected" : "22"}>22nd</option>
                                                    <option value="23"${`${row.SeasonalEnd.Day}` === "23" ? " selected" : "23"}>23rd</option>
                                                    <option value="24"${`${row.SeasonalEnd.Day}` === "24" ? " selected" : "24"}>24th</option>
                                                    <option value="25"${`${row.SeasonalEnd.Day}` === "25" ? " selected" : "25"}>25th</option>
                                                    <option value="26"${`${row.SeasonalEnd.Day}` === "26" ? " selected" : "26"}>26th</option>
                                                    <option value="27"${`${row.SeasonalEnd.Day}` === "27" ? " selected" : "27"}>27th</option>
                                                    <option value="28"${`${row.SeasonalEnd.Day}` === "28" ? " selected" : "28"}>28th</option>
                                                    <option value="29"${`${row.SeasonalEnd.Day}` === "29" ? " selected" : "29"}>29th</option>
                                                    <option value="30"${`${row.SeasonalEnd.Day}` === "30" ? " selected" : "30"}>30th</option>
                                                    <option value="31"${`${row.SeasonalEnd.Day}` === "31" ? " selected" : "31"}>31st</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div class="row">
                                            <div class="field">
                                                <span class="title">Code Date Type</span>
                                                <select id="CodeDateType">${codes.map(o => `<option value="${o}"${`${o}` === `${row.CodeDateType.Value}` ? " selected" : ""}>${row.CodeDateType.Values[o]}</option>`).join("")}</select>
                                            </div>

                                            <div class="field">
                                                <span class="title">Code Date Format</span>
                                                <select id="CodeDateFormat">${formats.map(o => `<option value="${o}"${`${o}` === `${row.CodeDateFormat.Value}` ? " selected" : ""}>${row.CodeDateFormat.Values[o]}</option>`).join("")}</select>
                                            </div>

                                            <div class="field">
                                                <span class="title">Shelf Life (Days)</span>
                                                <input type="text" id="ShelfLife" value="${row.ShelfLife}" onchange="EC_Fmt.InputFmt(this, '_Integer', 12, true, false)">
                                            </div>
                                        </div>

                                        <div class="row">
                                            <div class="field">
                                                <span class="title">Cases Per Pallet</span>
                                                <input type="text" id="CasesPerPallet" value="${row.CasesPerPallet}" onchange="EC_Fmt.InputFmt(this, '_Integer', 12, true, false)">
                                            </div>

                                            <div class="field">
                                                <span class="title">Cases Per Layer</span>
                                                <input type="text" id="CasesPerLayer" value="${row.CasesPerLayer}" onchange="EC_Fmt.InputFmt(this, '_Decimal', 12, true, false)">
                                            </div>

                                            <div class="field">
                                                <span class="title">Case Weight (Lbs)</span>
                                                <input type="text" id="Weight" value="${row.Weight}" onchange="EC_Fmt.InputFmt(this, '_Decimal', 12, true, false)">
                                            </div>
                                        </div>

                                        <div class="row">
                                            <div class="field">
                                                <span class="title">Case Height (Inch)</span>
                                                <input type="text" id="Height" value="${row.Height}" onchange="EC_Fmt.InputFmt(this, '_Decimal', 12, true, false)">
                                            </div>

                                            <div class="field">
                                                <span class="title">Case Width (Inch)</span>
                                                <input type="text" id="Width" value="${row.Width}" onchange="EC_Fmt.InputFmt(this, '_Decimal', 12, true, false)">
                                            </div>

                                            <div class="field">
                                                <span class="title">Case Length (Inch)</span>
                                                <input type="text" id="Length" value="${row.Length}" onchange="EC_Fmt.InputFmt(this, '_Decimal', 12, true, false)">
                                            </div>
                                        </div>

                                        <div class="row">
                                            <div id="product-save" class="svs-button svs-button-primary">Save Changes</div>
                                            <div id="product-cancel" class="svs-button">Cancel</div>
                                            <div class="fields"></div>
                                            <div id="product-delete" class="svs-button">Delete</div>
                                        </div>
                                    </div>

                                    <div class="sidecar">
                                        <div class="field">
                                            <span class="title">Image</span>

                                            <div class="image">
                                                <img src="${row.Image || "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="}" id="ImageDisplay_${row.ProductID}" loading="lazy">
                                                <div class="actions">
                                                    <div class="svs-button svs-button-primary">Edit</div>
                                                    <input type="file" id="Image_${row.ProductID}" accept="image/*" image="product" product="${row.ProductID}">
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </td>
                    </tr>
                `;
            }

            /*
            {
                BrandID,
                Brand,
                Status: {
                    Value,
                    Values
                },
                StrengthIndex,
                SegmentID,
                Segment,
                Style,
                Country,
                Region,
                Appellation,
                Varietal,
                AlcoholByVolume,
                Description,
                Sales13Week,
                Sales13WeekChange,
                SalesLastYear13WeekChange,
                Logo,
                SellSheet
            }
            */

            const bstatus = Object.keys(brand.Status.Values);

            components.details.html(`
                <div class="svs-mobile-only">
                    <div class="row">
                        <div class="svs-button" id="close-details" style="margin: 7px 0 0 0;">Back</div>
                    </div>
                </div>

                <h1>Brand Identity</h1>

                <div class="fieldset">
                    <div class="section">
                        <div class="fields">
                            <div class="row">
                                <div class="field">
                                    <span class="title">Brand Name</span>
                                    <input type="text" id="Brand" value="${brand.Brand || ""}">
                                </div>
                            </div>

                            <div class="row">
                                <div class="field">
                                    <span class="title">Alcohol By Volume</span>
                                    <input type="text" id="AlcoholByVolume" value="${(brand.AlcoholByVolume * 100).toFixed(2)}%" onchange="EC_Fmt.InputFmt(this, '_Percentage', 18, true, false)">
                                </div>

                                <div class="field">
                                    <span class="title">Style</span>
                                    <placeholder type="style" id="Style_${brand.BrandID}" parent="${brand.BrandID}" value="${brand.Style || ""}" display="${brand.Style || ""}">
                                </div>

                                <div class="field">
                                    <span class="title">Varietal</span>
                                    <input type="text" id="Varietal" value="${brand.Varietal || ""}">
                                </div>

                                <div class="field">
                                    <span class="title">Appellation</span>
                                    <input type="text" id="Appellation" value="${brand.Appellation || ""}">
                                </div>
                            </div>

                            <div class="row">
                                <div class="field">
                                    <span class="title">Country</span>
                                    <input type="text" id="Country" value="${brand.Country || ""}">
                                </div>

                                <div class="field">
                                    <span class="title">Region</span>
                                    <input type="text" id="Region" value="${brand.Region || ""}">
                                </div>

                                <div class="field">
                                    <span class="title">Segment</span>
                                    <placeholder type="segment" id="SegmentID_${brand.BrandID}" parent="${brand.BrandID}" value="${brand.SegmentID}" display="${brand.Segment}">
                                </div>

                                <div class="field">
                                    <span class="title">Status</span>
                                    <select id="Status">${bstatus.map(o => `<option value="${o}"${`${o}` === `${brand.Status.Value}` ? " selected" : ""}>${brand.Status.Values[o]}</option>`).join("")}</select>
                                </div>
                            </div>

                            <div class="row">
                                <div class="field" style="min-height: 200px;">
                                    <span class="title">Description</span>
                                    <textarea id="Description">${brand.Description || ""}</textarea>
                                </div>
                            </div>

                            <div class="row">
                                <div id="brand-save" class="svs-button svs-button-primary">Save Changes</div>
                                <div class="fields"></div>
                                <div id="brand-delete" class="svs-button">Delete</div>
                            </div>
                        </div>

                        <div class="sidecar">
                            <div class="field">
                                <span class="title">Logo</span>

                                <div class="logo">
                                    <img src="${logo.URL || "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="}" id="LogoDisplay" loading="lazy">
                                    <div class="actions">
                                        <div class="svs-button svs-button-primary">Edit</div>
                                        <input type="file" id="Logo" accept="image/*" image="logo">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <h1>Sell Sheet</h1>

                <div class="fieldset">
                    <div class="row">
                        ${brand.SellSheet && brand.SellSheet !== "" ? `
                            <div class="inline-item">
                                <a class="dbi-sell-sheet" href="${brand.SellSheet}" target="_blank">
                                    <svg width="40" height="40" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M6 2c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6H6zm7 7V3.5L18.5 9H13z" />
                                    </svg>
                                </a>
                            </div>
                        ` : ""}
                        <div class="inline-item">
                            <div class="sell-sheet-actions">
                                <div class="svs-button svs-button-primary">Edit</div>
                                <input type="file" id="SellSheet" accept="application/pdf" image="sell-sheet">
                            </div>
                        </div>
                    </div>
                </div>

                <h1>Brand Products</h1>

                <div class="fieldset">
                    <table class="svs-table nested-table" cellspacing="0">
                        <thead class="svs-mobile-hide">
                            <tr>
                                <th class="svs-mobile-hide"></th>
                                <th></th>
                                <th class="data-press">Name</th>
                                <th>Package</th>
                                <th>UPC</th>
                            </tr>
                        </thead>

                        <tbody class="data-body">
                            ${sku}
                        </tbody>
                    </table>

                    <div class="row">
                        <div id="product-add" class="svs-button svs-button-primary">Add Product</div>
                    </div>
                </div>
            `);

            const files = {
                logo: null,
                sheet: null,
                product: {}
            };

            components.details.find("placeholder").each((_index, element) => {
                const target = $(element);
                const type = target.attr("type");
                const parent = parseInt(target.attr("parent"), 10);

                const value = parseInt(target.attr("value"), 10);
                const display = target.attr("display");

                switch (type) {
                    case "package":
                        UI.setupAutocomplete(target, `PackageID_${parent}`, "", true, "Packages", "PackageID", ECP.DataType._Integer, "Package", ECP.DataType._Text).then((response) => {
                            if (!Number.isNaN(value)) {
                                response.element.find(`#PackageID_${parent}Hidden`).val(value);
                                response.input.val(display);

                                response.input.attr("displayval", display);
                                response.input.attr("keyvalue", value);
                            }
                        });

                        break;

                    case "segment":
                        UI.setupAutocomplete(target, `SegmentID_${parent}`, "", true, "Segments", "SegmentID", ECP.DataType._Integer, "Segment", ECP.DataType._Text).then((response) => {
                            if (!Number.isNaN(value)) {
                                response.element.find(`#SegmentID_${parent}Hidden`).val(value);
                                response.input.val(display);

                                response.input.attr("displayval", display);
                                response.input.attr("keyvalue", value);
                            }
                        });

                        break;

                    case "style":
                        UI.setupAutocomplete(target, `Style_${parent}`, "", true, "ZZ_Styles", "Style", ECP.DataType._Text, "Style", ECP.DataType._Text).then((response) => {
                            response.element.find(`#Style_${parent}Hidden`).val(value);
                            response.input.val(display);

                            response.input.attr("displayval", display);
                            response.input.attr("keyvalue", value);
                        });

                        break;
                }
            });

            components.details.on("change", "input[type='file']", (event) => {
                const target = $(event.currentTarget);

                if (target[0].files && target[0].files[0] && target.attr("accept") === "image/*") {
                    let image = null;

                    switch (target.attr("image")) {
                        case "logo":
                            files.logo = target[0].files[0];
                            image = components.details.find("#LogoDisplay");
                            break;

                        case "product":
                            files.product[parseInt(target.attr("product"), 10)] = target[0].files[0];
                            image = components.details.find(`#ImageDisplay_${target.attr("product")}`);
                            break;
                    }

                    if (image) {
                        const reader = new FileReader();

                        reader.onload = (stream) => {
                            image.attr("src", stream.target.result);
                        };

                        reader.readAsDataURL(target[0].files[0]);
                    }
                } else if (target[0].files && target[0].files[0]) {
                    switch (target.attr("image")) {
                        case "sell-sheet":
                            files.sheet = target[0].files[0];

                            this.dsd.app.content.html(this.dsd.app.spinner);

                            Database.SaveSellSheet(brand.BrandID, files.sheet).then((success) => {
                                if (success) {
                                    localStorage.removeItem(btoa(`DBI:DefaultBrands:${this.suppliers.map(s => s.SupplierID).join("^")}`));
                                    window.location.reload();
                                } else {
                                    this.dsd.app.alert("Unable to upload sell sheet.");
                                    this.display(ARGS.BrandID, ARGS.Query);
                                }
                            });

                            break;
                    }
                }
            });

            components.details.on("click", ".marker", (event) => {
                $(event.currentTarget).parent().find("input").focus();
            });

            components.details.on("click", "#close-details", () => {
                this.display(null, ARGS.Query);
            });

            components.details.on("click", "#brand-save", (event) => {
                this.key = new Date().getTime() + Math.random();

                this.debounce(this.key, () => {
                    const form = $(event.currentTarget).parent().parent();

                    const data = {
                        BrandID: brand.BrandID,
                        Brand: form.find("#Brand").val(),
                        AlcoholByVolume: parseFloat((form.find("#AlcoholByVolume").val() || "0").replace(/%/gi, "")) / 100,
                        Style: form.find(`#Style_${brand.BrandID}Hidden`).val(),
                        Varietal: form.find("#Varietal").val(),
                        Appellation: form.find("#Appellation").val(),
                        Country: form.find("#Country").val(),
                        Region: form.find("#Region").val(),
                        SegmentID: parseInt(form.find(`#SegmentID_${brand.BrandID}Hidden`).val(), 10) || null,
                        Status: parseInt(form.find("#Status").val(), 10) || 1,
                        Description: form.find("#Description").val()
                    };

                    components.details.html(this.dsd.app.spinner);

                    Database.SaveBrand(data, files.logo, logo).then(() => {
                        localStorage.removeItem(btoa(`DBI:DefaultBrands:${this.suppliers.map(s => s.SupplierID).join("^")}`));
                        window.location.reload();
                    });
                });
            });

            components.details.on("click", "#brand-delete", () => {
                this.key = new Date().getTime() + Math.random();

                this.debounce(this.key, () => {
                    Database.DeletePermissions("Brands", brand.BrandID).then((permission) => {
                        if (permission) {
                            this.dsd.app.dialog.open(`
                                <div class="svs-dialog-title">Merge Brands</div>
                                <div class="svs-dialog-content">
                                    <p class="dialog-message">
                                        There is data attached to this brand. You must select a brand to
                                        merge this data into. If this brand is no longer being sold,
                                        please set the status to discontinued.
                                    </p>
                                    <p class="dialog-message">
                                        <b>Warning. This can not be undone.</b>
                                    </p>
                                    <div class="fieldset">
                                        <div class="field">
                                            <span class="title">Destination Brand</span>
                                            <placeholder>
                                        </div>
                                    </div>
                                </div>
                                <div class="svs-dialog-actions">
                                    <div id="execute-merge" class="svs-button svs-button-primary">Merge</div>
                                    <div id="cancel-merge" class="svs-button">Cancel</div>
                                </div>
                            `);
    
                            this.dsd.app.dialog.action("#cancel-merge", () => {
                                this.dsd.app.dialog.close();
                            });
    
                            this.dsd.app.dialog.action("#execute-merge", () => {
                                const destination = parseInt(this.dsd.app.dialog.find("#BrandIDHidden").val(), 10) || null;
    
                                if (destination) {
                                    MergeRecord(table, source, destination).then((success) => {
                                        if (success) {
                                            localStorage.removeItem(btoa(`DBI:DefaultBrands:${this.suppliers.map(s => s.SupplierID).join("^")}`));
    
                                            Database.Brands({ suppliers: this.suppliers }).then((results) => {
                                                this.brands = results;
                                                this.dsd.app.dialog.close();
                                                this.display(null, ARGS.Query);
                                            });
                                        }
                                    });
                                }
                            });
    
                            this.dsd.app.dialog.find("placeholder").each((index, element) => {
                                UI.setupAutocomplete($(element), "BrandID", "", true, "Brands", "BrandID", ECP.DataType._Integer, "Brand", ECP.DataType._Text);
                            });
                        } else {
                            this.dsd.app.alert("This brand can not be deleted.");
                        }
                    });
                });
            });

            components.details.on("click", "#product-add", () => {
                this.displayAddProduct(components, brand, this.key);
            });

            components.details.on("click", ".show-product", (event) => {
                const trigger = $(event.currentTarget);
                const container = trigger.parent();

                container.find(".show-product").show();
                container.find(".row-form").hide();

                container.find(`.show-product[value='${trigger.attr("value")}']`).hide();
                container.find(`.row-form[value='${trigger.attr("value")}']`).show();
            });

            components.details.on("click", "#product-save", (event) => {
                this.key = new Date().getTime() + Math.random();

                this.debounce(this.key, () => {
                    const form = $(event.currentTarget)
                        .parent()
                        .parent()
                        .parent()
                        .parent();

                    const row = form.parent().parent();
                    const product = parseInt(row.attr("value"), 10);

                    let start = null;

                    if (!Number.isNaN(parseInt(form.find("#SeasonalStartMonth").val(), 10)) && !Number.isNaN(parseInt(form.find("#SeasonalStartDay").val(), 10))) {
                        start = `${form.find("#SeasonalStartMonth").val()}/${form.find("#SeasonalStartDay").val()}`;
                    }

                    let end = null;

                    if (!Number.isNaN(parseInt(form.find("#SeasonalEndMonth").val(), 10)) && !Number.isNaN(parseInt(form.find("#SeasonalEndDay").val(), 10))) {
                        end = `${form.find("#SeasonalEndMonth").val()}/${form.find("#SeasonalEndDay").val()}`;
                    }

                    const data = {
                        ProductID: product,
                        ProductName: form.find("#ProductName").val(),
                        ProductNumber: form.find("#ProductNumber").val(),
                        PackageID: parseInt(form.find(`#PackageID_${product}Hidden`).val(), 10) || null,
                        Status: parseInt(form.find("#Status").val(), 10) || 0,
                        SeasonalStart: start,
                        SeasonalEnd: end,
                        CodeDateType: parseInt(form.find("#CodeDateType").val(), 10) || 0,
                        CodeDateFormat: form.find("#CodeDateFormat").val(),
                        ShelfLife: parseInt(form.find("#ShelfLife").val(), 10) || 110,
                        CasesPerPallet: parseInt(form.find("#CasesPerPallet").val(), 10) || 0,
                        CasesPerLayer: parseFloat(form.find("#CasesPerLayer").val()) || 0,
                        Weight: parseFloat(form.find("#Weight").val()) || 0,
                        Height: parseFloat(form.find("#Height").val()) || 0,
                        Width: parseFloat(form.find("#Width").val()) || 0,
                        Length: parseFloat(form.find("#Length").val()) || 0,
                        CaseUPC: (form.find("#CaseUPC").val() || "").replace(/-/gi, ""),
                        CarrierUPC: (form.find("#CarrierUPC").val() || "").replace(/-/gi, ""),
                        UnitUPC: (form.find("#UnitUPC").val() || "").replace(/-/gi, "")
                    };

                    let valid = true;

                    if (valid && !brand.BrandID) {
                        this.dsd.app.alert("Brand is required.");

                        valid = false;
                    }

                    if (valid && (!data.ProductName || data.ProductName === "")) {
                        this.dsd.app.alert("Product Name is required.");

                        valid = false;
                    }

                    if (valid && (!data.ProductNumber || data.ProductNumber === "")) {
                        this.dsd.app.alert("Product Number is required.");

                        valid = false;
                    }

                    if (valid && (!data.PackageID || Number.isNaN(data.PackageID))) {
                        this.dsd.app.alert("Package is required.");

                        valid = false;
                    }

                    if (valid) {
                        components.details.html(this.dsd.app.spinner);

                        Database.SaveProduct(data, files.product[product]).finally(() => {
                            this.display(ARGS.BrandID, ARGS.Query);
                        });
                    }
                });
            });

            components.details.on("click", "#product-delete", (event) => {
                this.key = new Date().getTime() + Math.random();

                this.debounce(this.key, () => {
                    const form = $(event.currentTarget)
                        .parent()
                        .parent()
                        .parent()
                        .parent();

                    const row = form.parent().parent();
                    const product = parseInt(row.attr("value"), 10);

                    Database.DeletePermissions("Products", product).then((permission) => {
                        if (permission) {
                            this.dsd.app.dialog.open(`
                                <div class="svs-dialog-title">Merge Products</div>
                                <div class="svs-dialog-content">
                                    <p class="dialog-message">
                                        There is data attached to this product. You must select a
                                        product to merge this data into. If this product is no
                                        longer being sold, please set the status to discontinued.
                                    </p>
                                    <p class="dialog-message">
                                        <b>Warning. This can not be undone.</b>
                                    </p>
                                    <div class="fieldset">
                                        <div class="field">
                                            <span class="title">Destination Product</span>
                                            <placeholder>
                                        </div>
                                    </div>
                                </div>
                                <div class="svs-dialog-actions">
                                    <div id="execute-merge" class="svs-button svs-button-primary">Merge</div>
                                    <div id="cancel-merge" class="svs-button">Cancel</div>
                                </div>
                            `);

                            this.dsd.app.dialog.action("#cancel-merge", () => {
                                this.dsd.app.dialog.close();
                            });

                            this.dsd.app.dialog.action("#execute-merge", () => {
                                const destination = parseInt(this.dsd.app.dialog.find("#ProductIDHidden").val(), 10) || null;

                                if (destination) {
                                    MergeRecord(table, source, destination).then((success) => {
                                        if (success) {
                                            this.dsd.app.dialog.close();
                                            this.display(ARGS.BrandID, ARGS.Query);
                                        }
                                    });
                                }
                            });

                            this.dsd.app.dialog.find("placeholder").each((index, element) => {
                                UI.setupAutocomplete($(element), "ProductID", "", true, "Products", "ProductID", ECP.DataType._Integer, "ProductName", ECP.DataType._Text);
                            });
                        } else {
                            this.dsd.app.alert("This product can not be deleted.");
                        }
                    });
                });
            });

            components.details.on("click", "#product-cancel", (event) => {
                const form = $(event.currentTarget)
                    .parent()
                    .parent()
                    .parent()
                    .parent();

                const container = form.parent().parent().parent();

                form[0].reset();

                container.find(".show-product").show();
                container.find(".row-form").hide();
            });
        }
    }

    async displayAddBrand(components, key) {
        if (key === this.key) {
            components.data.addClass("data-left");
            components.data.addClass("svs-mobile-hide");
            components.search.parent().parent().addClass("svs-mobile-hide");
            components.details.off("change").off("click");
            components.details.show();

            components.details.html(`
                <h1>Add Brand</h1>

                <div class="fieldset">
                    <div class="section">
                        <div class="fields">
                            <div class="row">
                                <div class="field">
                                    <span class="title">Brand Name</span>
                                    <input type="text" id="Brand" value="">
                                </div>
                            </div>

                            <div class="row">
                                <div class="field">
                                    <span class="title">Supplier</span>
                                    <placeholder type="supplier" id="SupplierID" value="${this.suppliers[0].SupplierID || ""}">
                                </div>
                            </div>

                            <div class="row">
                                <div class="field">
                                    <span class="title">Alcohol By Volume</span>
                                    <input type="text" id="AlcoholByVolume" value="0%" onchange="EC_Fmt.InputFmt(this, '_Percentage', 18, true, false)">
                                </div>

                                <div class="field">
                                    <span class="title">Style</span>
                                    <placeholder type="style" id="Style">
                                </div>

                                <div class="field">
                                    <span class="title">Varietal</span>
                                    <input type="text" id="Varietal" value="">
                                </div>

                                <div class="field">
                                    <span class="title">Appellation</span>
                                    <input type="text" id="Appellation" value="">
                                </div>
                            </div>

                            <div class="row">
                                <div class="field">
                                    <span class="title">Country</span>
                                    <input type="text" id="Country" value="">
                                </div>

                                <div class="field">
                                    <span class="title">Region</span>
                                    <input type="text" id="Region" value="">
                                </div>

                                <div class="field">
                                    <span class="title">Segment</span>
                                    <placeholder type="segment" id="SegmentID">
                                </div>
                            </div>

                            <div class="row">
                                <div class="field" style="min-height: 200px;">
                                    <span class="title">Description</span>
                                    <textarea id="Description"></textarea>
                                </div>
                            </div>

                            <div class="row">
                                <div id="submit-brand-add" class="svs-button svs-button-primary">Add Brand</div>
                                <div id="add-brand-cancel" class="svs-button">Cancel</div>
                            </div>
                        </div>

                        <div class="sidecar">
                            <div class="field">
                                <span class="title">Logo</span>

                                <div class="logo">
                                    <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=" id="LogoDisplay" loading="lazy">
                                    <div class="actions">
                                        <div class="svs-button svs-button-primary">Edit</div>
                                        <input type="file" id="Logo" accept="image/*" image="logo">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `);

            const files = {
                logo: null
            };

            components.details.find("placeholder").each((index, element) => {
                const target = $(element);
                const type = target.attr("type");

                switch (type) {
                    case "segment":
                        UI.setupAutocomplete(target, "SegmentID", "", true, "Segments", "SegmentID", ECP.DataType._Integer, "Segment", ECP.DataType._Text);
                        break;

                    case "supplier":
                        UI.setupAutocomplete(target, "SupplierID", "", true, "Suppliers", "SupplierID", ECP.DataType._Integer, "Supplier", ECP.DataType._Text);
                        break;
                    
                    case "style":
                        UI.setupAutocomplete(target, "Style", "", true, "ZZ_Styles", "Style", ECP.DataType._Text, "Style", ECP.DataType._Text);
                        break;
                }
            });

            components.details.on("change", "input[type='file']", (event) => {
                const target = $(event.currentTarget);

                if (target[0].files && target[0].files[0] && target.attr("accept") === "image/*") {
                    let image = null;

                    switch (target.attr("image")) {
                        case "logo":
                            files.logo = target[0].files[0];
                            image = components.details.find("#LogoDisplay");
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

            components.details.on("click", "#add-brand-cancel", () => {
                this.displayBrands(this.key, ARGS.BrandID, ARGS.Query);
            });

            components.details.on("click", "#submit-brand-add", (event) => {
                this.key = new Date().getTime() + Math.random();

                this.debounce(this.key, () => {
                    const form = $(event.currentTarget).parent().parent();

                    const data = {
                        SupplierID: parseInt(form.find("#SupplierIDHidden").val(), 10) || null,
                        Brand: form.find("#Brand").val(),
                        AlcoholByVolume: parseFloat((form.find("#AlcoholByVolume").val() || "0").replace(/%/gi, "")) / 100,
                        Style: form.find("#StyleHidden").val(),
                        Varietal: form.find("#Varietal").val(),
                        Appellation: form.find("#Appellation").val(),
                        Country: form.find("#Country").val(),
                        Region: form.find("#Region").val(),
                        SegmentID: parseInt(form.find("#SegmentIDHidden").val(), 10) || null,
                        Status: 1,
                        Description: form.find("#Description").val(),
                        IsCompetition: 0,
                        Color: "0000FF"
                    };

                    let valid = true;

                    if (valid && !data.SupplierID) {
                        this.dsd.app.alert("Supplier is required.");

                        valid = false;
                    }

                    if (valid && (!data.Brand || data.Brand === "")) {
                        this.dsd.app.alert("Brand Name is required.");

                        valid = false;
                    }

                    if (valid && (!data.SegmentID || data.SegmentID === "" || Number.isNaN(data.SegmentID))) {
                        this.dsd.app.alert("Segment is required.");

                        valid = false;
                    }

                    if (valid) {
                        components.details.html(this.dsd.app.spinner);

                        Database.AddBrand(data, files.logo).then(async (results) => {
                            localStorage.removeItem(btoa(`DBI:DefaultBrands:${this.suppliers.map(s => s.SupplierID).join("^")}`));
                            window.location.reload();
                        });
                    }
                });
            });
        }
    }

    async displayAddProduct(components, brand, key) {
        if (key === this.key) {
            components.data.addClass("data-left");
            components.data.addClass("svs-mobile-hide");
            components.search.parent().parent().addClass("svs-mobile-hide");
            components.details.off("change").off("click");
            components.details.show();

            components.details.html(`
                <h1>Add Product</h1>

                <div class="fieldset">
                    <div class="section">
                        <div class="fields">
                            <div class="row">
                                <div class="field">
                                    <span class="title">Product Name</span>
                                    <input type="text" id="ProductName" value="">
                                </div>
                            </div>

                            <div class="row">
                                <div class="field">
                                    <span class="title">Product Number</span>
                                    <input type="text" id="ProductNumber" value="">
                                </div>

                                <div class="field">
                                    <span class="title">Package</span>
                                    <placeholder type="package" id="PackageID">
                                </div>

                                <div class="field">
                                    <span class="title">Status</span>
                                    <select id="Status">
                                        <option value="1" selected>Active</option>
                                        <option value="2">Pre-order</option>
                                    </select>
                                </div>
                            </div>

                            <div class="row">
                                <div class="field">
                                    <span class="title">Case UPC</span>
                                    <div class="marker-field">
                                        <div class="marker">
                                            <svg xmlns="http://www.w3.org/2000/svg" version="1.1" x="0px" y="0px" viewBox="0 0 95 95">
                                                <polygon fill="#949494" points="67.918,85.036 85.548,69.649 85.548,12.529 67.918,27.915"></polygon>
                                                <polygon fill="#949494" points="30.479,9.964 9.452,26.569 66.572,26.569 85.548,10.477"></polygon>
                                                <path fill="#949494" d="
                                                    M9.452,85.036h57.12V27.915H9.452V85.036z M55.357,64.716l2.311-4.004l2.313,4.004l2.311,4.004h-2.935v11.027
                                                    c0,0.56-0.453,1.014-1.013,1.014h-1.352c-0.561,0-1.013-0.454-1.013-1.014V68.72h-2.936L55.357,64.716z M26.313,33.556
                                                    c0-0.85,0.688-1.539,1.538-1.539h19.232c0.85,0,1.538,0.689,1.538,1.539v3.077c0,0.85-0.688,1.539-1.538,1.539H27.852
                                                    c-0.85,0-1.538-0.689-1.538-1.539V33.556z
                                                "></path>
                                            </svg>
                                        </div>
                                        <input type="text" id="CaseUPC" value="">
                                    </div>
                                </div>

                                <div class="field">
                                    <span class="title">Carrier UPC</span>
                                    <div class="marker-field">
                                        <div class="marker">
                                            <svg xmlns="http://www.w3.org/2000/svg" version="1.1" x="0px" y="0px" viewBox="0 0 100 100">
                                                <path fill="#949494" d="
                                                    M21.412,29.325l11.351,5.357v60.29l-11.274-2.591L21.412,29.325z M21.489,92.381l11.274,2.591v-60.29
                                                    l-11.351-5.357L21.489,92.381z M21.489,92.381l11.274,2.591v-60.29l-11.351-5.357L21.489,92.381z M7.414,36.969v54.035l13.071,1.214
                                                    V29.325L7.414,36.969z M33.533,34.635c0.431-0.718,0.293,61.872,0.28,60.337l58.773-3.618V36.503L33.533,34.635z M33.533,34.635
                                                    c0.431-0.718,0.293,61.872,0.28,60.337l58.773-3.618V36.503L33.533,34.635z M33.533,34.635c0.431-0.718,0.293,61.872,0.28,60.337
                                                    l58.773-3.618V36.503L33.533,34.635z M92.272,35.033l-5.566-2.109c-0.001-0.006-0.001-0.012-0.002-0.018
                                                    c-0.497-4.582-0.767-9.106-1.078-14.279c0.284-0.625,0.565-1.366,0.644-1.796c0.012-0.024,0.02-0.073,0.021-0.097
                                                    c0.001-0.036,0.002-0.088,0-0.13c0-0.02,0.001-0.045,0-0.064c0-0.003-0.002-0.009-0.002-0.011c-0.037-0.632-0.341-1.814-0.651-2.883
                                                    c0.003-0.143,0.005-0.286,0.006-0.428c0.174,0.048,0.328,0.158,0.443,0.312c-0.015-0.181-0.053-0.381-0.107-0.587
                                                    c-0.055-0.207-0.126-0.421-0.211-0.632c-0.084-0.211-0.181-0.419-0.287-0.614c-0.105-0.194-0.218-0.375-0.335-0.532
                                                    c-0.116-0.157-0.236-0.22-0.354-0.318c-0.119-0.098-0.235-0.111-0.346-0.111c-0.701,0-1.402,0-2.103,0c-0.701,0-1.402,0-2.104,0
                                                    c-0.701,0-1.402,0-2.103,0s-1.402,0-2.103,0c-0.116,0-0.24,0.019-0.364,0.125c-0.124,0.107-0.25,0.216-0.371,0.386
                                                    c-0.122,0.169-0.239,0.346-0.347,0.554c-0.108,0.208-0.206,0.421-0.29,0.643c-0.084,0.223-0.152,0.442-0.2,0.654
                                                    c-0.046,0.205-0.069,0.406-0.082,0.617c0.109-0.231,0.291-0.408,0.508-0.484c0.002,0.25,0.007,0.499,0.013,0.75
                                                    c-0.251,0.974-0.477,1.982-0.505,2.548c0,0.002-0.001,0.003-0.001,0.005c-0.001,0.016-0.001,0.036-0.001,0.054
                                                    c-0.001,0.044-0.001,0.084,0.001,0.121c0.001,0.023,0.007,0.044,0.017,0.066c0.062,0.385,0.275,1.079,0.506,1.652
                                                    c-0.358,5.96-0.658,10.796-1.304,16.007l1.271,0.037c0.601-5.019,1.269-15.854,1.269-15.854l0.49,0.158
                                                    c0,0-0.668,10.69-1.268,15.707l8.837,0.321c-0.11-0.902-1.27-16.325-1.27-16.325c0.309-0.684,0.552-1.357,0.618-1.713
                                                    c0,0-0.238-1.886-0.625-3.221l0.775,0.272l0.554-0.272c0.391,1.347,0.605,3.31,0.58,3.387c-0.096,0.475-0.35,1.203-0.598,1.764
                                                    c0,0,1.224,15.31,1.325,16.131L92.272,35.033z M21.126,11.75v15.947l0.565,0.23V11.516L21.126,11.75z M21.637,10.447
                                                    c0,0,1.508,0.069,1.478-0.034c0.003-0.143,0.005-0.236,0.006-0.378c0.174,0.048,0.328,0.108,0.443,0.262
                                                    c-0.015-0.181-0.053-0.331-0.107-0.537c-0.055-0.207-0.126-0.421-0.211-0.632c-0.084-0.212-0.181-0.419-0.287-0.614
                                                    c-0.105-0.194-0.218-0.375-0.335-0.532c-0.116-0.157-0.236-0.22-0.354-0.318c-0.119-0.098-0.235-0.111-0.346-0.111
                                                    c-0.701,0-1.402,0-2.103,0s-1.402,0-2.104,0c-0.701,0-1.402,0-2.103,0c-0.701,0-1.402,0-2.103,0c-0.116,0-0.24,0.019-0.364,0.125
                                                    c-0.124,0.107-0.25,0.216-0.371,0.386c-0.122,0.169-0.239,0.346-0.347,0.554c-0.108,0.208-0.206,0.421-0.29,0.643
                                                    s-0.152,0.442-0.2,0.654c-0.046,0.205-0.069,0.406-0.082,0.617c0.109-0.231,0.291-0.408,0.508-0.484
                                                    c0.002,0.25,0.006,0.499,0.013,0.75c-0.251,0.974-0.477,1.982-0.505,2.548c0,0.002-0.001,0.003-0.001,0.005
                                                    c-0.001,0.016-0.001,0.036-0.001,0.054c-0.001,0.044-0.001,0.084,0.001,0.121c0.001,0.023,0.008,0.044,0.017,0.066
                                                    c0.062,0.385,0.275,1.079,0.506,1.652c-0.358,5.96-1.539,13.241-2.185,18.592l1.271-0.762c0.601-5.159,2.15-17.64,2.15-17.64
                                                    l0.49,0.158c0,0-1.549,12.307-2.149,17.325l8.281-4.941v-16.01v-0.875L21.637,10.447z M73.341,17.547
                                                    c-0.347,5.576-0.638,10.159-1.227,14.998c0,0-6.441,1.52-6.436,1.567l-1.615-0.051c-0.217-2.301-1.407-17.115-1.407-17.115
                                                    c0.269-0.607,0.544-1.395,0.648-1.909c0.027-0.083-0.204-2.207-0.627-3.665l-0.6,0.294l-0.839-0.294
                                                    c0.419,1.445,0.676,3.486,0.676,3.486c-0.072,0.386-0.335,1.113-0.669,1.854c0,0,1.125,14.887,1.345,17.303l-9.244-0.306
                                                    c0.64-5.547,1.336-16.698,1.336-16.698l-0.795-0.15c0,0-0.696,11.277-1.337,16.831l-1.363-0.039
                                                    c0.672-5.516,0.994-10.674,1.374-16.998c-0.25-0.62-0.48-1.371-0.548-1.787c-0.01-0.024-0.017-0.046-0.018-0.071
                                                    c-0.002-0.041-0.002-0.084-0.001-0.131c0-0.02,0-0.041,0.001-0.058c0-0.002,0.001-0.003,0.002-0.005
                                                    c0.03-0.613,0.275-1.704,0.546-2.757c-0.006-0.271-0.012-0.542-0.014-0.812c-0.235,0.083-0.432,0.273-0.55,0.524
                                                    c0.014-0.228,0.038-0.446,0.088-0.668c0.053-0.23,0.126-0.467,0.217-0.708c0.09-0.24,0.197-0.47,0.314-0.695s0.243-0.416,0.375-0.6
                                                    c0.131-0.184,0.267-0.302,0.401-0.417c0.134-0.115,0.268-0.135,0.394-0.135c0.759,0,1.517,0,2.276,0c0.759,0,1.517,0,2.276,0
                                                    c0.759,0,1.517,0,2.276,0c0.759,0,1.517,0,2.276,0c0.12,0,0.246,0.013,0.375,0.12c0.128,0.105,0.258,0.174,0.383,0.344
                                                    c0.126,0.17,0.248,0.365,0.362,0.575c0.114,0.21,0.219,0.435,0.31,0.664c0.092,0.228,0.17,0.46,0.229,0.684
                                                    c0.059,0.223,0.1,0.439,0.116,0.635c-0.125-0.167-0.291-0.286-0.48-0.338c-0.001,0.154-0.003,0.309-0.006,0.464
                                                    c0.022,0.077,0.043,0.155,0.065,0.233c0.608,0,3.896,0.054,4.274,0.111c0.44,0.066,1.179,1.676,1.262,1.881l-5.118-0.39
                                                    c0.117,0.508,0.194,1.07,0.179,0.96l7.819,0.547C72.582,15.146,72.665,16.84,73.341,17.547z M65.135,28.094l0.076,0.684
                                                    c1.129-0.129,3.445-0.414,3.372-4.507c0-0.022,0.026-1.71,0.082-2.883c0.021-0.441-0.216-1.155-0.67-1.746
                                                    c-0.82-0.57-2.007-0.747-3.53,0.186c0.001,0.021,0.002,0.046,0.003,0.063l0.027,0.375C64.684,22.86,64.923,25.641,65.135,28.094z
                                                    M69.324,21.967c0.024-0.446-0.219-1.157-0.708-1.752c0.198,0.441,0.303,0.875,0.288,1.186c-0.056,1.168-0.082,3.052-0.082,3.07
                                                    c0.077,4.324-2.498,4.62-3.598,4.746l-0.028,0.003c0.012,0.124,0.025,0.259,0.037,0.381c1.161-0.124,4.087-0.276,4-4.593
                                                    C69.232,25.009,69.261,23.138,69.324,21.967z M27.56,11.844c-0.009-0.027-0.018-0.174-0.017-0.227c0-0.022-0.001-0.045,0.001-0.065
                                                    c0-0.002,0.001-0.003,0.001-0.006c0.001-0.026,0.006-0.064,0.008-0.092l-2.494-0.22l-2.831,0.015v16.945l5.071,2.24
                                                    c0.482-5.49,0.893-10.226,1.196-16.587C28.273,13.153,27.62,12.311,27.56,11.844z M50.646,20.995
                                                    c0.074-1.396,0.146-2.833,0.221-4.341c-0.206-0.62-0.397-1.371-0.452-1.787c-0.008-0.024-0.014-0.046-0.015-0.071
                                                    c-0.002-0.041-0.002-0.084-0.001-0.131c0-0.02,0-0.041,0.001-0.058c0-0.002,0.001-0.003,0.001-0.005
                                                    c0.013-0.305,0.069-0.73,0.151-1.21l-7.093-0.6c0.063-0.201,0.115-0.387,0.143-0.537c0.014-0.028,0.024-0.087,0.025-0.116
                                                    c0.002-0.043,0.002-0.105,0-0.155c0.001-0.024,0.001-0.054,0-0.076c0-0.003-0.002-0.01-0.003-0.013c0-0.002-0.001-0.005-0.001-0.007
                                                    l5.852,0.356c-0.098-0.243-0.557-0.908-0.679-1.131c-0.124-0.23-0.258-0.443-0.396-0.629s-0.28-0.26-0.419-0.376
                                                    c-0.14-0.117-0.278-0.131-0.41-0.131c-0.83,0-3.704-0.08-4.311-0.08c-0.124-0.494-0.267-0.933-0.412-1.433
                                                    c0.003-0.17,0.005-0.34,0.007-0.51c0.207,0.057,0.39,0.188,0.528,0.372c-0.018-0.216-0.063-0.454-0.128-0.699
                                                    c-0.065-0.246-0.15-0.502-0.252-0.752c-0.101-0.252-0.216-0.499-0.341-0.73c-0.125-0.231-0.259-0.446-0.398-0.633
                                                    c-0.138-0.187-0.281-0.262-0.422-0.378C41.701,5.014,41.562,5,41.43,5c-0.835,0-1.669,0-2.504,0c-0.835,0-1.669,0-2.504,0
                                                    s-1.669,0-2.504,0c-0.835,0-1.669,0-2.504,0c-0.138,0-0.285,0.022-0.433,0.149c-0.148,0.127-0.297,0.257-0.442,0.459
                                                    c-0.145,0.202-0.284,0.412-0.413,0.66c-0.128,0.247-0.245,0.501-0.345,0.765c-0.099,0.265-0.181,0.526-0.238,0.779
                                                    c-0.055,0.244-0.082,0.484-0.097,0.734c0.13-0.276,0.347-0.485,0.605-0.576c0.002,0.297,0.008,0.594,0.015,0.893
                                                    c-0.298,1.159-0.601,2.591-0.601,3.033c0,0.442,0.346,1.576,0.621,2.258c-0.378,6.296-0.703,11.539-1.309,16.975l1.411,0.6
                                                    c0.667-6.393,1.343-17.349,1.343-17.349l0.846,0.165c0,0-0.693,11.104-1.366,17.44l2.214,1.115l7.901,0.236
                                                    c-0.222-2.359-1.488-19.12-1.488-19.12c0.368-0.815,0.657-1.615,0.736-2.039c0,0-0.283-2.245-0.744-3.835l0.923,0.324l0.66-0.323
                                                    c0.466,1.604,0.72,3.94,0.69,4.032c-0.114,0.565-0.417,1.432-0.712,2.1c0,0,1.493,18.267,1.555,18.913l6.992,0.209
                                                    c0.154-1.539,0.285-3.052,0.402-4.569l-6.092-0.398c0-0.004-0.001-0.009-0.001-0.014l0,0c0-0.003-0.016-0.17-0.04-0.441
                                                    c1.369,0.109,4.777,0.377,6.161,0.443l0.01-0.39l-6.193-0.391c-0.184-1.912-0.722-7.794-0.738-7.98
                                                    C45.346,20.965,50.646,20.995,50.646,20.995z
                                                "></path>
                                            </svg>
                                        </div>
                                        <input type="text" id="CarrierUPC" value="">
                                    </div>
                                </div>

                                <div class="field">
                                    <span class="title">Unit UPC</span>
                                    <div class="marker-field">
                                        <div class="marker">
                                            <svg xmlns="http://www.w3.org/2000/svg" version="1.1" x="0px" y="0px" viewBox="0 0 100 100">
                                                <path fill="#949494" d="
                                                    M55.928,8.151c-0.062-0.245-0.222-0.758-0.59-1.364C54.979,6.195,52.217,6,49.994,6c-2.224,0-4.975,0.195-5.335,0.787
                                                    c-0.367,0.606-0.526,1.12-0.589,1.364c-0.021,0.046-0.034,0.098-0.034,0.154c0,0.194,0.14,0.351,0.312,0.351h5.646h5.656
                                                    c0.172,0,0.312-0.157,0.312-0.351C55.963,8.249,55.948,8.197,55.928,8.151z
                                                "></path>
                                                <path fill="#949494" d="
                                                    M63.771,82.315c-0.05-0.073-0.112-0.133-0.184-0.183v-36.34c0.312-0.011,0.562-0.265,0.562-0.58v-2.885
                                                    c0-0.639-0.119-1.246-0.328-1.811l0.005-0.001c-0.241-1.224-3.185-5.504-5.387-8.582h-0.001c-0.052-0.073-0.103-0.144-0.153-0.214
                                                    c-0.282-0.496-0.908-2.062-1.46-6.739c-0.001-0.002-0.001-0.005-0.001-0.005L55.248,11.63c0.361-0.012,0.652-0.308,0.652-0.673
                                                    c0-0.373-0.302-0.674-0.674-0.674h-0.138l-0.086-0.727h-4.982h-0.041h-4.983l-0.085,0.727h-0.138c-0.373,0-0.675,0.302-0.675,0.674
                                                    c0,0.365,0.29,0.661,0.652,0.673l-1.575,13.346c0,0-0.001,0.003-0.001,0.005c-0.553,4.677-1.178,6.243-1.46,6.739
                                                    c-0.051,0.07-0.101,0.141-0.153,0.214l0,0c-2.202,3.078-5.146,7.358-5.387,8.582l0.003,0.001c-0.208,0.565-0.327,1.172-0.327,1.811
                                                    v2.885c0,0.315,0.25,0.569,0.562,0.58v36.34c-0.072,0.05-0.136,0.109-0.184,0.183c-0.002-0.002-0.417-0.268-0.417,5.625
                                                    c0,1.46,0.636,2.768,1.642,3.675c0.003,0.002,0.006,0.005,0.008,0.009c1.812,1.961,8.521,2.322,11.694,2.381v0.009
                                                    c0,0,0.315,0.006,0.844,0.002c0.526,0.004,0.842-0.002,0.842-0.002l0.002-0.009c3.173-0.059,9.882-0.42,11.693-2.381
                                                    c0.002-0.004,0.004-0.007,0.007-0.009c1.006-0.907,1.644-2.215,1.644-3.675C64.188,82.048,63.771,82.313,63.771,82.315z
                                                    M38.62,46.625c-0.283,0-0.515-0.231-0.515-0.516c0-0.284,0.231-0.515,0.515-0.515c0.285,0,0.516,0.231,0.516,0.515
                                                    C39.136,46.393,38.905,46.625,38.62,46.625z M44.852,33.364l-0.153,0.214c-3.646,5.096-4.809,7.16-5.168,7.99l0.015,0.002
                                                    l-0.175,0.484c-0.198,0.54-0.3,1.097-0.3,1.655c0,0.249-0.201,0.451-0.45,0.451c-0.247,0-0.448-0.202-0.448-0.451
                                                    c0-0.643,0.111-1.285,0.333-1.907c0.211-1.035,2.048-3.979,5.461-8.748l0.154-0.214c0.145-0.202,0.425-0.249,0.628-0.104
                                                    C44.95,32.882,44.995,33.162,44.852,33.364z M60.098,48.591c0-0.248,0.202-0.449,0.45-0.449s0.45,0.201,0.45,0.449v29.227
                                                    c0,0.248-0.202,0.45-0.45,0.45s-0.45-0.202-0.45-0.45V48.591z M60.548,80.633c-0.284,0-0.515-0.232-0.515-0.516
                                                    c0-0.284,0.23-0.515,0.515-0.515s0.515,0.23,0.515,0.515C61.062,80.4,60.832,80.633,60.548,80.633z
                                                "></path>
                                            </svg>
                                        </div>
                                        <input type="text" id="UnitUPC" value="">
                                    </div>
                                </div>
                            </div>

                            <div class="row">
                                <div class="field">
                                    <span class="title">Seasonal Start Month</span>
                                    <select id="SeasonalStartMonth">
                                        <option value=""></option>
                                        <option value="1">January</option>
                                        <option value="2">February</option>
                                        <option value="3">March</option>
                                        <option value="4">April</option>
                                        <option value="5">May</option>
                                        <option value="6">June</option>
                                        <option value="7">July</option>
                                        <option value="8">August</option>
                                        <option value="9">September</option>
                                        <option value="10">October</option>
                                        <option value="11">November</option>
                                        <option value="12">December</option>
                                    </select>
                                </div>

                                <div class="field">
                                    <span class="title">Seasonal Start Day</span>
                                    <select id="SeasonalStartDay">
                                        <option value=""></option>
                                        <option value="1">1st</option>
                                        <option value="2">2nd</option>
                                        <option value="3">3rd</option>
                                        <option value="4">4th</option>
                                        <option value="5">5th</option>
                                        <option value="6">6th</option>
                                        <option value="7">7th</option>
                                        <option value="8">8th</option>
                                        <option value="9">9th</option>
                                        <option value="10">10th</option>
                                        <option value="11">11th</option>
                                        <option value="12">12th</option>
                                        <option value="13">13th</option>
                                        <option value="14">14th</option>
                                        <option value="15">15th</option>
                                        <option value="16">16th</option>
                                        <option value="17">17th</option>
                                        <option value="18">18th</option>
                                        <option value="19">19th</option>
                                        <option value="20">20th</option>
                                        <option value="21">21st</option>
                                        <option value="22">22nd</option>
                                        <option value="23">23rd</option>
                                        <option value="24">24th</option>
                                        <option value="25">25th</option>
                                        <option value="26">26th</option>
                                        <option value="27">27th</option>
                                        <option value="28">28th</option>
                                        <option value="29">29th</option>
                                        <option value="30">30th</option>
                                        <option value="31">31st</option>
                                    </select>
                                </div>

                                <div class="field">
                                    <span class="title">Seasonal End Month</span>
                                    <select id="SeasonalEndMonth">
                                        <option value=""></option>
                                        <option value="1">January</option>
                                        <option value="2">February</option>
                                        <option value="3">March</option>
                                        <option value="4">April</option>
                                        <option value="5">May</option>
                                        <option value="6">June</option>
                                        <option value="7">July</option>
                                        <option value="8">August</option>
                                        <option value="9">September</option>
                                        <option value="10">October</option>
                                        <option value="11">November</option>
                                        <option value="12">December</option>
                                    </select>
                                </div>

                                <div class="field">
                                    <span class="title">Seasonal End Day</span>
                                    <select id="SeasonalEndDay">
                                        <option value=""></option>
                                        <option value="1">1st</option>
                                        <option value="2">2nd</option>
                                        <option value="3">3rd</option>
                                        <option value="4">4th</option>
                                        <option value="5">5th</option>
                                        <option value="6">6th</option>
                                        <option value="7">7th</option>
                                        <option value="8">8th</option>
                                        <option value="9">9th</option>
                                        <option value="10">10th</option>
                                        <option value="11">11th</option>
                                        <option value="12">12th</option>
                                        <option value="13">13th</option>
                                        <option value="14">14th</option>
                                        <option value="15">15th</option>
                                        <option value="16">16th</option>
                                        <option value="17">17th</option>
                                        <option value="18">18th</option>
                                        <option value="19">19th</option>
                                        <option value="20">20th</option>
                                        <option value="21">21st</option>
                                        <option value="22">22nd</option>
                                        <option value="23">23rd</option>
                                        <option value="24">24th</option>
                                        <option value="25">25th</option>
                                        <option value="26">26th</option>
                                        <option value="27">27th</option>
                                        <option value="28">28th</option>
                                        <option value="29">29th</option>
                                        <option value="30">30th</option>
                                        <option value="31">31st</option>
                                    </select>
                                </div>
                            </div>

                            <div class="row">
                                <div class="field">
                                    <span class="title">Code Date Type</span>
                                    <select id="CodeDateType">
                                        <option value="1" selected>Expiration Date</option>
                                        <option value="2">Born on Date</option>
                                        <option value="3">Born on Code</option>
                                        <option value="4">Expiration Code</option>
                                    </select>
                                </div>

                                <div class="field">
                                    <span class="title">Code Date Format</span>
                                    <select id="CodeDateFormat">
                                        <option value="DDDY" selected>DDDY</option>
                                        <option value="DDDYY">DDDYY</option>
                                        <option value="DDMMMYY">DDMMMYY</option>
                                        <option value="DDMMYY">DDMMYY</option>
                                        <option value="MDDY Code">MDDY Code</option>
                                        <option value="MMDD">MMDD</option>
                                        <option value="MMDDY">MMDDY</option>
                                        <option value="MMDDYY">MMDDYY</option>
                                        <option value="MMMYY">MMMYY</option>
                                        <option value="MMYYYY">MMYYYY</option>
                                        <option value="YDDD">YDDD</option>
                                        <option value="YYDDD">YYDDD</option>
                                        <option value="YYMMDD">YYMMDD</option>
                                        <option value="YYYYDDMM">YYYYDDMM</option>
                                        <option value="CanadianDomestic">Canadian Domestic</option>
                                        <option value="Geloso">Geloso</option>
                                        <option value="Heineken">Heineken</option>
                                        <option value="HeinekenKeg">Heineken Keg</option>
                                        <option value="HeinekenCCM">Heineken CCM</option>
                                        <option value="Mikes">Mikes</option>
                                        <option value="Modelo">Modelo</option>
                                        <option value="NorthAmericanBrewery">North American Brewery</option>
                                    </select>
                                </div>

                                <div class="field">
                                    <span class="title">Shelf Life (Days)</span>
                                    <input type="text" id="ShelfLife" value="" onchange="EC_Fmt.InputFmt(this, '_Integer', 12, true, false)">
                                </div>
                            </div>

                            <div class="row">
                                <div class="field">
                                    <span class="title">Cases Per Pallet</span>
                                    <input type="text" id="CasesPerPallet" value="" onchange="EC_Fmt.InputFmt(this, '_Integer', 12, true, false)">
                                </div>

                                <div class="field">
                                    <span class="title">Cases Per Layer</span>
                                    <input type="text" id="CasesPerLayer" value="" onchange="EC_Fmt.InputFmt(this, '_Decimal', 12, true, false)">
                                </div>

                                <div class="field">
                                    <span class="title">Case Weight (Lbs)</span>
                                    <input type="text" id="Weight" value="" onchange="EC_Fmt.InputFmt(this, '_Decimal', 12, true, false)">
                                </div>
                            </div>

                            <div class="row">
                                <div class="field">
                                    <span class="title">Case Height (Inch)</span>
                                    <input type="text" id="Height" value="" onchange="EC_Fmt.InputFmt(this, '_Decimal', 12, true, false)">
                                </div>

                                <div class="field">
                                    <span class="title">Case Width (Inch)</span>
                                    <input type="text" id="Width" value="" onchange="EC_Fmt.InputFmt(this, '_Decimal', 12, true, false)">
                                </div>

                                <div class="field">
                                    <span class="title">Case Length (Inch)</span>
                                    <input type="text" id="Length" value="" onchange="EC_Fmt.InputFmt(this, '_Decimal', 12, true, false)">
                                </div>
                            </div>

                            <div class="row">
                                <div id="submit-product-add" class="svs-button svs-button-primary">Add Product</div>
                                <div id="add-product-cancel" class="svs-button">Cancel</div>
                            </div>
                        </div>

                        <div class="sidecar">
                            <div class="field">
                                <span class="title">Image</span>

                                <div class="logo">
                                    <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=" id="ImageDisplay" loading="lazy">
                                    <div class="actions">
                                        <div class="svs-button svs-button-primary">Edit</div>
                                        <input type="file" id="Image" accept="image/*" image="product">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `);

            const files = {
                image: null
            };

            components.details.find("placeholder").each((index, element) => {
                const target = $(element);
                const type = target.attr("type");

                switch (type) {
                    case "package":
                        UI.setupAutocomplete(target, "PackageID", "", true, "Packages", "PackageID", ECP.DataType._Integer, "Package", ECP.DataType._Text);
                        break;
                }
            });

            components.details.on("change", "input[type='file']", (event) => {
                const target = $(event.currentTarget);

                if (target[0].files && target[0].files[0] && target.attr("accept") === "image/*") {
                    let image = null;

                    switch (target.attr("image")) {
                        case "product":
                            files.image = target[0].files[0];
                            image = components.details.find("#ImageDisplay");
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

            components.details.on("click", ".marker", (event) => {
                $(event.currentTarget).parent().find("input").focus();
            });

            components.details.on("click", "#add-product-cancel", () => {
                this.displayBrands(this.key, ARGS.BrandID, ARGS.Query);
            });

            components.details.on("click", "#submit-product-add", (event) => {
                this.key = new Date().getTime() + Math.random();

                this.debounce(this.key, () => {
                    const form = $(event.currentTarget).parent().parent();

                    let start = null;

                    if (!Number.isNaN(parseInt(form.find("#SeasonalStartMonth").val(), 10)) && !Number.isNaN(parseInt(form.find("#SeasonalStartDay").val(), 10))) {
                        start = `${form.find("#SeasonalStartMonth").val()}/${form.find("#SeasonalStartDay").val()}`;
                    }

                    let end = null;

                    if (!Number.isNaN(parseInt(form.find("#SeasonalEndMonth").val(), 10)) && !Number.isNaN(parseInt(form.find("#SeasonalEndDay").val(), 10))) {
                        end = `${form.find("#SeasonalEndMonth").val()}/${form.find("#SeasonalEndDay").val()}`;
                    }

                    const data = {
                        BrandID: brand.BrandID,
                        ProductName: form.find("#ProductName").val(),
                        ProductNumber: form.find("#ProductNumber").val(),
                        PackageID: parseInt(form.find("#PackageIDHidden").val(), 10) || null,
                        Status: parseInt(form.find("#Status").val(), 10) || 0,
                        SeasonalStart: start,
                        SeasonalEnd: end,
                        CodeDateType: parseInt(form.find("#CodeDateType").val(), 10) || 0,
                        CodeDateFormat: form.find("#CodeDateFormat").val(),
                        ShelfLife: parseInt(form.find("#ShelfLife").val(), 10) || 110,
                        CasesPerPallet: parseInt(form.find("#CasesPerPallet").val(), 10) || 0,
                        CasesPerLayer: parseFloat(form.find("#CasesPerLayer").val()) || 0,
                        Weight: parseFloat(form.find("#Weight").val()) || 0,
                        Height: parseFloat(form.find("#Height").val()) || 0,
                        Width: parseFloat(form.find("#Width").val()) || 0,
                        Length: parseFloat(form.find("#Length").val()) || 0,
                        CaseUPC: (form.find("#CaseUPC").val() || "").replace(/-/gi, ""),
                        CarrierUPC: (form.find("#CarrierUPC").val() || "").replace(/-/gi, ""),
                        UnitUPC: (form.find("#UnitUPC").val() || "").replace(/-/gi, "")
                    };

                    let valid = true;

                    if (valid && !brand.BrandID) {
                        this.dsd.app.alert("Brand is required.");

                        valid = false;
                    }

                    if (valid && (!data.ProductName || data.ProductName === "")) {
                        this.dsd.app.alert("Product Name is required.");

                        valid = false;
                    }

                    if (valid && (!data.ProductNumber || data.ProductNumber === "")) {
                        this.dsd.app.alert("Product Number is required.");

                        valid = false;
                    }

                    if (valid && (!data.PackageID || Number.isNaN(data.PackageID))) {
                        this.dsd.app.alert("Package is required.");

                        valid = false;
                    }

                    if (valid) {
                        components.details.html(this.dsd.app.spinner);

                        Database.AddProduct(data, files.image).then(() => {
                            this.displayBrands(this.key, ARGS.BrandID, ARGS.Query);
                        });
                    }
                });
            });
        }
    }

    debounce(key, callback) {
        if (key === this.key && callback) {
            callback();
        }
    }
}
