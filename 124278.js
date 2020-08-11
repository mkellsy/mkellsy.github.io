let HASH_CHANGE = false;
let IS_EDITING = false;
let DASHBOARD = null;
let ARGS = {};

const LOADED_SCRIPTS = [];
const LOADED_STYLESHEETS = [];
const LOADED_WORKERS = {};

class Server {
    static startDashboard(dashboard, name, callback, scripts, styles) {
        const script = document.createElement("script");

        script.setAttribute("type", "text/javascript");
        script.setAttribute("src", "DocumentView.aspx?Action=Download&GlobalDocumentID=277767");

        document.head.appendChild(script);

        script.onload = () => {
            DASHBOARD = dashboard;

            if (!Array.isArray(scripts)) {
                scripts = [scripts];
            }

            scripts = [124275, 124276, ...scripts || []];

            if (!Array.isArray(styles)) {
                styles = [styles];
            }

            styles = [277783, ...styles || []];

            if (!enablePreview && window.location.href.indexOf("PreviewCode=True") >= 0) {
                IS_EDITING = true;

                if (!enablePreview) {
                    Server.log("In edit mode, code execution is disabled.");

                    if ($(".dashboard-item-preview").length > 0) {
                        $(".dashboard-item-preview").append(`
                        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; align-content: center; background: #ececec;">
                            <div style="text-align: center; width: 100%; height: 50%; padding: 0 20px;">
                                Preview has been disabled for this application.
                            </div>
                        </div>
                    `);
                    }
                }
            }

            if (!IS_EDITING) {
                Server.getArgs();

                const app = $(DASHBOARD).find(`#${name}`);

                if (app.find(".svs-loading-snack").length === 0) {
                    app.append(`
                    <div class="svs-loading-snack">Loading...</div>
                `);
                }

                if (app.find(".svs-loading").length === 0) {
                    app.append(`
                    <div class="svs-loading">
                        <span>Loading...</span>
                    </div>
                `);
                }

                if (app.find(".svs-dialog[dialog='alert']").length === 0) {
                    app.append(`
                    <div class="svs-dialog" dialog="alert">
                        <div class="svs-dialog-inner">
                            <div class="svs-dialog-title">Message</div>
                            <div class="svs-dialog-content svs-dialog-center" id="message"></div>
                            <div class="svs-dialog-actions">
                                <div class="svs-button svs-button-primary" id="ok-button">&nbsp;&nbsp;&nbsp;&nbsp;OK&nbsp;&nbsp;&nbsp;&nbsp;</div>
                            </div>
                        </div>
                    </div>
                `);
                }

                $(".svs-dialog").hide();

                app.extend({
                    loader: {
                        screen: app.find(".svs-loading").hide(),
                        snack: app.find(".svs-loading-snack").hide()
                    }
                });

                app.loader.hide = () => {
                    app.loader.screen.hide();
                    app.loader.snack.hide();
                };

                app.loader.show = (message) => {
                    app.loader.snack.hide();

                    if (message && message !== "") {
                        app.loader.screen.find("span").html(message);
                    } else {
                        app.loader.screen.find("span").html("Loading...");
                    }

                    app.loader.screen.css({
                        height: `${app.height() - 98}px`,
                        display: "flex"
                    });
                };

                window.onhashchange = () => {
                    if (!HASH_CHANGE) {
                        Server.getArgs();
                        Server.layoutDashboard();

                        app.css({
                            opacity: 1
                        })

                        callback(app);
                    }

                    HASH_CHANGE = false;
                };

                Server.loadStylesheet(styles);

                Server.loadScript(scripts, () => {
                    Server.layoutDashboard();

                    app.css({
                        opacity: 1
                    })

                    callback(app);
                });
            }
        };
    }

    static startComponent(dashboard, name, callback, scripts, styles) {
        EC_Fmt.LoadScript("DocumentView.aspx?Action=Download&GlobalDocumentID=277767", () => {
            DASHBOARD = dashboard;

            if (!Array.isArray(scripts)) {
                scripts = [scripts];
            }

            scripts = [124275, 124276, ...scripts || []];

            if (!Array.isArray(styles)) {
                styles = [styles];
            }

            styles = [66394, ...styles || []];

            const url = window.location.pathname;
            const filename = url.substring(url.lastIndexOf("/") + 1).toLowerCase();

            if ((!enablePreview && window.location.href.indexOf("PreviewCode=True") >= 0) || filename !== "home.aspx") {
                IS_EDITING = true;

                if (!enablePreview) {
                    Server.log("In edit mode, code execution is disabled.");

                    if ($(".dashboard-item-preview").length > 0) {
                        $(".dashboard-item-preview").append(`
                        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; align-content: center; background: #ececec;">
                            <div style="text-align: center; width: 100%; height: 50%; padding: 0 20px;">
                                Preview has been disabled for this application.
                            </div>
                        </div>
                    `);
                    }
                }
            }

            if (!IS_EDITING) {
                const app = $(DASHBOARD).find(`#${name}`);

                if (app.find(".svs-loading-snack").length === 0) {
                    app.append(`
                    <div class="svs-loading-snack">Loading...</div>
                `);
                }

                if (app.find(".svs-dialog[dialog='alert']").length === 0) {
                    app.append(`
                    <div class="svs-dialog" dialog="alert">
                        <div class="svs-dialog-inner">
                            <div class="svs-dialog-title">Message</div>
                            <div class="svs-dialog-content svs-dialog-center" id="message"></div>
                            <div class="svs-dialog-actions">
                                <div class="svs-button svs-button-primary" id="ok-button">&nbsp;&nbsp;&nbsp;&nbsp;OK&nbsp;&nbsp;&nbsp;&nbsp;</div>
                            </div>
                        </div>
                    </div>
                `);
                }

                $(".svs-dialog").hide();

                app.extend({
                    loader: {

                        snack: app.find(".svs-loading-snack").hide()
                    }
                });

                app.loader.hide = () => {
                    app.loader.snack.hide();
                };

                app.loader.show = () => {
                    app.loader.snack.show();
                };

                Server.loadStylesheet(styles);

                Server.loadScript(scripts, () => {
                    app.css({
                        opacity: 1
                    })

                    callback(app);
                });
            }
        });
    }

    static layoutDashboard() {
        const $dashboardItem = $(DASHBOARD);
        const $layout = $("#Content .Inner");

        $layout.css({
            overflow: "hidden"
        });

        $dashboardItem.css({
            height: `${$layout[0].clientHeight}px`,
            overflow: "hidden"
        });

        $("body").css({
            overflow: "hidden"
        });

        window.onresize = () => {
            window.setTimeout(() => {
                $dashboardItem.css({
                    height: `${$layout[0].clientHeight}px`,
                    overflow: "hidden"
                });
            }, 10);
        };
    }

    static log(value, critical) {
        if (debug || critical) {
            if (critical) {
                throw value;
            } else {
                console.log(value); /* eslint-disable-line */
            }
        }
    }

    static loadScript(scripts, callback, local) {
        if (!Array.isArray(scripts)) {
            scripts = [scripts];
        }

        const queue = [];

        for (let i = 0; i < scripts.length; i++) {
            const script = scripts[i];

            if (script && script !== "") {
                if (LOADED_SCRIPTS.indexOf(script) < 0) {
                    queue.push(true);

                    const element = document.createElement("script");

                    if (!Number.isNaN(parseInt(script, 10))) {
                        element.src = `DocumentView.aspx?Action=Download&${local ? `DocumentID=${script}` : `GlobalDocumentID=${script}`}`;
                    } else {
                        element.src = script;
                    }

                    element.addEventListener("load", () => {
                        document.body.removeChild(element);

                        queue.pop();

                        LOADED_SCRIPTS.push(script);

                        if (queue.length === 0) {
                            callback();
                        }
                    });

                    document.body.appendChild(element);
                }
            }
        }

        if (queue.length === 0) {
            callback();
        }
    }

    static loadStylesheet(stylesheets, local) {
        if (!Array.isArray(stylesheets)) {
            stylesheets = [stylesheets];
        }

        const queue = [];

        for (let i = 0; i < stylesheets.length; i++) {
            const stylesheet = stylesheets[i];

            if (stylesheet && stylesheet !== "") {
                if (LOADED_STYLESHEETS.indexOf(stylesheet) < 0) {
                    queue.push(true);

                    if (!Number.isNaN(parseInt(stylesheet, 10))) {
                        fetch(`DocumentView.aspx?Action=Download&${local ? `DocumentID=${stylesheet}` : `GlobalDocumentID=${stylesheet}`}`).then(async (response) => {
                            const link = document.createElement("link");

                            const url = (window.URL || window.webkitURL).createObjectURL(new Blob([await response.text()], {
                                type: "text/css"
                            }));

                            link.rel = "stylesheet";
                            link.type = "text/css";
                            link.href = url;

                            link.addEventListener("load", () => {
                                queue.pop();

                                LOADED_STYLESHEETS.push(stylesheet);
                                (window.URL || window.webkitURL).revokeObjectURL(url);
                            });

                            document.head.appendChild(link);
                        });
                    } else {
                        const link = document.createElement("link");

                        link.rel = "stylesheet";
                        link.type = "text/css";
                        link.href = stylesheet;

                        link.addEventListener("load", () => {
                            queue.pop();

                            LOADED_STYLESHEETS.push(stylesheet);
                        });

                        document.head.appendChild(link);
                    }
                }
            }
        }
    }

    static startWorker(script, callback, persisted, local) {
        return new Promise((resolve, reject) => {
            if (!persisted) {
                if (Object.keys(LOADED_WORKERS).indexOf(script) >= 0 && LOADED_WORKERS[script]) {
                    const worker = new Worker(LOADED_WORKERS[script]);

                    worker.onmessage = (event) => {
                        callback(event.data);
                    };

                    resolve(worker);
                } else {
                    fetch(`DocumentView.aspx?Action=Download&${local ? `DocumentID=${script}` : `GlobalDocumentID=${script}`}`).then(async (response) => {
                        LOADED_WORKERS[script] = (window.URL || window.webkitURL).createObjectURL(new Blob([await response.text()]));

                        const worker = new Worker(LOADED_WORKERS[script]);

                        worker.onmessage = (event) => {
                            callback(event.data);
                        };

                        resolve(worker);
                    }).catch((error) => {
                        reject(error);
                    });
                }
            } else {
                resolve(persisted);
            }
        });
    }

    static getArgs() {
        ARGS = Server.parseJson(atob(window.location.hash.replace(/#/i, "")));
    }

    static setArgs() {
        HASH_CHANGE = true;

        let hash = "";

        if (ARGS && typeof ARGS === "object") {
            hash = `#${btoa(JSON.stringify(ARGS))}`;
        }

        if (hash === homeHash) {
            hash = "";
        }

        if (hash !== window.location.hash) {
            if (hash !== "") {
                window.location.hash = hash;
            } else {
                history.pushState(null, null, window.location.href.split("#")[0]); /* eslint-disable-line */
            }
        }

        window.setTimeout(() => {
            HASH_CHANGE = false;
        }, 10);
    }

    static parseJson(value) {
        if (/^[\],:{}\s]*$/.test(value.replace(/\\["\\/bfnrtu]/g, "@").replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?/g, "]").replace(/(?:^|:|,)(?:\s*\[)+/g, ""))) {
            try {
                return JSON.parse(value);
            } catch (error) {
                return {};
            }
        }

        return {};
    }

    static parseResponse(response) {
        Server.log(response);

        let node = "Table";

        if (response && response.Export.Report) {
            node = "Report";
        }

        if (response.Export[node].Row && !Array.isArray(response.Export[node].Row)) {
            return [response.Export[node].Row];
        }

        return response.Export[node].Row;
    }

    static createRequest(command, distributor) {
        const request = new ECP.EC_Request(command);

        request.SetEncompassID(distributor || encompassId);

        return request;
    }

    static postRequest(request, data, options) {
        return new Promise((resolve, reject) => {
            let query = `APICommand=${request.Command}&EncompassID=${request.EncompassID}`;

            if (request.APIToken && request.APIToken !== "") {
                query += `&APIToken=${request.APIToken}`;
            }

            let version = "";

            if ((options || {}).version) {
                version = `ECP_${options.version}_${((options || {}).cycle || "A").toUpperCase()}/`;
            }

            fetch(`https://api.encompass8.com/${version}aspx1/API.ashx?${query}`, {
                method: "POST",
                headers: new Headers({
                    "content-type": (options || {}).contentType || "application/json"
                }),
                mode: (options || {}).mode || "cors",
                body: JSON.stringify(data)
            }).then((response) => {
                response.text().then(() => {
                    resolve();
                });
            }).catch((error) => {
                reject(error);
            });
        });
    }

    static setCookie(name, value, days) {
        const date = new Date();

        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = `${name}=${btoa(JSON.stringify(value))}; expires=${date.toUTCString()}; path=/`;
    }

    static getCookie(name) {
        const values = decodeURIComponent(document.cookie).split(";");

        for (let i = 0; i < values.length; i++) {
            let value = values[i];

            while (value.charAt(0) === " ") {
                value = value.substring(1);
            }

            if (value.indexOf(`${name}=`) === 0) {
                return Server.parseJson(atob(value.substring((`${name}=`).length, value.length)));
            }
        }

        return null;
    }
}
