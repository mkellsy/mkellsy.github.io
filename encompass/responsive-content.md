[Introduction](/encompass/introduction) - [Flexbox](/encompass/flexbox) - [Grids](/encompass/grids) - [Boilerplate](/encompass/boilerplate) - **Responsive Content** - [Conclusion](/encompass/conclusion)

# Responsive Content
We are going to edit the boilerplate code to show information from the item object.

## Code
* Modify the HTML, add containers for the info and the image.
* Make the content responsive including medium screens.
* Modify the DisplayItem function.

> Note. I am creating these code snippits to make coding in the class easier. Please understand what this code does.

### HTML
Modify the HTML. Modify the **content** element, add the **info** and **image** elements.

```html
<div class="content">
    <div class="info"></div>
    <div class="image"></div>
</div>
```

### CSS
Add the new **.info** definition to the **.content** definition.

```less
#app {
    ...

    .body {
        ...

        .content {
            ...

            .info {
                flex: 1;
                border: 1px #dfdfdf solid;
                word-break: break-all;
                border-radius: 3px;
                padding: 20px;
                margin: 0 20px 0 0;

                @media (min-width: 816px) and (max-width: 1015px) {
                    margin: 20px 0 0 0;
                    order: 2;
                }

                @media (min-width: 0px) and (max-width: 815px) {
                    margin: 20px 0 0 0;
                    padding: 0;
                    border-radius: unset;
                    border: 0 none;
                    order: 2;
                }
            }
        }
    }
}
```

> Note. There are two responsive definitions here, that do not overlap. This is because we want to do different things for narrow and medium screens. Also note that we are setting the `order` to **2**, this will force the information to display after the image on narrow and medium screens.

Now we need to define the new **.image** element.

```css
#app {
    ...

    .body {
        ...

        .content {
            ...

            .image {
                padding: 20px;
                border: 1px #dfdfdf solid;
                border-radius: 3px;

                img {
                    width: 280px;
                    max-width: 280px;
                    max-height: 800px;

                    @media (min-width: 0px) and (max-width: 1015px) {
                        order: 1;

                        img {
                            width: unset;
                            height: 400px;
                            max-width: 100%;
                            max-height: 400px;
                        }
                    }
                }
            }
        }
    }
}
```

> Note. The responsive definition covers both narrow and medium screens, we actually do the same thing for both sizes. Also the `order` is set to **1**, this makes the image display before the info.

Finally lets define what happens when the **selected** attrubute is set to **true**.

```less
#app {
    ...

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

> Note. We are adding this to the end of the **#app** definition. This tells the browser only do this if the app element has an attribute called selected and it is set to true.

### JavaScript
Let's modify the **DisplayItem** function. We need to find the item from the item array. Then we need to modify what it displays.

```js
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
        app.setAttribute("selected", "true");

        app.content.info.innerHTML = `
           Item: <b>${item.ItemID}</b><br>
           Name: <b>${item.Name}</b><br>
           URL: <b>${item.ImageURL}</b><br>
       `;

        app.content.image.innerHTML = `<img src="${item.ImageURL}"" />`;
    } else {
        app.setAttribute("selected", "false");
        app.content.info.innerHTML = "";
        app.content.image.innerHTML = "";
    }
}
```

> Note. We also cleaned up the data type for ItemID. We also simply check for the existance of an item now.

## Save
Now let's save. Remember to test, make sure the coverage is at 100%.

## Next
[Conclusion](/encompass/conclusion)
