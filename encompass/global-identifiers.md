# Global Identifiers
Global identifiers is a set of endpoints designed to give you the required information to interact with other endpoints.

## List Suppliers
We know that you may have multiple suppliers and will need to interact with the data in different ways. This endpoint will give you access to the IDs for each unique supplier you may have.

Request
```sh
GET: https://api.encompass8.com/api?APIToken=[API Token]&APICommand=  
[Prefix]_ListSuppliers&EncompassID=DSDLink
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
GET: https://api.encompass8.com/api?APIToken=[API Token]&APICommand=  
[Prefix]_ListDistributors&EncompassID=DSDLink
```

| Parameter | Type | Required | Notes |
| --- | --- | --- | --- |
| APIToken | String | Yes | Assigned API token |
| Prefix | String | Yes | Assigned prefix |

Response
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

> Note a distributor id and distributor number may show up more than once in this data. A distributor may have multiple locations reporting under the same number.

## List Retailers
Some endpoints require a Retailer ID. You can use this endpoint to view this data.

Due to the how large this list is, you must provide a Distributor ID to view the retailer list.

Request
```sh
GET: https://api.encompass8.com/api?APIToken=[API Token]&APICommand=  
[Prefix]_ListRetailers&EncompassID=DSDLink&DistributorID=[Distributor ID]
```

| Parameter | Type | Required | Notes |
| --- | --- | --- | --- |
| APIToken | String | Yes | Assigned API token |
| Prefix | String | Yes | Assigned prefix |
| DistributorID | String | Yes | The distributor you wish to view |

Response
```json
[{
    "RetailerID": 123456,
    "Retailer": "Timmy's House",
    "RetailerType": "Club",
    "Chain": "Default Chain",
    "StoreNum": null,
    "Address": "112 W Kiowa Ave",
    "City": "South Park",
    "State": "CO",
    "PostalCode": "80526",
    "LicenseNum": "123ABC"
}]
```

| Field | Type | Null | Notes |
| --- | --- | --- | --- |
| RetailerID | Integer | No | Unique ID for the retailer |
| Retailer | String | No | Retailer name |
| RetailerType | String | No | Retailer type |
| Chain | String | Yes | The retailers chain will show here |
| StoreNum | String | Yes | If the retailer is part of a chain their store number will be here |
| Address | String | No | Retailer address |
| City | String | No | Retailer city |
| State | String | No | Retailer state |
| PostalCode | String | No | Retailer postal code |
| LicenseNum | String | Yes | Ratailer state license number |

> Note these identifiers are global they will differ from the distributor's reported ids.

## List Products
You will need the global product ids to interact with most endpoints dealing with products. This endpoint will display the products a distributor carries with the global ids.

Request
```sh
GET: https://api.encompass8.com/api?APIToken=[API Token]&APICommand=  
[Prefix]_ListGlobalProducts&EncompassID=DSDLink&DistributorID=[Distributor ID]
```

| Parameter | Type | Required | Notes |
| --- | --- | --- | --- |
| APIToken | String | Yes | Assigned API token |
| Prefix | String | Yes | Assigned prefix |
| DistributorID | String | Yes | The distributor you wish to view |

Response
```json
[{
    "ProductID": 123456,
    "ProductNum": "ABC123",
    "SupplierID": 123456,
    "Supplier": "South Park Brewery",
    "ProductName": "Timmy's Root Beer Ale",
    "Package": "12 pack 24oz Cans",
    "CaseEquiv": 288.00,
    "Ounces": 288.00,
    "CaseUPC": "0-99999-99999-9",
    "CarrierUPC": "0-99999-99999-9",
    "UnitUPC": "0-99999-99999-9",
    "ABV": "0.0%"
}]
```

| Field | Type | Null | Notes |
| --- | --- | --- | --- |
| ProductID | Integer | No | Unique ID for the product |
| ProductNum | String | No | Supplier SKU |
| SupplierID | Integer | No | Unique ID for the supplier |
| Supplier | String | No | Supplier name |
| ProductName | String | No | Product name |
| Package | String | No | Package description |
| CaseEquiv | Number | Yes | Case equivalence |
| Ounces | Number | Yes | Ounces ber unit |
| CaseUPC | String | Yes | UPC of the wholesale case |
| CarrierUPC | String | Yes | UPC of the retail case |
| UnitUPC | String | Yes | UPC of the individual can/bottle |
| ABV | String | Yes | Alcohol by volume |

> Note these identifiers are global they will differ from the distributor's reported ids.
