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
First modify the structure of the HTML to this.

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
Now in the CSS tab remove all references to **.selected**, this is moving to an attribute.

Then change the **.body** definition to this.

```less
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
```

Then modify the main **#app** definition. You are setting up the grid here. And while you are here add the responsive definition too.

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

Then modify the **.nav** definition.

```less
.nav {
    grid-column-start: 1;
    grid-column-end: 3;
    box-sizing: border-box;
    border-bottom: 1px #dfdfdf solid;
}
```

And finally modify the **.menu** definition.

```less
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
```

### JavaScript
First modify the **Main** function. remove the **add.menu** and **app.content.item** elements.

```js
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
```

Then simplify the **DisplayItem** function.

```js
function DisplayItem(ItemID) {
    if (ItemID && !Number.isNaN(parseInt(ItemID, 10))) {
        app.setAttribute("selected", "true");
        app.content.innerHTML = `Item: ${ItemID}`;
    } else {
        app.setAttribute("selected", "false");
        app.content.innerHTML = "";
    }
}
```

## Save
Now let's save. Remember to test, make sure the coverage is at 100%.

## Next
