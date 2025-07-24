const mongoose = require("mongoose");

const PassSchema = new mongoose.Schema({
  imageUrl: { type: String, required: true },
  count: { type: Number, required: true },
});

module.exports = mongoose.model("Pass", PassSchema);