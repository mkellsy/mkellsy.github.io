# Authentication
This specification is generalized for Orchestra Connect. You will obtain your **API Token** and **Prefix** during a pilot program. Each API endpoint will require both your API Token and Prefix as well as any other documented variables.

## Prefixes
Prefixs are there to seperate your data from others. For example, if your prefix is *Cartman*, and the API endpoint is shown as, 
```sh
https://api.encompass8.com/api?APIToken=[API Token]&APICommand=[Prefix]_ListFriends&...
```

the URL you would use would be,
```sh
https://api.encompass8.com/api?APIToken=[API Token]&APICommand=Cartman_ListFriends&...
```

## API Tokens
Each endpoint will have an [API Token] field. We will only send you the token once. We also monitor public repositories and forums for our API tokens and will disable it, if it is exposed.

You will need to replace the [API Token] field in each endpoint.

## HTTP Verbs
Each request displayed in this specification will have the HTTP verb listed in front of the URL. If the verb is POST, there will also be a content type header listed, as well as an example of the POST body and a validation schema.

Validation schemas are standard schemas as defined by [https://json-schema.org](https://json-schema.org/).

> Some endpoints may have multiple responses defined depending on the state of the record. These cases will be clearly identified.
