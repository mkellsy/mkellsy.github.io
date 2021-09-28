## Interactive Elements

Making actionalble items.

> Note. I am creating these code snippits to make coding in the class easier. Please understand what this code does.

**HTML**
```html
<div id="app">
    <div class="nav"></div>
    <div class="body">
        <div class="menu">
            <div class="item" action="View" itemid="1">Item 1</div>
            <div class="item" action="View" itemid="2">Item 2</div>
            <div class="item" action="View" itemid="3">Item 3</div>
        </div>
        <div class="content"></div>
    </div>
</div>
```

**CSS**
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
        background: #369;
    }

    .body {
        flex: 1;
        display: flex;
        flex-direction: row;

        .menu {
            flex: 1;
            background: #66c;

            &.selected {
                flex: unset;
                width: 200px;

                @media (min-width: 0px) and (max-width: 815px) {
                    display: none;
                }
            }

            .item {
                border-top: 1px #ccf solid;
                color: #ccf;
                padding: 14px;
                cursor: pointer;
                user-select: none;

                &:first-child {
                    border-top: 0 none;
                }

                &:hover {
                    background: #369;
                }
            }
        }

        .content {
            flex: 1;
            display: none;
            background: #ccf;

            &.selected {
                display: block;
            }
        }
    }
}
```

**JavaScript**
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
        case "View":
            SaveState(state);
            DisplayItem(state.ItemID);
            break;

        default:
            SaveState(state);
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
