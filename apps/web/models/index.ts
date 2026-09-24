// Registers every Mongoose model. lib/mongodb.ts imports this, so any API
// route that connects has all models available for populate(), even as the
// very first request on a fresh serverless instance. Without it, a route that
// populates a model it doesn't import (e.g. SupplyLog → vehicle) fails with
// MissingSchemaError until some other route happens to load that model.
import "./Customer";
import "./Stock";
import "./SupplyLog";
import "./User";
import "./Vehicle";
