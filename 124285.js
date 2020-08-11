class GoogleMap {
    constructor(app, name, geolocation, options, callback) {
        this.app = $(app);
        this.name = name;
        this.element = this.app.find(`#${this.name}`).html("");

        this.markers = {};
        this.autoGroup = options.autoGroup || false;

        const includes = [];

        includes.push("https://maps.googleapis.com/maps/api/js?libraries=geometry,places&client=gme-encompasstechnologies");

        if (this.autoGroup) {
            includes.push("https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/markerclusterer.js");
        }

        Server.loadScript(includes, () => {
            const config = {
                center: {
                    lat: geolocation.latitude,
                    lng: geolocation.longitude
                }
            };

            if (options) {
                $.extend(config, options);
            }

            this.map = new google.maps.Map(this.element[0], config);

            if (this.autoGroup) {
                this.cluster = new MarkerClusterer(this.map, null, {
                    imagePath: "https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m"
                });
            }

            this.infoWindow = null;
            this.geocoder = null;
            this.places = null;

            if (callback) {
                callback();
            }
        });
    }

    moveToLocation(geolocation, zoom) {
        if (!zoom) {
            zoom = 16;
        }

        this.map.panTo(new google.maps.LatLng(geolocation.latitude, geolocation.longitude));
        this.map.setZoom(zoom);
    }

    addMarker(name, geolocation, title, content, options) {
        this.removeMarker(name);

        const config = {
            position: {
                lat: geolocation.latitude,
                lng: geolocation.longitude
            },
            draggable: false,
            map: this.map,
            title
        };

        if (options) {
            $.extend(config, options);
        }

        this.markers[name] = new google.maps.Marker(config);

        if (this.autoGroup) {
            this.cluster.addMarker(this.markers[name]);
        }

        if (content && content !== "") {
            google.maps.event.addListener(this.markers[name], "click", () => {
                if (!this.infoWindow) {
                    this.infoWindow = new google.maps.InfoWindow();
                }

                this.infoWindow.setContent(content);
                this.infoWindow.open(this.map, this.markers[name]);
            });
        }
    }

    addPlace(name, place, options, callback, before) {
        this.removeMarker(name);

        const config = {
            position: {
                lat: place.position.latitude,
                lng: place.position.longitude
            },
            draggable: false,
            map: this.map,
            title: place.company
        };

        if (options) {
            $.extend(config, options);
        }

        this.markers[name] = new google.maps.Marker(config);

        if (this.autoGroup) {
            this.cluster.addMarker(this.markers[name]);
        }

        if (callback) {
            if (!this.places) {
                this.places = new google.maps.places.PlacesService(this.map);
            }

            google.maps.event.addListener(this.markers[name], "click", () => {
                if (before) {
                    before();
                }

                this.places.findPlaceFromQuery({
                    query: `${place.company}, ${place.address}, ${place.city}, ${place.state}, ${place.postalCode}`,
                    fields: ["place_id"]
                }, (search, status) => {
                    if (status === google.maps.places.PlacesServiceStatus.OK && search[0].place_id) {
                        this.places.getDetails({
                            placeId: search[0].place_id,
                            fields: [
                                "place_id",
                                "name",
                                "adr_address",
                                "formatted_address",
                                "formatted_phone_number",
                                "photos",
                                "rating",
                                "user_ratings_total",
                                "opening_hours",
                                "utc_offset_minutes"
                            ]
                        }, (results, success) => {
                            if (success === google.maps.places.PlacesServiceStatus.OK) {
                                callback(this.parsePlaceData(place, results));
                            } else {
                                callback(this.parsePlaceData(place, null));
                            }
                        });
                    } else {
                        callback(this.parsePlaceData(place, null));
                    }
                });
            });
        }
    }

    parsePlaceData(place, data) {
        const results = {};

        if (data && data.formatted_address && data.name) {
            if (data.formatted_address.toLowerCase().startsWith(data.name.toLowerCase())) {
                results.company = place.company;

                const address = $(`<div>${data.adr_address}</div>`);

                if (address.find(".post-office-box").length > 0) {
                    results.postOfficeBox = address.find(".post-office-box").html();
                }

                if (address.find(".street-address").length > 0) {
                    results.streetAddress = address.find(".street-address").html();
                }

                if (address.find(".extended-address").length > 0) {
                    results.extendedAddress = address.find(".extended-address").html();
                }

                if (address.find(".locality").length > 0) {
                    results.city = address.find(".locality").html();
                }

                if (address.find(".region").length > 0) {
                    results.state = address.find(".region").html();
                }

                if (address.find(".postal-code").length > 0) {
                    results.postalCode = address.find(".postal-code").html();
                }

                if (address.find(".country-name").length > 0) {
                    results.country = address.find(".country-name").html();
                }
            } else {
                results.company = data.name;

                const address = $(`<div>${data.adr_address}</div>`);

                if (address.find(".post-office-box").length > 0) {
                    results.postOfficeBox = address.find(".post-office-box").html();
                }

                if (address.find(".street-address").length > 0) {
                    results.streetAddress = address.find(".street-address").html();
                }

                if (address.find(".extended-address").length > 0) {
                    results.extendedAddress = address.find(".extended-address").html();
                }

                if (address.find(".locality").length > 0) {
                    results.city = address.find(".locality").html();
                }

                if (address.find(".region").length > 0) {
                    results.state = address.find(".region").html();
                }

                if (address.find(".postal-code").length > 0) {
                    results.postalCode = address.find(".postal-code").html();
                }

                if (address.find(".country-name").length > 0) {
                    results.country = address.find(".country-name").html();
                }

                if (data.rating && data.user_ratings_total) {
                    results.rating = data.rating;
                    results.reviewCount = data.user_ratings_total;
                }

                if (data.opening_hours) {
                    if (data.opening_hours && data.utc_offset_minutes) {
                        results.open = data.opening_hours.isOpen();
                    }

                    if (data.opening_hours.weekday_text && Array.isArray(data.opening_hours.weekday_text)) {
                        results.hours = data.opening_hours.weekday_text;
                    }
                }

                if (data.photos && data.photos.length > 0) {
                    results.photos = [];

                    for (let i = 0; i < data.photos.length; i++) {
                        results.photos.push(data.photos[i].getUrl());
                    }
                }
            }
        } else {
            results.company = place.company;
            results.streetAddress = place.address;
            results.city = place.city;
            results.state = place.state;
            results.postalCode = place.postalCode;
        }

        return results;
    }

    removeMarker(name) {
        if (this.markers[name]) {
            if (this.autoGroup) {
                this.cluster.removeMarker(this.markers[name])
            }

            this.markers[name].setMap(null);
        }
    }

    removeAllMarkers() {
        const keys = Object.keys(this.markers);

        for (let i = 0; i < keys.length; i++) {
            this.removeMarker(keys[i]);
        }
    }

    locationSearch (search) {
        return new Promise((resolve, reject) => {
            if (!this.geocoder) {
                this.geocoder = new google.maps.Geocoder();
            }

            this.geocoder.geocode({
                address: search
            }, (results, status) => {
                if (status === "OK") {
                    const { ...position } = results[0].geometry.location;

                    resolve({
                        latitude: position.lat(),
                        longitude: position.lng()
                    });
                } else {
                    reject(new Error(status));
                }
            });
        });
    }
}
