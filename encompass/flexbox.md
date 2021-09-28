# Layout Using Flexbox

## Create Dashboard
1. First create a new dashboard. Set the name to **Mobile-First** and the category to **Training**.
2. Then select the **Blank** layout.
3. Add a **Code Block** item.

## Code
After creating your Code Block dashboard add this code.

> Note. I am creating these code snippits to make coding in the class easier. Please understand what this code does.

### HTML
```html
<div id="app">
    <div class="nav"></div>
    <div class="body">
        <div class="menu"></div>
        <div class="content"></div>
    </div>
</div>
```

### CSS
```less
#app {
    height: 100%;
    display: flex;
    flex-direction: column;

    .nav {
        height: 50px;
        background: #369;
    }

    .body {
        flex: 1;
        display: flex;
        flex-direction: row;

        .menu {
            width: 200px;
            background: #66c;
        }

        .content {
            flex: 1;
            background: #ccf;
        }
    }
}
```

## Configure Dashboard
1. Turn off the header from the settings snack.
2. Open the settings, its the cogs icon in the settings snack.
3. Clear the all fields for margin, padding and border.
4. Clear the fields for border color and border radius.
5. Set the height field to **100%**.
6. Set the auto fill row height setting to **Yes**.

## Save
Save the dashboard as released. This ensures the code gets committed. Remember the dashboard is not published yet.

> Note. Anytime you add code to a different file tab, or edit the HTML, you should save as released. Ofcourse if the dashboard is published/released don't do this.

## Next
[Setup Navigation](/encompass/setup-navigation)
