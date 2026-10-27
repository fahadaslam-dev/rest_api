# Complete project code

This listing reproduces every project file except this generated listing itself. The ZIP also contains all files separately in their runnable folder structure.

## `.env.example`

````text
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/modular_mvc_api
# Replace with a random secret of at least 32 bytes before starting.
# Generate one with: node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
JWT_SECRET=replace_this_with_a_random_secret
JWT_EXPIRES_IN=7d
# Comma-separated frontend origins. Use * only when public browser access is intended.
CORS_ORIGIN=http://localhost:5173,http://localhost:3000

````

## `.gitignore`

````text
node_modules/
.env
.env.*
!.env.example
coverage/
*.log
.DS_Store

````

## `README.md`

````markdown
# Modular MVC Course REST API

A complete Express.js REST API for authentication, categories, and courses using
MongoDB and Mongoose. Every module owns its model, controller, routes, and input
validation. Shared middleware handles JWT authentication, validation responses,
unknown routes, and errors.

## Requirements

- Node.js 22 or newer and npm.
- A running MongoDB 7+ server, or a MongoDB Atlas connection string.
- The database user must be able to read/write the database and create indexes.

## Setup and run

1. Extract the project and open a terminal inside `modular-mvc-api`.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy the environment example:

   ```bash
   # macOS / Linux / Git Bash
   cp .env.example .env
   ```

   ```powershell
   # Windows PowerShell
   Copy-Item .env.example .env
   ```

4. Generate a JWT secret and put its output into `.env` as `JWT_SECRET`:

   ```bash
   node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
   ```

5. Set `MONGO_URI` to your MongoDB database. The example uses a local server:

   ```dotenv
   MONGO_URI=mongodb://127.0.0.1:27017/modular_mvc_api
   ```

   For Atlas, replace it with your cluster connection string including a database
   name. Configure the cluster's network access and database credentials first.
   Start your local MongoDB service if you use the local URI.

6. Start development mode:

   ```bash
   npm run dev
   ```

   The server connects to MongoDB, initializes the unique indexes, and then listens
   at `http://localhost:5000`. Stop it with Ctrl+C. For a normal start, run
   `npm start`. The root `/` returns the normal JSON 404; the API starts at `/api`.

The supplied `.env.example` deliberately contains an invalid placeholder secret.
Replace it before starting. Never commit your actual `.env` file.

## Environment variables

| Variable | Meaning | Example / default |
| --- | --- | --- |
| `NODE_ENV` | `development`, `test`, or `production` | `development` |
| `PORT` | HTTP port, 1–65535 | `5000` |
| `MONGO_URI` | MongoDB connection string; required | `mongodb://127.0.0.1:27017/modular_mvc_api` |
| `JWT_SECRET` | Random signing secret of at least 32 UTF-8 bytes; required | Generate using the command above |
| `JWT_EXPIRES_IN` | Positive integer followed by `s`, `m`, `h`, or `d` | `7d` |
| `CORS_ORIGIN` | Comma-separated allowed frontend origins; `*` allows all | `http://localhost:5173,http://localhost:3000` |

`CORS_ORIGIN` controls browser cross-origin access. Authentication is enforced by
JWT middleware; CORS does not replace authentication.

## Folder structure

```text
modular-mvc-api/
├── .env.example
├── .gitignore
├── COMPLETE_CODE.md
├── README.md
├── nodemon.json
├── package.json
├── package-lock.json
├── server.js
├── src/
│   ├── app.js
│   ├── config/
│   │   ├── db.js
│   │   └── env.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── error.js
│   │   └── validate.js
│   ├── utils/
│   │   ├── ApiError.js
│   │   ├── response.js
│   │   └── token.js
│   └── modules/
│       ├── auth/
│       │   ├── auth.controller.js
│       │   ├── auth.model.js
│       │   ├── auth.routes.js
│       │   └── auth.validation.js
│       ├── categories/
│       │   ├── category.controller.js
│       │   ├── category.model.js
│       │   ├── category.routes.js
│       │   └── category.validation.js
│       └── courses/
│           ├── course.controller.js
│           ├── course.model.js
│           ├── course.routes.js
│           └── course.validation.js
└── tests/
    └── api.test.js
```

Request flow: route → authentication for protected routes → module validation →
validation middleware → controller → Mongoose model → JSON response. Express 5
forwards errors thrown by async controllers and middleware to the central error
handler. No extra async wrapper is needed.

## API endpoints

Base URL: `http://localhost:5000`

Send JSON bodies with `Content-Type: application/json`. Protected requests require:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

| Method | Endpoint | Access | Required JSON fields | Success |
| --- | --- | --- | --- | --- |
| POST | `/api/auth/register` | Public | `name`, `email`, `password` | 201 |
| POST | `/api/auth/login` | Public | `email`, `password` | 200 |
| POST | `/api/categories` | Protected | `name` | 201 |
| GET | `/api/categories` | Public | — | 200 |
| GET | `/api/categories/:id` | Public | — | 200 |
| PUT | `/api/categories/:id` | Protected | `name` | 200 |
| DELETE | `/api/categories/:id` | Protected | — | 200 |
| POST | `/api/courses` | Protected | `title`, `category`, `price` | 201 |
| GET | `/api/courses` | Public | — | 200 |
| GET | `/api/courses/:id` | Public | — | 200 |
| PUT | `/api/courses/:id` | Protected | `title`, `category`, `price` | 200 |
| DELETE | `/api/courses/:id` | Protected | — | 200 |

All authenticated users can create, update, and delete categories and courses.
`role` is stored for future policy expansion; this project does not impose an
admin-only or owner-only policy. Public registration always assigns `user` and
ignores any client-supplied role. There is no public role-management endpoint.

## Models and validation rules

### User

- `name`: required string, trimmed, 1–100 characters.
- `email`: required valid email, trimmed and converted to lowercase, at most 254
  characters, unique. Email matching does not strip dots or plus-address tags.
- `password`: required string, at least 8 characters on registration, at most 72
  UTF-8 bytes. Passwords are not trimmed. The Mongoose save hook hashes changed
  passwords with bcrypt cost 12. Hashes are excluded from user JSON responses.
- `role`: enum `user` / `admin`; defaults to `user`.
- `_id`, `createdAt`, and `updatedAt`: generated by MongoDB/Mongoose.

### Category

- `name`: required trimmed string, 1–100 characters, unique. Uniqueness is
  case-sensitive: `Programming` and `programming` are different names.
- `description`: optional trimmed string, at most 2,000 characters; defaults to `""`.
- `createdBy`: User ObjectId, assigned from the authenticated user on creation.
- `_id`, `createdAt`, and `updatedAt`: generated.

### Course

- `title`: required trimmed string, 1–200 characters.
- `description`: optional trimmed string, at most 10,000 characters; defaults to `""`.
- `category`: required valid Category ObjectId. The category must exist.
- `price`: required finite, non-negative JSON number; `0` is allowed. Numeric
  strings, booleans, objects, and `null` are rejected. Currency is application-defined.
- `instructor`: User ObjectId, assigned from the authenticated user on creation.
- `duration`: optional trimmed string, at most 100 characters, e.g. `"6 hours"`;
  defaults to `""`.
- `_id`, `createdAt`, and `updatedAt`: generated.

`createdBy` and `instructor` cannot be overwritten through these endpoints.
Unknown request fields are ignored because controllers use only validated body
fields. PUT requires the same mandatory fields as POST; omitted optional fields
retain their existing values. Send `""` to clear an optional text field.

Course list/detail responses populate `category` with `_id`, `name`, and
`description`. Course create/update responses populate it as well.

Deleting a category that is used by a course returns 400. Delete or reassign its
courses first. Reference existence checks and the deletion guard cover ordinary
requests, but they are not a transactional foreign-key constraint: concurrent
course writes/category deletes or direct database edits can still race. A missing
reference is populated as `null`. Strict concurrent referential integrity would
require an additional shared locking/transaction design.

## Response format

Successful registration and login include the token and safe user under `data`:

```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Fahad Aslam",
      "email": "fahad@example.com",
      "role": "user",
      "createdAt": "2026-10-27T00:00:00.000Z",
      "updatedAt": "2026-10-27T00:00:00.000Z"
    },
    "token": "YOUR_JWT_TOKEN"
  }
}
```

Single-resource responses put the object directly under `data`; list responses
put an array under `data`. Successful deletion returns `data: null`.

Validation failures retain the common envelope and add an `errors` array:

```json
{
  "success": false,
  "message": "Validation failed",
  "data": null,
  "errors": [
    { "field": "title", "message": "title is required", "location": "body" },
    { "field": "category", "message": "category is required", "location": "body" },
    { "field": "price", "message": "price is required", "location": "body" }
  ]
}
```

Submitted values, including passwords, are omitted from validation errors.
Duplicate-key and Mongoose validation errors may also include `errors`, without a
`location`. Other failures use the three common fields, for example:

```json
{
  "success": false,
  "message": "Course not found",
  "data": null
}
```

| Status | Meaning |
| --- | --- |
| 201 | User, category, or course created |
| 200 | Login, GET, PUT, DELETE, or CORS preflight succeeded |
| 400 | Input validation, duplicate email/name, malformed ID/JSON, or category in use |
| 401 | Missing, invalid, or expired JWT; deleted token user; invalid login credentials |
| 404 | Unknown route, missing category/course, or missing referenced category |
| 413 | JSON body exceeds 100 KB |
| 500 | Unexpected internal error; details are logged only on the server |

## Example requests

These examples use curl in Bash/Git Bash. In Windows PowerShell, use Postman or
`Invoke-RestMethod` with equivalent JSON bodies, or run the examples in Git Bash.
Replace `YOUR_JWT_TOKEN`, `CATEGORY_ID`, and `COURSE_ID` with actual response values.

### 1. Register

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Fahad Aslam","email":"fahad@example.com","password":"StudyPass123!"}'
```

Copy `data.token`. The response also includes `data.user` without its password.

### 2. Log in

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"fahad@example.com","password":"StudyPass123!"}'
```

### 3. Create a category

```bash
curl -X POST http://localhost:5000/api/categories \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -d '{"name":"Web Development","description":"Backend and frontend courses"}'
```

Copy the returned `data._id` as `CATEGORY_ID`.

### 4. Read categories

```bash
curl http://localhost:5000/api/categories
curl http://localhost:5000/api/categories/CATEGORY_ID
```

### 5. Update a category

```bash
curl -X PUT http://localhost:5000/api/categories/CATEGORY_ID \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -d '{"name":"Backend Development","description":"Server-side courses"}'
```

### 6. Create a course

```bash
curl -X POST http://localhost:5000/api/courses \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -d '{"title":"Node.js Basics","description":"Build REST APIs","category":"CATEGORY_ID","price":49.99,"duration":"6 hours"}'
```

Copy the returned `data._id` as `COURSE_ID`.

### 7. Read courses with populated categories

```bash
curl http://localhost:5000/api/courses
curl http://localhost:5000/api/courses/COURSE_ID
```

### 8. Update a course

```bash
curl -X PUT http://localhost:5000/api/courses/COURSE_ID \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -d '{"title":"Advanced Node.js","category":"CATEGORY_ID","price":79.99,"duration":"10 hours"}'
```

### 9. Delete the course, then its category

```bash
curl -X DELETE http://localhost:5000/api/courses/COURSE_ID \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'

curl -X DELETE http://localhost:5000/api/categories/CATEGORY_ID \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

## Tests

```bash
npm test
```

The 25 integration/error-handling cases use Node's test runner, Supertest, and a
disposable real MongoDB instance managed by `mongodb-memory-server`. They test
registration, hashing, login, JWT rejection, all protected mutations, category and
course CRUD, population, duplicates, required fields, invalid IDs/references,
unsafe input, JSON errors, CORS, and the generic 500 envelope.

The tests ignore your application's database URI and delete only their temporary
test data. The first install/test may download a MongoDB binary. Internet access,
a supported OS, and the ability to launch a local MongoDB process are required.
An installed binary can be selected with `MONGOMS_SYSTEM_BINARY` if needed.

## Implementation references

- Express async error handling: https://expressjs.com/en/guide/error-handling.html
- Mongoose unique indexes and validation: https://mongoosejs.com/docs/8.x/docs/validation.html
- express-validator results: https://express-validator.github.io/docs/api/validation-result/

MongoDB enforces uniqueness through indexes, so the central error handler maps
duplicate-key errors to JSON 400 responses even when concurrent requests pass a
preliminary email check.

````

## `nodemon.json`

````json
{
  "watch": ["src", "server.js"],
  "ext": "js,json",
  "ignore": ["tests/**", "node_modules/**"]
}

````

## `package-lock.json`

````json
{
  "name": "modular-mvc-course-api",
  "version": "1.0.0",
  "lockfileVersion": 3,
  "requires": true,
  "packages": {
    "": {
      "name": "modular-mvc-course-api",
      "version": "1.0.0",
      "dependencies": {
        "bcryptjs": "^3.0.2",
        "cors": "^2.8.5",
        "dotenv": "^17.2.3",
        "express": "^5.1.0",
        "express-validator": "^7.3.0",
        "jsonwebtoken": "^9.0.2",
        "mongoose": "^8.19.1"
      },
      "devDependencies": {
        "mongodb-memory-server": "^10.2.3",
        "nodemon": "^3.1.10",
        "supertest": "^7.1.4"
      },
      "engines": {
        "node": ">=22"
      }
    },
    "node_modules/@mongodb-js/saslprep": {
      "version": "1.6.1",
      "resolved": "https://registry.npmjs.org/@mongodb-js/saslprep/-/saslprep-1.6.1.tgz",
      "integrity": "sha512-D4CQtk9IwjCLAvCf1xvHEod3960q8XMUzfmdRU9qjUNlHnesGuTOvJcOTaPm9koZ1caUKA2aTbszZiAkcmSgmg==",
      "license": "MIT",
      "dependencies": {
        "sparse-bitfield": "^3.0.3"
      }
    },
    "node_modules/@noble/hashes": {
      "version": "1.8.0",
      "resolved": "https://registry.npmjs.org/@noble/hashes/-/hashes-1.8.0.tgz",
      "integrity": "sha512-jCs9ldd7NwzpgXDIf6P3+NrHh9/sD6CQdxHyjQI+h/6rDNo88ypBxxz45UDuZHz9r3tNz7N/VInSVoVdtXEI4A==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": "^14.21.3 || >=16"
      },
      "funding": {
        "url": "https://paulmillr.com/funding/"
      }
    },
    "node_modules/@paralleldrive/cuid2": {
      "version": "2.3.1",
      "resolved": "https://registry.npmjs.org/@paralleldrive/cuid2/-/cuid2-2.3.1.tgz",
      "integrity": "sha512-XO7cAxhnTZl0Yggq6jOgjiOHhbgcO4NqFqwSmQpjK3b6TEE6Uj/jfSk6wzYyemh3+I0sHirKSetjQwn5cZktFw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@noble/hashes": "^1.1.5"
      }
    },
    "node_modules/@types/webidl-conversions": {
      "version": "7.0.3",
      "resolved": "https://registry.npmjs.org/@types/webidl-conversions/-/webidl-conversions-7.0.3.tgz",
      "integrity": "sha512-CiJJvcRtIgzadHCYXw7dqEnMNRjhGZlYK05Mj9OyktqV8uVT8fD2BFOB7S1uwBE3Kj2Z+4UyPmFw/Ixgw/LAlA==",
      "license": "MIT"
    },
    "node_modules/@types/whatwg-url": {
      "version": "11.0.5",
      "resolved": "https://registry.npmjs.org/@types/whatwg-url/-/whatwg-url-11.0.5.tgz",
      "integrity": "sha512-coYR071JRaHa+xoEvvYqvnIHaVqaYrLPbsufM9BF63HkwI5Lgmy2QR8Q5K/lYDYo5AK82wOvSOS0UsLTpTG7uQ==",
      "license": "MIT",
      "dependencies": {
        "@types/webidl-conversions": "*"
      }
    },
    "node_modules/accepts": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/accepts/-/accepts-2.0.0.tgz",
      "integrity": "sha512-5cvg6CtKwfgdmVqY1WIiXKc3Q1bkRqGLi+2W/6ao+6Y7gu/RCwRuAhGEzh5B4KlszSuTLgZYuqFqo5bImjNKng==",
      "license": "MIT",
      "dependencies": {
        "mime-types": "^3.0.0",
        "negotiator": "^1.0.0"
      },
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/agent-base": {
      "version": "7.1.4",
      "resolved": "https://registry.npmjs.org/agent-base/-/agent-base-7.1.4.tgz",
      "integrity": "sha512-MnA+YT8fwfJPgBx3m60MNqakm30XOkyIoH1y6huTQvC0PwZG7ki8NacLBcrPbNoo8vEZy7Jpuk7+jMO+CUovTQ==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 14"
      }
    },
    "node_modules/anymatch": {
      "version": "3.1.3",
      "resolved": "https://registry.npmjs.org/anymatch/-/anymatch-3.1.3.tgz",
      "integrity": "sha512-KMReFUr0B4t+D+OBkjR3KYqvocp2XaSzO55UcB6mgQMd3KbcE+mWTyvVV7D/zsdEbNnV6acZUutkiHQXvTr1Rw==",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "normalize-path": "^3.0.0",
        "picomatch": "^2.0.4"
      },
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/asap": {
      "version": "2.0.6",
      "resolved": "https://registry.npmjs.org/asap/-/asap-2.0.6.tgz",
      "integrity": "sha512-BSHWgDSAiKs50o2Re8ppvp3seVHXSRM44cdSsT9FfNEUUZLOGWVCsiWaRPWM1Znn+mqZ1OfVZ3z3DWEzSp7hRA==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/async-mutex": {
      "version": "0.5.0",
      "resolved": "https://registry.npmjs.org/async-mutex/-/async-mutex-0.5.0.tgz",
      "integrity": "sha512-1A94B18jkJ3DYq284ohPxoXbfTA5HsQ7/Mf4DEhcyLx3Bz27Rh59iScbB6EPiP+B+joue6YCxcMXSbFC1tZKwA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "tslib": "^2.4.0"
      }
    },
    "node_modules/asynckit": {
      "version": "0.4.0",
      "resolved": "https://registry.npmjs.org/asynckit/-/asynckit-0.4.0.tgz",
      "integrity": "sha512-Oei9OH4tRh0YqU3GxhX79dM/mwVgvbZJaSNaRk+bshkj0S5cfHcgYakreBjrHwatXKbz+IoIdYLxrKim2MjW0Q==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/b4a": {
      "version": "1.9.0",
      "resolved": "https://registry.npmjs.org/b4a/-/b4a-1.9.0.tgz",
      "integrity": "sha512-dpfcF9fDNR6++cthXR67iyhgqWy9CBouAvIWhIntzBG6cvK/cnIPiZQjBwi/ZqjjBEDGfoNDtmB0kTjroOJ3pQ==",
      "dev": true,
      "license": "Apache-2.0",
      "peerDependencies": {
        "react-native-b4a": "*"
      },
      "peerDependenciesMeta": {
        "react-native-b4a": {
          "optional": true
        }
      }
    },
    "node_modules/balanced-match": {
      "version": "4.0.4",
      "resolved": "https://registry.npmjs.org/balanced-match/-/balanced-match-4.0.4.tgz",
      "integrity": "sha512-BLrgEcRTwX2o6gGxGOCNyMvGSp35YofuYzw9h1IMTRmKqttAZZVU67bdb9Pr2vUHA8+j3i2tJfjO6C6+4myGTA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": "18 || 20 || >=22"
      }
    },
    "node_modules/bare-events": {
      "version": "2.9.2",
      "resolved": "https://registry.npmjs.org/bare-events/-/bare-events-2.9.2.tgz",
      "integrity": "sha512-AIPKioV7/Y/8KfZ3AAhjPJxLLbY49S64Ym5DakZlUg75qQiTgUq9hEJoEwa4eUezPUlXRy/i5NpsKvo9jgKmoA==",
      "dev": true,
      "license": "Apache-2.0",
      "peerDependencies": {
        "bare-abort-controller": "*"
      },
      "peerDependenciesMeta": {
        "bare-abort-controller": {
          "optional": true
        }
      }
    },
    "node_modules/bare-fs": {
      "version": "4.8.4",
      "resolved": "https://registry.npmjs.org/bare-fs/-/bare-fs-4.8.4.tgz",
      "integrity": "sha512-MPC2eyrpbk3A873sK4y6rk+Iv4o2enxTjHZ8zH3HO0mjrpm5XjnguY2XmfidIsDV6vnjpbMBKUAJpV0ISD2SsQ==",
      "dev": true,
      "license": "Apache-2.0",
      "dependencies": {
        "bare-events": "^2.5.4",
        "bare-path": "^3.0.0",
        "bare-stream": "^2.6.4",
        "bare-url": "^2.2.2",
        "fast-fifo": "^1.3.2"
      },
      "engines": {
        "bare": ">=1.28.0"
      },
      "peerDependencies": {
        "bare-buffer": "*"
      },
      "peerDependenciesMeta": {
        "bare-buffer": {
          "optional": true
        }
      }
    },
    "node_modules/bare-path": {
      "version": "3.1.2",
      "resolved": "https://registry.npmjs.org/bare-path/-/bare-path-3.1.2.tgz",
      "integrity": "sha512-ZyKbsuuqK6Ag0K8pX6V5Txq6XeJRvY+wXucnFGRjiyVYP9YWDpIQugk/b+enRYrEYBJaqLzghRQpXPMR7341Nw==",
      "dev": true,
      "license": "Apache-2.0"
    },
    "node_modules/bare-stream": {
      "version": "2.13.4",
      "resolved": "https://registry.npmjs.org/bare-stream/-/bare-stream-2.13.4.tgz",
      "integrity": "sha512-PcrQ8lVLbiJscNm1Kez+Yp4Gy4AHGcN1lzwjvf5NybWen7VvEgUfyfnXYJ2zNqWnzOfCb1Abq6lH8ti0syQszA==",
      "dev": true,
      "license": "Apache-2.0",
      "dependencies": {
        "b4a": "^1.8.1",
        "streamx": "^2.25.0",
        "teex": "^1.0.1"
      },
      "peerDependencies": {
        "bare-abort-controller": "*",
        "bare-buffer": "*",
        "bare-events": "*"
      },
      "peerDependenciesMeta": {
        "bare-abort-controller": {
          "optional": true
        },
        "bare-buffer": {
          "optional": true
        },
        "bare-events": {
          "optional": true
        }
      }
    },
    "node_modules/bare-url": {
      "version": "2.5.5",
      "resolved": "https://registry.npmjs.org/bare-url/-/bare-url-2.5.5.tgz",
      "integrity": "sha512-iM9qJCruvpt2rPaLsrumVDru9pogI7PHziHIa9kTNRFt8C8HuSa+kI9kFezK+NvHEFnnz71rKGZ1EAilq/3V/Q==",
      "dev": true,
      "license": "Apache-2.0",
      "dependencies": {
        "bare-path": "^3.0.0"
      }
    },
    "node_modules/bcryptjs": {
      "version": "3.0.3",
      "resolved": "https://registry.npmjs.org/bcryptjs/-/bcryptjs-3.0.3.tgz",
      "integrity": "sha512-GlF5wPWnSa/X5LKM1o0wz0suXIINz1iHRLvTS+sLyi7XPbe5ycmYI3DlZqVGZZtDgl4DmasFg7gOB3JYbphV5g==",
      "license": "BSD-3-Clause",
      "bin": {
        "bcrypt": "bin/bcrypt"
      }
    },
    "node_modules/binary-extensions": {
      "version": "2.3.0",
      "resolved": "https://registry.npmjs.org/binary-extensions/-/binary-extensions-2.3.0.tgz",
      "integrity": "sha512-Ceh+7ox5qe7LJuLHoY0feh3pHuUDHAcRUeyL2VYghZwfpkNIy/+8Ocg0a3UuSoYzavmylwuLWQOf3hl0jjMMIw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=8"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/body-parser": {
      "version": "2.4.0",
      "resolved": "https://registry.npmjs.org/body-parser/-/body-parser-2.4.0.tgz",
      "integrity": "sha512-Ifk1KcLrxaGt1occQagQNFNNOqRt1LFuehEnHHzB8Z6cRgIxRU1TBaiIsUiCdA+gy5PL7Y1IX31DNKkRmxtXjQ==",
      "license": "MIT",
      "dependencies": {
        "bytes": "^3.1.2",
        "content-type": "^2.1.0",
        "debug": "^4.4.3",
        "http-errors": "^2.0.1",
        "iconv-lite": "^0.7.3",
        "on-finished": "^2.4.1",
        "qs": "^6.16.1",
        "raw-body": "^3.0.2",
        "type-is": "^2.1.0"
      },
      "engines": {
        "node": ">=18"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/brace-expansion": {
      "version": "5.0.12",
      "resolved": "https://registry.npmjs.org/brace-expansion/-/brace-expansion-5.0.12.tgz",
      "integrity": "sha512-YovQ3rzhaLMIrDjNDMkNS01tea93qhEhG5xy8f6+R0l+dw3Ki+5sCoIoI942iuLZTHWogWktgwVDhU09iNEimQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "balanced-match": "^4.0.2"
      },
      "engines": {
        "node": "20 || >=22"
      }
    },
    "node_modules/braces": {
      "version": "3.0.3",
      "resolved": "https://registry.npmjs.org/braces/-/braces-3.0.3.tgz",
      "integrity": "sha512-yQbXgO/OSZVD2IsiLlro+7Hf6Q18EJrKSEsdoMzKePKXct3gvD8oLcOQdIzGupr5Fj+EDe8gO/lxc1BzfMpxvA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "fill-range": "^7.1.1"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/bson": {
      "version": "6.10.4",
      "resolved": "https://registry.npmjs.org/bson/-/bson-6.10.4.tgz",
      "integrity": "sha512-WIsKqkSC0ABoBJuT1LEX+2HEvNmNKKgnTAyd0fL8qzK4SH2i9NXg+t08YtdZp/V9IZ33cxe3iV4yM0qg8lMQng==",
      "license": "Apache-2.0",
      "engines": {
        "node": ">=16.20.1"
      }
    },
    "node_modules/buffer-equal-constant-time": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/buffer-equal-constant-time/-/buffer-equal-constant-time-1.0.1.tgz",
      "integrity": "sha512-zRpUiDwd/xk6ADqPMATG8vc9VPrkck7T07OIx0gnjmJAnHnTVXNQG3vfvWNuiZIkwu9KrKdA1iJKfsfTVxE6NA==",
      "license": "BSD-3-Clause"
    },
    "node_modules/bytes": {
      "version": "3.1.2",
      "resolved": "https://registry.npmjs.org/bytes/-/bytes-3.1.2.tgz",
      "integrity": "sha512-/Nf7TyzTx6S3yRJObOAV7956r8cr2+Oj8AC5dt8wSP3BQAoeX58NoHyCU8P8zGkNXStjTSi6fzO6F0pBdcYbEg==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/call-bind-apply-helpers": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/call-bind-apply-helpers/-/call-bind-apply-helpers-1.0.2.tgz",
      "integrity": "sha512-Sp1ablJ0ivDkSzjcaJdxEunN5/XvksFJ2sMBFfq6x0ryhQV/2b/KwFe21cMpmHtPOSij8K99/wSfoEuTObmuMQ==",
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0",
        "function-bind": "^1.1.2"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/call-bound": {
      "version": "1.0.4",
      "resolved": "https://registry.npmjs.org/call-bound/-/call-bound-1.0.4.tgz",
      "integrity": "sha512-+ys997U96po4Kx/ABpBCqhA9EuxJaQWDQg7295H4hBphv3IZg0boBKuwYpt4YXp6MZ5AmZQnU/tyMTlRpaSejg==",
      "license": "MIT",
      "dependencies": {
        "call-bind-apply-helpers": "^1.0.2",
        "get-intrinsic": "^1.3.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/camelcase": {
      "version": "6.3.0",
      "resolved": "https://registry.npmjs.org/camelcase/-/camelcase-6.3.0.tgz",
      "integrity": "sha512-Gmy6FhYlCY7uOElZUSbxo2UCDH8owEk996gkbrpsgGtrJLM3J7jGxl9Ic7Qwwj4ivOE5AWZWRMecDdF7hqGjFA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/chokidar": {
      "version": "3.6.0",
      "resolved": "https://registry.npmjs.org/chokidar/-/chokidar-3.6.0.tgz",
      "integrity": "sha512-7VT13fmjotKpGipCW9JEQAusEPE+Ei8nl6/g4FBAmIm0GOOLMua9NDDo/DWp0ZAxCr3cPq5ZpBqmPAQgDda2Pw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "anymatch": "~3.1.2",
        "braces": "~3.0.2",
        "glob-parent": "~5.1.2",
        "is-binary-path": "~2.1.0",
        "is-glob": "~4.0.1",
        "normalize-path": "~3.0.0",
        "readdirp": "~3.6.0"
      },
      "engines": {
        "node": ">= 8.10.0"
      },
      "funding": {
        "url": "https://paulmillr.com/funding/"
      },
      "optionalDependencies": {
        "fsevents": "~2.3.2"
      }
    },
    "node_modules/combined-stream": {
      "version": "1.0.8",
      "resolved": "https://registry.npmjs.org/combined-stream/-/combined-stream-1.0.8.tgz",
      "integrity": "sha512-FQN4MRfuJeHf7cBbBMJFXhKSDq+2kAArBlmRBvcvFE5BB1HZKXtSFASDhdlz9zOYwxh8lDdnvmMOe/+5cdoEdg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "delayed-stream": "~1.0.0"
      },
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/commondir": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/commondir/-/commondir-1.0.1.tgz",
      "integrity": "sha512-W9pAhw0ja1Edb5GVdIF1mjZw/ASI0AlShXM83UUGe2DVr5TdAPEA1OA8m/g8zWp9x6On7gqufY+FatDbC3MDQg==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/component-emitter": {
      "version": "1.3.1",
      "resolved": "https://registry.npmjs.org/component-emitter/-/component-emitter-1.3.1.tgz",
      "integrity": "sha512-T0+barUSQRTUQASh8bx02dl+DhF54GtIDY13Y3m9oWTklKbb3Wv974meRpeZ3lp1JpLVECWWNHC4vaG2XHXouQ==",
      "dev": true,
      "license": "MIT",
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/content-disposition": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/content-disposition/-/content-disposition-2.0.1.tgz",
      "integrity": "sha512-e+H0ZXHSWYrENhQzw1LPuP4oF5MzVKmDU6d3hxlvaPEYLLg62MxtQNPRx4SYSuYJSBUgnQIG4HIN2tEtNv7Dog==",
      "license": "MIT",
      "engines": {
        "node": ">=18"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/content-type": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/content-type/-/content-type-2.1.0.tgz",
      "integrity": "sha512-mj7UPXE0jaqaOsukNZRUEfEi2AcL7C/vwmwcHV0O97eO1E1pxBZuyjlZrx5seTaNBg1U6+o35wpa35Qfcc+7ag==",
      "license": "MIT",
      "engines": {
        "node": ">=18"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/cookie": {
      "version": "0.7.2",
      "resolved": "https://registry.npmjs.org/cookie/-/cookie-0.7.2.tgz",
      "integrity": "sha512-yki5XnKuf750l50uGTllt6kKILY4nQ1eNIQatoXEByZ5dWgnKqbnqmTrBE5B4N7lrMJKQ2ytWMiTO2o0v6Ew/w==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/cookie-signature": {
      "version": "1.2.2",
      "resolved": "https://registry.npmjs.org/cookie-signature/-/cookie-signature-1.2.2.tgz",
      "integrity": "sha512-D76uU73ulSXrD1UXF4KE2TMxVVwhsnCgfAyTg9k8P6KGZjlXKrOLe4dJQKI3Bxi5wjesZoFXJWElNWBjPZMbhg==",
      "license": "MIT",
      "engines": {
        "node": ">=6.6.0"
      }
    },
    "node_modules/cookiejar": {
      "version": "2.1.4",
      "resolved": "https://registry.npmjs.org/cookiejar/-/cookiejar-2.1.4.tgz",
      "integrity": "sha512-LDx6oHrK+PhzLKJU9j5S7/Y3jM/mUHvD/DeI1WQmJn652iPC5Y4TBzC9l+5OMOXlyTTA+SmVUPm0HQUwpD5Jqw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/cors": {
      "version": "2.8.6",
      "resolved": "https://registry.npmjs.org/cors/-/cors-2.8.6.tgz",
      "integrity": "sha512-tJtZBBHA6vjIAaF6EnIaq6laBBP9aq/Y3ouVJjEfoHbRBcHBAHYcMh/w8LDrk2PvIMMq8gmopa5D4V8RmbrxGw==",
      "license": "MIT",
      "dependencies": {
        "object-assign": "^4",
        "vary": "^1"
      },
      "engines": {
        "node": ">= 0.10"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/debug": {
      "version": "4.4.3",
      "resolved": "https://registry.npmjs.org/debug/-/debug-4.4.3.tgz",
      "integrity": "sha512-RGwwWnwQvkVfavKVt22FGLw+xYSdzARwm0ru6DhTVA3umU5hZc28V3kO4stgYryrTlLpuvgI9GiijltAjNbcqA==",
      "license": "MIT",
      "dependencies": {
        "ms": "^2.1.3"
      },
      "engines": {
        "node": ">=6.0"
      },
      "peerDependenciesMeta": {
        "supports-color": {
          "optional": true
        }
      }
    },
    "node_modules/delayed-stream": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/delayed-stream/-/delayed-stream-1.0.0.tgz",
      "integrity": "sha512-ZySD7Nf91aLB0RxL4KGrKHBXl7Eds1DAmEdcoVawXnLD7SDhpNgtuII2aAkg7a7QS41jxPSZ17p4VdGnMHk3MQ==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=0.4.0"
      }
    },
    "node_modules/depd": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/depd/-/depd-2.0.0.tgz",
      "integrity": "sha512-g7nH6P6dyDioJogAAGprGpCtVImJhpPk/roCzdb3fIh61/s/nPsfR6onyMwkCAR/OlC3yBC0lESvUoQEAssIrw==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/dezalgo": {
      "version": "1.0.4",
      "resolved": "https://registry.npmjs.org/dezalgo/-/dezalgo-1.0.4.tgz",
      "integrity": "sha512-rXSP0bf+5n0Qonsb+SVVfNfIsimO4HEtmnIpPHY8Q1UCzKlQrDMfdobr8nJOOsRgWCyMRqeSBQzmWUMq7zvVig==",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "asap": "^2.0.0",
        "wrappy": "1"
      }
    },
    "node_modules/dotenv": {
      "version": "17.4.2",
      "resolved": "https://registry.npmjs.org/dotenv/-/dotenv-17.4.2.tgz",
      "integrity": "sha512-nI4U3TottKAcAD9LLud4Cb7b2QztQMUEfHbvhTH09bqXTxnSie8WnjPALV/WMCrJZ6UV/qHJ6L03OqO3LcdYZw==",
      "license": "BSD-2-Clause",
      "engines": {
        "node": ">=12"
      },
      "funding": {
        "url": "https://dotenvx.com"
      }
    },
    "node_modules/dunder-proto": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/dunder-proto/-/dunder-proto-1.0.1.tgz",
      "integrity": "sha512-KIN/nDJBQRcXw0MLVhZE9iQHmG68qAVIBg9CqmUYjmQIhgij9U5MFvrqkUL5FbtyyzZuOeOt0zdeRe4UY7ct+A==",
      "license": "MIT",
      "dependencies": {
        "call-bind-apply-helpers": "^1.0.1",
        "es-errors": "^1.3.0",
        "gopd": "^1.2.0"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/ecdsa-sig-formatter": {
      "version": "1.0.11",
      "resolved": "https://registry.npmjs.org/ecdsa-sig-formatter/-/ecdsa-sig-formatter-1.0.11.tgz",
      "integrity": "sha512-nagl3RYrbNv6kQkeJIpt6NJZy8twLB/2vtz6yN9Z4vRKHN4/QZJIEbqohALSgwKdnksuY3k5Addp5lg8sVoVcQ==",
      "license": "Apache-2.0",
      "dependencies": {
        "safe-buffer": "^5.0.1"
      }
    },
    "node_modules/ee-first": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/ee-first/-/ee-first-1.1.1.tgz",
      "integrity": "sha512-WMwm9LhRUo+WUaRN+vRuETqG89IgZphVSNkdFgeb6sS/E4OrDIN7t48CAewSHXc6C8lefD8KKfr5vY61brQlow==",
      "license": "MIT"
    },
    "node_modules/encodeurl": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/encodeurl/-/encodeurl-2.0.0.tgz",
      "integrity": "sha512-Q0n9HRi4m6JuGIV1eFlmvJB7ZEVxu93IrMyiMsGC0lrMJMWzRgx6WGquyfQgZVb31vhGgXnfmPNNXmxnOkRBrg==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/es-define-property": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/es-define-property/-/es-define-property-1.0.1.tgz",
      "integrity": "sha512-e3nRfgfUZ4rNGL232gUgX06QNyyez04KdjFrF+LTRoOXmrOgFKDg4BCdsjW8EnT69eqdYGmRpJwiPVYNrCaW3g==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/es-errors": {
      "version": "1.3.0",
      "resolved": "https://registry.npmjs.org/es-errors/-/es-errors-1.3.0.tgz",
      "integrity": "sha512-Zf5H2Kxt2xjTvbJvP2ZWLEICxA6j+hAmMzIlypy4xcBg1vKVnx89Wy0GbS+kf5cwCVFFzdCFh2XSCFNULS6csw==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/es-object-atoms": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/es-object-atoms/-/es-object-atoms-1.1.2.tgz",
      "integrity": "sha512-HWcBoN6NileqtSydK2FqHbS/LoDd2pqrnQHLyJzBj4kOp/ky2MWMN694xOfkK8/SnUsW2DH7EfyVlydKCsm1Zw==",
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/es-set-tostringtag": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/es-set-tostringtag/-/es-set-tostringtag-2.1.0.tgz",
      "integrity": "sha512-j6vWzfrGVfyXxge+O0x5sh6cvxAog0a/4Rdd2K36zCMV5eJ+/+tOAngRO8cODMNWbVRdVlmGZQL2YS3yR8bIUA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0",
        "get-intrinsic": "^1.2.6",
        "has-tostringtag": "^1.0.2",
        "hasown": "^2.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/escape-html": {
      "version": "1.0.3",
      "resolved": "https://registry.npmjs.org/escape-html/-/escape-html-1.0.3.tgz",
      "integrity": "sha512-NiSupZ4OeuGwr68lGIeym/ksIZMJodUGOSCZ/FSnTxcrekbvqrgdUxlJOMpijaKZVjAJrWrGs/6Jy8OMuyj9ow==",
      "license": "MIT"
    },
    "node_modules/etag": {
      "version": "1.8.1",
      "resolved": "https://registry.npmjs.org/etag/-/etag-1.8.1.tgz",
      "integrity": "sha512-aIL5Fx7mawVa300al2BnEE4iNvo1qETxLrPI/o05L7z6go7fCw1J6EQmbK4FmJ2AS7kgVF/KEZWufBfdClMcPg==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/events-universal": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/events-universal/-/events-universal-1.0.1.tgz",
      "integrity": "sha512-LUd5euvbMLpwOF8m6ivPCbhQeSiYVNb8Vs0fQ8QjXo0JTkEHpz8pxdQf0gStltaPpw0Cca8b39KxvK9cfKRiAw==",
      "dev": true,
      "license": "Apache-2.0",
      "dependencies": {
        "bare-events": "^2.7.0"
      }
    },
    "node_modules/express": {
      "version": "5.3.0",
      "resolved": "https://registry.npmjs.org/express/-/express-5.3.0.tgz",
      "integrity": "sha512-qCqy1xSoaugxOD4IVHb1ZWdkvCF2W3aE2okKouWj8VwJ+ztskSiXoBnCSJqfKT+cVPJhuJqe9YLbY425+Zh00g==",
      "license": "MIT",
      "dependencies": {
        "accepts": "^2.0.0",
        "body-parser": "^2.3.0",
        "content-disposition": "^2.0.1",
        "content-type": "^2.0.0",
        "cookie": "^0.7.1",
        "cookie-signature": "^1.2.1",
        "debug": "^4.4.0",
        "depd": "^2.0.0",
        "encodeurl": "^2.0.0",
        "escape-html": "^1.0.3",
        "etag": "^1.8.1",
        "finalhandler": "^2.1.0",
        "fresh": "^2.0.0",
        "http-errors": "^2.0.0",
        "merge-descriptors": "^2.0.0",
        "mime-types": "^3.0.0",
        "on-finished": "^2.4.1",
        "once": "^1.4.0",
        "parseurl": "^1.3.3",
        "proxy-addr": "^2.0.8",
        "qs": "^6.16.0",
        "range-parser": "^1.2.1",
        "router": "^2.2.0",
        "send": "^1.1.0",
        "serve-static": "^2.2.0",
        "statuses": "^2.0.1",
        "type-is": "^2.1.0",
        "vary": "^1.1.2"
      },
      "engines": {
        "node": ">= 18"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/express-validator": {
      "version": "7.3.2",
      "resolved": "https://registry.npmjs.org/express-validator/-/express-validator-7.3.2.tgz",
      "integrity": "sha512-ctLw1Vl6dXVH62dIQMDdTAQkrh480mkFuG6/SGXOaVlwPNukhRAe7EgJIMJ2TSAni8iwHBRp530zAZE5ZPF2IA==",
      "license": "MIT",
      "dependencies": {
        "lodash": "^4.18.1",
        "validator": "~13.15.23"
      },
      "engines": {
        "node": ">= 8.0.0"
      }
    },
    "node_modules/fast-fifo": {
      "version": "1.3.2",
      "resolved": "https://registry.npmjs.org/fast-fifo/-/fast-fifo-1.3.2.tgz",
      "integrity": "sha512-/d9sfos4yxzpwkDkuN7k2SqFKtYNmCTzgfEpz82x34IM9/zc8KGxQoXg1liNC/izpRM/MBdt44Nmx41ZWqk+FQ==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/fast-safe-stringify": {
      "version": "2.1.1",
      "resolved": "https://registry.npmjs.org/fast-safe-stringify/-/fast-safe-stringify-2.1.1.tgz",
      "integrity": "sha512-W+KJc2dmILlPplD/H4K9l9LcAHAfPtP6BY84uVLXQ6Evcz9Lcg33Y2z1IVblT6xdY54PXYVHEv+0Wpq8Io6zkA==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/fill-range": {
      "version": "7.1.1",
      "resolved": "https://registry.npmjs.org/fill-range/-/fill-range-7.1.1.tgz",
      "integrity": "sha512-YsGpe3WHLK8ZYi4tWDg2Jy3ebRz2rXowDxnld4bkQB00cc/1Zw9AWnC0i9ztDJitivtQvaI9KaLyKrc+hBW0yg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "to-regex-range": "^5.0.1"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/finalhandler": {
      "version": "2.1.1",
      "resolved": "https://registry.npmjs.org/finalhandler/-/finalhandler-2.1.1.tgz",
      "integrity": "sha512-S8KoZgRZN+a5rNwqTxlZZePjT/4cnm0ROV70LedRHZ0p8u9fRID0hJUZQpkKLzro8LfmC8sx23bY6tVNxv8pQA==",
      "license": "MIT",
      "dependencies": {
        "debug": "^4.4.0",
        "encodeurl": "^2.0.0",
        "escape-html": "^1.0.3",
        "on-finished": "^2.4.1",
        "parseurl": "^1.3.3",
        "statuses": "^2.0.1"
      },
      "engines": {
        "node": ">= 18.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/find-cache-dir": {
      "version": "3.3.2",
      "resolved": "https://registry.npmjs.org/find-cache-dir/-/find-cache-dir-3.3.2.tgz",
      "integrity": "sha512-wXZV5emFEjrridIgED11OoUKLxiYjAcqot/NJdAkOhlJ+vGzwhOAfcG5OX1jP+S0PcjEn8bdMJv+g2jwQ3Onig==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "commondir": "^1.0.1",
        "make-dir": "^3.0.2",
        "pkg-dir": "^4.1.0"
      },
      "engines": {
        "node": ">=8"
      },
      "funding": {
        "url": "https://github.com/avajs/find-cache-dir?sponsor=1"
      }
    },
    "node_modules/find-up": {
      "version": "4.1.0",
      "resolved": "https://registry.npmjs.org/find-up/-/find-up-4.1.0.tgz",
      "integrity": "sha512-PpOwAdQ/YlXQ2vj8a3h8IipDuYRi3wceVQQGYWxNINccq40Anw7BlsEXCMbt1Zt+OLA6Fq9suIpIWD0OsnISlw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "locate-path": "^5.0.0",
        "path-exists": "^4.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/follow-redirects": {
      "version": "1.16.2",
      "resolved": "https://registry.npmjs.org/follow-redirects/-/follow-redirects-1.16.2.tgz",
      "integrity": "sha512-/kVP2U8z596Ia0gwFrwyIeo74ta5aVmSeU1FfAUMAmcEP5EP7zydmag3SLiN64NaRKef3lxsq7i/g7ltJQDGow==",
      "dev": true,
      "funding": [
        {
          "type": "individual",
          "url": "https://github.com/sponsors/RubenVerborgh"
        }
      ],
      "license": "MIT",
      "engines": {
        "node": ">=4.0"
      },
      "peerDependenciesMeta": {
        "debug": {
          "optional": true
        }
      }
    },
    "node_modules/form-data": {
      "version": "4.0.6",
      "resolved": "https://registry.npmjs.org/form-data/-/form-data-4.0.6.tgz",
      "integrity": "sha512-vKatAh4SlVfgbv+YtmhiRjhEMJsYpsG1Y2rMQtR+SVSbytsSD1YGzDIcrAJmdFec88u/+VoGmxnl+80gL1tRCQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "asynckit": "^0.4.0",
        "combined-stream": "^1.0.8",
        "es-set-tostringtag": "^2.1.0",
        "hasown": "^2.0.4",
        "mime-types": "^2.1.35"
      },
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/form-data/node_modules/mime-db": {
      "version": "1.52.0",
      "resolved": "https://registry.npmjs.org/mime-db/-/mime-db-1.52.0.tgz",
      "integrity": "sha512-sPU4uV7dYlvtWJxwwxHD0PuihVNiE7TyAbQ5SWxDCB9mUYvOgroQOwYQQOKPJ8CIbE+1ETVlOoK1UC2nU3gYvg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/form-data/node_modules/mime-types": {
      "version": "2.1.35",
      "resolved": "https://registry.npmjs.org/mime-types/-/mime-types-2.1.35.tgz",
      "integrity": "sha512-ZDY+bPm5zTTF+YpCrAU9nK0UgICYPT0QtT1NZWFv4s++TNkcgVaT0g6+4R2uI4MjQjzysHB1zxuWL50hzaeXiw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "mime-db": "1.52.0"
      },
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/formidable": {
      "version": "3.5.4",
      "resolved": "https://registry.npmjs.org/formidable/-/formidable-3.5.4.tgz",
      "integrity": "sha512-YikH+7CUTOtP44ZTnUhR7Ic2UASBPOqmaRkRKxRbywPTe5VxF7RRCck4af9wutiZ/QKM5nME9Bie2fFaPz5Gug==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@paralleldrive/cuid2": "^2.2.2",
        "dezalgo": "^1.0.4",
        "once": "^1.4.0"
      },
      "engines": {
        "node": ">=14.0.0"
      },
      "funding": {
        "url": "https://ko-fi.com/tunnckoCore/commissions"
      }
    },
    "node_modules/forwarded": {
      "version": "0.2.0",
      "resolved": "https://registry.npmjs.org/forwarded/-/forwarded-0.2.0.tgz",
      "integrity": "sha512-buRG0fpBtRHSTCOASe6hD258tEubFoRLb4ZNA6NxMVHNw2gOcwHo9wyablzMzOA5z9xA9L1KNjk/Nt6MT9aYow==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/fresh": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/fresh/-/fresh-2.0.0.tgz",
      "integrity": "sha512-Rx/WycZ60HOaqLKAi6cHRKKI7zxWbJ31MhntmtwMoaTeF7XFH9hhBp8vITaMidfljRQ6eYWCKkaTK+ykVJHP2A==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/fsevents": {
      "version": "2.3.3",
      "resolved": "https://registry.npmjs.org/fsevents/-/fsevents-2.3.3.tgz",
      "integrity": "sha512-5xoDfX+fL7faATnagmWPpbFtwh/R77WmMMqqHGS65C3vvB0YHrgF+B1YmZ3441tMj5n63k0212XNoJwzlhffQw==",
      "dev": true,
      "hasInstallScript": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": "^8.16.0 || ^10.6.0 || >=11.0.0"
      }
    },
    "node_modules/function-bind": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/function-bind/-/function-bind-1.1.2.tgz",
      "integrity": "sha512-7XHNxH7qX9xG5mIwxkhumTox/MIRNcOgDrxWsMt2pAr23WHp6MrRlN7FBSFpCpr+oVO0F744iUgR82nJMfG2SA==",
      "license": "MIT",
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/get-intrinsic": {
      "version": "1.3.0",
      "resolved": "https://registry.npmjs.org/get-intrinsic/-/get-intrinsic-1.3.0.tgz",
      "integrity": "sha512-9fSjSaos/fRIVIp+xSJlE6lfwhES7LNtKaCBIamHsjr2na1BiABJPo0mOjjz8GJDURarmCPGqaiVg5mfjb98CQ==",
      "license": "MIT",
      "dependencies": {
        "call-bind-apply-helpers": "^1.0.2",
        "es-define-property": "^1.0.1",
        "es-errors": "^1.3.0",
        "es-object-atoms": "^1.1.1",
        "function-bind": "^1.1.2",
        "get-proto": "^1.0.1",
        "gopd": "^1.2.0",
        "has-symbols": "^1.1.0",
        "hasown": "^2.0.2",
        "math-intrinsics": "^1.1.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/get-proto": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/get-proto/-/get-proto-1.0.1.tgz",
      "integrity": "sha512-sTSfBjoXBp89JvIKIefqw7U2CCebsc74kiY6awiGogKtoSGbgjYE/G/+l9sF3MWFPNc9IcoOC4ODfKHfxFmp0g==",
      "license": "MIT",
      "dependencies": {
        "dunder-proto": "^1.0.1",
        "es-object-atoms": "^1.0.0"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/glob-parent": {
      "version": "5.1.2",
      "resolved": "https://registry.npmjs.org/glob-parent/-/glob-parent-5.1.2.tgz",
      "integrity": "sha512-AOIgSQCepiJYwP3ARnGx+5VnTu2HBYdzbGP45eLw1vr3zB3vZLeyed1sC9hnbcOc9/SrMyM5RPQrkGz4aS9Zow==",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "is-glob": "^4.0.1"
      },
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/gopd": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/gopd/-/gopd-1.2.0.tgz",
      "integrity": "sha512-ZUKRh6/kUFoAiTAtTYPZJ3hw9wNxx+BIBOijnlG9PnrJsCcSjs1wyyD6vJpaYtgnzDrKYRSqf3OO6Rfa93xsRg==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/has-flag": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/has-flag/-/has-flag-3.0.0.tgz",
      "integrity": "sha512-sKJf1+ceQBr4SMkvQnBDNDtf4TXpVhVGateu0t918bl30FnbE2m4vNLX+VWe/dpjlb+HugGYzW7uQXH98HPEYw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/has-symbols": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/has-symbols/-/has-symbols-1.1.0.tgz",
      "integrity": "sha512-1cDNdwJ2Jaohmb3sg4OmKaMBwuC48sYni5HUw2DvsC8LjGTLK9h+eb1X6RyuOHe4hT0ULCW68iomhjUoKUqlPQ==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/has-tostringtag": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/has-tostringtag/-/has-tostringtag-1.0.2.tgz",
      "integrity": "sha512-NqADB8VjPFLM2V0VvHUewwwsw0ZWBaIdgo+ieHtK3hasLz4qeCRjYcqfB6AQrBggRKppKF8L52/VqdVsO47Dlw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "has-symbols": "^1.0.3"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/hasown": {
      "version": "2.0.4",
      "resolved": "https://registry.npmjs.org/hasown/-/hasown-2.0.4.tgz",
      "integrity": "sha512-T2UbfbBEF32wiepXIsMlTW9+dDYC6wMh/t/vYA4tuOMKqWz/n3vr1NFSxQiyP+zk2mXsoMA/i/7qV6LKut1t1A==",
      "license": "MIT",
      "dependencies": {
        "function-bind": "^1.1.2"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/http-errors": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/http-errors/-/http-errors-2.0.1.tgz",
      "integrity": "sha512-4FbRdAX+bSdmo4AUFuS0WNiPz8NgFt+r8ThgNWmlrjQjt1Q7ZR9+zTlce2859x4KSXrwIsaeTqDoKQmtP8pLmQ==",
      "license": "MIT",
      "dependencies": {
        "depd": "~2.0.0",
        "inherits": "~2.0.4",
        "setprototypeof": "~1.2.0",
        "statuses": "~2.0.2",
        "toidentifier": "~1.0.1"
      },
      "engines": {
        "node": ">= 0.8"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/https-proxy-agent": {
      "version": "7.0.6",
      "resolved": "https://registry.npmjs.org/https-proxy-agent/-/https-proxy-agent-7.0.6.tgz",
      "integrity": "sha512-vK9P5/iUfdl95AI+JVyUuIcVtd4ofvtrOr3HNtM2yxC9bnMbEdp3x01OhQNnjb8IJYi38VlTE3mBXwcfvywuSw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "agent-base": "^7.1.2",
        "debug": "4"
      },
      "engines": {
        "node": ">= 14"
      }
    },
    "node_modules/iconv-lite": {
      "version": "0.7.3",
      "resolved": "https://registry.npmjs.org/iconv-lite/-/iconv-lite-0.7.3.tgz",
      "integrity": "sha512-IKXpvIzjnC9XTAUbVBcMfGS0EPaIXtW6v+zr+RRp+hqULEpo0owZax6wyRwPOJbWbzjYspQwusTsfVr0ifh4uQ==",
      "license": "MIT",
      "dependencies": {
        "safer-buffer": ">= 2.1.2 < 3.0.0"
      },
      "engines": {
        "node": ">=0.10.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/ignore-by-default": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/ignore-by-default/-/ignore-by-default-1.0.1.tgz",
      "integrity": "sha512-Ius2VYcGNk7T90CppJqcIkS5ooHUZyIQK+ClZfMfMNFEF9VSE73Fq+906u/CWu92x4gzZMWOwfFYckPObzdEbA==",
      "dev": true,
      "license": "ISC"
    },
    "node_modules/inherits": {
      "version": "2.0.4",
      "resolved": "https://registry.npmjs.org/inherits/-/inherits-2.0.4.tgz",
      "integrity": "sha512-k/vGaX4/Yla3WzyMCvTQOXYeIHvqOKtnqBduzTHpzpQZzAskKMhZ2K+EnBiSM9zGSoIFeMpXKxa4dYeZIQqewQ==",
      "license": "ISC"
    },
    "node_modules/ipaddr.js": {
      "version": "1.9.1",
      "resolved": "https://registry.npmjs.org/ipaddr.js/-/ipaddr.js-1.9.1.tgz",
      "integrity": "sha512-0KI/607xoxSToH7GjN1FfSbLoU0+btTicjsQSWQlh/hZykN8KpmMf7uYwPW3R+akZ6R/w18ZlXSHBYXiYUPO3g==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.10"
      }
    },
    "node_modules/is-binary-path": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/is-binary-path/-/is-binary-path-2.1.0.tgz",
      "integrity": "sha512-ZMERYes6pDydyuGidse7OsHxtbI7WVeUEozgR/g7rd0xUimYNlvZRE/K2MgZTjWy725IfelLeVcEM97mmtRGXw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "binary-extensions": "^2.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/is-extglob": {
      "version": "2.1.1",
      "resolved": "https://registry.npmjs.org/is-extglob/-/is-extglob-2.1.1.tgz",
      "integrity": "sha512-SbKbANkN603Vi4jEZv49LeVJMn4yGwsbzZworEoyEiutsN3nJYdbO36zfhGJ6QEDpOZIFkDtnq5JRxmvl3jsoQ==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/is-glob": {
      "version": "4.0.3",
      "resolved": "https://registry.npmjs.org/is-glob/-/is-glob-4.0.3.tgz",
      "integrity": "sha512-xelSayHH36ZgE7ZWhli7pW34hNbNl8Ojv5KVmkJD4hBdD3th8Tfk9vYasLM+mXWOZhFkgZfxhLSnrwRr4elSSg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "is-extglob": "^2.1.1"
      },
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/is-number": {
      "version": "7.0.0",
      "resolved": "https://registry.npmjs.org/is-number/-/is-number-7.0.0.tgz",
      "integrity": "sha512-41Cifkg6e8TylSpdtTpeLVMqvSBEVzTttHvERD741+pnZ8ANv0004MRL43QKPDlK9cGvNp6NZWZUBlbGXYxxng==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=0.12.0"
      }
    },
    "node_modules/is-promise": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/is-promise/-/is-promise-4.0.0.tgz",
      "integrity": "sha512-hvpoI6korhJMnej285dSg6nu1+e6uxs7zG3BYAm5byqDsgJNWwxzM6z6iZiAgQR4TJ30JmBTOwqZUw3WlyH3AQ==",
      "license": "MIT"
    },
    "node_modules/jsonwebtoken": {
      "version": "9.0.3",
      "resolved": "https://registry.npmjs.org/jsonwebtoken/-/jsonwebtoken-9.0.3.tgz",
      "integrity": "sha512-MT/xP0CrubFRNLNKvxJ2BYfy53Zkm++5bX9dtuPbqAeQpTVe0MQTFhao8+Cp//EmJp244xt6Drw/GVEGCUj40g==",
      "license": "MIT",
      "dependencies": {
        "jws": "^4.0.1",
        "lodash.includes": "^4.3.0",
        "lodash.isboolean": "^3.0.3",
        "lodash.isinteger": "^4.0.4",
        "lodash.isnumber": "^3.0.3",
        "lodash.isplainobject": "^4.0.6",
        "lodash.isstring": "^4.0.1",
        "lodash.once": "^4.0.0",
        "ms": "^2.1.1",
        "semver": "^7.5.4"
      },
      "engines": {
        "node": ">=12",
        "npm": ">=6"
      }
    },
    "node_modules/jwa": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/jwa/-/jwa-2.0.1.tgz",
      "integrity": "sha512-hRF04fqJIP8Abbkq5NKGN0Bbr3JxlQ+qhZufXVr0DvujKy93ZCbXZMHDL4EOtodSbCWxOqR8MS1tXA5hwqCXDg==",
      "license": "MIT",
      "dependencies": {
        "buffer-equal-constant-time": "^1.0.1",
        "ecdsa-sig-formatter": "1.0.11",
        "safe-buffer": "^5.0.1"
      }
    },
    "node_modules/jws": {
      "version": "4.0.1",
      "resolved": "https://registry.npmjs.org/jws/-/jws-4.0.1.tgz",
      "integrity": "sha512-EKI/M/yqPncGUUh44xz0PxSidXFr/+r0pA70+gIYhjv+et7yxM+s29Y+VGDkovRofQem0fs7Uvf4+YmAdyRduA==",
      "license": "MIT",
      "dependencies": {
        "jwa": "^2.0.1",
        "safe-buffer": "^5.0.1"
      }
    },
    "node_modules/kareem": {
      "version": "2.6.3",
      "resolved": "https://registry.npmjs.org/kareem/-/kareem-2.6.3.tgz",
      "integrity": "sha512-C3iHfuGUXK2u8/ipq9LfjFfXFxAZMQJJq7vLS45r3D9Y2xQ/m4S8zaR4zMLFWh9AsNPXmcFfUDhTEO8UIC/V6Q==",
      "license": "Apache-2.0",
      "engines": {
        "node": ">=12.0.0"
      }
    },
    "node_modules/locate-path": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/locate-path/-/locate-path-5.0.0.tgz",
      "integrity": "sha512-t7hw9pI+WvuwNJXwk5zVHpyhIqzg2qTlklJOf0mVxGSbe3Fp2VieZcduNYjaLDoy6p9uGpQEGWG87WpMKlNq8g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "p-locate": "^4.1.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/lodash": {
      "version": "4.18.1",
      "resolved": "https://registry.npmjs.org/lodash/-/lodash-4.18.1.tgz",
      "integrity": "sha512-dMInicTPVE8d1e5otfwmmjlxkZoUpiVLwyeTdUsi/Caj/gfzzblBcCE5sRHV/AsjuCmxWrte2TNGSYuCeCq+0Q==",
      "license": "MIT"
    },
    "node_modules/lodash.includes": {
      "version": "4.3.0",
      "resolved": "https://registry.npmjs.org/lodash.includes/-/lodash.includes-4.3.0.tgz",
      "integrity": "sha512-W3Bx6mdkRTGtlJISOvVD/lbqjTlPPUDTMnlXZFnVwi9NKJ6tiAk6LVdlhZMm17VZisqhKcgzpO5Wz91PCt5b0w==",
      "license": "MIT"
    },
    "node_modules/lodash.isboolean": {
      "version": "3.0.3",
      "resolved": "https://registry.npmjs.org/lodash.isboolean/-/lodash.isboolean-3.0.3.tgz",
      "integrity": "sha512-Bz5mupy2SVbPHURB98VAcw+aHh4vRV5IPNhILUCsOzRmsTmSQ17jIuqopAentWoehktxGd9e/hbIXq980/1QJg==",
      "license": "MIT"
    },
    "node_modules/lodash.isinteger": {
      "version": "4.0.4",
      "resolved": "https://registry.npmjs.org/lodash.isinteger/-/lodash.isinteger-4.0.4.tgz",
      "integrity": "sha512-DBwtEWN2caHQ9/imiNeEA5ys1JoRtRfY3d7V9wkqtbycnAmTvRRmbHKDV4a0EYc678/dia0jrte4tjYwVBaZUA==",
      "license": "MIT"
    },
    "node_modules/lodash.isnumber": {
      "version": "3.0.3",
      "resolved": "https://registry.npmjs.org/lodash.isnumber/-/lodash.isnumber-3.0.3.tgz",
      "integrity": "sha512-QYqzpfwO3/CWf3XP+Z+tkQsfaLL/EnUlXWVkIk5FUPc4sBdTehEqZONuyRt2P67PXAk+NXmTBcc97zw9t1FQrw==",
      "license": "MIT"
    },
    "node_modules/lodash.isplainobject": {
      "version": "4.0.6",
      "resolved": "https://registry.npmjs.org/lodash.isplainobject/-/lodash.isplainobject-4.0.6.tgz",
      "integrity": "sha512-oSXzaWypCMHkPC3NvBEaPHf0KsA5mvPrOPgQWDsbg8n7orZ290M0BmC/jgRZ4vcJ6DTAhjrsSYgdsW/F+MFOBA==",
      "license": "MIT"
    },
    "node_modules/lodash.isstring": {
      "version": "4.0.1",
      "resolved": "https://registry.npmjs.org/lodash.isstring/-/lodash.isstring-4.0.1.tgz",
      "integrity": "sha512-0wJxfxH1wgO3GrbuP+dTTk7op+6L41QCXbGINEmD+ny/G/eCqGzxyCsh7159S+mgDDcoarnBw6PC1PS5+wUGgw==",
      "license": "MIT"
    },
    "node_modules/lodash.once": {
      "version": "4.1.1",
      "resolved": "https://registry.npmjs.org/lodash.once/-/lodash.once-4.1.1.tgz",
      "integrity": "sha512-Sb487aTOCr9drQVL8pIxOzVhafOjZN9UU54hiN8PU3uAiSV7lx1yYNpbNmex2PK6dSJoNTSJUUswT651yww3Mg==",
      "license": "MIT"
    },
    "node_modules/make-dir": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/make-dir/-/make-dir-3.1.0.tgz",
      "integrity": "sha512-g3FeP20LNwhALb/6Cz6Dd4F2ngze0jz7tbzrD2wAV+o9FeNHe4rL+yK2md0J/fiSf1sa1ADhXqi5+oVwOM/eGw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "semver": "^6.0.0"
      },
      "engines": {
        "node": ">=8"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/make-dir/node_modules/semver": {
      "version": "6.3.1",
      "resolved": "https://registry.npmjs.org/semver/-/semver-6.3.1.tgz",
      "integrity": "sha512-BR7VvDCVHO+q2xBEWskxS6DJE1qRnb7DxzUrogb71CWoSficBxYsiAGd+Kl0mmq/MprG9yArRkyrQxTO6XjMzA==",
      "dev": true,
      "license": "ISC",
      "bin": {
        "semver": "bin/semver.js"
      }
    },
    "node_modules/math-intrinsics": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/math-intrinsics/-/math-intrinsics-1.1.0.tgz",
      "integrity": "sha512-/IXtbwEk5HTPyEwyKX6hGkYXxM9nbj64B+ilVJnC/R6B0pH5G4V3b0pVbL7DBj4tkhBAppbQUlf6F6Xl9LHu1g==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/media-typer": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/media-typer/-/media-typer-1.1.1.tgz",
      "integrity": "sha512-yz3xRaG20c6/BOzvYoDaGtPmGscs7YivItZEEqe6GbwNfHuxu9YNmvnEkMzKldAGY4/80pRcQRZSEnhquk9XuQ==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.8"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/memory-pager": {
      "version": "1.5.0",
      "resolved": "https://registry.npmjs.org/memory-pager/-/memory-pager-1.5.0.tgz",
      "integrity": "sha512-ZS4Bp4r/Zoeq6+NLJpP+0Zzm0pR8whtGPf1XExKLJBAczGMnSi3It14OiNCStjQjM6NU1okjQGSxgEZN8eBYKg==",
      "license": "MIT"
    },
    "node_modules/merge-descriptors": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/merge-descriptors/-/merge-descriptors-2.0.0.tgz",
      "integrity": "sha512-Snk314V5ayFLhp3fkUREub6WtjBfPdCPY1Ln8/8munuLuiYhsABgBVWsozAG+MWMbVEvcdcpbi9R7ww22l9Q3g==",
      "license": "MIT",
      "engines": {
        "node": ">=18"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/methods": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/methods/-/methods-1.1.2.tgz",
      "integrity": "sha512-iclAHeNqNm68zFtnZ0e+1L2yUIdvzNoauKU4WBA3VvH/vPFieF7qfRlwUZU+DA9P9bPXIS90ulxoUoCH23sV2w==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/mime": {
      "version": "2.6.0",
      "resolved": "https://registry.npmjs.org/mime/-/mime-2.6.0.tgz",
      "integrity": "sha512-USPkMeET31rOMiarsBNIHZKLGgvKc/LrjofAnBlOttf5ajRvqiRA8QsenbcooctK6d6Ts6aqZXBA+XbkKthiQg==",
      "dev": true,
      "license": "MIT",
      "bin": {
        "mime": "cli.js"
      },
      "engines": {
        "node": ">=4.0.0"
      }
    },
    "node_modules/mime-db": {
      "version": "1.54.0",
      "resolved": "https://registry.npmjs.org/mime-db/-/mime-db-1.54.0.tgz",
      "integrity": "sha512-aU5EJuIN2WDemCcAp2vFBfp/m4EAhWJnUNSSw0ixs7/kXbd6Pg64EmwJkNdFhB8aWt1sH2CTXrLxo/iAGV3oPQ==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/mime-types": {
      "version": "3.0.2",
      "resolved": "https://registry.npmjs.org/mime-types/-/mime-types-3.0.2.tgz",
      "integrity": "sha512-Lbgzdk0h4juoQ9fCKXW4by0UJqj+nOOrI9MJ1sSj4nI8aI2eo1qmvQEie4VD1glsS250n15LsWsYtCugiStS5A==",
      "license": "MIT",
      "dependencies": {
        "mime-db": "^1.54.0"
      },
      "engines": {
        "node": ">=18"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/minimatch": {
      "version": "10.2.6",
      "resolved": "https://registry.npmjs.org/minimatch/-/minimatch-10.2.6.tgz",
      "integrity": "sha512-vpLQEs+VLCr1nU0BXS07maYoFwlDAH0gngQuuttxIwutDFEMHq2blX+8vpgxDdK3J1PwjCJiep77OitTZ4Ll1A==",
      "dev": true,
      "license": "BlueOak-1.0.0",
      "dependencies": {
        "brace-expansion": "^5.0.8"
      },
      "engines": {
        "node": "18 || 20 || >=22"
      },
      "funding": {
        "url": "https://github.com/sponsors/isaacs"
      }
    },
    "node_modules/mongodb": {
      "version": "6.21.0",
      "resolved": "https://registry.npmjs.org/mongodb/-/mongodb-6.21.0.tgz",
      "integrity": "sha512-URyb/VXMjJ4da46OeSXg+puO39XH9DeQpWCslifrRn9JWugy0D+DvvBvkm2WxmHe61O/H19JM66p1z7RHVkZ6A==",
      "dev": true,
      "license": "Apache-2.0",
      "dependencies": {
        "@mongodb-js/saslprep": "^1.3.0",
        "bson": "^6.10.4",
        "mongodb-connection-string-url": "^3.0.2"
      },
      "engines": {
        "node": ">=16.20.1"
      },
      "peerDependencies": {
        "@aws-sdk/credential-providers": "^3.188.0",
        "@mongodb-js/zstd": "^1.1.0 || ^2.0.0",
        "gcp-metadata": "^5.2.0",
        "kerberos": "^2.0.1",
        "mongodb-client-encryption": ">=6.0.0 <7",
        "snappy": "^7.3.2",
        "socks": "^2.7.1"
      },
      "peerDependenciesMeta": {
        "@aws-sdk/credential-providers": {
          "optional": true
        },
        "@mongodb-js/zstd": {
          "optional": true
        },
        "gcp-metadata": {
          "optional": true
        },
        "kerberos": {
          "optional": true
        },
        "mongodb-client-encryption": {
          "optional": true
        },
        "snappy": {
          "optional": true
        },
        "socks": {
          "optional": true
        }
      }
    },
    "node_modules/mongodb-connection-string-url": {
      "version": "3.0.2",
      "resolved": "https://registry.npmjs.org/mongodb-connection-string-url/-/mongodb-connection-string-url-3.0.2.tgz",
      "integrity": "sha512-rMO7CGo/9BFwyZABcKAWL8UJwH/Kc2x0g72uhDWzG48URRax5TCIcJ7Rc3RZqffZzO/Gwff/jyKwCU9TN8gehA==",
      "license": "Apache-2.0",
      "dependencies": {
        "@types/whatwg-url": "^11.0.2",
        "whatwg-url": "^14.1.0 || ^13.0.0"
      }
    },
    "node_modules/mongodb-memory-server": {
      "version": "10.4.3",
      "resolved": "https://registry.npmjs.org/mongodb-memory-server/-/mongodb-memory-server-10.4.3.tgz",
      "integrity": "sha512-CDZvFisXvGIigsIw5gqH6r9NI/zxGa/uRdutgUL/isuJh+inj0YXb7Ykw6oFMFzqgTJWb7x0I5DpzrqCstBWpg==",
      "dev": true,
      "hasInstallScript": true,
      "license": "MIT",
      "dependencies": {
        "mongodb-memory-server-core": "10.4.3",
        "tslib": "^2.8.1"
      },
      "engines": {
        "node": ">=16.20.1"
      }
    },
    "node_modules/mongodb-memory-server-core": {
      "version": "10.4.3",
      "resolved": "https://registry.npmjs.org/mongodb-memory-server-core/-/mongodb-memory-server-core-10.4.3.tgz",
      "integrity": "sha512-IPjlw73IoSYopnqBibQKxmAXMbOEPf5uGAOsBcaUiNH/TOI7V19WO+K7n5KYtnQ9FqzLGLpvwCGuPOTBSg4s5Q==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "async-mutex": "^0.5.0",
        "camelcase": "^6.3.0",
        "debug": "^4.4.3",
        "find-cache-dir": "^3.3.2",
        "follow-redirects": "^1.15.11",
        "https-proxy-agent": "^7.0.6",
        "mongodb": "^6.9.0",
        "new-find-package-json": "^2.0.0",
        "semver": "^7.7.3",
        "tar-stream": "^3.1.7",
        "tslib": "^2.8.1",
        "yauzl": "^3.2.0"
      },
      "engines": {
        "node": ">=16.20.1"
      }
    },
    "node_modules/mongoose": {
      "version": "8.24.7",
      "resolved": "https://registry.npmjs.org/mongoose/-/mongoose-8.24.7.tgz",
      "integrity": "sha512-+hrEOLpLGPgOt7S/UrcBAKZ4gvB6+5qf16jspWH5xQ8WtQu9lRTzcqy04ZNQrlIox4Pl6Nh2RzlNDPSOFw9rng==",
      "license": "MIT",
      "dependencies": {
        "bson": "^6.10.4",
        "kareem": "2.6.3",
        "mongodb": "~6.20.0",
        "mpath": "0.9.0",
        "mquery": "5.0.1",
        "ms": "2.1.3",
        "sift": "17.1.3"
      },
      "engines": {
        "node": ">=16.20.1"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/mongoose"
      }
    },
    "node_modules/mongoose/node_modules/mongodb": {
      "version": "6.20.0",
      "resolved": "https://registry.npmjs.org/mongodb/-/mongodb-6.20.0.tgz",
      "integrity": "sha512-Tl6MEIU3K4Rq3TSHd+sZQqRBoGlFsOgNrH5ltAcFBV62Re3Fd+FcaVf8uSEQFOJ51SDowDVttBTONMfoYWrWlQ==",
      "license": "Apache-2.0",
      "dependencies": {
        "@mongodb-js/saslprep": "^1.3.0",
        "bson": "^6.10.4",
        "mongodb-connection-string-url": "^3.0.2"
      },
      "engines": {
        "node": ">=16.20.1"
      },
      "peerDependencies": {
        "@aws-sdk/credential-providers": "^3.188.0",
        "@mongodb-js/zstd": "^1.1.0 || ^2.0.0",
        "gcp-metadata": "^5.2.0",
        "kerberos": "^2.0.1",
        "mongodb-client-encryption": ">=6.0.0 <7",
        "snappy": "^7.3.2",
        "socks": "^2.7.1"
      },
      "peerDependenciesMeta": {
        "@aws-sdk/credential-providers": {
          "optional": true
        },
        "@mongodb-js/zstd": {
          "optional": true
        },
        "gcp-metadata": {
          "optional": true
        },
        "kerberos": {
          "optional": true
        },
        "mongodb-client-encryption": {
          "optional": true
        },
        "snappy": {
          "optional": true
        },
        "socks": {
          "optional": true
        }
      }
    },
    "node_modules/mpath": {
      "version": "0.9.0",
      "resolved": "https://registry.npmjs.org/mpath/-/mpath-0.9.0.tgz",
      "integrity": "sha512-ikJRQTk8hw5DEoFVxHG1Gn9T/xcjtdnOKIU1JTmGjZZlg9LST2mBLmcX3/ICIbgJydT2GOc15RnNy5mHmzfSew==",
      "license": "MIT",
      "engines": {
        "node": ">=4.0.0"
      }
    },
    "node_modules/mquery": {
      "version": "5.0.1",
      "resolved": "https://registry.npmjs.org/mquery/-/mquery-5.0.1.tgz",
      "integrity": "sha512-C99lWV0TFI34pS008jBsi3JrE2xZPnTgUw5yApQR71nRP0hxLy8D5m1Lbbk83c8AQWJwdJ0329HzFtZ1MRTUIw==",
      "license": "MIT",
      "dependencies": {
        "debug": "4.x"
      },
      "engines": {
        "node": ">=14.0.0"
      }
    },
    "node_modules/ms": {
      "version": "2.1.3",
      "resolved": "https://registry.npmjs.org/ms/-/ms-2.1.3.tgz",
      "integrity": "sha512-6FlzubTLZG3J2a/NVCAleEhjzq5oxgHyaCU9yYXvcLsvoVaHJq/s5xXI6/XXP6tz7R9xAOtHnSO/tXtF3WRTlA==",
      "license": "MIT"
    },
    "node_modules/negotiator": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/negotiator/-/negotiator-1.1.0.tgz",
      "integrity": "sha512-NMPBRMJgiQHjbd8phG3Vebdx4kZ1H121rbl5IkMqeOsahptB9BKo/d7oJ3zTXqTgagn2bWlNSXkh0QUGM31RYg==",
      "license": "MIT",
      "dependencies": {
        "content-type": "^2.1.0"
      },
      "engines": {
        "node": ">=18"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/new-find-package-json": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/new-find-package-json/-/new-find-package-json-2.0.0.tgz",
      "integrity": "sha512-lDcBsjBSMlj3LXH2v/FW3txlh2pYTjmbOXPYJD93HI5EwuLzI11tdHSIpUMmfq/IOsldj4Ps8M8flhm+pCK4Ew==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "debug": "^4.3.4"
      },
      "engines": {
        "node": ">=12.22.0"
      }
    },
    "node_modules/nodemon": {
      "version": "3.1.14",
      "resolved": "https://registry.npmjs.org/nodemon/-/nodemon-3.1.14.tgz",
      "integrity": "sha512-jakjZi93UtB3jHMWsXL68FXSAosbLfY0In5gtKq3niLSkrWznrVBzXFNOEMJUfc9+Ke7SHWoAZsiMkNP3vq6Jw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "chokidar": "^3.5.2",
        "debug": "^4",
        "ignore-by-default": "^1.0.1",
        "minimatch": "^10.2.1",
        "pstree.remy": "^1.1.8",
        "semver": "^7.5.3",
        "simple-update-notifier": "^2.0.0",
        "supports-color": "^5.5.0",
        "touch": "^3.1.0",
        "undefsafe": "^2.0.5"
      },
      "bin": {
        "nodemon": "bin/nodemon.js"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/nodemon"
      }
    },
    "node_modules/normalize-path": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/normalize-path/-/normalize-path-3.0.0.tgz",
      "integrity": "sha512-6eZs5Ls3WtCisHWp9S2GUy8dqkpGi4BVSz3GaqiE6ezub0512ESztXUwUB6C6IKbQkY2Pnb/mD4WYojCRwcwLA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/object-assign": {
      "version": "4.1.1",
      "resolved": "https://registry.npmjs.org/object-assign/-/object-assign-4.1.1.tgz",
      "integrity": "sha512-rJgTQnkUnH1sFw8yT6VSU3zD3sWmu6sZhIseY8VX+GRu3P6F7Fu+JNDoXfklElbLJSnc3FUQHVe4cU5hj+BcUg==",
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/object-inspect": {
      "version": "1.13.4",
      "resolved": "https://registry.npmjs.org/object-inspect/-/object-inspect-1.13.4.tgz",
      "integrity": "sha512-W67iLl4J2EXEGTbfeHCffrjDfitvLANg0UlX3wFUUSTx92KXRFegMHUVgSqE+wvhAbi4WqjGg9czysTV2Epbew==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/on-finished": {
      "version": "2.4.2",
      "resolved": "https://registry.npmjs.org/on-finished/-/on-finished-2.4.2.tgz",
      "integrity": "sha512-ATWUv387i+nLD49EiDoOft5scf32Vsdz3ktrQJG9bi7jRFmaXTssvyvj1EmeKVVgvesbqUtvQQvaS2TpTukAZQ==",
      "license": "MIT",
      "dependencies": {
        "ee-first": "1.1.1"
      },
      "engines": {
        "node": ">= 0.8"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/once": {
      "version": "1.4.0",
      "resolved": "https://registry.npmjs.org/once/-/once-1.4.0.tgz",
      "integrity": "sha512-lNaJgI+2Q5URQBkccEKHTQOPaXdUxnZZElQTZY0MFUAuaEqe1E+Nyvgdz/aIyNi6Z9MzO5dv1H8n58/GELp3+w==",
      "license": "ISC",
      "dependencies": {
        "wrappy": "1"
      }
    },
    "node_modules/p-limit": {
      "version": "2.3.0",
      "resolved": "https://registry.npmjs.org/p-limit/-/p-limit-2.3.0.tgz",
      "integrity": "sha512-//88mFWSJx8lxCzwdAABTJL2MyWB12+eIY7MDL2SqLmAkeKU9qxRvWuSyTjm3FUmpBEMuFfckAIqEaVGUDxb6w==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "p-try": "^2.0.0"
      },
      "engines": {
        "node": ">=6"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/p-locate": {
      "version": "4.1.0",
      "resolved": "https://registry.npmjs.org/p-locate/-/p-locate-4.1.0.tgz",
      "integrity": "sha512-R79ZZ/0wAxKGu3oYMlz8jy/kbhsNrS7SKZ7PxEHBgJ5+F2mtFW2fK2cOtBh1cHYkQsbzFV7I+EoRKe6Yt0oK7A==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "p-limit": "^2.2.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/p-try": {
      "version": "2.2.0",
      "resolved": "https://registry.npmjs.org/p-try/-/p-try-2.2.0.tgz",
      "integrity": "sha512-R4nPAVTAU0B9D35/Gk3uJf/7XYbQcyohSKdvAxIRSNghFl4e71hVoGnBNQz9cWaXxO2I10KTC+3jMdvvoKw6dQ==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/parseurl": {
      "version": "1.3.3",
      "resolved": "https://registry.npmjs.org/parseurl/-/parseurl-1.3.3.tgz",
      "integrity": "sha512-CiyeOxFT/JZyN5m0z9PfXw4SCBJ6Sygz1Dpl0wqjlhDEGGBP1GnsUVEL0p63hoG1fcj3fHynXi9NYO4nWOL+qQ==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/path-exists": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/path-exists/-/path-exists-4.0.0.tgz",
      "integrity": "sha512-ak9Qy5Q7jYb2Wwcey5Fpvg2KoAc/ZIhLSLOSBmRmygPsGwkVVt0fZa0qrtMz+m6tJTAHfZQ8FnmB4MG4LWy7/w==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/path-to-regexp": {
      "version": "8.4.2",
      "resolved": "https://registry.npmjs.org/path-to-regexp/-/path-to-regexp-8.4.2.tgz",
      "integrity": "sha512-qRcuIdP69NPm4qbACK+aDogI5CBDMi1jKe0ry5rSQJz8JVLsC7jV8XpiJjGRLLol3N+R5ihGYcrPLTno6pAdBA==",
      "license": "MIT",
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/pend": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/pend/-/pend-1.2.0.tgz",
      "integrity": "sha512-F3asv42UuXchdzt+xXqfW1OGlVBe+mxa2mqI0pg5yAHZPvFmY3Y6drSf/GQ1A86WgWEN9Kzh/WrgKa6iGcHXLg==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/picomatch": {
      "version": "2.3.2",
      "resolved": "https://registry.npmjs.org/picomatch/-/picomatch-2.3.2.tgz",
      "integrity": "sha512-V7+vQEJ06Z+c5tSye8S+nHUfI51xoXIXjHQ99cQtKUkQqqO1kO/KCJUfZXuB47h/YBlDhah2H3hdUGXn8ie0oA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=8.6"
      },
      "funding": {
        "url": "https://github.com/sponsors/jonschlinkert"
      }
    },
    "node_modules/pkg-dir": {
      "version": "4.2.0",
      "resolved": "https://registry.npmjs.org/pkg-dir/-/pkg-dir-4.2.0.tgz",
      "integrity": "sha512-HRDzbaKjC+AOWVXxAU/x54COGeIv9eb+6CkDSQoNTt4XyWoIJvuPsXizxu/Fr23EiekbtZwmh1IcIG/l/a10GQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "find-up": "^4.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/proxy-addr": {
      "version": "2.0.8",
      "resolved": "https://registry.npmjs.org/proxy-addr/-/proxy-addr-2.0.8.tgz",
      "integrity": "sha512-5nnx0yGyVUcY6t9RnWcARWtwT9F1D8O9rt08htPvnd49W1IgZtmLkhu9WfMzQj1cFxjHIO6connUNVW5k7AVyQ==",
      "license": "MIT",
      "dependencies": {
        "forwarded": "0.2.0",
        "ipaddr.js": "1.9.1"
      },
      "engines": {
        "node": ">= 0.10"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/pstree.remy": {
      "version": "1.1.8",
      "resolved": "https://registry.npmjs.org/pstree.remy/-/pstree.remy-1.1.8.tgz",
      "integrity": "sha512-77DZwxQmxKnu3aR542U+X8FypNzbfJ+C5XQDk3uWjWxn6151aIMGthWYRXTqT1E5oJvg+ljaa2OJi+VfvCOQ8w==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/punycode": {
      "version": "2.3.1",
      "resolved": "https://registry.npmjs.org/punycode/-/punycode-2.3.1.tgz",
      "integrity": "sha512-vYt7UD1U9Wg6138shLtLOvdAu+8DsC/ilFtEVHcH+wydcSpNE20AfSOduf6MkRFahL5FY7X1oU7nKVZFtfq8Fg==",
      "license": "MIT",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/qs": {
      "version": "6.16.1",
      "resolved": "https://registry.npmjs.org/qs/-/qs-6.16.1.tgz",
      "integrity": "sha512-5Px6J7rfHBAGUhNQ3es4YzcOdBBw0SDcVtThJml4RdnKw4tKs2epA0kPZ+K8X+WiHktT93RHVcQ/3ym5aTCgtg==",
      "license": "BSD-3-Clause",
      "dependencies": {
        "es-define-property": "^1.0.1",
        "side-channel": "^1.1.1"
      },
      "engines": {
        "node": ">=0.6"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/range-parser": {
      "version": "1.3.0",
      "resolved": "https://registry.npmjs.org/range-parser/-/range-parser-1.3.0.tgz",
      "integrity": "sha512-hek2mFQpPuI4E1BBKrSto+BU3e3x4xuarsbiwr3+lf7p44juvFMV0XFWQAP3xUyqXA4RrXLIoaSUGbSt056ZMw==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/raw-body": {
      "version": "3.0.2",
      "resolved": "https://registry.npmjs.org/raw-body/-/raw-body-3.0.2.tgz",
      "integrity": "sha512-K5zQjDllxWkf7Z5xJdV0/B0WTNqx6vxG70zJE4N0kBs4LovmEYWJzQGxC9bS9RAKu3bgM40lrd5zoLJ12MQ5BA==",
      "license": "MIT",
      "dependencies": {
        "bytes": "~3.1.2",
        "http-errors": "~2.0.1",
        "iconv-lite": "~0.7.0",
        "unpipe": "~1.0.0"
      },
      "engines": {
        "node": ">= 0.10"
      }
    },
    "node_modules/readdirp": {
      "version": "3.6.0",
      "resolved": "https://registry.npmjs.org/readdirp/-/readdirp-3.6.0.tgz",
      "integrity": "sha512-hOS089on8RduqdbhvQ5Z37A0ESjsqz6qnRcffsMU3495FuTdqSm+7bhJ29JvIOsBDEEnan5DPu9t3To9VRlMzA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "picomatch": "^2.2.1"
      },
      "engines": {
        "node": ">=8.10.0"
      }
    },
    "node_modules/router": {
      "version": "2.2.0",
      "resolved": "https://registry.npmjs.org/router/-/router-2.2.0.tgz",
      "integrity": "sha512-nLTrUKm2UyiL7rlhapu/Zl45FwNgkZGaCpZbIHajDYgwlJCOzLSk+cIPAnsEqV955GjILJnKbdQC1nVPz+gAYQ==",
      "license": "MIT",
      "dependencies": {
        "debug": "^4.4.0",
        "depd": "^2.0.0",
        "is-promise": "^4.0.0",
        "parseurl": "^1.3.3",
        "path-to-regexp": "^8.0.0"
      },
      "engines": {
        "node": ">= 18"
      }
    },
    "node_modules/safe-buffer": {
      "version": "5.2.1",
      "resolved": "https://registry.npmjs.org/safe-buffer/-/safe-buffer-5.2.1.tgz",
      "integrity": "sha512-rp3So07KcdmmKbGvgaNxQSJr7bGVSVk5S9Eq1F+ppbRo70+YeaDxkw5Dd8NPN+GD6bjnYm2VuPuCXmpuYvmCXQ==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/feross"
        },
        {
          "type": "patreon",
          "url": "https://www.patreon.com/feross"
        },
        {
          "type": "consulting",
          "url": "https://feross.org/support"
        }
      ],
      "license": "MIT"
    },
    "node_modules/safer-buffer": {
      "version": "2.1.2",
      "resolved": "https://registry.npmjs.org/safer-buffer/-/safer-buffer-2.1.2.tgz",
      "integrity": "sha512-YZo3K82SD7Riyi0E1EQPojLz7kpepnSQI9IyPbHHg1XXXevb5dJI7tpyN2ADxGcQbHG7vcyRHk0cbwqcQriUtg==",
      "license": "MIT"
    },
    "node_modules/semver": {
      "version": "7.8.5",
      "resolved": "https://registry.npmjs.org/semver/-/semver-7.8.5.tgz",
      "integrity": "sha512-Y7/KDsb8LjooZpwaqGyulO6DQlksgCncchHGk+sZIY4SBvUocMBEFH5Ur1fI4dV+Jvl0w6cjvucaIi40puRioA==",
      "license": "ISC",
      "bin": {
        "semver": "bin/semver.js"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/send": {
      "version": "1.2.1",
      "resolved": "https://registry.npmjs.org/send/-/send-1.2.1.tgz",
      "integrity": "sha512-1gnZf7DFcoIcajTjTwjwuDjzuz4PPcY2StKPlsGAQ1+YH20IRVrBaXSWmdjowTJ6u8Rc01PoYOGHXfP1mYcZNQ==",
      "license": "MIT",
      "dependencies": {
        "debug": "^4.4.3",
        "encodeurl": "^2.0.0",
        "escape-html": "^1.0.3",
        "etag": "^1.8.1",
        "fresh": "^2.0.0",
        "http-errors": "^2.0.1",
        "mime-types": "^3.0.2",
        "ms": "^2.1.3",
        "on-finished": "^2.4.1",
        "range-parser": "^1.2.1",
        "statuses": "^2.0.2"
      },
      "engines": {
        "node": ">= 18"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/serve-static": {
      "version": "2.2.1",
      "resolved": "https://registry.npmjs.org/serve-static/-/serve-static-2.2.1.tgz",
      "integrity": "sha512-xRXBn0pPqQTVQiC8wyQrKs2MOlX24zQ0POGaj0kultvoOCstBQM5yvOhAVSUwOMjQtTvsPWoNCHfPGwaaQJhTw==",
      "license": "MIT",
      "dependencies": {
        "encodeurl": "^2.0.0",
        "escape-html": "^1.0.3",
        "parseurl": "^1.3.3",
        "send": "^1.2.0"
      },
      "engines": {
        "node": ">= 18"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/setprototypeof": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/setprototypeof/-/setprototypeof-1.2.0.tgz",
      "integrity": "sha512-E5LDX7Wrp85Kil5bhZv46j8jOeboKq5JMmYM3gVGdGH8xFpPWXUMsNrlODCrkoxMEeNi/XZIwuRvY4XNwYMJpw==",
      "license": "ISC"
    },
    "node_modules/side-channel": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/side-channel/-/side-channel-1.1.1.tgz",
      "integrity": "sha512-6x6dK6zJdpTzF4sQeNYxwtvBzf6Eg4GtlesS94HOvTudUeyK2WXAaIfmDgsyslYrRBeFIlsi54AYsFGUuhmvrQ==",
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0",
        "object-inspect": "^1.13.4",
        "side-channel-list": "^1.0.1",
        "side-channel-map": "^1.0.1",
        "side-channel-weakmap": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/side-channel-list": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/side-channel-list/-/side-channel-list-1.0.1.tgz",
      "integrity": "sha512-mjn/0bi/oUURjc5Xl7IaWi/OJJJumuoJFQJfDDyO46+hBWsfaVM65TBHq2eoZBhzl9EchxOijpkbRC8SVBQU0w==",
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0",
        "object-inspect": "^1.13.4"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/side-channel-map": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/side-channel-map/-/side-channel-map-1.0.1.tgz",
      "integrity": "sha512-VCjCNfgMsby3tTdo02nbjtM/ewra6jPHmpThenkTYh8pG9ucZ/1P8So4u4FGBek/BjpOVsDCMoLA/iuBKIFXRA==",
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.2",
        "es-errors": "^1.3.0",
        "get-intrinsic": "^1.2.5",
        "object-inspect": "^1.13.3"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/side-channel-weakmap": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/side-channel-weakmap/-/side-channel-weakmap-1.0.2.tgz",
      "integrity": "sha512-WPS/HvHQTYnHisLo9McqBHOJk2FkHO/tlpvldyrnem4aeQp4hai3gythswg6p01oSoTl58rcpiFAjF2br2Ak2A==",
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.2",
        "es-errors": "^1.3.0",
        "get-intrinsic": "^1.2.5",
        "object-inspect": "^1.13.3",
        "side-channel-map": "^1.0.1"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/sift": {
      "version": "17.1.3",
      "resolved": "https://registry.npmjs.org/sift/-/sift-17.1.3.tgz",
      "integrity": "sha512-Rtlj66/b0ICeFzYTuNvX/EF1igRbbnGSvEyT79McoZa/DeGhMyC5pWKOEsZKnpkqtSeovd5FL/bjHWC3CIIvCQ==",
      "license": "MIT"
    },
    "node_modules/simple-update-notifier": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/simple-update-notifier/-/simple-update-notifier-2.0.0.tgz",
      "integrity": "sha512-a2B9Y0KlNXl9u/vsW6sTIu9vGEpfKu2wRV6l1H3XEas/0gUIzGzBoP/IouTcUQbm9JWZLH3COxyn03TYlFax6w==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "semver": "^7.5.3"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/sparse-bitfield": {
      "version": "3.0.3",
      "resolved": "https://registry.npmjs.org/sparse-bitfield/-/sparse-bitfield-3.0.3.tgz",
      "integrity": "sha512-kvzhi7vqKTfkh0PZU+2D2PIllw2ymqJKujUcyPMd9Y75Nv4nPbGJZXNhxsgdQab2BmlDct1YnfQCguEvHr7VsQ==",
      "license": "MIT",
      "dependencies": {
        "memory-pager": "^1.0.2"
      }
    },
    "node_modules/statuses": {
      "version": "2.0.2",
      "resolved": "https://registry.npmjs.org/statuses/-/statuses-2.0.2.tgz",
      "integrity": "sha512-DvEy55V3DB7uknRo+4iOGT5fP1slR8wQohVdknigZPMpMstaKJQWhwiYBACJE3Ul2pTnATihhBYnRhZQHGBiRw==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/streamx": {
      "version": "2.28.1",
      "resolved": "https://registry.npmjs.org/streamx/-/streamx-2.28.1.tgz",
      "integrity": "sha512-zEzXb0s5Cds7tqMH6rhZ05lcJydCWiQPEwiNngVqzsxCc962vLY4Uw+mW7od8kDH258k2Uz/JrOkdIAAhSh9VA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "events-universal": "^1.0.0",
        "fast-fifo": "^1.3.2",
        "text-decoder": "^1.1.0"
      }
    },
    "node_modules/superagent": {
      "version": "10.4.1",
      "resolved": "https://registry.npmjs.org/superagent/-/superagent-10.4.1.tgz",
      "integrity": "sha512-PVMkMrhKrSTtFhUU8jiWuGh/gyRMKiyCTCmm0+qVzRNxlfntmRKJkDhlEXN62x3HIb33sQ4kmL8lcSdccWAchQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "component-emitter": "^1.3.1",
        "cookiejar": "^2.1.4",
        "debug": "^4.3.7",
        "fast-safe-stringify": "^2.1.1",
        "form-data": "^4.0.5",
        "formidable": "^3.5.4",
        "methods": "^1.1.2",
        "mime": "2.6.0",
        "qs": "^6.14.1"
      },
      "engines": {
        "node": ">=14.18.0"
      }
    },
    "node_modules/supertest": {
      "version": "7.3.1",
      "resolved": "https://registry.npmjs.org/supertest/-/supertest-7.3.1.tgz",
      "integrity": "sha512-vNaNCFoCR/edDbErQZp5KLNT8R4dSPHX7rlDLoE8hWLAm/878j6ShMbe8HK/E6RwwuhlSXVelXAIg9AxR5WWPw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "cookie-signature": "^1.2.2",
        "methods": "^1.1.2",
        "superagent": "^10.3.0"
      },
      "engines": {
        "node": ">=14.18.0"
      }
    },
    "node_modules/supports-color": {
      "version": "5.5.0",
      "resolved": "https://registry.npmjs.org/supports-color/-/supports-color-5.5.0.tgz",
      "integrity": "sha512-QjVjwdXIt408MIiAqCX4oUKsgU2EqAGzs2Ppkm4aQYbjm+ZEWEcW4SfFNTr4uMNZma0ey4f5lgLrkB0aX0QMow==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "has-flag": "^3.0.0"
      },
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/tar-stream": {
      "version": "3.2.2",
      "resolved": "https://registry.npmjs.org/tar-stream/-/tar-stream-3.2.2.tgz",
      "integrity": "sha512-+8NeqHRjQWH9nYlwo2gamAMImZCVzI4UoEgDpWorBt9OEfppiZn+uSkskzQKPWIZyji/C8fpWO7u69G0DX0tbg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "b4a": "^1.9.0",
        "bare-fs": "^4.8.2",
        "fast-fifo": "^1.3.2",
        "streamx": "^2.28.1"
      }
    },
    "node_modules/teex": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/teex/-/teex-1.0.1.tgz",
      "integrity": "sha512-eYE6iEI62Ni1H8oIa7KlDU6uQBtqr4Eajni3wX7rpfXD8ysFx8z0+dri+KWEPWpBsxXfxu58x/0jvTVT1ekOSg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "streamx": "^2.12.5"
      }
    },
    "node_modules/text-decoder": {
      "version": "1.2.7",
      "resolved": "https://registry.npmjs.org/text-decoder/-/text-decoder-1.2.7.tgz",
      "integrity": "sha512-vlLytXkeP4xvEq2otHeJfSQIRyWxo/oZGEbXrtEEF9Hnmrdly59sUbzZ/QgyWuLYHctCHxFF4tRQZNQ9k60ExQ==",
      "dev": true,
      "license": "Apache-2.0",
      "dependencies": {
        "b4a": "^1.6.4"
      }
    },
    "node_modules/to-regex-range": {
      "version": "5.0.1",
      "resolved": "https://registry.npmjs.org/to-regex-range/-/to-regex-range-5.0.1.tgz",
      "integrity": "sha512-65P7iz6X5yEr1cwcgvQxbbIw7Uk3gOy5dIdtZ4rDveLqhrdJP+Li/Hx6tyK0NEb+2GCyneCMJiGqrADCSNk8sQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "is-number": "^7.0.0"
      },
      "engines": {
        "node": ">=8.0"
      }
    },
    "node_modules/toidentifier": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/toidentifier/-/toidentifier-1.0.1.tgz",
      "integrity": "sha512-o5sSPKEkg/DIQNmH43V0/uerLrpzVedkUh8tGNvaeXpfpuwjKenlSox/2O/BTlZUtEe+JG7s5YhEz608PlAHRA==",
      "license": "MIT",
      "engines": {
        "node": ">=0.6"
      }
    },
    "node_modules/touch": {
      "version": "3.1.1",
      "resolved": "https://registry.npmjs.org/touch/-/touch-3.1.1.tgz",
      "integrity": "sha512-r0eojU4bI8MnHr8c5bNo7lJDdI2qXlWWJk6a9EAFG7vbhTjElYhBVS3/miuE0uOuoLdb8Mc/rVfsmm6eo5o9GA==",
      "dev": true,
      "license": "ISC",
      "bin": {
        "nodetouch": "bin/nodetouch.js"
      }
    },
    "node_modules/tr46": {
      "version": "5.1.1",
      "resolved": "https://registry.npmjs.org/tr46/-/tr46-5.1.1.tgz",
      "integrity": "sha512-hdF5ZgjTqgAntKkklYw0R03MG2x/bSzTtkxmIRw/sTNV8YXsCJ1tfLAX23lhxhHJlEf3CRCOCGGWw3vI3GaSPw==",
      "license": "MIT",
      "dependencies": {
        "punycode": "^2.3.1"
      },
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/tslib": {
      "version": "2.8.1",
      "resolved": "https://registry.npmjs.org/tslib/-/tslib-2.8.1.tgz",
      "integrity": "sha512-oJFu94HQb+KVduSUQL7wnpmqnfmLsOA/nAh6b6EH0wCEoK0/mPeXU6c3wKDV83MkOuHPRHtSXKKU99IBazS/2w==",
      "dev": true,
      "license": "0BSD"
    },
    "node_modules/type-is": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/type-is/-/type-is-2.1.0.tgz",
      "integrity": "sha512-faYHw0anBbc/kWF3zFTEnxSFOAGUX9GFbOBthvDdLsIlEoWOFOtS0zgCiQYwIskL9iGXZL3kAXD8OoZ4GmMATA==",
      "license": "MIT",
      "dependencies": {
        "content-type": "^2.0.0",
        "media-typer": "^1.1.0",
        "mime-types": "^3.0.0"
      },
      "engines": {
        "node": ">= 18"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/undefsafe": {
      "version": "2.0.5",
      "resolved": "https://registry.npmjs.org/undefsafe/-/undefsafe-2.0.5.tgz",
      "integrity": "sha512-WxONCrssBM8TSPRqN5EmsjVrsv4A8X12J4ArBiiayv3DyyG3ZlIg6yysuuSYdZsVz3TKcTg2fd//Ujd4CHV1iA==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/unpipe": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/unpipe/-/unpipe-1.0.0.tgz",
      "integrity": "sha512-pjy2bYhSsufwWlKwPc+l3cN7+wuJlK6uz0YdJEOlQDbl6jo/YlPi4mb8agUkVC8BF7V8NuzeyPNqRksA3hztKQ==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/validator": {
      "version": "13.15.35",
      "resolved": "https://registry.npmjs.org/validator/-/validator-13.15.35.tgz",
      "integrity": "sha512-TQ5pAGhd5whStmqWvYF4OjQROlmv9SMFVt37qoCBdqRffuuklWYQlCNnEs2ZaIBD1kZRNnikiZOS1eqgkar0iw==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.10"
      }
    },
    "node_modules/vary": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/vary/-/vary-1.1.2.tgz",
      "integrity": "sha512-BNGbWLfd0eUPabhkXUVm0j8uuvREyTh5ovRa/dyow/BqAbZJyC+5fU+IzQOzmAKzYqYRAISoRhdQr3eIZ/PXqg==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/webidl-conversions": {
      "version": "7.0.0",
      "resolved": "https://registry.npmjs.org/webidl-conversions/-/webidl-conversions-7.0.0.tgz",
      "integrity": "sha512-VwddBukDzu71offAQR975unBIGqfKZpM+8ZX6ySk8nYhVoo5CYaZyzt3YBvYtRtO+aoGlqxPg/B87NGVZ/fu6g==",
      "license": "BSD-2-Clause",
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/whatwg-url": {
      "version": "14.2.0",
      "resolved": "https://registry.npmjs.org/whatwg-url/-/whatwg-url-14.2.0.tgz",
      "integrity": "sha512-De72GdQZzNTUBBChsXueQUnPKDkg/5A5zp7pFDuQAj5UFoENpiACU0wlCvzpAGnTkj++ihpKwKyYewn/XNUbKw==",
      "license": "MIT",
      "dependencies": {
        "tr46": "^5.1.0",
        "webidl-conversions": "^7.0.0"
      },
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/wrappy": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/wrappy/-/wrappy-1.0.2.tgz",
      "integrity": "sha512-l4Sp/DRseor9wL6EvV2+TuQn63dMkPjZ/sp9XkghTEbV9KlPS1xUsZ3u7/IQO4wxtcFB4bgpQPRcR3QCvezPcQ==",
      "license": "ISC"
    },
    "node_modules/yauzl": {
      "version": "3.4.0",
      "resolved": "https://registry.npmjs.org/yauzl/-/yauzl-3.4.0.tgz",
      "integrity": "sha512-jIH9yLR9wqr0wOS0TpBvo/g/2UgZH5qePVbjgRliiF0BYvOZyaBknKsF+x9Iht0O6sqgnB93rCICdOZFecJuDw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "pend": "~1.2.0"
      },
      "engines": {
        "node": ">=12"
      }
    }
  }
}

````

## `package.json`

````json
{
  "name": "modular-mvc-course-api",
  "version": "1.0.0",
  "private": true,
  "description": "Express and MongoDB REST API with modular MVC architecture",
  "main": "server.js",
  "type": "commonjs",
  "engines": { "node": ">=22" },
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "node --test --test-concurrency=1 tests/*.test.js"
  },
  "dependencies": {
    "bcryptjs": "^3.0.2",
    "cors": "^2.8.5",
    "dotenv": "^17.2.3",
    "express": "^5.1.0",
    "express-validator": "^7.3.0",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.19.1"
  },
  "devDependencies": {
    "mongodb-memory-server": "^10.2.3",
    "nodemon": "^3.1.10",
    "supertest": "^7.1.4"
  }
}

````

## `server.js`

````javascript
const mongoose = require('mongoose');
const { env, validateEnv } = require('./src/config/env');
const app = require('./src/app');
const connectDB = require('./src/config/db');

async function start() {
  validateEnv();
  await connectDB();
  const server = app.listen(env.port, () => {
    console.log(`API running on http://localhost:${env.port}`);
  });

  server.on('error', () => {
    console.error('HTTP server failed to start; check PORT and whether it is already in use');
    void mongoose.disconnect().finally(() => process.exit(1));
  });

  let shuttingDown = false;
  function shutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`${signal} received; closing server`);
    const timeout = setTimeout(() => process.exit(1), 10000);
    timeout.unref();
    server.close(() => {
      void mongoose.disconnect()
        .then(() => { clearTimeout(timeout); process.exit(0); })
        .catch(() => process.exit(1));
    });
  }
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch(async (error) => {
  // Avoid printing connection strings, which can contain database credentials.
  console.error('Startup failed. Check .env, MongoDB connectivity, and database permissions.');
  if (!['MongoServerSelectionError', 'MongoParseError', 'MongoServerError'].includes(error.name)) {
    console.error(error.message);
  }
  await mongoose.disconnect();
  process.exit(1);
});

````

## `src/app.js`

````javascript
const express = require('express');
const cors = require('cors');
const { env } = require('./config/env');
const authRoutes = require('./modules/auth/auth.routes');
const categoryRoutes = require('./modules/categories/category.routes');
const courseRoutes = require('./modules/courses/course.routes');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();
app.disable('x-powered-by');
app.use(cors({
  origin: env.corsOrigin === '*'
    ? '*'
    : env.corsOrigin.split(',').map((origin) => origin.trim()).filter(Boolean),
  // Continue preflight requests so they use the JSON response envelope, too.
  preflightContinue: true,
}));
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    return res.status(200).json({ success: true, message: 'Preflight successful', data: null });
  }
  return next();
});
app.use(express.json({ limit: '100kb' }));

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/courses', courseRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;

````

## `src/config/db.js`

````javascript
const mongoose = require('mongoose');
const { env } = require('./env');

async function connectDB() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 10000 });
  // Build unique indexes before accepting writes, including on a fresh database.
  await Promise.all(Object.values(mongoose.models).map((model) => model.init()));
  console.log('MongoDB connected');
}

module.exports = connectDB;

````

## `src/config/env.js`

````javascript
const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '../../.env'), quiet: true });

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
};

function validateEnv() {
  if (!['development', 'test', 'production'].includes(env.nodeEnv)) {
    throw new Error('NODE_ENV must be development, test, or production');
  }
  if (!Number.isInteger(env.port) || env.port < 1 || env.port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }
  if (!env.mongoUri || !/^mongodb(?:\+srv)?:\/\//.test(env.mongoUri)) {
    throw new Error('MONGO_URI must be a MongoDB connection string');
  }
  if (!env.jwtSecret || Buffer.byteLength(env.jwtSecret, 'utf8') < 32 ||
      env.jwtSecret === 'replace_this_with_a_random_secret') {
    throw new Error('Set JWT_SECRET to a random secret of at least 32 bytes');
  }
  if (!/^[1-9]\d*[smhd]$/.test(env.jwtExpiresIn)) {
    throw new Error('JWT_EXPIRES_IN must include a unit, for example 30m, 12h, or 7d');
  }
}

module.exports = { env, validateEnv };

````

## `src/middleware/auth.js`

````javascript
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../modules/auth/auth.model');
const { env } = require('../config/env');
const ApiError = require('../utils/ApiError');

async function protect(req, res, next) {
  const match = /^Bearer\s+(\S+)$/i.exec(req.get('Authorization') || '');
  if (!match) throw new ApiError(401, 'Authentication required: provide a Bearer token');

  let decoded;
  try {
    decoded = jwt.verify(match[1], env.jwtSecret, {
      algorithms: ['HS256'],
      issuer: 'modular-mvc-api',
      audience: 'modular-mvc-client',
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new ApiError(401, 'Token expired; please log in again');
    }
    if (['JsonWebTokenError', 'NotBeforeError'].includes(error.name)) {
      throw new ApiError(401, 'Invalid authentication token');
    }
    throw error;
  }

  if (!decoded || typeof decoded !== 'object' ||
      !mongoose.isObjectIdOrHexString(decoded.sub) ||
      !Number.isFinite(decoded.exp)) {
    throw new ApiError(401, 'Invalid authentication token');
  }
  // Lookup is outside the JWT catch: database failures remain server errors.
  const user = await User.findById(decoded.sub);
  if (!user) throw new ApiError(401, 'User no longer exists');
  req.user = user;
  return next();
}

module.exports = { protect };

````

## `src/middleware/error.js`

````javascript
const ApiError = require('../utils/ApiError');

function notFound(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.path}`));
}

// Four arguments are required for Express to recognize error middleware.
function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  let statusCode = err instanceof ApiError ? err.statusCode : 500;
  let message = err instanceof ApiError ? err.message : 'Internal server error';
  let errors = err instanceof ApiError ? err.errors : undefined;

  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyPattern || err.keyValue || {})[0] || 'field';
    message = `${field} already exists`;
    errors = [{ field, message }];
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((error) => ({
      field: error.path, message: error.message,
    }));
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid identifier or field value';
    errors = [{ field: err.path, message }];
  } else if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Invalid JSON request body';
  } else if (err.type === 'entity.too.large') {
    statusCode = 413;
    message = 'Request body exceeds the 100 KB limit';
  } else if (err.status >= 400 && err.status < 500 && !(err instanceof ApiError)) {
    statusCode = err.status;
    message = 'Invalid request';
  }

  if (statusCode >= 500) {
    console.error('Request failed:', err);
    message = 'Internal server error';
    errors = undefined;
  }

  return res.status(statusCode).json({
    success: false,
    message,
    data: null,
    ...(errors ? { errors } : {}),
  });
}

module.exports = { notFound, errorHandler };

````

## `src/middleware/validate.js`

````javascript
const { validationResult, matchedData } = require('express-validator');
const ApiError = require('../utils/ApiError');

function validate(req, res, next) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    // Omit submitted values so passwords never appear in validation responses.
    const errors = result.array({ onlyFirstError: true }).map((error) => ({
      field: error.path,
      message: error.msg,
      location: error.location,
    }));
    return next(new ApiError(400, 'Validation failed', errors));
  }
  // Controllers never persist arbitrary request body fields.
  req.validated = matchedData(req, { locations: ['body'] });
  return next();
}

module.exports = validate;

````

## `src/modules/auth/auth.controller.js`

````javascript
const User = require('./auth.model');
const signToken = require('../../utils/token');
const sendResponse = require('../../utils/response');
const ApiError = require('../../utils/ApiError');

async function register(req, res) {
  const { name, email, password } = req.validated;
  if (await User.exists({ email })) throw new ApiError(400, 'email already exists');

  // Role is assigned by the server, never taken from the registration payload.
  const user = await User.create({ name, email, password, role: 'user' });
  return sendResponse(res, 201, 'Registration successful', {
    user: user.toJSON(), token: signToken(user._id),
  });
}

async function login(req, res) {
  const { email, password } = req.validated;
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }
  return sendResponse(res, 200, 'Login successful', {
    user: user.toJSON(), token: signToken(user._id),
  });
}

module.exports = { register, login };

````

## `src/modules/auth/auth.model.js`

````javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
}, {
  timestamps: true,
  toJSON: {
    transform(doc, ret) {
      delete ret.password;
      delete ret.__v;
      return ret;
    },
  },
});

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);

````

## `src/modules/auth/auth.routes.js`

````javascript
const router = require('express').Router();
const controller = require('./auth.controller');
const { registerValidation, loginValidation } = require('./auth.validation');
const validate = require('../../middleware/validate');

router.post('/register', registerValidation, validate, controller.register);
router.post('/login', loginValidation, validate, controller.login);

module.exports = router;

````

## `src/modules/auth/auth.validation.js`

````javascript
const { body } = require('express-validator');

const emailField = () => body('email')
  .exists().withMessage('email is required').bail()
  .isString().withMessage('email must be a string').bail()
  .trim().isEmail().withMessage('email must be valid').bail()
  .isLength({ max: 254 }).withMessage('email must be at most 254 characters')
  .toLowerCase();

// bcrypt uses at most 72 UTF-8 bytes; reject longer input instead of truncating.
const passwordField = (minimum) => body('password')
  .exists().withMessage('password is required').bail()
  .isString().withMessage('password must be a string').bail()
  .isLength({ min: minimum }).withMessage(`password must contain at least ${minimum} characters`)
  .bail().custom((value) => Buffer.byteLength(value, 'utf8') <= 72)
  .withMessage('password must be at most 72 UTF-8 bytes');

const registerValidation = [
  body('name').exists().withMessage('name is required').bail()
    .isString().withMessage('name must be a string').bail()
    .trim().notEmpty().withMessage('name is required').bail()
    .isLength({ max: 100 }).withMessage('name must be at most 100 characters'),
  emailField(),
  passwordField(8),
];

const loginValidation = [emailField(), passwordField(1)];

module.exports = { registerValidation, loginValidation };

````

## `src/modules/categories/category.controller.js`

````javascript
const Category = require('./category.model');
const Course = require('../courses/course.model');
const ApiError = require('../../utils/ApiError');
const sendResponse = require('../../utils/response');

async function createCategory(req, res) {
  const category = await Category.create({ ...req.validated, createdBy: req.user._id });
  return sendResponse(res, 201, 'Category created', category);
}

async function getCategories(req, res) {
  const categories = await Category.find().sort({ createdAt: -1 });
  return sendResponse(res, 200, 'Categories retrieved', categories);
}

async function getCategory(req, res) {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found');
  return sendResponse(res, 200, 'Category retrieved', category);
}

async function updateCategory(req, res) {
  const category = await Category.findByIdAndUpdate(
    req.params.id, { $set: req.validated }, { new: true, runValidators: true },
  );
  if (!category) throw new ApiError(404, 'Category not found');
  return sendResponse(res, 200, 'Category updated', category);
}

async function deleteCategory(req, res) {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found');
  if (await Course.exists({ category: category._id })) {
    throw new ApiError(400, 'Category is in use; delete or reassign its courses first');
  }
  await category.deleteOne();
  return sendResponse(res, 200, 'Category deleted');
}

module.exports = { createCategory, getCategories, getCategory, updateCategory, deleteCategory };

````

## `src/modules/categories/category.model.js`

````javascript
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true, maxlength: 100 },
  description: { type: String, trim: true, maxlength: 2000, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model('Category', categorySchema);

````

## `src/modules/categories/category.routes.js`

````javascript
const router = require('express').Router();
const controller = require('./category.controller');
const { categoryIdValidation, categoryBodyValidation } = require('./category.validation');
const { protect } = require('../../middleware/auth');
const validate = require('../../middleware/validate');

router.route('/')
  .get(controller.getCategories)
  .post(protect, categoryBodyValidation, validate, controller.createCategory);

router.route('/:id')
  .get(categoryIdValidation, validate, controller.getCategory)
  .put(protect, categoryIdValidation, categoryBodyValidation, validate, controller.updateCategory)
  .delete(protect, categoryIdValidation, validate, controller.deleteCategory);

module.exports = router;

````

## `src/modules/categories/category.validation.js`

````javascript
const { body, param } = require('express-validator');

const categoryIdValidation = [
  param('id').isMongoId().withMessage('id must be a valid MongoDB ObjectId'),
];

// PUT requires name; description is optional on both POST and PUT.
const categoryBodyValidation = [
  body('name').exists().withMessage('name is required').bail()
    .isString().withMessage('name must be a string').bail()
    .trim().notEmpty().withMessage('name is required').bail()
    .isLength({ max: 100 }).withMessage('name must be at most 100 characters'),
  body('description').optional().isString().withMessage('description must be a string')
    .bail().trim().isLength({ max: 2000 })
    .withMessage('description must be at most 2000 characters'),
];

module.exports = { categoryIdValidation, categoryBodyValidation };

````

## `src/modules/courses/course.controller.js`

````javascript
const Course = require('./course.model');
const Category = require('../categories/category.model');
const ApiError = require('../../utils/ApiError');
const sendResponse = require('../../utils/response');

async function requireCategory(categoryId) {
  if (!(await Category.exists({ _id: categoryId }))) {
    throw new ApiError(404, 'Category not found');
  }
}

async function createCourse(req, res) {
  await requireCategory(req.validated.category);
  const course = await Course.create({ ...req.validated, instructor: req.user._id });
  await course.populate('category', 'name description');
  return sendResponse(res, 201, 'Course created', course);
}

async function getCourses(req, res) {
  const courses = await Course.find().populate('category', 'name description')
    .sort({ createdAt: -1 });
  return sendResponse(res, 200, 'Courses retrieved', courses);
}

async function getCourse(req, res) {
  const course = await Course.findById(req.params.id).populate('category', 'name description');
  if (!course) throw new ApiError(404, 'Course not found');
  return sendResponse(res, 200, 'Course retrieved', course);
}

async function updateCourse(req, res) {
  const course = await Course.findById(req.params.id);
  if (!course) throw new ApiError(404, 'Course not found');
  await requireCategory(req.validated.category);
  Object.assign(course, req.validated);
  await course.save();
  await course.populate('category', 'name description');
  return sendResponse(res, 200, 'Course updated', course);
}

async function deleteCourse(req, res) {
  const course = await Course.findByIdAndDelete(req.params.id);
  if (!course) throw new ApiError(404, 'Course not found');
  return sendResponse(res, 200, 'Course deleted');
}

module.exports = { createCourse, getCourses, getCourse, updateCourse, deleteCourse };

````

## `src/modules/courses/course.model.js`

````javascript
const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, trim: true, maxlength: 10000, default: '' },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
  price: { type: Number, required: true, min: 0 },
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  duration: { type: String, trim: true, maxlength: 100, default: '' },
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model('Course', courseSchema);

````

## `src/modules/courses/course.routes.js`

````javascript
const router = require('express').Router();
const controller = require('./course.controller');
const { courseIdValidation, courseBodyValidation } = require('./course.validation');
const { protect } = require('../../middleware/auth');
const validate = require('../../middleware/validate');

router.route('/')
  .get(controller.getCourses)
  .post(protect, courseBodyValidation, validate, controller.createCourse);

router.route('/:id')
  .get(courseIdValidation, validate, controller.getCourse)
  .put(protect, courseIdValidation, courseBodyValidation, validate, controller.updateCourse)
  .delete(protect, courseIdValidation, validate, controller.deleteCourse);

module.exports = router;

````

## `src/modules/courses/course.validation.js`

````javascript
const { body, param } = require('express-validator');

const courseIdValidation = [
  param('id').isMongoId().withMessage('id must be a valid MongoDB ObjectId'),
];

// Required fields are required on PUT as well as POST.
const courseBodyValidation = [
  body('title').exists().withMessage('title is required').bail()
    .isString().withMessage('title must be a string').bail()
    .trim().notEmpty().withMessage('title is required').bail()
    .isLength({ max: 200 }).withMessage('title must be at most 200 characters'),
  body('category').exists().withMessage('category is required').bail()
    .isString().withMessage('category must be a string').bail()
    .isMongoId().withMessage('category must be a valid MongoDB ObjectId'),
  body('price').exists().withMessage('price is required').bail()
    .custom((value) => typeof value === 'number' && Number.isFinite(value) && value >= 0)
    .withMessage('price must be a finite non-negative JSON number'),
  body('description').optional().isString().withMessage('description must be a string')
    .bail().trim().isLength({ max: 10000 })
    .withMessage('description must be at most 10000 characters'),
  body('duration').optional().isString().withMessage('duration must be a string')
    .bail().trim().isLength({ max: 100 })
    .withMessage('duration must be at most 100 characters'),
];

module.exports = { courseIdValidation, courseBodyValidation };

````

## `src/utils/ApiError.js`

````javascript
class ApiError extends Error {
  constructor(statusCode, message, errors) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;

````

## `src/utils/response.js`

````javascript
function sendResponse(res, statusCode, message, data = null) {
  return res.status(statusCode).json({ success: true, message, data });
}

module.exports = sendResponse;

````

## `src/utils/token.js`

````javascript
const jwt = require('jsonwebtoken');
const { env } = require('../config/env');

function signToken(userId) {
  return jwt.sign({}, env.jwtSecret, {
    subject: userId.toString(),
    algorithm: 'HS256',
    expiresIn: env.jwtExpiresIn,
    issuer: 'modular-mvc-api',
    audience: 'modular-mvc-client',
  });
}

module.exports = signToken;

````

## `tests/api.test.js`

````javascript
const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Tests always use their own disposable database, never the application's .env URI.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-only-secret-with-at-least-32-bytes-never-use-in-production';
process.env.JWT_EXPIRES_IN = '1h';
process.env.CORS_ORIGIN = 'http://localhost:5173';

const app = require('../src/app');
const connectDB = require('../src/config/db');
const { env, validateEnv } = require('../src/config/env');
const User = require('../src/modules/auth/auth.model');
const Category = require('../src/modules/categories/category.model');
const Course = require('../src/modules/courses/course.model');
const { errorHandler } = require('../src/middleware/error');

let mongo;
let token;
let userId;
const missingId = '000000000000000000000001';
const account = { name: 'Fahad Aslam', email: 'fahad@example.com', password: 'StudyPass123!' };
const auth = () => ({ Authorization: `Bearer ${token}` });

async function createCategory(name = 'Development') {
  const response = await request(app).post('/api/categories').set(auth())
    .send({ name, description: 'Programming courses' }).expect(201);
  return response.body.data;
}

async function createCourse(categoryId) {
  const response = await request(app).post('/api/courses').set(auth())
    .send({ title: 'Node.js Basics', category: categoryId, price: 49, duration: '6 hours' })
    .expect(201);
  return response.body.data;
}

describe('Modular MVC REST API', { concurrency: false }, () => {
  before(async () => {
    // The tests use TCP only, so a local Unix socket is unnecessary.
    mongo = await MongoMemoryServer.create({ instance: { args: ['--nounixsocket'] } });
    env.mongoUri = mongo.getUri('modular_mvc_api_test');
    validateEnv();
    await connectDB();
  });

  after(async () => {
    await mongoose.disconnect();
    if (mongo) await mongo.stop();
  });

  beforeEach(async () => {
    await Promise.all([User.deleteMany({}), Category.deleteMany({}), Course.deleteMany({})]);
    const response = await request(app).post('/api/auth/register').send(account).expect(201);
    token = response.body.data.token;
    userId = response.body.data.user._id;
  });

  it('registers with a hashed password, safe user response, and working JWT', async () => {
    const stored = await User.findById(userId).select('+password');
    assert.notEqual(stored.password, account.password);
    assert.equal(await stored.comparePassword(account.password), true);
    assert.equal(stored.toJSON().password, undefined);
    assert.equal(jwt.verify(token, env.jwtSecret).sub, userId);
    await request(app).post('/api/categories').set(auth()).send({ name: 'Test' }).expect(201);
  });

  it('returns structured missing-field errors without echoing submitted passwords', async () => {
    const response = await request(app).post('/api/auth/register')
      .send({ password: 'short' }).expect(400);
    assert.equal(response.body.success, false);
    assert.equal(response.body.data, null);
    assert.deepEqual(response.body.errors.map((error) => error.field).sort(), ['email', 'name', 'password']);
    assert.equal(JSON.stringify(response.body).includes('short'), false);
  });

  it('normalizes email and rejects duplicate registrations', async () => {
    await request(app).post('/api/auth/register')
      .send({ ...account, email: '  FAHAD@EXAMPLE.COM  ' }).expect(400);
    assert.equal(await User.countDocuments(), 1);
  });

  it('does not allow registration to assign the admin role', async () => {
    const response = await request(app).post('/api/auth/register')
      .send({ ...account, email: 'other@example.com', role: 'admin' }).expect(201);
    assert.equal(response.body.data.user.role, 'user');
  });

  it('rejects oversized UTF-8 passwords before bcrypt can truncate them', async () => {
    const response = await request(app).post('/api/auth/register')
      .send({ ...account, email: 'other@example.com', password: '🙂'.repeat(20) }).expect(400);
    assert.equal(response.body.errors[0].field, 'password');
  });

  it('logs in and excludes the password hash from JSON', async () => {
    const response = await request(app).post('/api/auth/login')
      .send({ email: 'FAHAD@EXAMPLE.COM', password: account.password }).expect(200);
    assert.equal(response.body.data.user._id, userId);
    assert.equal(response.body.data.user.password, undefined);
    assert.equal(typeof response.body.data.token, 'string');
  });

  it('rejects wrong passwords and unknown accounts with 401', async () => {
    for (const payload of [
      { email: account.email, password: 'WrongPass123!' },
      { email: 'missing@example.com', password: account.password },
    ]) {
      const response = await request(app).post('/api/auth/login').send(payload).expect(401);
      assert.equal(response.body.message, 'Invalid email or password');
    }
  });

  it('validates login payloads and rejects object-based query injection', async () => {
    await request(app).post('/api/auth/login').send({}).expect(400);
    await request(app).post('/api/auth/login')
      .send({ email: { $ne: null }, password: account.password }).expect(400);
  });

  it('protects every category and course mutation', async () => {
    for (const base of ['/api/categories', '/api/courses']) {
      for (const method of ['post', 'put', 'delete']) {
        const path = method === 'post' ? base : `${base}/${missingId}`;
        await request(app)[method](path).send({}).expect(401);
      }
    }
  });

  it('rejects malformed, expired, wrong-algorithm, and wrong-audience tokens', async () => {
    const options = { subject: userId, issuer: 'modular-mvc-api', audience: 'modular-mvc-client' };
    for (const badToken of [
      'invalid-token',
      jwt.sign({}, env.jwtSecret, { ...options, expiresIn: -1 }),
      jwt.sign({}, env.jwtSecret, { ...options, expiresIn: '1h', algorithm: 'HS384' }),
      jwt.sign({}, env.jwtSecret, { ...options, expiresIn: '1h', audience: 'wrong-client' }),
      jwt.sign({}, env.jwtSecret, options), // No expiry.
    ]) {
      await request(app).post('/api/categories').set('Authorization', `Bearer ${badToken}`)
        .send({ name: 'Test' }).expect(401);
    }
  });

  it('rejects an otherwise valid token after its user is deleted', async () => {
    await User.findByIdAndDelete(userId);
    await request(app).post('/api/categories').set(auth()).send({ name: 'Test' }).expect(401);
  });

  it('creates, publicly lists, retrieves, updates, and deletes a category', async () => {
    const category = await createCategory();
    assert.equal(category.createdBy, userId);
    const list = await request(app).get('/api/categories').expect(200);
    assert.equal(list.body.data.length, 1);
    await request(app).get(`/api/categories/${category._id}`).expect(200);
    const updated = await request(app).put(`/api/categories/${category._id}`).set(auth())
      .send({ name: 'Backend', description: 'API courses', createdBy: missingId }).expect(200);
    assert.equal(updated.body.data.name, 'Backend');
    assert.equal(updated.body.data.createdBy, userId);
    const deleted = await request(app).delete(`/api/categories/${category._id}`).set(auth()).expect(200);
    assert.equal(deleted.body.data, null);
    await request(app).get(`/api/categories/${category._id}`).expect(404);
  });

  it('requires a non-empty category name on create and update', async () => {
    await request(app).post('/api/categories').set(auth()).send({}).expect(400);
    await request(app).post('/api/categories').set(auth()).send({ name: '  ' }).expect(400);
    const category = await createCategory();
    await request(app).put(`/api/categories/${category._id}`).set(auth())
      .send({ description: 'No name' }).expect(400);
  });

  it('enforces category uniqueness on create and update', async () => {
    const first = await createCategory('First');
    const second = await createCategory('Second');
    await request(app).post('/api/categories').set(auth()).send({ name: 'First' }).expect(400);
    await request(app).put(`/api/categories/${second._id}`).set(auth())
      .send({ name: first.name }).expect(400);
  });

  it('rejects malformed IDs and returns 404 for valid IDs with no matching record', async () => {
    for (const base of ['/api/categories', '/api/courses']) {
      await request(app).get(`${base}/not-an-id`).expect(400);
      await request(app).get(`${base}/${missingId}`).expect(404);
      await request(app).delete(`${base}/${missingId}`).set(auth()).expect(404);
    }
    await request(app).put(`/api/categories/${missingId}`).set(auth())
      .send({ name: 'Missing' }).expect(404);
    await request(app).put(`/api/courses/${missingId}`).set(auth())
      .send({ title: 'Missing', category: missingId, price: 1 }).expect(404);
  });

  it('creates, publicly lists, and retrieves courses with populated categories', async () => {
    const category = await createCategory();
    const course = await createCourse(category._id);
    assert.equal(course.instructor, userId);
    assert.equal(course.category.name, category.name);
    const list = await request(app).get('/api/courses').expect(200);
    assert.equal(list.body.data[0].category._id, category._id);
    const detail = await request(app).get(`/api/courses/${course._id}`).expect(200);
    assert.equal(detail.body.data.category.name, category.name);
  });

  it('updates course fields and category while preserving its server-assigned instructor', async () => {
    const first = await createCategory('First');
    const second = await createCategory('Second');
    const course = await createCourse(first._id);
    const updated = await request(app).put(`/api/courses/${course._id}`).set(auth())
      .send({ title: 'Advanced Node', category: second._id, price: 99, instructor: missingId })
      .expect(200);
    assert.equal(updated.body.data.title, 'Advanced Node');
    assert.equal(updated.body.data.price, 99);
    assert.equal(updated.body.data.category._id, second._id);
    assert.equal(updated.body.data.instructor, userId);
  });

  it('requires title, category, and price for course creation and PUT', async () => {
    const response = await request(app).post('/api/courses').set(auth()).send({}).expect(400);
    assert.deepEqual(response.body.errors.map((error) => error.field).sort(), ['category', 'price', 'title']);
    const category = await createCategory();
    const course = await createCourse(category._id);
    await request(app).put(`/api/courses/${course._id}`).set(auth())
      .send({ title: 'Missing required fields' }).expect(400);
  });

  it('allows free courses and rejects negative, null, boolean, and string prices', async () => {
    const category = await createCategory();
    const payload = { title: 'Free course', category: category._id, price: 0 };
    await request(app).post('/api/courses').set(auth()).send(payload).expect(201);
    for (const price of [-1, null, true, '', '9.99', {}]) {
      await request(app).post('/api/courses').set(auth()).send({ ...payload, price }).expect(400);
    }
  });

  it('rejects invalid and nonexistent category references on create and update', async () => {
    await request(app).post('/api/courses').set(auth())
      .send({ title: 'Test', category: 'bad-id', price: 1 }).expect(400);
    await request(app).post('/api/courses').set(auth())
      .send({ title: 'Test', category: missingId, price: 1 }).expect(404);
    const category = await createCategory();
    const course = await createCourse(category._id);
    await request(app).put(`/api/courses/${course._id}`).set(auth())
      .send({ title: 'Test', category: missingId, price: 1 }).expect(404);
    assert.equal((await Course.findById(course._id)).title, 'Node.js Basics');
  });

  it('blocks category deletion while used, then allows course and category deletion', async () => {
    const category = await createCategory();
    const course = await createCourse(category._id);
    await request(app).delete(`/api/categories/${category._id}`).set(auth()).expect(400);
    const deleted = await request(app).delete(`/api/courses/${course._id}`).set(auth()).expect(200);
    assert.equal(deleted.body.success, true);
    assert.equal(deleted.body.data, null);
    await request(app).get(`/api/courses/${course._id}`).expect(404);
    await request(app).delete(`/api/categories/${category._id}`).set(auth()).expect(200);
  });

  it('returns JSON for unknown routes and unsupported methods', async () => {
    for (const method of ['get', 'post']) {
      const response = await request(app)[method]('/api/does-not-exist').expect(404);
      assert.equal(response.body.success, false);
      assert.equal(response.body.data, null);
      assert.match(response.headers['content-type'], /json/);
    }
    await request(app).patch('/api/categories/any').send({}).expect(404);
  });

  it('handles malformed and oversized JSON with the error envelope', async () => {
    const malformed = await request(app).post('/api/auth/login')
      .set('Content-Type', 'application/json').send('{broken').expect(400);
    assert.equal(malformed.body.message, 'Invalid JSON request body');
    const oversized = await request(app).post('/api/auth/login')
      .send({ extra: 'x'.repeat(110000) }).expect(413);
    assert.equal(oversized.body.success, false);
    assert.equal(oversized.body.data, null);
  });

  it('returns a JSON preflight response and allows configured frontend origins', async () => {
    const response = await request(app).options('/api/courses')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'authorization,content-type').expect(200);
    assert.equal(response.headers['access-control-allow-origin'], 'http://localhost:5173');
    assert.equal(response.body.success, true);
  });

  it('maps unexpected errors to a generic 500 without leaking internal details', () => {
    let status;
    let body;
    const res = {
      status(code) { status = code; return this; },
      json(payload) { body = payload; return this; },
    };
    const originalError = console.error;
    try {
      console.error = () => {};
      errorHandler(new Error('private internal information'), {}, res, () => {});
    } finally {
      console.error = originalError;
    }
    assert.equal(status, 500);
    assert.deepEqual(body, { success: false, message: 'Internal server error', data: null });
  });
});

````

