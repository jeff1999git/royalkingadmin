import mongoose from "mongoose";
// Side effect: registers every model (see models/index.ts).
import "../models";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  // Names of the models whose indexes this process has already ensured.
  indexedModels?: Set<string>;
};

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? {
  conn: null,
  promise: null,
};

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

// Indexes an older schema declared that the current one must not have, by
// collection. Only these are ever dropped, and only while they still have the
// listed shape, so an index added by hand in Atlas is never touched.
// vehicles.vehicleNumber holds the model ("TATA ACE GOLD"), which two vehicles
// may share, so its old unique index has to go.
const OBSOLETE_UNIQUE_INDEXES: Record<string, string[]> = {
  vehicles: ["vehicleNumber_1"],
};

async function dropObsoleteIndexes(model: mongoose.Model<unknown>) {
  const names = OBSOLETE_UNIQUE_INDEXES[model.collection.collectionName];
  if (!names) return;
  const existing = await model.collection.indexes();
  for (const name of names) {
    if (existing.some((index) => index.name === name && index.unique)) {
      await model.collection.dropIndex(name);
      console.info(`[mongodb] dropped obsolete index ${model.collection.collectionName}.${name}`);
    }
  }
}

// Mongoose normally builds indexes when a model is compiled, but the models
// here are compiled at import time, before the connection exists, and with
// bufferCommands off that attempt fails silently. So each model's declared
// indexes are created once per process, the first time a request runs with
// that model loaded (all of them, via models/index.ts). createIndexes() only
// adds missing indexes; it never drops
// or rebuilds existing ones, and data is never touched. Runs in the background.
function ensureIndexes() {
  // A dev-server reload can hand over a cache object made by older code.
  const done = (cached.indexedModels ??= new Set<string>());
  for (const model of Object.values(mongoose.models)) {
    if (done.has(model.modelName)) continue;
    done.add(model.modelName);
    model.createIndexes().catch((err: unknown) => {
      console.error(`[mongodb] index build failed for ${model.modelName}`, err);
    });
    dropObsoleteIndexes(model as mongoose.Model<unknown>).catch((err: unknown) => {
      console.error(`[mongodb] obsolete index cleanup failed for ${model.modelName}`, err);
    });
  }
}

export async function connectToDatabase() {
  const mongodbUri = getMongoUri();

  if (cached.conn) {
    ensureIndexes();
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(mongodbUri, {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  ensureIndexes();
  return cached.conn;
}

function getMongoUri() {
  const mongodbUri = process.env.MONGODB_URI;

  if (!mongodbUri) {
    throw new Error("Missing MONGODB_URI in environment variables.");
  }

  return mongodbUri;
}
