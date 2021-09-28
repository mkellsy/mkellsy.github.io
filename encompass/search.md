# Search
Notice we have a blank nav bar on the top of this interface. This is the perfect place for a search bar.

## Code
* First we are going to make the search bar elements in the HTML.
* Then we need to make it look good in the CSS.
* And finally we will need to add an action and a function in the JS.
* Of course we will need to make a test case too.

> Note. I am creating these code snippits to make coding in the class easier. Please understand what this code does.

### HTML
Modify the HTML. Replace the **nav** element with this new **search** element.

```html
<form class="search">
    <input type="text" placeholder="Search" value="" />
    <div class="button" action="Search">Search</div>
</form>
```

### CSS
Now we need to make some changes to the CSS. Now that we have a grid layout this is pretty easy, just focus on the style. Replace the **.nav** definition with this new **.search** definition.

```less
.search {
    display: flex;
    align-items: center;
    grid-column-start: 1;
    grid-column-end: 3;
    box-sizing: border-box;
    border-bottom: 1px #dfdfdf solid;
    padding: 0 7px;
}
```

Now lets add the sub-definitions. Start by definining the **input** element.

```less
.search {
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
}
```

> Note. WE are not using a class name here, since the **search** element only has one input field.

Finally we need to define the **.button** element.

> There are buttons in the UI Kit, however we want to crash the button into the search field. This helps the UX design, it's subtle, but it's enough to add an association between the button and the field.

```less
.search {
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
```

### JavaScript
Add the **ProcessSearch** function. This is responsiable for taking the input field and adding it to the `state` object.

```js
function ProcessSearch(event) {
    if (event) event.preventDefault();

    app.state.Action = "View";
    app.state.Search = app.search.input.value;
    app.state.ItemID = "Null";

    Navigate(app.state);

    return false;
}
```

> Note. The search bar is a form, and we want to call this function when that form submits. However we don't want the form to actually submit.

Then modify the **Action** function. You need to add the **Search** action for the button.

```js
function Action(action, state) {
    switch (action) {
        case "Search":
            ProcessSearch();
            break;

        default:
            SaveState(state);
            DisplayItem(state.ItemID);
            break;
    }
}
```

### Testing
First, we added a new function. So now we need to add the **Process Search** test case.

```js
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
```

> Note. We are calling the TriggerEvent function from the SDK. You want to call this so the event is called. If you were to just call the submit() function on the HTMLElement, it would break the test case, because submit() ignores listeners.

Now since you added a new action, you need to test it. Modify the **Navigate** test case.

```js
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
```

> Note. We just coppied the `View` object in the `actions` variable and changed the `Action` to **Search**.
> 
## Save
Now let's save. Remember to test, make sure the coverage is at 100%.

## Next
