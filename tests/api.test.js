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
