const mongoose = require("mongoose");

const EmployeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  mobile: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // plain text password
});

module.exports = mongoose.model("Employee", EmployeeSchema);
