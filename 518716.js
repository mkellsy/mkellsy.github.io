class History {
    constructor() {
        this.load();
    }

    load() {
        this.parameters = {};

        const parameters = window.location.href.split("?").pop().split("&");

        for (let i = 0; i < parameters.length; i++) {
            const parameter = parameters[i].split("=");

            if ((parameter[1] || "") !== "") {
                this.parameters[parameter[0]] = decodeURIComponent(parameter[1] || "").split(",");

                if (Array.isArray(this.parameters[parameter[0]]) && this.parameters[parameter[0]].length === 1) {
                    this.parameters[parameter[0]] = this.parameters[parameter[0]][0];
                }
            }
        }
    }

    value(key, ...values) {
        if (values !== undefined && Array.isArray(values) && values.length > 0) {
            const uuid = new Date().getTime() + Math.random();

            this.key = uuid;

            values = values.filter(item => item && item !== "");

            if (values.length === 0) {
                delete this.parameters[key];
            } else {
                this.parameters[key] = values.length === 1 ? values[0] : values;
            }

            setTimeout(() => {
                this.update(uuid);
            }, 5);
        } else {
            return this.parameters[key];
        }

        return null;
    }

    encoded(key, value) {
        if (value !== undefined) {
            const uuid = new Date().getTime() + Math.random();

            this.key = uuid;

            if (!value || value === "") {
                delete this.parameters[key];
            } else {
                this.parameters[key] = btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, ""); // eslint-disable-line no-div-regex
            }

            setTimeout(() => {
                this.update(uuid);
            });
        } else {
            if (!this.parameters[key] || this.parameters[key] === "") {
                return null;
            }

            return atob(this.parameters[key].replace(/-/g, "+").replace(/_/g, "/"));
        }

        return null;
    }

    update(key) {
        if (key === this.key) {
            const current = window.location.href.split("/").pop();
            const keys = Object.keys(this.parameters);
            const params = [];

            for (let i = 0; i < keys.length; i++) {
                if ((this.parameters[keys[i]] || "") !== "") {
                    params.push(`${keys[i]}=${this.parameters[keys[i]]}`);
                }
            }

            if (current !== `Home?${params.join("&")}`) {
                window.history.pushState(this.parameters, "", `Home?${params.join("&")}`);
            }
        }
    }
}
