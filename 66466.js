onmessage = function(event) {
    for (let i = 0; i < event.data.items.length; i++) {
        const item = event.data.items[i];

        let picture = null;
        let openLink = null;
        let appendBody = null;
        let actionDisplay = null;
        let itemViewed = null;
        let contactDisplay = null;
        let subject = null

        switch (item.Type) {
            case "Task":
                actionDisplay = item.Subject;
                picture = item.User && item.User.Picture && item.User.Picture !== "" ? item.User.Picture : "https://images.encompass8.com/GlobalDocs/127092.png";
                openLink = `<span class="lm-action-link" action="task" value="${item.Attributes.TaskID}">Open Task</span>`;
                break;

            case "Task Detail":
                subject = item.Subject;
                picture = item.User && item.User.Picture && item.User.Picture !== "" ? item.User.Picture : "https://images.encompass8.com/GlobalDocs/127092.png";
                break;

            case "Task Update":
                subject = item.Subject;
                picture = item.User && item.User.Picture && item.User.Picture !== "" ? item.User.Picture : "https://images.encompass8.com/GlobalDocs/127092.png";
                actionDisplay = `<span class="lm-who">${item.User ? item.User.FriendlyName || "" : ""}</span> added a task detail`;
                openLink = `<span class="lm-action-link" action="task" value="${item.Attributes.TaskID}">Open Task</span>`;
                break;

            case "Note":
                subject = item.Subject;
                picture = item.User && item.User.Picture && item.User.Picture !== "" ? item.User.Picture : "https://images.encompass8.com/GlobalDocs/127092.png";
                actionDisplay = `<span class="lm-who">${item.User ? item.User.FriendlyName || "" : ""}</span> added a note`;
                openLink = `<a class="lm-external-link" href="TableView.aspx?TableName=CustomerNotes&Parameters=F:CustomerNoteID~V:${item.Attributes.CustomerNoteID}~O:E" target="_blank">Open Note <i class="ews-icon-externallink"></i></a>`;
                break;

            case "Received Email":
                subject = item.Subject;

                switch (event.data.section) {
                    case "customer":
                        picture = item.User && item.User.Picture && item.User.Picture !== "" ? item.User.Picture : "https://images.encompass8.com/GlobalDocs/127092.png";
                        actionDisplay = `<span class="lm-who">${item.User ? item.User.FriendlyName || "" : ""}</span> sent an email ${item.Customer && item.Customer.Contact && item.Customer.Contact !== "" ? `to <span class="lm-who">${item.Customer.Contact}</span>` : ""}`;
                        break;

                    default:
                        picture = item.Customer && item.Customer.Picture && item.Customer.Picture !== "" ? item.Customer.Picture : "https://images.encompass8.com/GlobalDocs/127092.png";
                        actionDisplay = `<span class="lm-who">${item.User ? item.User.FriendlyName || "" : ""}</span> received an email ${item.Customer && item.Customer.Contact && item.Customer.Contact !== "" ? `from <span class="lm-who">${item.Customer.Contact}</span>` : ""}`;
                        break;
                }

                if (item.Attributes.Status === "Opened") {
                    itemViewed = `<div class="lm-item-viewed"><i class="ews-icon-chatting lm-viewed-icon"></i> Opened ${getAgeDisplay(item.Attributes.TimeUpdated)}</div>`;
                }

                break;

            case "Sent Email":
                subject = item.Subject;
                picture = item.User && item.User.Picture && item.User.Picture !== "" ? item.User.Picture : "https://images.encompass8.com/GlobalDocs/127092.png";
                actionDisplay = `<span class="lm-who">${item.User ? item.User.FriendlyName || "" : ""}</span> sent an email ${item.Customer && item.Customer.Contact && item.Customer.Contact !== "" ? `to <span class="lm-who">${item.Customer.Contact}</span>` : ""}`;

                if (item.Attributes.Status === "Opened") {
                    itemViewed = `<div class="lm-item-viewed"><i class="ews-icon-chatting lm-viewed-icon"></i> Opened ${getAgeDisplay(item.Attributes.TimeUpdated)}</div>`;
                }
                
                break;

            case "Event":
                subject = item.Subject;
                picture = item.User && item.User.Picture && item.User.Picture !== "" ? item.User.Picture : "https://images.encompass8.com/GlobalDocs/127092.png";
                actionDisplay = `<span class="lm-who">${item.User ? item.User.FriendlyName || "" : ""}</span> created an event`;
                appendBody = item.Attributes.Attendees && item.Attributes.Attendees.length > 0 ? `<br><br><b>Attendees</b><br>${item.Attributes.Attendees.join("<br>")}` : "";
                openLink = `<a class="lm-external-link" href="TableView.aspx?TableName=Events&SubTableJoinID=Tasks_Events&SubTableJoinID=TasksHist_Events&SubTableJoinID=EventsUsers_Events&Parameters=F:EventID~V:${item.Attributes.EventID}~O:E" target="_blank">Open Event <i class="ews-icon-externallink"></i></a>`;
                break;

            case "Reminder":
                subject = item.Subject;
                picture = item.User && item.User.Picture && item.User.Picture !== "" ? item.User.Picture : "https://images.encompass8.com/GlobalDocs/127092.png";

                const rwho = item.User ? item.User.FriendlyName || "" : "";

                if (rwho === "You") {
                    actionDisplay = `<span class="lm-who">${rwho}</span> have a followup reminder`;
                } else if (rwho === "") {
                    actionDisplay = `Followup reminder`;
                } else {
                    actionDisplay = `<span class="lm-who">${rwho}</span> has a followup reminder`;
                }

                break;

            case "Website Hit":
                subject = item.Subject;
                picture = item.User && item.User.Picture && item.User.Picture !== "" ? item.User.Picture : "https://images.encompass8.com/GlobalDocs/127092.png";
                actionDisplay = `<span class="lm-who">${item.User ? item.User.FriendlyName || "" : ""}</span> visited the website`;
                break;
        }

        switch (event.data.section) {
            case "user":
                contactDisplay = `
                    <div class="lm-item-customer">${item.Customer ? item.Customer.Company || "" : ""}</div>
                    <div class="lm-item-contact">${item.Customer ? [getPhoneNumber(item.Customer.Phone, item.Customer.Mobile), item.Customer.Email].filter(x => x).join(" - ") : ""}</div>
                `;

                break;
        }

        postMessage({
            uniqueRunKey: event.data.uniqueRunKey,
            action: "continue",
            item: `
                <div class="lm-feed-item lm-${item.Type.toLowerCase().replace(/ /g, "-")}" style="order: ${new Date() - item.Date};">
                    <div class="lm-feed-item-body">
                        <div class="lm-avatar">
                            <div class="lm-avatar-img" style="${picture ? `background-image: url('${picture}');` : ""}"></div>
                        </div>
                        <div class="lm-info">
                            <div class="lm-item-action">
                                <span class="lm-action-description">${actionDisplay || ""}</span><span class="lm-date-display">${getAgeDisplay(item.Date)}</span>
                            </div>
                            ${itemViewed || ""}
                            ${contactDisplay || ""}
                            <div class="lm-item-subject">${subject || ""}</div>
                            <div class="lm-item-body">
                                <p>
                                    ${item.Body || ""}
                                    ${appendBody || ""}
                                </p>
                                <div class="lm-body-more"></div>
                            </div>
                            <div class="lm-body-actions">
                                <span class="lm-more-link">More</span>${openLink ? `<span class="lm-link-spacer">&nbsp;&nbsp;|&nbsp;&nbsp;</span>${openLink}` : ""}
                            </div>
                        </div>
                    </div>
                </div>
            `
        });

        delete event.data.items[i];
    }

    postMessage({
        uniqueRunKey: event.data.uniqueRunKey,
        action: "finished"
    });

    delete delete event.data.items;s
}

const getPhoneNumber = function getPhoneNumber(phone, mobile) {
    if (phone && phone !== "" && phone.length >= 7) {
        return phone;
    }

    if (mobile && mobile !== "" && mobile.length >= 7) {
        return mobile;
    }

    return null;
}

const getMonthName = function getMonthName(month) {
    switch (month % 12) {
        case 1:
            return "Feb";

        case 2:
            return "Mar";

        case 3:
            return "Apr";

        case 4:
            return "May";

        case 5:
            return "Jun";

        case 6:
            return "Jul";

        case 7:
            return "Aug";

        case 8:
            return "Sep";

        case 9:
            return "Oct";

        case 10:
            return "Nov";

        case 11:
            return "Dec";

        default:
            return "Jan";
    }
}

const displayDate = function displayDate(date) {
    const now = new Date();

    if (now.getFullYear() === date.getFullYear()) {
        return `${getMonthName(date.getMonth())} ${date.getDate()}`;
    }

    return `${getMonthName(date.getMonth())} ${date.getDate()} ${date.getFullYear()}`;
}

const getAgeDisplay = function getAgeDisplay(date) {
    if (date && date instanceof Date) {
        const age = new Date() - date;
        const future = age < 0;

        if (Math.abs(age) < 60000) {
            return "Now";
        }

        if (Math.abs(age) < 3600000 && Math.abs(age) >= 120000) {
            return `${future ? "In " : ""}${Math.floor(Math.abs(age) / 60000)} minutes${future ? "" : " ago"}`;
        }

        if (Math.abs(age) < 3600000) {
            return `${future ? "In " : ""}${Math.floor(Math.abs(age) / 60000)} minute${future ? "" : " ago"}`;
        }

        if (Math.abs(age) < 86400000 && Math.abs(age) >= 7200000) {
            return `${future ? "In " : ""}${Math.floor(Math.abs(age) / 3600000)} hours${future ? "" : " ago"}`;
        }

        if (Math.abs(age) < 86400000) {
            return `${future ? "In " : ""}${Math.floor(Math.abs(age) / 3600000)} hour${future ? "" : " ago"}`;
        }

        if (age > 0 && age < 604800000 && age >= 172800000) {
            return `${Math.floor(Math.abs(age) / 86400000)} days ago`;
        }

        if (age > 0 && age < 604800000) {
            return `${Math.floor(Math.abs(age) / 86400000)} day ago`;
        }

        return `${displayDate(date)}, ${date.getHours() % 12 ? date.getHours() % 12 : 12}:${date.getMinutes() < 10 ? `0${date.getMinutes()}` : date.getMinutes()} ${date.getHours() >= 12 ? "PM" : "AM"}`;
    }

    return "";
}
