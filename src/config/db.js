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
