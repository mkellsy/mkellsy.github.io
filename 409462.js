class Public {
    static API(command, distributor) {
        const request = new ECP.EC_Request(command);

        request.SetEncompassID(distributor || encompassId);
        request.SetAPIToken("e4796d93aff06ced62fd4f06666a3a4f");

        return request;
    }

    static Request(command, distributor, parameters, options) {
        return fetch(`https://api.encompass8.com/aspx1/API.ashx?EncompassID=${distributor || encompassId}&APICommand=${command}&APIToken=e4796d93aff06ced62fd4f06666a3a4f&${(parameters || []).join("&")}`, options)
    }
}
