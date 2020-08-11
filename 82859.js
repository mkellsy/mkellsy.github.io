class Slack {
    constructor (url) {
        this.url = url;
    }

    sendMessage(text) {
        return new Promise((resolve, reject) => {
            if (text && text !== "") {
                $.ajax({
                    data: "payload=" + JSON.stringify({
                        text
                    }),
                    dataType: "json",
                    processData: false,
                    type: "POST",
                    url: this.url
                }).always(() => {
                    resolve();
                });
            } else {
                reject(new Error("Text is required."));
            }
        })
    }
}
