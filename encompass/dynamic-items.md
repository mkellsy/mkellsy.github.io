# Dynamic Items

The three HTML items are cute, but lets add some more fields so we can work with this interface.

I am not adding the JSON to this document to save space. You can download the JSON data here [https://tinyurl.com/26uaruec](https://tinyurl.com/26uaruec).

## Code
* We are going to add JSON data.
* Then modify the DisplayItems function to write the item list dynamically.

> Note. I am creating these code snippits to make coding in the class easier. Please understand what this code does.

### HTML
First modify the **menu** element in the HTML tab. Remove the children.

```html
<div class="menu"></div>
```

### CSS
Add the **.active** definition to the **.item** defintion in the **.menu** definition.

```less
.menu {
    .item {
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
```

Then modify the **.menu** definition. Keep the sub-definition, just modify the directives to this. We are adding interactive scrollbars here.

```less
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
}
```

Now add the definition for the **selected** attribute. This belongs on the bottom of the main **#app** definition.

```less
#app {
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

Then do the same for the **.content** definition in the **.body** definition.

```less
.content {
    padding: 20px;
    box-sizing: border-box;
    overflow: hidden;

    &:hover {
        overflow: overlay;
    }

    @media (min-width: 0px) and (max-width: 815px) {
        overflow: auto;
    }
}
```

### JavaScript
First add the **Items** variable at the top of the file. For this tutorial we are just making a global list. Production interfaces will use an API call for this.

```js
const Items = [...]; // paste the json data here.
```

Now modify the **Main** function. Add the **app.menu** element back. We need it so we can populate the items.

```js
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
```

Now, modify the **DisplayItem** function. We need to populate the menu now. And while we are here, let's add support for filtering. I have a feeling we will need it later.

```js
function DisplayItem(ItemID, Search) {
    app.menu.innerHTML = "";

    const items = Items.filter(item => !Search || Search === "" || item.Name.toLowerCase().indexOf(Search.toLowerCase()) >= 0);

    for (let i = 0; i < items.length; i += 1) {
        if (items[i].ItemID === ItemID) {
            app.menu.innerHTML += `<div class="item active" action="View" itemid="${items[i].ItemID}">${items[i].Name}</div>`;
        } else {
            app.menu.innerHTML += `<div class="item" action="View" itemid="${items[i].ItemID}">${items[i].Name}</div>`;
        }
    }

    if (ItemID && !Number.isNaN(parseInt(ItemID, 10))) {
        app.setAttribute("selected", "true");
        app.content.innerHTML = `Item: ${ItemID}`;
    } else {
        app.setAttribute("selected", "false");
        app.content.innerHTML = "";
    }
}
```

### Testing
Now we need to modify the testing script. The **Display Items** test case is no longer valid. There are not items with IDs 1, 2, or 3. LEt's change this to actual IDs in the new list. Also there is a new **Search** parameter we need to test.

```js
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
```

## Save
Now let's save. Remember to test, make sure the coverage is at 100%.

## Next
[Search](/encompass/search)
