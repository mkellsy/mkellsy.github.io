# Setup Navigation
This is common code I use for all my dashboards. It handles all necessary browser navigation using a `state` object.

## Code
This code is common. Understand what it does, but for the most part you don't need to modify this part.

> Note. I am creating these code snippits to make coding in the class easier. Please understand what this code does.

### CSS
Add this definition to the **#app** definition.

```css
#app {
    *[action] > * {
        pointer-events: none;
    }
}
```

### JavaScript
Add this code the the JavaScript tab.

```js
let app = null;

const StateFields = {
    Action: "String"
};

function KeyValue(parameter) {
    const parts = (parameter || "").split("=");

    return parts.length >= 2 ? { key: parts[0], value: parts[1] } : null;
}

function GetState() {
    const parameters = ((`${window.location}`).split("?").pop().split("&") || [])
        .map(parameter => KeyValue(parameter))
        .filter(parameter => parameter !== null);

    const results = {};

    for (let i = 0; i < parameters.length; i++) {
        results[parameters[i].key] = decodeURIComponent(parameters[i].value);
    }

    return results;
}

function SaveState(state) {
    state = state || {};

    const keys = (Object.keys(state || {})).filter(parameter => parameter !== "" && (state[parameter] || "") !== "");
    const parameters = keys.map(parameter => `${parameter}=${encodeURIComponent(state[parameter])}`);
    const current = window.location.href.split("/").pop();

    if (current !== `Home?${parameters.join("&")}`) window.history.pushState(state, "Encompass", `Home?${parameters.join("&")}`);

    app.state = state;
}

function RestoreState() {
    app.state = GetState();

    Navigate(app.state);
}

function Navigate(parameters, fields) {
    fields = fields || StateFields;

    if (!parameters) return;
    if (parameters instanceof MouseEvent && !parameters.target.getAttribute("action")) return;

    const state = parameters || {};
    const { ...updated } = app.state;
    const keys = Object.keys(fields);

    const type = parameters instanceof MouseEvent ? "element" : "call";

    for (let i = 0; i < keys.length; i += 1) {
        if (type === "element") state[keys[i]] = parameters.target.getAttribute(keys[i].toLowerCase());

        if (state[keys[i]] === "Null") {
            updated[keys[i]] = undefined;
        } else {
            let value;

            switch (fields[keys[i]].toLowerCase()) {
                case "integer":
                    updated[keys[i]] = parseInt(state[keys[i]], 10) || updated[keys[i]];
                    break;

                case "number":
                    updated[keys[i]] = parseFloat(state[keys[i]]) || updated[keys[i]];
                    break;

                case "date":
                    value = new Date(state[keys[i]]);
                    updated[keys[i]] = !Number.isNaN(value.getTime()) ? value.toLocaleDateString() : updated[keys[i]];
                    break;

                case "datetime":
                    value = new Date(state[keys[i]]);
                    updated[keys[i]] = !Number.isNaN(value.getTime()) ? value.toLocaleString() : updated[keys[i]];
                    break;

                default:
                    updated[keys[i]] = state[keys[i]] && state[keys[i]] !== "" ? state[keys[i]] : updated[keys[i]];
                    break;
            }
        }
    }

    Action(updated.Action, updated);
}

function Action(action, state) {
    switch (action) {
        default:
            SaveState(state);
            break;
    }
}

function Main() {
    app = dashboardItem.querySelector("#app");

    if (!app) return false;

    app.testing = app.getAttribute("test") === "true";
    app.state = GetState();

    window.addEventListener("popstate", RestoreState);
    app.addEventListener("click", Navigate);

    Navigate(app.state);

    return true;
}

Main();
```

**Testing Script**
Add this code to the Test Script tab.

```js
/* eslint-disable prefer-arrow-callback */
/* eslint-disable no-unused-expressions */

const assert = chai.assert;
const expect = chai.expect;

const app = dashboardItem.querySelector("#app");

app.setAttribute("test", "true");

it("Main", function () {
    expect(Main()).to.be.true;
    app.id = "foobar";
    expect(Main()).to.be.false;
    app.id = "app";
});

describe("State Functions", function () {
    it("Key Value", function () {
        const values = KeyValue("Foo=Bar");
        const values_malformed = KeyValue("Foo");
        const values_null = KeyValue();

        assert(values.key === "Foo", "KeyValue key should be Foo");
        assert(values.value === "Bar", "KeyValue value should be Bar");
        expect(values_malformed).to.be.null;
        expect(values_null).to.be.null;
    });

    it("Get State", function () {
        Main();

        const state = GetState();

        expect(state || null).to.not.be.null;
        expect(GetState).to.not.throw();
    });

    it("Save State", function () {
        Main();

        const current = GetState();
        const state = { Foo: "Bar", Test: "FooBar", Null: "" };

        SaveState(state);

        assert(app.state.Foo === state.Foo, "Should save state");
        assert(app.state.Test === state.Test, "Should save state");
        expect(app.state.Null || null).to.be.null;

        SaveState();

        expect(SaveState).to.not.throw();

        SaveState(current);
    });

    it("Restore State", function () {
        Main();
        RestoreState();

        EC_Fmt.TriggerEvent(window, "popstate");

        expect(RestoreState).to.not.throw();
    });

    it("Navigate", async function () {
        if (Main()) {
            const fields = {
                Action: "String",
                ValueString: "String",
                ValueInteger: "Integer",
                ValueNumber: "Number",
                ValueDate: "Date",
                ValueDateTime: "DateTime"
            };

            const actions = [{
                Action: "View",
                ValueString: "FooBar",
                ValueInteger: "12",
                ValueNumber: "4.5",
                ValueDate: "1/1/2021",
                ValueDateTime: "1/1/2020 1:45"
            }, {
                Action: "Null",
                ValueString: "Null",
                ValueInteger: "Null",
                ValueNumber: "Null",
                ValueDate: "Null",
                ValueDateTime: "Null"
            }, {
                Action: "Undefined"
            }];

            for (let i = 0; i < actions.length; i += 1) {
                const trigger = document.createElement("DIV");
                const keys = Object.keys(actions[i]);

                trigger.addEventListener("click", Navigate);

                if (actions[i].Action !== "Undefined") {
                    for (let j = 0; j < keys.length; j += 1) {
                        trigger.setAttribute(keys[j].toLowerCase(), actions[i][keys[j]]);
                    }
                }

                Navigate(actions[i].Action !== "Undefined" ? { ...actions[i] } : undefined, fields);
                EC_Fmt.TriggerEvent(trigger, "click");
            }
        }
    }).timeout(80000);
});
```

## Save
Again save as released. You are adding new files and you want to ensure they get committed.

> Note. Anytime you add code to a different file tab, or edit the HTML, you should save as released. Ofcourse if the dashboard is published/released don't do this.

## Next
[Interactive Elements](/encompass/interactive-elements)
