[Flexbox](/encompass/flexbox) - [Navigation](/encompass/setup-navigation) - [Items](/encompass/interactive-elements) - **Flow** - [Grids](/encompass/grid-layout) - [Dynamic Items](/encompass/dynamic-items) - [Search](/encompass/search) - [Responsive Content](/encompass/responsive-content) - [Complete Code](/encompass/complete-code)

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
First modify the **content** element. Seperate the content so we can add a back item.

```html
<div class="content">
    <div class="item" action="View" itemid="Null">< Back</div>
    <div class="item-display"></div>
</div>
```

### CSS
Now modify the **.content** definition in the **.body** definition.

```css
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
```

Then modify the **.nav** definition.

```css
.nav {
    height: 50px;
    border-bottom: 1px #dfdfdf solid;
}
```

Then modify the **.menu** definition in the **.body** definition.

```css
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
```

### JavaScript
First combine the **default** and **View** in the **Action** function.

```js
function Action(action, state) {
    switch (action) {
        default:
            SaveState(state);
            DisplayItem(state.ItemID);
            break;
    }
}
```

Now modify the **Main** function, add the **add.content.item** element.

```js
function Main() {
    app = dashboardItem.querySelector("#app");

    if (!app) return false;

    app.testing = app.getAttribute("test") === "true";
    app.content = app.querySelector(".content");
    app.content.item = app.content.querySelector(".item-display");
    app.menu = app.querySelector(".menu");
    app.state = GetState();

    window.addEventListener("popstate", RestoreState);
    app.addEventListener("click", Navigate);

    Navigate(app.state);

    return true;
}
```

Then modify the **DisplayItem** function. Fix the content HTML.
```js
function DisplayItem(ItemID) {
    if (ItemID && !Number.isNaN(parseInt(ItemID, 10))) {
        app.menu.className = "menu selected";
        app.content.className = "content selected";
        app.content.item.innerHTML = `Item: ${ItemID}`;
    } else {
        app.menu.className = "menu";
        app.content.className = "content";
        app.content.item.innerHTML = "";
    }
}
```

### Testing
Finally add the **Display Item** test case.

```js
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
```

## Save
Now let's save. Remember to test, make sure the coverage is at 100%.

## Next
[Grid Layout](/encompass/grid-layout)
