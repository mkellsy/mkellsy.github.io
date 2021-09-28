# Interactive Elements

Now we have a layout, lets give the layout something to do. Let's make some actionalble items.

## Code
* Here we are going to modify the HTML and add some action items.
* Then we are going to add an `ItemID` parameter, and a `View` action.
* Also we are going to hide the right panel if nothing is selected. To do this we will need to map the content and menu boxes.

> Note. I am creating these code snippits to make coding in the class easier. Please understand what this code does.

### HTML
Modify the menu element in the HTML tab.

```html
<div class="menu">
    <div class="item" action="View" itemid="1">Item 1</div>
    <div class="item" action="View" itemid="2">Item 2</div>
    <div class="item" action="View" itemid="3">Item 3</div>
</div>
```

### CSS
Modify the **.menu** definition in the **.body** definition.

```less
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
```

Modify the **.content** definition in the **.body** definition.

```less
.content {
    flex: 1;
    display: none;
    background: #ccf;

    &.selected {
        display: block;
    }
}
```

### JavaScript
First add the **ItemID** parameter to the **StateFields**.

```js
const StateFields = {
    Action: "String",
    ItemID: "Integer"
};
```

Modify the **Main** function. Add the **app.content** and **app.menu** elements.

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

Add the **DisplayItem** function.

```js
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
```

Then finally modify the **Action** function and add the **View** action.

```js
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
```

## Save
Now let's save. You don't need to save as released here. In fact you can save yourself some time by not saving here. However you should run the test scripts before saving as a draft.

## Next
[Improving Flow](/encompass/improving-flow)
