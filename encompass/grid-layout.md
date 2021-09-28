# Grid Layout

You got the flexbox version to work. Grids are better for layouts. Grids give you more control over the layout from CSS. This helps with reactive interfaces.

## Code
* First simplify the HTML and remove the body box.
* Now the body is removed lets make the class names make more sense. Rename **content** to **body** and rename **item-display** to **content**.
* In the CSS remove the **.body** definition, but keep the nested definitions.
* Then rename **.content** to **.body** and rename **.item-display** to **.content**.
* Finally in in the CSS, lets make the **.content** box-sizing a **border-box**.
* In the JS, remove the mapping for **app.menu** and then modify the **app.content** to select the **.content** box.
* Then in the DisplayItem function lets fix the app.content.innerHTML calls.
* And then remove the className modifiers, and set the selected attribute on the app root.
* Then back in the CSS lets setup the grid.

> Note. I am creating these code snippits to make coding in the class easier. Please understand what this code does.

### HTML
```html
<div id="app">
    <div class="nav"></div>
    <div class="menu">
        <div class="item" action="View" itemid="1">Item 1</div>
        <div class="item" action="View" itemid="2">Item 2</div>
        <div class="item" action="View" itemid="3">Item 3</div>
    </div>
    <div class="body">
        <div class="item" action="View" itemid="Null">< Back</div>
        <div class="content"></div>
    </div>
</div>
```

### CSS
```less
#app {
    height: 100%;
    display: grid;
    grid-template-columns: 200px 1fr;
    grid-template-rows: 50px 1fr;
    overflow: hidden;

    @media (min-width: 0px) and (max-width: 815px) {
        grid-template-columns: 1fr;
    }

    *[action] > * {
        pointer-events: none;
    }

    .nav {
        grid-column-start: 1;
        grid-column-end: 3;
        box-sizing: border-box;
        border-bottom: 1px #dfdfdf solid;
    }

    .menu {
        grid-column-start: 1;
        grid-column-end: 3;
        overflow: auto;

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

    .body {
        flex: 1;
        overflow: hidden;
        display: none;

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

        .content {
            padding: 20px;
            box-sizing: border-box;
            overflow: auto;
        }
    }

    &[selected="true"] {
        .menu {
            grid-column-end: 2;

            @media (min-width: 0px) and (max-width: 815px) {
                display: none;
            }
        }

        .body {
            display: block;
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
        app.setAttribute("selected", "true");
        app.content.innerHTML = `Item: ${ItemID}`;
    } else {
        app.setAttribute("selected", "false");
        app.content.innerHTML = "";
    }
}

function Main() {
    app = dashboardItem.querySelector("#app");

    if (!app) return false;

    app.testing = app.getAttribute("test") === "true";
    app.content = app.querySelector(".content");
    app.state = GetState();

    window.addEventListener("popstate", RestoreState);
    app.addEventListener("click", Navigate);

    Navigate(app.state);

    return true;
}

Main();
```

## Save
Now let's save. Remember to test, make sure the coverage is at 100%.

## Next
