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
