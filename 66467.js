onmessage = function(event) {
    for (let i = 0; i < event.data.usernames.length; i++) {
        const { ...user } = event.data.users[event.data.usernames[i]];

        switch (event.data.section) {
            case "user":
                postMessage({
                    uniqueRunKey: event.data.uniqueRunKey,
                    action: "continue",
                    item: `
                        <div class="lm-action" action="user" value="${user.UserID}">
                            <div class="lm-title-row">
                                <div class="lm-avatar-img" style="background-image: url('${user.Picture ? user.Picture : "https://images.encompass8.com/GlobalDocs/127092.png"}');"></div>
                                <div class="lm-title">
                                    <h4>${user.Name}</h4>
                                    <span class="lm-user-type lm-${user.UserType.toLowerCase().replace(/ /gi, "")}-user">${user.UserType} User</span>
                                </div>
                            </div>
                            <div class="lm-detail-row">${user.UserType === "Employee" && user.Department && user.Department !== "" ? `<span class="lm-inline-title">Team</span> ${user.Department}` : ""}</div>
                            <div class="lm-detail-row">${user.Email && user.Email !== "" ? `<span class="lm-inline-title">Email</span> ${user.Email}` : ""}</div>
                            <div class="lm-detail-row">${user.Phone && user.Phone !== "" ? `<span class="lm-inline-title">Phone</span> ${user.Phone}` : ""}</div>
                            <div class="lm-detail-row">${user.Mobile && user.Mobile !== "" ? `<span class="lm-inline-title">Mobile</span> ${user.Mobile}` : ""}</div>
                        </div>
                    `
                });

                break;

            case "customer":
                postMessage({
                    uniqueRunKey: event.data.uniqueRunKey,
                    action: "continue",
                    item: `
                        <div class="lm-action" action="user" value="${user.UserID}">
                            <div class="lm-title-row lm-title-row-small">
                                <div class="lm-avatar-img" style="background-image: url('${user.Picture ? user.Picture : "https://images.encompass8.com/GlobalDocs/127092.png"}');"></div>
                                <div class="lm-title">
                                    <h4>${user.Name}</h4>
                                </div>
                            </div>
                            ${user.Email && user.Email !== "" ? `<div class="lm-detail-row"><span class="lm-inline-title">Email</span> ${user.Email}</div>` : ""}
                            ${user.Phone && user.Phone !== "" ? `<div class="lm-detail-row"><span class="lm-inline-title">Phone</span> ${user.Phone}</div>` : ""}
                            ${user.Mobile && user.Mobile !== "" ? `<div class="lm-detail-row"><span class="lm-inline-title">Mobile</span> ${user.Mobile}</div>` : ""}
                        </div>
                    `
                });

                break;
        }
    }

    postMessage({
        uniqueRunKey: event.data.uniqueRunKey,
        action: "finished"
    });
}
