# Program Review Information System Management (PRISM)

This repository contains the REST API for the client-side portion of PRISM.

### Setup

These instruction assume that NodeJS, NPM, and MongoDB are already installed on the computer being set up.

1. Clone this repository
2. Run `npm install` from the project root to install dependencies
3. Make a copy of the `.env_skeleton` file named `.env` and ensure all parameters that are not commented out in the `.env_skeleton` file are configured properly
4. Run the MongoDB server that is configured in the `.env` file
5. Run `node bin/create_users.js`. It is important to do this from the root of this repository so that the `.env` file can be loaded.

### Running

Be sure that the MongoDB server configured in the `.env` is running before performing any of these steps.

##### Server

Run `npm start`

##### Tests

Run `npm test`

#### Login

Make a request to the POST `/login` endpoint with the following format:

```json
{
    "username": "<username>",
    "password": "<password>"
}
```

The `create_users.js` script from the initial setup creates the following users:

* `testUserX` - Basic users, not members of any groups
* `testPrsX` - Program Review Subcommittee members, members of the `Program Review Subcommittee` group
* `testAdminX` - Administrators, members of the `Administrators` group
* `testRootX` - Root, not a member of any groups, bypasses all access control

X is a number between 1 and 15 (e.g. testUser2, testRoot12, testAdmin15, etc.).

All users created by the `create_users.js` script have a password of `password`.

Example request and response bodies from the POST `/login` endpoint:

**Request Body**

```json
{
	"username": "testAdmin5",
	"password": "password"
}
```

**Response Body**

```json
{
    "user": {
        "_id": "5a5654e0a81dbd2b904b8091",
        "username": "testAdmin5",
        "__v": 0,
        "name": {
            "first": "first name",
            "last": "last name"
        }
    },
    "groups": [
        {
            "name": "Administrators",
            "_id": "5a5654e0a81dbd2b904b8082"
        }
    ],
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1YTU2NTRlMGE4MWRiZDJiOTA0YjgwOTEiLCJ1c2VybmFtZSI6InRlc3RBZG1pbjUiLCJlbWFpbCI6ImVtYWlsQGV4YW1wbGUuY29tIiwiaW50ZXJuYWwiOnRydWUsIl9fdiI6MCwicm9vdCI6ZmFsc2UsIm5hbWUiOnsiZmlyc3QiOiJmaXJzdCBuYW1lIiwibGFzdCI6Imxhc3QgbmFtZSJ9LCJpYXQiOjE1MTU2NTE4NDR9.s-O-5xospY9qGzlmMMMQnyCh1Kp-kIZjacDCffA5PgA"
}
```

### Making Request to Endpoints

The root URL for the API is `/api` and the default port for the server is 3000.

All endpoints except POST `/login` require authentication via Passport.

To authenticate, include the `Authorization` header in all HTTP requests to the API. The format except is `Authorization: Bearer :token` where `:token` is the token received from the POST `/login` endpoint.

### Useful links

[Initial Implementation GitHub Project](https://github.com/amclees/prism-api/projects/1)

#### Server-side

* [evelyn-server](https://github.com/cysun/evelyn-server)
* [Intro to `Promise`s](https://developers.google.com/web/fundamentals/primers/promises)
* [Express 4 Docs](http://expressjs.com/en/4x/api.html)
* [Mongoose Guide](http://mongoosejs.com/docs/guide.html)
* [HTTP Status Codes](https://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html)

#### Client-side

* [evelyn-client](https://github.com/cysun/evelyn-client)
* [PrimeNG Docs](https://www.primefaces.org/primeng/#/)
* [Angular Docs](https://angular.io/docs/)
