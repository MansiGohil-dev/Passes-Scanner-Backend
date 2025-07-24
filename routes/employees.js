const express = require("express");
const router = express.Router();
const Employee = require("../models/Employee");

// Create employee
router.post("/", async (req, res) => {
  try {
    const { name, mobile, password } = req.body;
    console.log('Received employee data:', { name, mobile, password: password ? '***' : 'undefined' });
    
    // Validation
    if (!name) return res.status(400).json({ message: 'Name is required' });
    if (!mobile) return res.status(400).json({ message: 'Mobile is required' });
    if (!password) return res.status(400).json({ message: 'Password is required' });
    
    // Check if employee already exists
    const existingEmployee = await Employee.findOne({ mobile });
    if (existingEmployee) {
      return res.status(400).json({ message: 'Employee with this mobile number already exists' });
    }
    
    const employee = new Employee({ name, mobile, password });
    console.log('Creating employee:', { name: employee.name, mobile: employee.mobile, hasPassword: !!employee.password });
    
    await employee.save();
    console.log('Employee saved successfully:', employee._id);
    
    // Add new employee to allowedEmployees in all PassShare documents
    const PassShare = require("../models/PassShare");
    await PassShare.updateMany({}, { $push: { allowedEmployees: employee._id } });
    
    res.status(201).json({
      _id: employee._id,
      name: employee.name,
      mobile: employee.mobile,
      message: 'Employee created successfully'
    });
  } catch (err) {
    console.error('Error creating employee:', err);
    res.status(400).json({ message: err.message || 'Failed to create employee' });
  }
});

// POST /api/employees/login
router.post('/login', async (req, res) => {
  const { mobile, password } = req.body;
  if (!mobile || !password) {
    return res.status(400).json({ success: false, message: 'Mobile and password are required' });
  }
  try {
    const emp = await Employee.findOne({ mobile });
    if (!emp) {
      return res.status(401).json({ success: false, message: 'Employee not found' });
    }
    if (emp.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid password' });
    }
    // Add this employee to allowedEmployees for all existing passes (if not already present)
    const PassShare = require("../models/PassShare");
    await PassShare.updateMany({}, { $addToSet: { allowedEmployees: emp._id } });
    res.json({ success: true, employee: { mobile: emp.mobile, name: emp.name, _id: emp._id } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Login failed', error: err.message });
  }
});

// Get all employees
router.get("/", async (req, res) => {
  const employees = await Employee.find();
  res.json(employees);
});

module.exports = router;
