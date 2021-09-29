[Flexbox](/encompass/flexbox) - [Grids](/encompass/grids) - **Boilerplate** - [Responsive Content](/encompass/responsive-content)

# Boilerplate Code
We need to add some content for the next part. Here we are just going to copy over some code to work with.

First create your dashboard.

1. First create a new dashboard. Set the name to **Mobile-First (Responsive)** and the category to **Training**.
2. Then select the **Blank** layout.
3. Add a **Code Block** item.

## Code
After creating your Code Block dashboard add this code.

### HTML
Add this code to the HTML tab.

```html
<div id="app">
    <form class="search">
        <input type="text" placeholder="Search" value="" />
        <div class="button" action="Search">Search</div>
    </form>
    <div class="menu"></div>
    <div class="body">
        <div class="item" action="View" itemid="Null">< Back</div>
        <div class="content"></div>
    </div>
</div>
```

### CSS
Add this code to the CSS tab.

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

    .search {
        display: flex;
        align-items: center;
        grid-column-start: 1;
        grid-column-end: 3;
        box-sizing: border-box;
        border-bottom: 1px #dfdfdf solid;
        padding: 0 7px;

        input {
            flex: 1;
            height: 36px !important;
            border-top: 1px #dfdfdf solid !important;
            border-right: 0 none !important;
            border-bottom: 1px #dfdfdf solid !important;
            border-left: 1px #dfdfdf solid !important;
            border-radius: 3px 0 0 3px !important;
            outline: 0 none !important;

            &:focus {
                border-top: 1px #007acc solid !important;
                border-bottom: 1px #007acc solid !important;
                border-left: 1px #007acc solid !important;
            }
        }

        .button {
            display: flex;
            align-items: center;
            justify-content: space-around;
            height: 36px;
            background: #007acc;
            color: #ffffffe8;
            border-radius: 0 3px 3px 0 !important;
            cursor: pointer;

            &:hover {
                color: #fff;
            }
        }
    }

    .menu {
        grid-column-start: 1;
        grid-column-end: 3;
        overflow: hidden;

        &:hover {
            overflow: overlay;
        }

        @media (min-width: 0px) and (max-width: 815px) {
            overflow: auto;
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

            &.active {
                background: #007acc;
                border-top: 1px #007acc solid;
                color: #fff;

                &:first-child {
                    border-top: 0 none;
                }

                &:hover {
                    color: #fff;
                    background: #007acc;
                }
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
            display: flex;
            align-items: flex-start;
            padding: 20px;
            box-sizing: border-box;
            overflow: hidden;

            &:hover {
                overflow: overlay;
            }

            @media (min-width: 0px) and (max-width: 1015px) {
                align-items: unset;
                flex-direction: column;
            }

            @media (min-width: 0px) and (max-width: 815px) {
                overflow: auto;
            }
        }
    }
}
```

### JavaScript
Add this code to the JavaScript tab.

```js
let app = null;

const StateFields = {
    Action: "String",
    ItemID: "Integer",
    Search: "String"
};

const Items = [
    {
        ItemID: 1614153,
        Name: "Encompass Mobile",
        ImageURL: "https://images.encompass8.com/Support/S3Images/e49dcaa78d6ecd86b79dea9dc3a06ea8.jpg"
    },
    {
        ItemID: 1614152,
        Name: "Pick Lane Monitor",
        ImageURL: "https://images.encompass8.com/Support/S3Images/2059a1503945f6bca29b640b02e2a95a.jpg"
    },
    {
        ItemID: 1614035,
        Name: "Box Label",
        ImageURL: "https://images.encompass8.com/Support/S3Images/0096706f01b1bd7dbc12d964abc124f6.jpg"
    },
    {
        ItemID: 1614019,
        Name: "Print Error",
        ImageURL: "https://images.encompass8.com/Support/S3Images/36e07d24d78be391efe4800e5122f5f1.jpg"
    },
    {
        ItemID: 1613910,
        Name: "Conveyor Divert",
        ImageURL: "https://images.encompass8.com/Support/S3Images/9c49a4a65955cdb0df602df0cd05dc07.png"
    },
    {
        ItemID: 1613808,
        Name: "Pick Screen",
        ImageURL: "https://images.encompass8.com/Support/S3Images/75ae601d0291dfad636a0b7e024ea516.jpg"
    },
    {
        ItemID: 1613732,
        Name: "label on a Stick",
        ImageURL: "https://images.encompass8.com/Support/S3Images/cc299780b4109788df95fefb26c6dcde.jpg"
    },
    {
        ItemID: 1613567,
        Name: "iPhone in an iPhone",
        ImageURL: "https://images.encompass8.com/Support/S3Images/5f8a133d064de89c6848f97f7173f605.png"
    },
    {
        ItemID: 1613377,
        Name: "Most Inefficient Screenshot",
        ImageURL: "https://images.encompass8.com/Support/S3Images/677032bd7433962aea7f8d1543fa28ea.jpg"
    },
    {
        ItemID: 1613148,
        Name: "Label Print Issue",
        ImageURL: "https://images.encompass8.com/Support/S3Images/862971c26cbfbd1b70b49fc64b179712.jpeg"
    },
    {
        ItemID: 1613116,
        Name: "Connect Conference Logo",
        ImageURL: "https://images.encompass8.com/Support/S3KnowledgeIcon/061c2e377383aa5485bf9d7031b26f5c.png"
    },
    {
        ItemID: 1613102,
        Name: "In Route",
        ImageURL: "https://images.encompass8.com/Support/S3Images/b6a6261e883e479052f93eae371b39a7.PNG"
    },
    {
        ItemID: 1612900,
        Name: "Pick Lane Interface",
        ImageURL: "https://images.encompass8.com/Support/S3Images/17f860be6d33a5717e360b4f825a69b6.jpg"
    },
    {
        ItemID: 1612841,
        Name: "Map Loading",
        ImageURL: "https://images.encompass8.com/Support/S3AutoTestLog/d32ff274f721e63681e51407feeda572.png"
    },
    {
        ItemID: 1612758,
        Name: "All Wired Up",
        ImageURL: "https://images.encompass8.com/Support/S3Images/7710bb3350a718bd359324570ab4a08b.png"
    },
    {
        ItemID: 1612399,
        Name: "Which Port Do I Use",
        ImageURL: "https://images.encompass8.com/Support/S3Images/7679b587a45462d98525a6804a640b32.JPEG"
    },
    {
        ItemID: 1612343,
        Name: "BlueSA",
        ImageURL: "https://images.encompass8.com/Support/S3Images/97e0c945cb29ca111c9a13aa8d1fd2d2.png"
    },
    {
        ItemID: 1612317,
        Name: "PO Information",
        ImageURL: "https://images.encompass8.com/Support/S3Images/e9ff85f65503a7d322e472c22289adde.jpg"
    },
    {
        ItemID: 1612042,
        Name: "Re-Routing Fun",
        ImageURL: "https://images.encompass8.com/Support/S3Images/0c3a889fb28290a6ae0560694a78e8c4.png"
    },
    {
        ItemID: 1611839,
        Name: "Encompass Cast",
        ImageURL: "https://images.encompass8.com/Support/S3Images/4603f72bf486d37b207fe31fad1b4355.jpg"
    },
    {
        ItemID: 1611833,
        Name: "New Picksheet Font",
        ImageURL: "https://images.encompass8.com/Support/S3Images/5111e77e09b0a50e694f4bf9c72f1c6b.jpg"
    }
];

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
        case "Search":
            ProcessSearch();
            break;

        default:
            SaveState(state);
            DisplayItem(state.ItemID, state.Search);
            break;
    }
}

function DisplayItem(ItemID, Search) {
    app.menu.innerHTML = "";

    const items = Items.filter(item => !Search || Search === "" || item.Name.toLowerCase().indexOf(Search.toLowerCase()) >= 0);
    const item = Items.find(row => row.ItemID === parseInt(ItemID, 10));

    for (let i = 0; i < items.length; i += 1) {
        if (items[i].ItemID === parseInt(ItemID, 10)) {
            app.menu.innerHTML += `<div class="item active" action="View" itemid="${items[i].ItemID}">${items[i].Name}</div>`;
        } else {
            app.menu.innerHTML += `<div class="item" action="View" itemid="${items[i].ItemID}">${items[i].Name}</div>`;
        }
    }

    if (item) {
        // DISPLAY ITEM
    } else {
        // CLEAR ITEM
    }
}

function ProcessSearch(event) {
    if (event) event.preventDefault();

    app.state.Action = "View";
    app.state.Search = app.search.input.value;
    app.state.ItemID = "Null";

    Navigate(app.state);

    return false;
}

function Main() {
    app = dashboardItem.querySelector("#app");

    if (!app) return false;

    app.testing = app.getAttribute("test") === "true";
    app.search = app.querySelector(".search");
    app.search.input = app.search.querySelector("input");
    app.content = app.querySelector(".content");
    app.content.info = app.content.querySelector(".info");
    app.content.image = app.content.querySelector(".image");
    app.menu = app.querySelector(".menu");
    app.state = GetState();

    window.addEventListener("popstate", RestoreState);
    app.addEventListener("click", Navigate);
    app.search.addEventListener("submit", ProcessSearch);

    Navigate(app.state);

    return true;
}

Main();
```

### Training
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

it("Display Item", function () {
    if (Main()) {
        DisplayItem(1614153);
        DisplayItem("1614153");
        DisplayItem(1613567);
        DisplayItem("1613567");
        DisplayItem(1612758);
        DisplayItem("1612758");

        DisplayItem("1612758", "Wire");
        DisplayItem("FooBar");
        DisplayItem();
    }
});

it("Process Search", function () {
    if (Main()) {
        const search = app.querySelector(".search");
        const input = search.querySelector("input");

        input.value = "Wire";
        ProcessSearch();

        input.value = "";
        ProcessSearch();

        EC_Fmt.TriggerEvent(search, "submit");
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
                Action: "Search",
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

## Configure Dashboard
1. Turn off the header from the settings snack.
2. Open the settings, its the cogs icon in the settings snack.
3. Clear the all fields for margin, padding and border.
4. Clear the fields for border color and border radius.
5. Set the height field to **100%**.
6. Set the auto fill row height setting to **Yes**.

## Save
Save the dashboard as released. This ensures the code gets committed. Remember the dashboard is not published.

Then go to the [Training Dashboards](https://support.encompass8.com/Home?DashboardID=100100&TableName=ZZ_TrainingDashboards) table and add your bashboard to the list.

## Next
[Responsive Content](/encompass/responsive-content)
