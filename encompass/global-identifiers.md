# Global Identifiers
Global identifiers is a set of endpoints designed to give you the required information to interact with other endpoints.

## List Suppliers
You will be assigned a vendor ID. This ID seperates you from other vendors on Orchestra Connect. However some systems like objectives are seperated by supplier. We know that you may have multiple suppliers and will need to interact with the data in different ways.

This endpoint will give you access to the IDs for each supplier attached to your vendor ID. Also note that your vendor ID is tied to your Prefix.

Request
```sh
GET: https://api.encompass8.com/api?APIToken=[API Token]&APICommand=[Prefix]_ListSuppliers&
EncompassID=DSDLink
```

| Parameter | Type | Required | Notes |
| --- | --- | --- | --- |
| APIToken | String | Yes | Assigned API token |
| Prefix | String | Yes | Assigned prefix |

Response
```json
[{
    "SupplierID": 123,
    "Supplier": "South Park Brewery"
},{
    "SupplierID": 456,
    "Supplier": "Professor Chaos Beverage"
}]
```

| Field | Type | Null | Notes |
| --- | --- | --- | --- |
| SupplierID | Integer | No | Record key and can be used anywhere that calls for a Supplier ID |
| Supplier | String | No | Supplier name |

## List Distributors
You will need access to the unique distributor location for some records. This endpoint will show you the distributors in your network. There will be a record for each location.

Request
```sh
GET: https://api.encompass8.com/api?APIToken=[API Token]&APICommand=[Prefix]_ListDistributors&
EncompassID=DSDLink
```

| Parameter | Type | Required | Notes |
| --- | --- | --- | --- |
| APIToken | String | Yes | Assigned API token |
| Prefix | String | Yes | Assigned prefix |

```json
[{
    "DistributorID": "SouthPark",
    "LocationID": 3,
    "DistributorNum": "123ABC",
    "DBA": "South Park Distributors, Inc.",
    "Address": "123 Somewhere St",
    "City": "South Park",
    "State": "CO",
    "PostalCode": "80526",
    "Phone": "(555) 555-5555",
    "Contact": "Stan",
    "Email": "stan@email.com",
    "Website": "spdist.com"
}]
```

| Field | Type | Null | Notes |
| --- | --- | --- | --- |
| DistributorID | String | No | Unique ID for a distributor, a distributor may have multiple locations |
| LocationID | Integer | No | Unique ID for a distributor location |
| DistributorNum | String | Yes | This is your identifier for a distributor location |
| DBA | String | No | Distributor location buisness name |
| Address | String | No | Location address |
| City | String | No | Location city |
| State | String | No | Location state |
| PostalCode | String | No | Location postal code |
| Phone | String | Yes | Location phone number |
| Contact | String | Yes | Primary contact |
| Email | String | Yes | Primary contact email address |
| Website | String | Yes | Location/Distributor website address |

## List Retailers

## List Products
