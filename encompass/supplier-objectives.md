# Supplier Objectives
This specification covers the endpoints required to interact with objective data.

## List Objective Types
Objective types are a defined set of types used to catagorize objectives.

Request
```sh
GET: https://api.encompass8.com/api?APIToken=[API Token]&APICommand=[Prefix]_ListObjectiveTypes&EncompassID=DSDLink
```

| Parameter | Type | Required | Notes |
| --- | --- | --- | --- |
| APIToken | String | Yes | Assigned API token |
| Prefix | String | Yes | Assigned prefix |

Response
```json
[{
    "ObjectiveTypeID": 22,
    "ObjectiveType": "Placement Gap"
},{
    "ObjectiveTypeID": 23,
    "ObjectiveType": "Display Activity"
}]
```

| Field | Type | Null | Notes |
| --- | --- | --- | --- |
| ObjectiveTypeID | Integer | No | Record key |
| ObjectiveType | String | No | Used when creating objectives |

## List Objectives
Objectives descript the task. Each objective may contain multiple retailers, products and distributors. For example, an objective may be a "placement gap", "chain mandate" or a "display survey".

Objectives are slow changing records. A single objective may be scheduled through the life of a given project. For example, a "chain mandate" may only be one objective record and be scheduled across multiple retailers, distributors and for many years.

You will need to use this endpoint to obtain the "ObjectiveID" which is used to schedule an objective.

Request
```sh
GET: https://api.encompass8.com/api?APIToken=[API Token]&APICommand=[Prefix]_ListObjectives&EncompassID=DSDLink
```

| Parameter | Type | Required | Notes |
| --- | --- | --- | --- |
| APIToken | String | Yes | Assigned API token |
| Prefix | String | Yes | Assigned prefix |

Response
```json
[{
    "ObjectiveID": 100,
    "ObjectiveNum":" 123ABC",
    "ObjectiveType": "Placement Gap",
    "Objective": "New Product"
}]
```

| Field | Type | Null | Notes |
| --- | --- | --- | --- |
| ObjectiveID | Integer | No | Record key |
| ObjectiveNum | String | Yes | This is used to store your key value if needed |
| ObjectiveType | String | No | Objective type (from the ListObjectives endpoint) |
| Objective | String | No | Unique name for the objective |

## Create Objectives
You must create one or more objectives before scheduling. These records can be cached or stored in your application, they are designed to be slow changing.

For example, an objective can represent a single program like "Placement Gaps" or "Chain Mandates". You can use the same objective for many years (or as long as you need to). The retailer, store, product and distributor are set on the schedule record covered later in this specification.

Request
```sh
POST: https://api.encompass8.com/api?APIToken=[API Token]&APICommand=[Prefix]_CreateObjective&EncompassID=DSDLink&SupplierID=[Supplier ID]
Content Type: application/json
```

| Parameter | Type | Required | Notes |
| --- | --- | --- | --- |
| APIToken | String | Yes | Assigned API token |
| Prefix | String | Yes | Assigned prefix |
| SupplierID | Integer | Yes | Desired supplier assigned to this objective |

Request Body
```json
[{
    "ObjectiveNum": "123ABC",
    "ObjectiveType": "Placement Gap",
    "Objective": "New Product"
}]
```

| Field | Type | Null | Notes |
| --- | --- | --- | --- |
| ObjectiveID | Integer | No | Record key |
| ObjectiveNum | String | Yes | This is used to store your key value if needed |
| ObjectiveType | String | No | Objective type (from the ListObjectives endpoint) |
| Objective | String | No | Unique name for the objective |

Validation Schema
```json
{
    "type": "array",
    "items": {
        "type": "object",
        "required": ["ObjectiveType", "Objective"],
        "properties": {
            "ObjectiveNum": { "type": "string" },
            "ObjectiveType": { "type": "string" },
            "Objective": { "type": "string" }
        }
    }
}
```

Response
```json
{
    "Status": "Success",
    "Errors": [],
    "Warnings": [
        "2 Records were skipped because Fields [...] do not allow duplicates due to Unique Multi Column Index configuration."
    ]
}
```

| Field | Type | Null | Notes |
| --- | --- | --- | --- |
| Status | String | No | Success, Warning, Fail |
| Errors | Array | No | Array of strings containing any error messages |
| Warnings | Array | No | Array of strings containing any warning messages |

> Note you will recieve warning messages if your records try to duplicate data.

## List Objective Schedule
Listing the objective schedule gives you access to the schedule records. This is needed if you wish to track the distributor's progress. It is also needed if you need to assign a specific SKU(s) to the schedule. Schedules support multiple SKUs and will need to be attached after a schedule has been created.

Schedules can be target one of two ways.

* Target by retailer type/chain
* Target by single retailer

This will return any schedule that is set to end today or in the future.

Request
```sh
GET: https://api.encompass8.com/api?APIToken=[API Token]&APICommand=[Prefix]_ListObjectiveSchedule&EncompassID=DSDLink&ObjectiveID=[Objective ID]
```

| Parameter | Type | Required | Notes |
| --- | --- | --- | --- | --- |
| APIToken | String | Yes | Assigned API token |
| Prefix | String | Yes | Assigned prefix |
| ObjectiveID | Integer | Yes | Desired objective to view |

Response (Target by Retailer Type/Chain)
```json
[{
    "ObjectiveScheduleID": 4,
    "Status": "Approved",
    "StartDate": "10/22/2021",
    "EndDate": "11/7/2022",
    "DistributorLocation": 379,
    "ChainID": null,
    "RetailerType": null,
    "IndustryVolume": "A",
    "OnPremise": false,
    "DraftPackage": "Draft and Package",
    "HasDisplays": false,
    "Products": [{
        "ProductID": 123456789,
        "ProductName": "Timmy's Beer"
    }]
}]
```

| Field | Type | Null | Notes |
| --- | --- | --- | --- |
| ObjectiveScheduleID | Integer | No | Record key |
| Status | String | No | Inactive, Active, Approval Pending, Approved, Not Approved |
| StartDate | String | No | Date the task will be created if approved |
| EndDate | String | No | Date the task will be marked failed if not complete |
| DistributorLocation | Integer | No | Unique distributor location ID (Global Identifier) |
| ChainID | Integer | Yes | Chain the schedule is targeting (Global Identifier) |
| RetailerType | String | Yes | Target tasks by retailer type |
| IndustryVolume | String | Yes | Target tasks by industry volume (A, B, C) |
| OnPremise | Boolean | Yes | Target tasks by on or off premise |
| DraftPackage | String | Yes | Target tasks by draft present or not (Draft and Package, Draft Only, Package Only) |
| HasDisplays | Boolean | Yes | Target tasks by if the retailer allows displays or not |
| Products | Array | Yes | Array of products attached to this schedule |
| Products.ProductID | Integer | No | Unique global product ID (Global Identifier) |
| Products.ProductName | String | No | Name of the product |

Response (Target by Single Retailer)
```json
[{
    "ObjectiveScheduleID": 3,
    "Status": "Approval Pending",
    "StartDate": "10/26/2021",
    "EndDate": "11/7/2022",
    "DistributorLocation": 3,
    "RetailerID": 1042185126,
    "Products": [{
        "ProductID": 123456789,
        "ProductName": "Timmy's Beer"
    }]
}]
```

| Field | Type | Null | Notes |
| --- | --- | --- | --- |
| ObjectiveScheduleID | Integer | No | Record key |
| Status | String | No | Inactive, Active, Approval Pending, Approved, Not Approved |
| StartDate | String | No | Date the task will be created if approved |
| EndDate | String | No | Date the task will be marked failed if not complete |
| DistributorLocation | No | Integer | Unique distributor location ID (Global Identifier) |
| RetailerID | Integer | No | Retailer the schedule is targeting (Global Identifier) |
| Products | Array | Yes | Array of products attached to this schedule |
| Products.ProductID | Integer | No | Unique global product ID (Global Identifier) |
| Products.ProductName | String | No | Name of the product |


## Create Objective Schedules
This is the endpoint to schedule objectives. This endpoint will not duplicate data based on the start and end date, distributor location and targeting information.

Request
```sh
POST: https://api.encompass8.com/api?APIToken=[API Token]&APICommand=[Prefix]_CreateObjectiveSchedule&EncompassID=DSDLink&ObjectiveID=[Objective ID]
Content Type: application/json
```

| Parameter | Type | Required | Notes |
| --- | --- | --- | --- |
| APIToken | String | Yes | Assigned API token |
| Prefix | String | Yes | Assigned prefix |
| ObjectiveID | Integer | Yes | Desired objective to create a schedule for |

Request Body (Target by Retailer Type/Chain)
```json
[{
    "StartDate": "2021-10-26",
    "EndDate": "2022-11-07",
    "DistributorLocation": 3,
    "ChainID": null,
    "RetailerType": null,
    "IndustryVolume": "A",
    "OnPremise": false,
    "DraftPackage": "Draft and Package",
    "HasDisplays": false,
    "Products": [123456789,987654321]
}]
```

| Field | Type | Null | Notes |
| --- | --- | --- | --- |
| StartDate | Date YYYY-MM-DD | No | Date the task will be created if approved |
| EndDate | Date YYYY-MM-DD | No | Date the task will be created if approved |
| DistributorLocation | Integer | No | Unique distributor location ID (Global Identifier) |
| ChainID | Integer | Yes | Chain the schedule is targeting (Global Identifier) |
| RetailerType | String | Yes | Target tasks by retailer type |
| IndustryVolume | String | Yes | Target tasks by industry volume (A, B, C) |
| OnPremise | Boolean | Yes | Target tasks by on or off premise |
| DraftPackage | String | Yes | Target tasks by draft present or not (Draft and Package, Draft Only, Package Only) |
| HasDisplays | Boolean | Yes | Target tasks by if the retailer allows displays or not |
| Products | Array | Yes | Array of product IDs to attach (Global Identifier) |

Request Body (Target by Single Retailer)
```json
[{
    "StartDate": "2021-10-26",
    "EndDate": "2022-11-07",
    "DistributorLocation": 3,
    "RetailerID": 1042185126,
    "Products": [123456789]
}]
```

| Field | Type | Null | Notes |
| --- | --- | --- | --- |
| StartDate | Date YYYY-MM-DD | No | Date the task will be created if approved |
| EndDate | Date YYYY-MM-DD | No | Date the task will be created if approved |
| DistributorLocation | Integer | No | Unique distributor location ID (Global Identifier) |
| RetailerID | Integer | No | Retailer the schedule is targeting (Global Identifier) |
| Products | Array | Yes | Array of product IDs to attach (Global Identifier) |

Validation Schema
```json
{
    "type": "array",
    "items": {
        "type": "object",
        "required": ["StartDate", "EndDate", "DistributorLocation"],
        "properties": {
            "StartDate": { "type": "string" },
            "EndDate": { "type": "string" },
            "DistributorLocation": { "type": "number" },
            "RetailerID":  { "type": "number" },
            "ChainID":  { "type": "number" },
            "RetailerType":  { "type": "string" },
            "IndustryVolume":  { "type": "string" },
            "OnPremise":  { "type": "boolean" },
            "DraftPackage":  { "type": "string" },
            "HasDisplays":  { "type": "boolean" },
            "Products":  {
                "type": "aray",
                "items": { "type": "number" }
            }
        }
    }
}
```

Response
```json
{
    "Status": "Success",
    "Errors": [],
    "Warnings": [
        "2 Records were skipped because Fields [...] do not allow duplicates due to Unique Multi Column Index configuration."
    ]
}
```

| Field | Type | Null | Notes |
| --- | --- | --- | --- |
| Status | String | No | Success, Warning, Fail |
| Errors | Array | No | Array of strings containing any error messages |
| Warnings | Array | No | Array of strings containing any warning messages |

> Note you will recieve warning messages if your records try to duplicate data.
