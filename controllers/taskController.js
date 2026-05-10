const Task = require('../models/Task');

const getTasks = async (req, res) => {
    try {
        const tasks = await Task.find({ user: req.user._id }).sort('order');
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createTask = async (req, res) => {
    try {
        const { title, category } = req.body;
        const task = new Task({
            user: req.user._id,
            title,
            category: category || 'others'
        });
        const savedTask = await task.save();
        res.status(201).json(savedTask);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updateTask = async (req, res) => {
    try {
        const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
        if (!task) return res.status(404).json({ message: 'Task not found' });

        const { title, category, status, order } = req.body;
        if (title !== undefined) task.title = title;
        if (category !== undefined) task.category = category;
        if (status !== undefined) task.status = status;
        if (order !== undefined) task.order = order;

        const updatedTask = await task.save();
        res.json(updatedTask);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteTask = async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });
        if (!task) return res.status(404).json({ message: 'Task not found' });
        res.json({ message: 'Task deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateTaskOrder = async (req, res) => {
    try {
        const { tasks } = req.body; // Array of { id, order, category }
        const bulkOps = tasks.map(t => ({
            updateOne: {
                filter: { _id: t.id, user: req.user._id },
                update: { $set: { order: t.order, category: t.category } }
            }
        }));
        await Task.bulkWrite(bulkOps);
        res.json({ message: 'Order updated' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getTasks, createTask, updateTask, deleteTask, updateTaskOrder };
