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
]}
```

| Field | Type | Null | Notes |
| --- | --- | --- | --- |
| SupplierID | Integer | No | Record key and can be used anywhere that calls for a Supplier ID |
| Supplier | String | No | Supplier name |

## List Distributors

## List Retailers

## List Products
