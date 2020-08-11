const Alert = function Alert(message, callback) {
    const dialog = UI.showDialog("alert");

    dialog.find("#message").html(message);

    dialog.find("#ok-button").unbind("click").on("click", () => {
        dialog.hide();

        if (callback) {
            callback();
        }
    });
};

class UI {
    static showDialog (name) {
        const dialog = $(DASHBOARD || window).find(`.svs-dialog[dialog='${name}']`).css({
            display: "flex"
        });

        return dialog;
    }

    static resizeTextarea(target) {
        const $target = $(target);

        while ($target.outerHeight() < $target[0].scrollHeight + parseFloat($target.css("borderTopWidth")) + parseFloat($target.css("borderBottomWidth"))) {
            $target.height($target.height() + 1);
        }
    }

    static setupAutocomplete(element, name, placeholder, required, table, field, fieldType, display, displayType, filter, onChange) {
        return new Promise((resolve) => {
            const $autocomplete = {};

            const options = {
                InputName: name,
                RefTable: table,
                RefField: field,
                DataType: fieldType,
                RefFieldDisplay: display || field,
                RefFieldDisplayDataType: displayType || fieldType,
                Width: 300,
                Required: required,
                LimitToRefList: required,
                IsSearch: !required,
                Translate: false,
                TabIndex: 1,
                ListLength: 40,
                AllowAddRelated: false
            };

            if (filter && filter !== "") {
                options.RefFieldFilter = filter;
            }

            ECP.HTML.AutoComplete(options).then((html) => {
                $autocomplete.element = $(html);

                $(element).html("").replaceWith($autocomplete.element);

                $autocomplete.element.find(".AutocompleteField").removeAttr("style");
                $autocomplete.input = $autocomplete.element.find(`#${name}Input`);

                if (placeholder && placeholder !== "") {
                    $autocomplete.input.attr("placeholder", placeholder);
                }

                if (onChange) {
                    $autocomplete.field = new ECP.HTML.AjaxInput($autocomplete.input[0], null, null, (d, v) => {
                        onChange(d, v);
                    });
                } else {
                    $autocomplete.field = new ECP.HTML.AjaxInput($autocomplete.input[0]);
                }
            }).finally(() => {
                resolve($autocomplete);
            });
        });
    }

    static setupEmailField(element, name, label, customers) {
        return new Promise((resolve) => {
            const $email = {
                element: $(element).html("")
            };

            $email.element.attr("value", "");

            $email.val = (value) => {
                if (value) {
                    const current = $email.element.attr("value").split("^").filter(x => x !== null && x !== "");

                    if (current.indexOf(value) === -1) {
                        current.push(value);
                        $email.element.attr("value", current.join("^"));
                    }

                    return $email.element;
                }

                return $email.element.attr("value").split("^").filter(x => x !== null && x !== "");
            };

            $email.contains = (value) => {
                if ($email.element.attr("value").split("^").filter(x => x !== null && x !== "").indexOf(value) >= 0) {
                    return true;
                }

                return false;
            };

            $email.remove = (value) => {
                const current = $email.element.attr("value").split("^").filter(x => x !== null && x !== "");

                if (current.indexOf(value) >= 0) {
                    current.splice(current.indexOf(value), 1);
                }

                $email.element.attr("value", current.join("^"));
            };

            $email.focus = () => {
                $email.element.find(`#${name}Input`).focus();
            };

            ECP.HTML.AutoComplete({
                InputName: name,
                RefTable: "Users",
                RefField: "UserID",
                DataType: ECP.DataType._Integer,
                RefFieldDisplay: "Name",
                RefFieldDisplayDataType: ECP.DataType._Text,
                RefFieldFilter: `"Users"."Email" IS NOT NULL AND ("Users"."UserTypeID" IN (1, 2) OR (SELECT COUNT(DISTINCT "CustomersUsers"."ID") FROM "CustomersUsers" WHERE "CustomersUsers"."UserID" = "Users"."UserID" AND "CustomersUsers"."CustomerID" IN (${customers.join(", ")})) > 0)`,
                Width: 300,
                Required: false,
                LimitToRefList: true,
                IsSearch: false,
                Translate: false,
                TabIndex: 1,
                ListLength: 40,
                AllowAddRelated: false
            }).then((html) => {
                $email.section = $(html);
                $email.label = $(`<span class="svs-field-label">${label}:</span>`);

                $email.element.append($email.label);
                $email.element.append($email.section);

                $email.section.find(".AutocompleteField").removeAttr("style");
                $email.input = $email.section.find(`#${name}Input`);

                $email.field = new ECP.HTML.AjaxInput($email.input[0], null, null, (d, v) => {
                    if (v.value !== "") {
                        if (!$email.contains(v.value)) {
                            $email.element.find("section").before(`<div class="svs-tag" value="${v.value}">${Data.cleanNames(d.value)} <i class="ews-icon-cancel svs-tag-clear"></i></div>`);
                            $email.val(v.value);
                        }

                        d.value = "";
                        v.value = "";
                    }
                });
            }).finally(() => {
                $email.element.on("click", ".svs-tag-clear", (event) => {
                    const $target = $(event.currentTarget).parent();

                    $email.remove($target.attr("value"));
                    $target.remove();
                });

                $(`#${name}_Results`).on("mouseup", ".AutocompleteItem", () => {
                    setTimeout(() => {
                        $email.input.blur();

                        setTimeout(() => {
                            $email.input.focus();
                        }, 10);
                    }, 10);
                });

                resolve($email);
            });
        });
    }
}
