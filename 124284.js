class Geolocation {
    static getGeolocation() {
        return new Promise((resolve) => {
            const latitude = parseFloat(Server.getCookie("latitude"));
            const longitude = parseFloat(Server.getCookie("longitude"));

            if (!Number.isNaN(latitude) && !Number.isNaN(longitude)) {
                resolve({
                    latitude,
                    longitude
                });
            } else if (!navigator.geolocation) {
                resolve({
                    latitude: 40.59,
                    longitude: -105.08
                });
            } else {
                EC_Fmt.GetLongitudeLatitude().then((position) => {
                    Server.setCookie("latitude", position[1], 180);
                    Server.setCookie("longitude", position[0], 180);

                    resolve({
                        latitude: parseFloat(position[1]),
                        longitude: parseFloat(position[0])
                    });
                }).catch(() => {
                    resolve({
                        latitude: 40.59,
                        longitude: -105.08
                    });
                });
            }
        });
    }

    static getGeolocationFast() {
        return new Promise((resolve) => {
            const latitude = parseFloat(Server.getCookie("latitude"));
            const longitude = parseFloat(Server.getCookie("longitude"));

            if (!Number.isNaN(latitude) && !Number.isNaN(longitude)) {
                resolve({
                    latitude,
                    longitude
                });
            } else {
                const position = {
                    latitude: 40.59,
                    longitude: -105.08
                };
    
                $.getJSON("http://ip-api.com/json/").done((response) => {
                    Server.setCookie("latitude", response.lat, 1);
                    Server.setCookie("longitude", response.lon, 1);

                    position.latitude = response.lat;
                    position.longitude = response.lon;
                }).complete(() => {
                    resolve(position);
                });
            }
        });
    }

    static getDistance(base, position) {
        const radians = {
            latitude: (position.latitude - base.latitude) * (Math.PI / 180),
            longitude: (position.longitude - base.longitude) * (Math.PI / 180)
        };

        const a = Math.sin(radians.latitude / 2) * Math.sin(radians.latitude / 2) + Math.cos(base.latitude * (Math.PI / 180)) * Math.cos(position.latitude * (Math.PI / 180)) * Math.sin(radians.longitude / 2) * Math.sin(radians.longitude / 2); /* eslint-disable-line */

        return 6371 * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
    }

    static getGeofence(position, km) {
        return {
            latitude: {
                min: position.latitude - ((km / 6371) * 57.29577951308232),
                max: position.latitude + ((km / 6371) * 57.29577951308232)
            },
            longitude: {
                min: position.longitude - ((km / 6371 / Math.cos(position.latitude * (Math.PI / 180))) * 57.29577951308232),
                max: position.longitude + ((km / 6371 / Math.cos(position.latitude * (Math.PI / 180))) * 57.29577951308232)
            }
        };
    }
}
