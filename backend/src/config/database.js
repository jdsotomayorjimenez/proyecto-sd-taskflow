const mongoose = require("mongoose");

function buildMongoUri() {
  const {
    MONGO_HOST,
    MONGO_PORT,
    MONGO_DATABASE,
    MONGO_USERNAME,
    MONGO_PASSWORD,
  } = process.env;

  const auth = MONGO_USERNAME && MONGO_PASSWORD
    ? `${encodeURIComponent(MONGO_USERNAME)}:${encodeURIComponent(MONGO_PASSWORD)}@`
    : "";

  return `mongodb://${auth}${MONGO_HOST}:${MONGO_PORT}/${MONGO_DATABASE}?authSource=admin`;
}

async function connectDB() {
  const uri = buildMongoUri();
  await mongoose.connect(uri);
  return mongoose.connection;
}

module.exports = { connectDB, buildMongoUri };
