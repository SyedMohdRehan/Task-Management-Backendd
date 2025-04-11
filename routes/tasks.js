const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Task = require('../models/Task');
const User = require('../models/User');

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  console.log("Raw authHeader:", JSON.stringify(authHeader)); // Log raw header

  if (!authHeader) {
    return res.status(401).json({ message: 'Missing authorization header' });
  }

  // More robust token extraction
  const tokenParts = authHeader.split(' ');
  if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
    return res.status(401).json({ message: 'Invalid authorization format' });
  }

  const token = tokenParts[1].trim();
  console.log("Trimmed token:", JSON.stringify(token)); // Log the exact token
  console.log("Token length:", token.length);

  try {
    const JWT_SECRET = process.env.JWT_SECRET.trim();
    
    // Debug: Compare the received token with a known good token
    const expectedToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2N2U1MzMzY2UyNmI4Yzk4MmM3MmMxNWQiLCJpYXQiOjE3NDMwNzQxMjUsImV4cCI6MTc0MzA3NzcyNX0.Kuy2o2D9b8ug1AnV79m_Q-vlxXD7dikd__VHfCIAArI";
    console.log("Token matches expected:", token === expectedToken);
    
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log("Decoded Token:", decoded);
    
    req.userId = decoded.userId;
    next();
  } catch (err) {
    console.error('JWT Verification Error Details:', {
      message: err.message,
      name: err.name,
      stack: err.stack
    });
    
    // Additional debug: Try manual verification
    try {
      const manualVerify = jwt.verify(expectedToken, process.env.JWT_SECRET.trim());
      console.log("Manual verification successful:", manualVerify);
    } catch (manualErr) {
      console.error("Manual verification failed:", manualErr);
    }
    
    return res.status(401).json({ 
      message: 'Invalid token',
      error: err.message 
    });
  }
};
// POST /tasks
router.post('/', verifyToken, async (req, res) => {
  res.json({ message: 'Test route' });
  try {
    const { title, description } = req.body;
    const task = new Task({ title, description, user: req.userId });
    await task.save();
    res.status(201).json({ message: 'Task created successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Something went wrong' });
  }
});

// GET /tasks
router.get('/', verifyToken, async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.userId });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Something went wrong' });
  }
});

// GET /tasks/:id
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.userId });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: 'Something went wrong' });
  }
});

// PUT /tasks/:id
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { title, description } = req.body;
    const task = await Task.findOneAndUpdate({ _id: req.params.id, user: req.userId }, { title, description }, { new: true });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json({ message: 'Task updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Something went wrong' });
  }
});

// DELETE /tasks/:id
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Something went wrong' });
  }
});

module.exports = router;