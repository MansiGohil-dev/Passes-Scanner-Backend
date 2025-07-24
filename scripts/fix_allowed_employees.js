// Script to add all Employee IDs to allowedEmployees for all PassShare docs missing them
const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const PassShare = require('../models/PassShare');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/yourdbname';

async function main() {
  await mongoose.connect(MONGO_URI);
  const employees = await Employee.find({}, '_id');
  const employeeIds = employees.map(e => e._id);

  const result = await PassShare.updateMany(
    { $or: [ { allowedEmployees: { $exists: false } }, { allowedEmployees: { $size: 0 } } ] },
    { $set: { allowedEmployees: employeeIds } }
  );
  console.log(`Updated ${result.modifiedCount || result.nModified} PassShare documents.`);
  await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
