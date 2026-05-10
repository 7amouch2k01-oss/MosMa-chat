import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { X, Plus, MoreVertical, Trash2, CheckCircle, Circle, GripVertical, Star, Calendar, Clock, List } from 'lucide-react';
import './TaskManager.css';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_URL = `${BACKEND_URL}/api`;

const COLUMNS = [
    { id: 'important', title: 'Important', icon: <Star size={16} /> },
    { id: 'common',    title: 'Common',    icon: <List size={16} /> },
    { id: 'daily',     title: 'Daily',     icon: <Clock size={16} /> },
    { id: 'others',    title: 'Others',    icon: <Calendar size={16} /> },
];

const TaskManager = ({ userInfo, onClose, isFullPage = false }) => {
    const [tasks, setTasks] = useState([]);
    const [newTask, setNewTask] = useState('');
    const [activeCol, setActiveCol] = useState('others');

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const token = userInfo?.token;
            const { data } = await axios.get(`${API_URL}/tasks`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTasks(data);
        } catch (err) {
            console.error('Failed to fetch tasks', err);
        }
    };

    const handleAddTask = async (e) => {
        e.preventDefault();
        if (!newTask.trim()) return;

        try {
            const token = userInfo?.token;
            const { data } = await axios.post(`${API_URL}/tasks`, 
                { title: newTask, category: activeCol },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setTasks([...tasks, data]);
            setNewTask('');
        } catch (err) {
            console.error('Failed to add task', err);
        }
    };

    const toggleTaskStatus = async (task) => {
        try {
            const token = userInfo?.token;
            const newStatus = task.status === 'completed' ? 'pending' : 'completed';
            const { data } = await axios.put(`${API_URL}/tasks/${task._id}`, 
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setTasks(tasks.map(t => t._id === task._id ? data : t));
        } catch (err) {
            console.error('Failed to update task', err);
        }
    };

    const deleteTask = async (taskId) => {
        try {
            const token = userInfo?.token;
            await axios.delete(`${API_URL}/tasks/${taskId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTasks(tasks.filter(t => t._id !== taskId));
        } catch (err) {
            console.error('Failed to delete task', err);
        }
    };

    const onDragEnd = async (result) => {
        const { destination, source, draggableId } = result;
        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        // Optimistic UI update
        const newTasks = Array.from(tasks);
        const taskToMove = newTasks.find(t => t._id === draggableId);
        
        // Remove from current position
        const filtered = newTasks.filter(t => t._id !== draggableId);
        
        // Update category if changed
        taskToMove.category = destination.droppableId;
        
        // Insert into new position
        const colTasks = filtered.filter(t => t.category === destination.droppableId);
        const otherTasks = filtered.filter(t => t.category !== destination.droppableId);
        
        colTasks.splice(destination.index, 0, taskToMove);
        
        // Re-calculate orders
        const updatedColTasks = colTasks.map((t, idx) => ({ ...t, order: idx }));
        const finalTasks = [...otherTasks, ...updatedColTasks];
        
        setTasks(finalTasks);

        // Sync with backend
        try {
            const token = userInfo?.token;
            await axios.put(`${API_URL}/tasks/reorder`, 
                { tasks: updatedColTasks.map(t => ({ id: t._id, order: t.order, category: t.category })) },
                { headers: { Authorization: `Bearer ${token}` } }
            );
        } catch (err) {
            console.error('Failed to sync order', err);
            fetchTasks(); // Rollback
        }
    };

    return (
        <div className="task-overlay" onClick={onClose}>
            <div className="task-panel" onClick={e => e.stopPropagation()}>
                <div className="task-header">
                    <div className="task-header-title">
                        <CheckCircle className="header-icon" />
                        <h3>Task Manager</h3>
                    </div>
                    {!isFullPage && <button className="task-close" onClick={onClose}><X size={20} /></button>}
                </div>

                <form className="task-input-section" onSubmit={handleAddTask}>
                    <input 
                        type="text" 
                        placeholder="What needs to be done?" 
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                    />
                    <select value={activeCol} onChange={(e) => setActiveCol(e.target.value)}>
                        {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                    <button type="submit"><Plus size={20} /></button>
                </form>

                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="task-board">
                        {COLUMNS.map(col => (
                            <div key={col.id} className={`task-column ${col.id}`}>
                                <div className="column-header">
                                    {col.icon}
                                    <span>{col.title}</span>
                                    <span className="count">{tasks.filter(t => t.category === col.id).length}</span>
                                </div>

                                <Droppable droppableId={col.id}>
                                    {(provided, snapshot) => (
                                        <div 
                                            className={`task-list ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                                            {...provided.droppableProps}
                                            ref={provided.innerRef}
                                        >
                                            {tasks
                                                .filter(t => t.category === col.id)
                                                .map((task, index) => (
                                                    <Draggable key={task._id} draggableId={task._id} index={index}>
                                                        {(provided, snapshot) => (
                                                            <div 
                                                                className={`task-item ${task.status === 'completed' ? 'completed' : ''} ${snapshot.isDragging ? 'dragging' : ''}`}
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                            >
                                                                <div className="task-drag-handle" {...provided.dragHandleProps}>
                                                                    <GripVertical size={14} />
                                                                </div>
                                                                <button className="status-btn" onClick={() => toggleTaskStatus(task)}>
                                                                    {task.status === 'completed' ? <CheckCircle size={18} /> : <Circle size={18} />}
                                                                </button>
                                                                <span className="task-title">{task.title}</span>
                                                                <button className="delete-btn" onClick={() => deleteTask(task._id)}>
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                ))}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </div>
                        ))}
                    </div>
                </DragDropContext>
            </div>
        </div>
    );
};

export default TaskManager;
