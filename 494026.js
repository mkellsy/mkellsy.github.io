var LZC=function(){function o(o,r){if(!t[o]){t[o]={};for(var n=0;n<o.length;n++)t[o][o.charAt(n)]=n}return t[o][r]}var r=String.fromCharCode,n="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",e="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$",t={},i={compressToBase64:function(o){if(null==o)return"";var r=i._compress(o,6,function(o){return n.charAt(o)});switch(r.length%4){default:case 0:return r;case 1:return r+"===";case 2:return r+"==";case 3:return r+"="}},decompressFromBase64:function(r){return null==r?"":""==r?null:i._decompress(r.length,32,function(e){return o(n,r.charAt(e))})},compressToUTF16:function(o){return null==o?"":i._compress(o,15,function(o){return r(o+32)})+" "},decompressFromUTF16:function(o){return null==o?"":""==o?null:i._decompress(o.length,16384,function(r){return o.charCodeAt(r)-32})},compressToUint8Array:function(o){for(var r=i.compress(o),n=new Uint8Array(2*r.length),e=0,t=r.length;t>e;e++){var s=r.charCodeAt(e);n[2*e]=s>>>8,n[2*e+1]=s%256}return n},decompressFromUint8Array:function(o){if(null===o||void 0===o)return i.decompress(o);for(var n=new Array(o.length/2),e=0,t=n.length;t>e;e++)n[e]=256*o[2*e]+o[2*e+1];var s=[];return n.forEach(function(o){s.push(r(o))}),i.decompress(s.join(""))},compressToEncodedURIComponent:function(o){return null==o?"":i._compress(o,6,function(o){return e.charAt(o)})},decompressFromEncodedURIComponent:function(r){return null==r?"":""==r?null:(r=r.replace(/ /g,"+"),i._decompress(r.length,32,function(n){return o(e,r.charAt(n))}))},compress:function(o){return i._compress(o,16,function(o){return r(o)})},_compress:function(o,r,n){if(null==o)return"";var e,t,i,s={},p={},u="",c="",a="",l=2,f=3,h=2,d=[],m=0,v=0;for(i=0;i<o.length;i+=1)if(u=o.charAt(i),Object.prototype.hasOwnProperty.call(s,u)||(s[u]=f++,p[u]=!0),c=a+u,Object.prototype.hasOwnProperty.call(s,c))a=c;else{if(Object.prototype.hasOwnProperty.call(p,a)){if(a.charCodeAt(0)<256){for(e=0;h>e;e++)m<<=1,v==r-1?(v=0,d.push(n(m)),m=0):v++;for(t=a.charCodeAt(0),e=0;8>e;e++)m=m<<1|1&t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t>>=1}else{for(t=1,e=0;h>e;e++)m=m<<1|t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t=0;for(t=a.charCodeAt(0),e=0;16>e;e++)m=m<<1|1&t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t>>=1}l--,0==l&&(l=Math.pow(2,h),h++),delete p[a]}else for(t=s[a],e=0;h>e;e++)m=m<<1|1&t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t>>=1;l--,0==l&&(l=Math.pow(2,h),h++),s[c]=f++,a=String(u)}if(""!==a){if(Object.prototype.hasOwnProperty.call(p,a)){if(a.charCodeAt(0)<256){for(e=0;h>e;e++)m<<=1,v==r-1?(v=0,d.push(n(m)),m=0):v++;for(t=a.charCodeAt(0),e=0;8>e;e++)m=m<<1|1&t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t>>=1}else{for(t=1,e=0;h>e;e++)m=m<<1|t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t=0;for(t=a.charCodeAt(0),e=0;16>e;e++)m=m<<1|1&t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t>>=1}l--,0==l&&(l=Math.pow(2,h),h++),delete p[a]}else for(t=s[a],e=0;h>e;e++)m=m<<1|1&t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t>>=1;l--,0==l&&(l=Math.pow(2,h),h++)}for(t=2,e=0;h>e;e++)m=m<<1|1&t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t>>=1;for(;;){if(m<<=1,v==r-1){d.push(n(m));break}v++}return d.join("")},decompress:function(o){return null==o?"":""==o?null:i._decompress(o.length,32768,function(r){return o.charCodeAt(r)})},_decompress:function(o,n,e){var t,i,s,p,u,c,a,l,f=[],h=4,d=4,m=3,v="",w=[],A={val:e(0),position:n,index:1};for(i=0;3>i;i+=1)f[i]=i;for(p=0,c=Math.pow(2,2),a=1;a!=c;)u=A.val&A.position,A.position>>=1,0==A.position&&(A.position=n,A.val=e(A.index++)),p|=(u>0?1:0)*a,a<<=1;switch(t=p){case 0:for(p=0,c=Math.pow(2,8),a=1;a!=c;)u=A.val&A.position,A.position>>=1,0==A.position&&(A.position=n,A.val=e(A.index++)),p|=(u>0?1:0)*a,a<<=1;l=r(p);break;case 1:for(p=0,c=Math.pow(2,16),a=1;a!=c;)u=A.val&A.position,A.position>>=1,0==A.position&&(A.position=n,A.val=e(A.index++)),p|=(u>0?1:0)*a,a<<=1;l=r(p);break;case 2:return""}for(f[3]=l,s=l,w.push(l);;){if(A.index>o)return"";for(p=0,c=Math.pow(2,m),a=1;a!=c;)u=A.val&A.position,A.position>>=1,0==A.position&&(A.position=n,A.val=e(A.index++)),p|=(u>0?1:0)*a,a<<=1;switch(l=p){case 0:for(p=0,c=Math.pow(2,8),a=1;a!=c;)u=A.val&A.position,A.position>>=1,0==A.position&&(A.position=n,A.val=e(A.index++)),p|=(u>0?1:0)*a,a<<=1;f[d++]=r(p),l=d-1,h--;break;case 1:for(p=0,c=Math.pow(2,16),a=1;a!=c;)u=A.val&A.position,A.position>>=1,0==A.position&&(A.position=n,A.val=e(A.index++)),p|=(u>0?1:0)*a,a<<=1;f[d++]=r(p),l=d-1,h--;break;case 2:return w.join("")}if(0==h&&(h=Math.pow(2,m),m++),f[l])v=f[l];else{if(l!==d)return null;v=s+s.charAt(0)}w.push(v),f[d++]=s+v.charAt(0),h--,s=v,0==h&&(h=Math.pow(2,m),m++)}}};return i}();"function"==typeof define&&define.amd?define(function(){return LZC}):"undefined"!=typeof module&&null!=module&&(module.exports=LZC);

class DSDLink {
    constructor(app, initilize, refresh) {
        if (window.location.href.toLowerCase().indexOf("dashboardedit") === -1) {
            this.app = app;

            this.app.extend({
                content: this.app.find(".content"),
                dialog: this.app.find(".svs-dialog").hide(),
                console: this.app.find(".debug").hide(),
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
                ARGS.SupplierFamilies = this.state.SupplierFamilies;

                if (UserType === "Supplier") {
                    ARGS.SupplierFamilies = (await DSDLink.SupplierFamilies()).join("^");
                }

                if ((ARGS.SupplierFamilies || "") !== "" && (ARGS.SupplierFamilies || "") !== "NaN") {
                    initilize(this.app, this.state, (ARGS.SupplierFamilies || "").split(",").map(v => parseInt(v, 10)));
                } else {
                    this.app.dialog.open(`
                        <div class="svs-dialog-title">Select Suppliers</div>
                        <div class="svs-dialog-content">
                            <p class="dialog-message">
                                You are not logged in as a supplier. You must select
                                one or more suppliers to continue.
                            </p>
                            <div class="fieldset">
                                <div class="field">
                                    <span class="title">Supplier</span>
                                    <placeholder>
                                </div>
                            </div>
                        </div>
                        <div class="svs-dialog-actions">
                            <div id="select-suppliers" class="svs-button svs-button-primary">Select</div>
                        </div>
                    `);

                    this.app.dialog.action("#select-suppliers", async () => {
                        const supplierFamilies = (this.app.dialog.find("#SupplierFamilyIDHidden").val() || "").split("^").map(v => parseInt(v, 10));

                        if (supplierFamilies && supplierFamilies.length > 0) {
                            this.app.dialog.close();
                            initilize(this.app, this.state, supplierFamilies);
                        }
                    });

                    this.app.dialog.find("placeholder").each(async (index, element) => {
                        (await UI.setupAutocomplete($(element), "SupplierFamilyID", "", false, "SupplierFamilies", "SupplierFamilyID", ECP.DataType._Integer, "SupplierFamily", ECP.DataType._Text)).element.find(".ajax-input-icon")
                            .removeClass("ews-icon-ajaxinput")
                            .addClass("ews-icon-caretdown")
                            .addClass("single-selection");
                    });
                }
            })();

            window.addEventListener("popstate", () => {
                this.state = DSDLink.readState();

                if (refresh) {
                    refresh(this.app, this.state);
                }
            });

            this.app.console.on("click", ".close", () => {
                this.app.console.hide();
            });
        }
    }

    static SupplierFamilies() {
        return new Promise((resolve) => {
            const key = btoa(`DBI:SupplierFamilies:${UserID}`);

            let results = DSDLink.getCache(key);

            if (!results) {
                results = [];

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

                    DSDLink.setCache(key, results, 1000 * 60 * 30);
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

    static Supplier(supplierFamilies) {
        return new Promise((resolve) => {
            const key = btoa(`DBI:Suppliers:${supplierFamilies.join("^")}^0`);

            let results = DSDLink.getCache(key);

            if (!results) {
                results = [];

                const request = Public.API("DBI_Get_Suppliers");

                request.AddParameter("SupplierFamilyID", `${supplierFamilies.join("^")}^0`, ECP.EC_Operator.Equals);

                request.Submit().then((response) => {
                    const data = Server.parseResponse(response) || [];

                    for (let i = 0; i < data.length; i++) {
                        const { ...row } = data[i];

                        results.push({
                            SupplierID: parseInt(row.SupplierID || "0", 10),
                            SupplierFamilyID: parseInt(row.SupplierFamilyID_DBValue || "0", 10),
                            ReportCode: row["Suppliers_Codes_SupplierReportCode^Codes.Code"],
                            CodeType: row["Suppliers_Codes_SupplierReportCode^Codes.CodeType"]
                        });
                    }

                    DSDLink.setCache(key, results, 1000 * 60 * 30);
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

    appendSearch(query, add) {
        this.app.content.html("");

        const components = {
            form: $("<form class=\"search\" method=\"get\"></form>"),
            data: $("<div id=\"data\" class=\"data\"></div>"),
            details: $("<div class=\"details\"></div>"),
            layout: $("<div class=\"layout\"></div>"),
            search: $(`<input type="text" id="search" value="${query || ""}" placeholder="Search" />`)
        };

        if (add) {
            components.add = $(`
                <div id="add" class="svs-button svs-mobile-hide">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
                        <path fill="#638e46" d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
                    </svg>
                    <span>${add}</span>
                </div>
            `);

            components.form.append(components.add);
        }

        const field = $(`
            <div class="field">
                <div class="icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
                        <path fill="#d4d4d4" d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
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
        components.layout.append(components.details);

        components.form.append(field);

        this.app.content.append(components.form);
        this.app.content.append(components.layout);

        return components;
    }

    static readState() {
        const parms = window.location.href.split("?").pop().split("&");
        const results = {};

        for (let i = 0; i < parms.length; i++) {
            const keyValue = parms[i].split("=");

            if (keyValue[0] !== "SupplierFamilies" || UserType !== "Supplier") {
                results[keyValue[0]] = keyValue[1];
            }
        }

        return results;
    }

    static logState() {
        const current = window.location.href.split("/").pop();
        const keys = Object.keys(ARGS);
        const params = [];

        params.push(`DashboardID=${Settings.DashboardID}`);

        for (let i = 0; i < keys.length; i++) {
            if ((ARGS[keys[i]] || "") !== "" && (ARGS[keys[i]] || "") !== "NaN" && (keys[i] !== "SupplierFamilies" || UserType !== "Supplier")) {
                params.push(`${keys[i]}=${ARGS[keys[i]]}`);
            }
        }

        if (window.debug) {
            params.push("Debug=True");
        }

        if (current !== `Home?${params.join("&")}`) {
            window.history.pushState(ARGS, "Brands", `Home?${params.join("&")}`);
        }

        DSDLink.tabsState();
    }

    static tabsState() {
        $(".MainLayoutTabs a").each((index, element) => {
            const url = $(element).attr("href");

            if (url && (url.split("?")[0] || "").toLowerCase() === "home") {
                const params = url.split("?").pop().split("&").filter(p => (p.split("=")[0] || "").toLowerCase() !== "supplierfamilies" && (p.split("=")[0] || "").toLowerCase() !== "debug");

                if (UserType !== "Supplier" && (ARGS.SupplierFamilies || "") !== "" && (ARGS.SupplierFamilies || "") !== "NaN") {
                    params.push(`SupplierFamilies=${ARGS.SupplierFamilies}`);
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

        localStorage.setItem(key, JSON.stringify(item))
    }

    static getCache(key) {
        const itemStr = localStorage.getItem(key)

        if (!itemStr) {
            return null
        }

        const item = JSON.parse(itemStr)
        const now = new Date()

        if (now.getTime() > item.expiry) {
            localStorage.removeItem(key)

            return null
        }

        return item.value
    }

    static setCompress(key, value, ttl) {
        const now = new Date()
        
        const item = {
            value: value,
            expiry: now.getTime() + ttl
        }

        localStorage.setItem(key, LZC.compress(JSON.stringify(item)));
    }

    static getCompress(key) {
        const itemStr = localStorage.getItem(key)

        if (!itemStr) {
            return null;
        }

        const item = JSON.parse(LZC.decompress(itemStr));
        const now = new Date();

        if (now.getTime() > item.expiry) {
            localStorage.removeItem(key);

            return null;
        }

        return item.value;
    }
}
