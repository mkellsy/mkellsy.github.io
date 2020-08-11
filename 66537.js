class Colors {
    static stringToColor(value) {
        let hash = 0;

        for (let i = 0; i < value.length; i += 1) {
            hash = value.charCodeAt(i) + ((hash << 6) - hash); /* eslint-disable-line */
        }

        const hex = (hash & 0x00FFFFFF).toString(16).toLowerCase(); /* eslint-disable-line */

        return `#${"000000".substring(0, 6 - hex.length) + hex}`;
    }

    static foreground(hex) {
        const rgb = Colors.hexToRgb(hex);

        if (((rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000) > 123) {
            return "#000000";
        }

        return "#ffffff";
    }

    static hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

        return {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        };
    }
}
