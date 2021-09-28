# Improving Flow

It's starting to look good, but there's issues.

* No default view.
* No back button when viewing an item on a narrow screen.
* Testing is no longer 100%.
* The colors are hideous.

## Code
* First we are going to seperate the content and add a back button.
* In the CSS lets remove the initial colors, and set the borders and text colors.
* Then we are going to hide the back item when on wide screens and show it on narrow screens.
* In the JavaScript, Action function, combine the default and View actions.
* Finally lets test the DisplayItems function.

> Note. I am creating these code snippits to make coding in the class easier. Please understand what this code does.

### HTML
```html
<div id="app">
    <div class="nav"></div>
    <div class="body">
        <div class="menu">
            <div class="item" action="View" itemid="1">Item 1</div>
            <div class="item" action="View" itemid="2">Item 2</div>
            <div class="item" action="View" itemid="3">Item 3</div>
        </div>
        <div class="content">
            <div class="item" action="View" itemid="Null">< Back</div>
            <div class="item-display"></div>
        </div>
    </div>
</div>
```

### CSS
```less
#app {
    height: 100%;
    display: flex;
    flex-direction: column;

    *[action] > * {
        pointer-events: none;
    }

    .nav {
        height: 50px;
        border-bottom: 1px #dfdfdf solid;
    }

    .body {
        flex: 1;
        display: flex;
        flex-direction: row;

        .menu {
            flex: 1;

            &.selected {
                flex: unset;
                width: 200px;

                @media (min-width: 0px) and (max-width: 815px) {
                    display: none;
                }
            }

            .item {
                border-top: 1px #dfdfdf solid;
                color: #525252;
                padding: 14px;
                cursor: pointer;
                user-select: none;

                &:first-child {
                    border-top: 0 none;
                }

                &:hover {
                    color: #000;
                    background: #efefef;
                }
            }
        }

        .content {
            flex: 1;
            display: none;

            &.selected {
                display: block;
            }

            .item-display {
                padding: 20px;
            }

            .item {
                display: none;
                border-bottom: 1px #dfdfdf solid;
                color: #525252;
                padding: 14px;
                cursor: pointer;
                user-select: none;

                @media (min-width: 0px) and (max-width: 815px) {
                    display: block;
                }

                &:hover {
                    color: #000;
                    background: #efefef;
                }
            }
        }
    }
}
```

### JavaScript
```js
let app = null;

const StateFields = {
    Action: "String",
    ItemID: "Integer"
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
            DisplayItem(state.ItemID);
            break;
    }
}

function DisplayItem(ItemID) {
    if (ItemID && !Number.isNaN(parseInt(ItemID, 10))) {
        app.menu.className = "menu selected";
        app.content.className = "content selected";
        app.content.innerHTML = `Item: ${ItemID}`;
    } else {
        app.menu.className = "menu";
        app.content.className = "content";
        app.content.innerHTML = "";
    }
}

function Main() {
    app = dashboardItem.querySelector("#app");

    if (!app) return false;

    app.testing = app.getAttribute("test") === "true";
    app.content = app.querySelector(".content");
    app.menu = app.querySelector(".menu");
    app.state = GetState();

    window.addEventListener("popstate", RestoreState);
    app.addEventListener("click", Navigate);

    Navigate(app.state);

    return true;
}

Main();
```

### Testing
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

it("Display Item", function () {
    if (Main()) {
        DisplayItem(1);
        DisplayItem("1");
        DisplayItem(2);
        DisplayItem("2");
        DisplayItem(3);
        DisplayItem("3");
        DisplayItem("FooBar");
        DisplayItem();
    }
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
Now let's save. Remember to test, make sure the coverage is at 100%.

## Next
