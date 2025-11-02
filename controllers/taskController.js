const Task = require('../models/Task');

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res) => {
  let query = {};
  
  // Regular users can only see tasks assigned to them
  if (req.user.role === 'user') {
    query.assignedTo = req.user.id;
  }
  
  const tasks = await Task.find(query)
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email');
  
  res.status(200).json({
    success: true,
    count: tasks.length,
    data: tasks
  });
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
const getTask = async (req, res) => {
  const task = await Task.findById(req.params.id)
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email');
  
  if (!task) {
    return res.status(404).json({
      success: false,
      error: 'Task not found'
    });
  }

  // Regular users can only view tasks assigned to them
  if (req.user.role === 'user' && task.assignedTo._id.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      error: 'Access denied'
    });
  }

  res.status(200).json({
    success: true,
    data: task
  });
};

// @desc    Create task
// @route   POST /api/tasks
// @access  Private
const createTask = async (req, res) => {
  // Set createdBy from authenticated user
  req.body.createdBy = req.user.id;
  
  // Regular users can only create tasks assigned to themselves
  if (req.user.role === 'user') {
    req.body.assignedTo = req.user.id;
  }
  
  const task = await Task.create(req.body);
  
  const populatedTask = await Task.findById(task._id)
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email');
  
  res.status(201).json({
    success: true,
    data: populatedTask
  });
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res) => {
  let task = await Task.findById(req.params.id);

  if (!task) {
    return res.status(404).json({
      success: false,
      error: 'Task not found'
    });
  }

  // Regular users can only update tasks assigned to them
  if (req.user.role === 'user' && task.assignedTo.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      error: 'Access denied'
    });
  }

  task = await Task.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  })
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email');

  res.status(200).json({
    success: true,
    data: task
  });
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    return res.status(404).json({
      success: false,
      error: 'Task not found'
    });
  }

  // Regular users can only delete tasks assigned to them
  if (req.user.role === 'user' && task.assignedTo.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      error: 'Access denied'
    });
  }

  await task.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
};

module.exports = {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask
};

