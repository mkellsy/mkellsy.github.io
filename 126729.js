class HtmlEdit {
    constructor(app, name, formatting, callback) {
        this.loaded = false;

        this.app = $(app);
        this.name = name;
        this.editor = null;
        this.element = null;

        Server.loadStylesheet([
            326054,
        ]);

        Server.loadScript([
            326052
        ], () => {
            this.element = $(`<textarea id="${this.name}-input"></textarea>`);
            this.app.find(`#${this.name}`).html("").append(this.element);

            this.editor = this.element.redactor({
                focus: false,
                formatting
            });

            this.loaded = true;

            if (callback) {
                callback();
            }
        });
    }

    focus() {
        if (this.loaded) {
            this.editor.parent().find(".redactor-layer").focus();
        }
    }

    val(value) {
        if (this.loaded) {
            if (value) {
                this.editor.redactor("code.set", value || "");
            } else {
                return this.element.val();
            }
        }
    }
}
