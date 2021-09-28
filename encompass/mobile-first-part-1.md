## Layout Using Flexbox

After creating your Code Block dashboard add this code.

> Note. I am creating these code snippits to make coding in the class easier. Please understand what this code does.

**HTML**
```html
<div id="app">
    <div class="nav"></div>
    <div class="body">
        <div class="menu"></div>
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

## Next
[Setup Navigation](/encompass/mobile-first-part-1)
