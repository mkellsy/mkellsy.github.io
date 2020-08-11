class Data {
    static titleCase(value) {
        return value.replace(/\w\S*/g, item => item.charAt(0).toUpperCase() + item.substr(1).toLowerCase());
    }

    static cleanNames(value) {
        if (value && value !== "") {
            value = value.replace(/\*/g, "");
            value = value.replace(/ - /g, "");
            value = value.replace(/ *\([^)]*\) */g, "");

            return value;
        }

        return null;
    }

    static escapeHtml(value) {
        value = value.replace(/&/g, "&amp;");
        value = value.replace(/</g, "&lt;");
        value = value.replace(/>/g, "&gt;");
        value = value.replace(/"/g, "&quot;");
        value = value.replace(/'/g, "&#039;");

        return value;
    }

    static htmlDecode(value) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(`<!doctype html><body>${value}`, "text/html");

        let html = doc.body.innerHTML;

        html = html.replace(/&amp;/g, "&");
        html = html.replace(/&gt;/g, ">");
        html = html.replace(/&lt;/g, "<");
        html = html.replace(/&quot;/g, "\"");
        html = html.replace(/&#39;/g, "'");
        html = html.replace(/&nbsp;/g, " ");
        html = html.replace(/;/g, ",");
        html = html.replace(/{/g, "(");
        html = html.replace(/}/g, ")");

        return html;
    }

    static formatFileType(type) {
        switch (type.replace(/\./gi, "").toLowerCase()) {
            case "3gp":
            case "flv":
            case "m4v":
            case "mov":
            case "mp4":
            case "swf":
            case "wav":
            case "m4a":
            case "mkv":
            case "mp3":
            case "mpg":
            case "wmv":
            case "avi":
                return {
                    Name: "Media File",
                    Icon: `
                        <svg aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
                            <path fill="#7d09b7" d="M384 121.941V128H256V0h6.059c6.365 0 12.47 2.529 16.971 7.029l97.941 97.941A24.005 24.005 0 0 1 384 121.941zM224 136V0H24C10.745 0 0 10.745 0 24v464c0 13.255 10.745 24 24 24h336c13.255 0 24-10.745 24-24V160H248c-13.2 0-24-10.8-24-24zm96 144.016v111.963c0 21.445-25.943 31.998-40.971 16.971L224 353.941V392c0 13.255-10.745 24-24 24H88c-13.255 0-24-10.745-24-24V280c0-13.255 10.745-24 24-24h112c13.255 0 24 10.745 24 24v38.059l55.029-55.013c15.011-15.01 40.971-4.491 40.971 16.97z"></path>
                        </svg>
                    `,
                    Color: "#7d09b7"
                };

            case "7z":
            case "rar":
            case "zip":
            case "gz":
            case "tar":
            case "tbz":
            case "tbz2":
            case "tgz":
                return {
                    Name: "Compressed File",
                    Icon: `
                        <svg aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
                            <path fill="#15aabf" d="M377 105L279.1 7c-4.5-4.5-10.6-7-17-7H256v128h128v-6.1c0-6.3-2.5-12.4-7-16.9zM128.4 336c-17.9 0-32.4 12.1-32.4 27 0 15 14.6 27 32.5 27s32.4-12.1 32.4-27-14.6-27-32.5-27zM224 136V0h-63.6v32h-32V0H24C10.7 0 0 10.7 0 24v464c0 13.3 10.7 24 24 24h336c13.3 0 24-10.7 24-24V160H248c-13.2 0-24-10.8-24-24zM95.9 32h32v32h-32zm32.3 384c-33.2 0-58-30.4-51.4-62.9L96.4 256v-32h32v-32h-32v-32h32v-32h-32V96h32V64h32v32h-32v32h32v32h-32v32h32v32h-32v32h22.1c5.7 0 10.7 4.1 11.8 9.7l17.3 87.7c6.4 32.4-18.4 62.6-51.4 62.6z"></path>
                        </svg>
                    `,
                    Color: "#15aabf"
                };

            case "accdb":
            case "db":
            case "dbf":
            case "mssql":
            case "sqlite":
            case "sqlite3":
                return {
                    Name: "Database File",
                    Icon: `
                        <svg aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
                            <path fill="#7a7a7a" d="M224 136V0H24C10.7 0 0 10.7 0 24v464c0 13.3 10.7 24 24 24h336c13.3 0 24-10.7 24-24V160H248c-13.2 0-24-10.8-24-24zm160-14.1v6.1H256V0h6.1c6.4 0 12.5 2.5 17 7l97.9 98c4.5 4.5 7 10.6 7 16.9z"></path>
                        </svg>
                    `,
                    Color: "#7a7a7a"
                };

            case "ashx":
            case "aspx":
            case "cs":
            case "css":
            case "dplx":
            case "java":
            case "js":
            case "patch":
            case "sql":
            case "swift":
            case "ts":
            case "vb":
            case "c":
            case "conf":
            case "config":
            case "py":
                return {
                    Name: "Code File",
                    Icon: `
                        <svg aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
                            <path fill="#15aabf" d="M384 121.941V128H256V0h6.059c6.365 0 12.47 2.529 16.971 7.029l97.941 97.941A24.005 24.005 0 0 1 384 121.941zM248 160c-13.2 0-24-10.8-24-24V0H24C10.745 0 0 10.745 0 24v464c0 13.255 10.745 24 24 24h336c13.255 0 24-10.745 24-24V160H248zM123.206 400.505a5.4 5.4 0 0 1-7.633.246l-64.866-60.812a5.4 5.4 0 0 1 0-7.879l64.866-60.812a5.4 5.4 0 0 1 7.633.246l19.579 20.885a5.4 5.4 0 0 1-.372 7.747L101.65 336l40.763 35.874a5.4 5.4 0 0 1 .372 7.747l-19.579 20.884zm51.295 50.479l-27.453-7.97a5.402 5.402 0 0 1-3.681-6.692l61.44-211.626a5.402 5.402 0 0 1 6.692-3.681l27.452 7.97a5.4 5.4 0 0 1 3.68 6.692l-61.44 211.626a5.397 5.397 0 0 1-6.69 3.681zm160.792-111.045l-64.866 60.812a5.4 5.4 0 0 1-7.633-.246l-19.58-20.885a5.4 5.4 0 0 1 .372-7.747L284.35 336l-40.763-35.874a5.4 5.4 0 0 1-.372-7.747l19.58-20.885a5.4 5.4 0 0 1 7.633-.246l64.866 60.812a5.4 5.4 0 0 1-.001 7.879z"></path>
                        </svg>
                    `,
                    Color: "#15aabf"
                };

            case "bmp":
            case "gif":
            case "heic":
            case "jpeg":
            case "jpg":
            case "png":
            case "svg":
            case "tif":
            case "tiff":
            case "ico":
            case "psd":
                return {
                    Name: "Image File",
                    Icon: `
                        <svg aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
                            <path fill="#4c0377" d="M384 121.941V128H256V0h6.059a24 24 0 0 1 16.97 7.029l97.941 97.941a24.002 24.002 0 0 1 7.03 16.971zM248 160c-13.2 0-24-10.8-24-24V0H24C10.745 0 0 10.745 0 24v464c0 13.255 10.745 24 24 24h336c13.255 0 24-10.745 24-24V160H248zm-135.455 16c26.51 0 48 21.49 48 48s-21.49 48-48 48-48-21.49-48-48 21.491-48 48-48zm208 240h-256l.485-48.485L104.545 328c4.686-4.686 11.799-4.201 16.485.485L160.545 368 264.06 264.485c4.686-4.686 12.284-4.686 16.971 0L320.545 304v112z"></path>
                        </svg>
                    `,
                    Color: "#4c0377"
                };

            case "cdr":
            case "eps":
            case "ai":
                return {
                    Name: "Vector Image File",
                    Icon: `
                        <svg aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
                            <path fill="#4c0377" d="M384 121.941V128H256V0h6.059a24 24 0 0 1 16.97 7.029l97.941 97.941a24.002 24.002 0 0 1 7.03 16.971zM248 160c-13.2 0-24-10.8-24-24V0H24C10.745 0 0 10.745 0 24v464c0 13.255 10.745 24 24 24h336c13.255 0 24-10.745 24-24V160H248zm-135.455 16c26.51 0 48 21.49 48 48s-21.49 48-48 48-48-21.49-48-48 21.491-48 48-48zm208 240h-256l.485-48.485L104.545 328c4.686-4.686 11.799-4.201 16.485.485L160.545 368 264.06 264.485c4.686-4.686 12.284-4.686 16.971 0L320.545 304v112z"></path>
                        </svg>
                    `,
                    Color: "#4c0377"
                };

            case "csv":
                return {
                    Name: "CSV File",
                    Icon: `
                        <svg aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
                            <path fill="#82c91e" d="M224 136V0H24C10.7 0 0 10.7 0 24v464c0 13.3 10.7 24 24 24h336c13.3 0 24-10.7 24-24V160H248c-13.2 0-24-10.8-24-24zm-96 144c0 4.42-3.58 8-8 8h-8c-8.84 0-16 7.16-16 16v32c0 8.84 7.16 16 16 16h8c4.42 0 8 3.58 8 8v16c0 4.42-3.58 8-8 8h-8c-26.51 0-48-21.49-48-48v-32c0-26.51 21.49-48 48-48h8c4.42 0 8 3.58 8 8v16zm44.27 104H160c-4.42 0-8-3.58-8-8v-16c0-4.42 3.58-8 8-8h12.27c5.95 0 10.41-3.5 10.41-6.62 0-1.3-.75-2.66-2.12-3.84l-21.89-18.77c-8.47-7.22-13.33-17.48-13.33-28.14 0-21.3 19.02-38.62 42.41-38.62H200c4.42 0 8 3.58 8 8v16c0 4.42-3.58 8-8 8h-12.27c-5.95 0-10.41 3.5-10.41 6.62 0 1.3.75 2.66 2.12 3.84l21.89 18.77c8.47 7.22 13.33 17.48 13.33 28.14.01 21.29-19 38.62-42.39 38.62zM256 264v20.8c0 20.27 5.7 40.17 16 56.88 10.3-16.7 16-36.61 16-56.88V264c0-4.42 3.58-8 8-8h16c4.42 0 8 3.58 8 8v20.8c0 35.48-12.88 68.89-36.28 94.09-3.02 3.25-7.27 5.11-11.72 5.11s-8.7-1.86-11.72-5.11c-23.4-25.2-36.28-58.61-36.28-94.09V264c0-4.42 3.58-8 8-8h16c4.42 0 8 3.58 8 8zm121-159L279.1 7c-4.5-4.5-10.6-7-17-7H256v128h128v-6.1c0-6.3-2.5-12.4-7-16.9z"></path>
                        </svg>
                    `,
                    Color: "#82c91e"
                };

            case "dll":
            case "h":
            case "jar":
            case "bin":
                return {
                    Name: "Library File",
                    Icon: `
                        <svg aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
                            <path fill="#7a7a7a" d="M224 136V0H24C10.7 0 0 10.7 0 24v464c0 13.3 10.7 24 24 24h336c13.3 0 24-10.7 24-24V160H248c-13.2 0-24-10.8-24-24zm160-14.1v6.1H256V0h6.1c6.4 0 12.5 2.5 17 7l97.9 98c4.5 4.5 7 10.6 7 16.9z"></path>
                        </svg>
                    `,
                    Color: "#7a7a7a"
                };

            case "doc":
            case "docm":
            case "docx":
            case "pages":
            case "gdoc":
                return {
                    Name: "Word File",
                    Icon: `<svg aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
                            <path fill="#4c6ef5" d="M224 136V0H24C10.7 0 0 10.7 0 24v464c0 13.3 10.7 24 24 24h336c13.3 0 24-10.7 24-24V160H248c-13.2 0-24-10.8-24-24zm57.1 120H305c7.7 0 13.4 7.1 11.7 14.7l-38 168c-1.2 5.5-6.1 9.3-11.7 9.3h-38c-5.5 0-10.3-3.8-11.6-9.1-25.8-103.5-20.8-81.2-25.6-110.5h-.5c-1.1 14.3-2.4 17.4-25.6 110.5-1.3 5.3-6.1 9.1-11.6 9.1H117c-5.6 0-10.5-3.9-11.7-9.4l-37.8-168c-1.7-7.5 4-14.6 11.7-14.6h24.5c5.7 0 10.7 4 11.8 9.7 15.6 78 20.1 109.5 21 122.2 1.6-10.2 7.3-32.7 29.4-122.7 1.3-5.4 6.1-9.1 11.7-9.1h29.1c5.6 0 10.4 3.8 11.7 9.2 24 100.4 28.8 124 29.6 129.4-.2-11.2-2.6-17.8 21.6-129.2 1-5.6 5.9-9.5 11.5-9.5zM384 121.9v6.1H256V0h6.1c6.4 0 12.5 2.5 17 7l97.9 98c4.5 4.5 7 10.6 7 16.9z"></path>
                        </svg>
                    `,
                    Color: "#4c6ef5"
                };

            case "demo3d":
            case "dwg":
            case "demo3dcatalo":
            case "sldasm":
            case "slddrw":
            case "sldprt":
            case "stl":
                return {
                    Name: "CAD File",
                    Icon: `
                        <svg aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
                            <path fill="#15aabf" d="M384 121.941V128H256V0h6.059a24 24 0 0 1 16.97 7.029l97.941 97.941a24.002 24.002 0 0 1 7.03 16.971zM248 160c-13.2 0-24-10.8-24-24V0H24C10.745 0 0 10.745 0 24v464c0 13.255 10.745 24 24 24h336c13.255 0 24-10.745 24-24V160H248zm-135.455 16c26.51 0 48 21.49 48 48s-21.49 48-48 48-48-21.49-48-48 21.491-48 48-48zm208 240h-256l.485-48.485L104.545 328c4.686-4.686 11.799-4.201 16.485.485L160.545 368 264.06 264.485c4.686-4.686 12.284-4.686 16.971 0L320.545 304v112z"></path>
                        </svg>
                    `,
                    Color: "#15aabf"
                };

            case "exe":
            case "plist":
            case "bat":
            case "cmd":
                return {
                    Name: "Executable",
                    Icon: `
                        <svg aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
                            <path fill="#7a7a7a" d="M224 136V0H24C10.7 0 0 10.7 0 24v464c0 13.3 10.7 24 24 24h336c13.3 0 24-10.7 24-24V160H248c-13.2 0-24-10.8-24-24zm160-14.1v6.1H256V0h6.1c6.4 0 12.5 2.5 17 7l97.9 98c4.5 4.5 7 10.6 7 16.9z"></path>
                        </svg>
                    `,
                    Color: "#7a7a7a"
                };

            case "htm":
            case "html":
                return {
                    Name: "HTML File",
                    Icon: `
                        <svg aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
                            <path fill="#fd7e14" d="M384 121.941V128H256V0h6.059c6.365 0 12.47 2.529 16.971 7.029l97.941 97.941A24.005 24.005 0 0 1 384 121.941zM248 160c-13.2 0-24-10.8-24-24V0H24C10.745 0 0 10.745 0 24v464c0 13.255 10.745 24 24 24h336c13.255 0 24-10.745 24-24V160H248zM123.206 400.505a5.4 5.4 0 0 1-7.633.246l-64.866-60.812a5.4 5.4 0 0 1 0-7.879l64.866-60.812a5.4 5.4 0 0 1 7.633.246l19.579 20.885a5.4 5.4 0 0 1-.372 7.747L101.65 336l40.763 35.874a5.4 5.4 0 0 1 .372 7.747l-19.579 20.884zm51.295 50.479l-27.453-7.97a5.402 5.402 0 0 1-3.681-6.692l61.44-211.626a5.402 5.402 0 0 1 6.692-3.681l27.452 7.97a5.4 5.4 0 0 1 3.68 6.692l-61.44 211.626a5.397 5.397 0 0 1-6.69 3.681zm160.792-111.045l-64.866 60.812a5.4 5.4 0 0 1-7.633-.246l-19.58-20.885a5.4 5.4 0 0 1 .372-7.747L284.35 336l-40.763-35.874a5.4 5.4 0 0 1-.372-7.747l19.58-20.885a5.4 5.4 0 0 1 7.633-.246l64.866 60.812a5.4 5.4 0 0 1-.001 7.879z"></path>
                        </svg>
                    `,
                    Color: "#fd7e14"
                };

            case "json":
                return {
                    Name: "JSON File",
                    Icon: `
                        <svg aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
                            <path fill="#7a7a7a" d="M224 136V0H24C10.7 0 0 10.7 0 24v464c0 13.3 10.7 24 24 24h336c13.3 0 24-10.7 24-24V160H248c-13.2 0-24-10.8-24-24zm160-14.1v6.1H256V0h6.1c6.4 0 12.5 2.5 17 7l97.9 98c4.5 4.5 7 10.6 7 16.9z"></path>
                        </svg>
                    `,
                    Color: "#7a7a7a"
                };

            case "pdf":
                return {
                    Name: "PDF File",
                    Icon: `
                        <svg aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
                            <path fill="#a50303" d="M181.9 256.1c-5-16-4.9-46.9-2-46.9 8.4 0 7.6 36.9 2 46.9zm-1.7 47.2c-7.7 20.2-17.3 43.3-28.4 62.7 18.3-7 39-17.2 62.9-21.9-12.7-9.6-24.9-23.4-34.5-40.8zM86.1 428.1c0 .8 13.2-5.4 34.9-40.2-6.7 6.3-29.1 24.5-34.9 40.2zM248 160h136v328c0 13.3-10.7 24-24 24H24c-13.3 0-24-10.7-24-24V24C0 10.7 10.7 0 24 0h200v136c0 13.2 10.8 24 24 24zm-8 171.8c-20-12.2-33.3-29-42.7-53.8 4.5-18.5 11.6-46.6 6.2-64.2-4.7-29.4-42.4-26.5-47.8-6.8-5 18.3-.4 44.1 8.1 77-11.6 27.6-28.7 64.6-40.8 85.8-.1 0-.1.1-.2.1-27.1 13.9-73.6 44.5-54.5 68 5.6 6.9 16 10 21.5 10 17.9 0 35.7-18 61.1-61.8 25.8-8.5 54.1-19.1 79-23.2 21.7 11.8 47.1 19.5 64 19.5 29.2 0 31.2-32 19.7-43.4-13.9-13.6-54.3-9.7-73.6-7.2zM377 105L279 7c-4.5-4.5-10.6-7-17-7h-6v128h128v-6.1c0-6.3-2.5-12.4-7-16.9zm-74.1 255.3c4.1-2.7-2.5-11.9-42.8-9 37.1 15.8 42.8 9 42.8 9z"></path>
                        </svg>
                    `,
                    Color: "#a50303"
                };

            case "ppt":
            case "pptx":
            case "pptm":
                return {
                    Name: "Powerpoint File",
                    Icon: `
                        <svg aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
                            <path fill="#fd7e14" d="M193.7 271.2c8.8 0 15.5 2.7 20.3 8.1 9.6 10.9 9.8 32.7-.2 44.1-4.9 5.6-11.9 8.5-21.1 8.5h-26.9v-60.7h27.9zM377 105L279 7c-4.5-4.5-10.6-7-17-7h-6v128h128v-6.1c0-6.3-2.5-12.4-7-16.9zm-153 31V0H24C10.7 0 0 10.7 0 24v464c0 13.3 10.7 24 24 24h336c13.3 0 24-10.7 24-24V160H248c-13.2 0-24-10.8-24-24zm53 165.2c0 90.3-88.8 77.6-111.1 77.6V436c0 6.6-5.4 12-12 12h-30.8c-6.6 0-12-5.4-12-12V236.2c0-6.6 5.4-12 12-12h81c44.5 0 72.9 32.8 72.9 77z"></path>
                        </svg>
                    `,
                    Color: "#fd7e14"
                };

            case "txt":
            case "text":
            case "rtf":
            case "markdown":
            case "ini":
                return {
                    Name: "Text File",
                    Icon: `
                        <svg aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
                            <path fill="#e5e21b" d="M224 136V0H24C10.7 0 0 10.7 0 24v464c0 13.3 10.7 24 24 24h336c13.3 0 24-10.7 24-24V160H248c-13.2 0-24-10.8-24-24zm64 236c0 6.6-5.4 12-12 12H108c-6.6 0-12-5.4-12-12v-8c0-6.6 5.4-12 12-12h168c6.6 0 12 5.4 12 12v8zm0-64c0 6.6-5.4 12-12 12H108c-6.6 0-12-5.4-12-12v-8c0-6.6 5.4-12 12-12h168c6.6 0 12 5.4 12 12v8zm0-72v8c0 6.6-5.4 12-12 12H108c-6.6 0-12-5.4-12-12v-8c0-6.6 5.4-12 12-12h168c6.6 0 12 5.4 12 12zm96-114.1v6.1H256V0h6.1c6.4 0 12.5 2.5 17 7l97.9 98c4.5 4.5 7 10.6 7 16.9z"></path>
                        </svg>
                    `,
                    Color: "#e5e21b"
                };

            case "xls":
            case "xlsb":
            case "xlsm":
            case "xlsx":
            case "xlt":
            case "xltm":
            case "xltx":
            case "numbers":
            case "gsheet":
                return {
                    Name: "Excel File",
                    Icon: `
                        <svg aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
                            <path fill="#82c91e" d="M224 136V0H24C10.7 0 0 10.7 0 24v464c0 13.3 10.7 24 24 24h336c13.3 0 24-10.7 24-24V160H248c-13.2 0-24-10.8-24-24zm60.1 106.5L224 336l60.1 93.5c5.1 8-.6 18.5-10.1 18.5h-34.9c-4.4 0-8.5-2.4-10.6-6.3C208.9 405.5 192 373 192 373c-6.4 14.8-10 20-36.6 68.8-2.1 3.9-6.1 6.3-10.5 6.3H110c-9.5 0-15.2-10.5-10.1-18.5l60.3-93.5-60.3-93.5c-5.2-8 .6-18.5 10.1-18.5h34.8c4.4 0 8.5 2.4 10.6 6.3 26.1 48.8 20 33.6 36.6 68.5 0 0 6.1-11.7 36.6-68.5 2.1-3.9 6.2-6.3 10.6-6.3H274c9.5-.1 15.2 10.4 10.1 18.4zM384 121.9v6.1H256V0h6.1c6.4 0 12.5 2.5 17 7l97.9 98c4.5 4.5 7 10.6 7 16.9z"></path>
                        </svg>
                    `,
                    Color: "#82c91e"
                };

            case "xml":
            case "yaml":
                return {
                    Name: "XML File",
                    Icon: `
                        <svg aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
                            <path fill="#82c91e" d="M384 121.941V128H256V0h6.059c6.365 0 12.47 2.529 16.971 7.029l97.941 97.941A24.005 24.005 0 0 1 384 121.941zM248 160c-13.2 0-24-10.8-24-24V0H24C10.745 0 0 10.745 0 24v464c0 13.255 10.745 24 24 24h336c13.255 0 24-10.745 24-24V160H248zM123.206 400.505a5.4 5.4 0 0 1-7.633.246l-64.866-60.812a5.4 5.4 0 0 1 0-7.879l64.866-60.812a5.4 5.4 0 0 1 7.633.246l19.579 20.885a5.4 5.4 0 0 1-.372 7.747L101.65 336l40.763 35.874a5.4 5.4 0 0 1 .372 7.747l-19.579 20.884zm51.295 50.479l-27.453-7.97a5.402 5.402 0 0 1-3.681-6.692l61.44-211.626a5.402 5.402 0 0 1 6.692-3.681l27.452 7.97a5.4 5.4 0 0 1 3.68 6.692l-61.44 211.626a5.397 5.397 0 0 1-6.69 3.681zm160.792-111.045l-64.866 60.812a5.4 5.4 0 0 1-7.633-.246l-19.58-20.885a5.4 5.4 0 0 1 .372-7.747L284.35 336l-40.763-35.874a5.4 5.4 0 0 1-.372-7.747l19.58-20.885a5.4 5.4 0 0 1 7.633-.246l64.866 60.812a5.4 5.4 0 0 1-.001 7.879z"></path>
                        </svg>
                    `,
                    Color: "#82c91e"
                };

            case "invoice":
                return {
                    Name: "Invoice",
                    Icon: `
                        <svg aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
                            <path fill="#033077" d="M288 256H96v64h192v-64zm89-151L279.1 7c-4.5-4.5-10.6-7-17-7H256v128h128v-6.1c0-6.3-2.5-12.4-7-16.9zm-153 31V0H24C10.7 0 0 10.7 0 24v464c0 13.3 10.7 24 24 24h336c13.3 0 24-10.7 24-24V160H248c-13.2 0-24-10.8-24-24zM64 72c0-4.42 3.58-8 8-8h80c4.42 0 8 3.58 8 8v16c0 4.42-3.58 8-8 8H72c-4.42 0-8-3.58-8-8V72zm0 64c0-4.42 3.58-8 8-8h80c4.42 0 8 3.58 8 8v16c0 4.42-3.58 8-8 8H72c-4.42 0-8-3.58-8-8v-16zm256 304c0 4.42-3.58 8-8 8h-80c-4.42 0-8-3.58-8-8v-16c0-4.42 3.58-8 8-8h80c4.42 0 8 3.58 8 8v16zm0-200v96c0 8.84-7.16 16-16 16H80c-8.84 0-16-7.16-16-16v-96c0-8.84 7.16-16 16-16h224c8.84 0 16 7.16 16 16z"></path>
                        </svg>
                    `,
                    Color: "#033077"
                };
        }

        return {
            Name: "File",
            Icon: `
                <svg aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
                    <path fill="#7a7a7a" d="M224 136V0H24C10.7 0 0 10.7 0 24v464c0 13.3 10.7 24 24 24h336c13.3 0 24-10.7 24-24V160H248c-13.2 0-24-10.8-24-24zm160-14.1v6.1H256V0h6.1c6.4 0 12.5 2.5 17 7l97.9 98c4.5 4.5 7 10.6 7 16.9z"></path>
                </svg>
            `,
            Color: "#7a7a7a"
        };
    }

    static saveAttachments(attachments) {
        return new Promise((resolve) => {
            if (attachments.length > 0) {
                const request = Server.createRequest("Lead_Manager_Save_Attachments");

                request.AddJSON(JSON.stringify(attachments));
                request.SetReturnType(ECP.EC_ReturnType.Text);

                request.Submit().finally(() => {
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }

    static pad(value) {
        return value < 10 ? `0${value}` : value;
    }

    static uploadDocument(file) {
        return new Promise((resolve) => {
            let document = null;

            const data = new FormData();

            data.append("data", file);
            data.append("Distributor", encompassId);

            $.ajax({
                url: "API.ashx?APICommand=SalesComm_UploadDocument",
                contentType: false,
                encType: "multipart/form-data",
                type: "POST",
                data,
                cache: false,
                processData: false
            }).done((response) => {
                document = {
                    DocumentID: parseInt(Server.parseJson(response).DocumentID, 10),
                    Name: file.name
                };
            }).complete(() => {
                resolve(document);
            });
        });
    }

    static userToEmail(userId) {
        if (!Array.isArray(userId)) {
            userId = [userId];
        }

        return new Promise((resolve) => {
            const emails = [];
            const request = Server.createRequest("Lead_Manager_Get_Users");

            request.AddParameter("UserID", userId.join("^"), ECP.EC_Operator.Equals);

            Server.log(request);

            request.Submit().then((response) => {
                let data = Server.parseResponse(response);

                for (let i = 0; i < data.length; i++) {
                    const { ...row } = data[i];

                    if (emails.indexOf(row.Email) === -1) {
                        emails.push(row.Email);
                    }
                }

                data = null;
                response = null;
            }).catch((error) => {
                Server.log(error, true);
            }).finally(() => {
                resolve(emails);
            });
        });
    }
}
