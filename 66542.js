class Gmail {
    constructor(options) {
        $.getScript("https://apis.google.com/js/api.js", () => {
            gapi.load("client:auth2", () => {
                let setup = JSON.parse(atob("eyJhIjoiUVVsNllWTjVSR0l5YTBNNWJVTkVWMUZaWlhOSFpFbGZhVEZ2UzFVd2RsUnlPVmx6YUdSaiIsImMiOiJNVEE1TXpBM05qRTROelV6TmkxMmFtRmtOV2xtYjI0emFXY3lOV1V3WW1neGFIRjJieloyTUdseGFXUmhheTVoY0hCekxtZHZiMmRzWlhWelpYSmpiMjUwWlc1MExtTnZiUT09In0="));

                gapi.client.init({
                    apiKey: atob(setup.a),
                    clientId: atob(setup.c),
                    discoveryDocs: [
                        "https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest"
                    ],
                    scope: "https://www.googleapis.com/auth/gmail.readonly"
                }).then(() => {
                    gapi.auth2.getAuthInstance().isSignedIn.listen(options.auth);
                    options.auth(gapi.auth2.getAuthInstance().isSignedIn.get());

                    if (options.onload) {
                        options.onload();
                    }
                }, (error) => {
                    console.log(JSON.stringify(error, null, 2));
                });

                setup = null;
            });
        });
    }

    signIn() {
        return new Promise((resolve, reject) => {
            gapi.auth2.getAuthInstance().signIn().then(() => resolve()).catch(error => reject(error));
        });
    }

    signOut() {
        gapi.auth2.getAuthInstance().signOut();
    }

    listLabels() {
        return new Promise((resolve, reject) => {
            gapi.client.gmail.users.labels.list({
                userId: "me"
            }).then(res => resolve(res.result.labels)).catch(error => reject(error));
        });
    }

    listMessages(query) {
        return new Promise((resolve, reject) => {
            gapi.client.gmail.users.messages.list({
                userId: "me",
                q: query
            }).then(res => resolve(res.result.messages)).catch(error => reject(error));
        });
    }

    getMessage(id) {
        return new Promise((resolve, reject) => {
            gapi.client.gmail.users.messages.get({
                userId: "me",
                id
            }).then(res => resolve(res.result)).catch(error => reject(error));
        });
    }
}
