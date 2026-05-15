import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { 
    X, Plus, MoreVertical, Trash2, CheckCircle, Circle, 
    GripVertical, Star, Calendar, Clock, List, AlertCircle,
    ChevronRight, ChevronDown, Edit3, Type, AlignLeft, BarChart2,
    Calendar as CalendarIcon, Flag, Search, Filter
} from 'lucide-react';
import './TaskManager.css';

const BACKEND_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin);
const API_URL = `${BACKEND_URL}/api`;

const COLUMNS = [
    { id: 'important', title: 'Important', icon: <Star size={16} /> },
    { id: 'common',    title: 'Common',    icon: <List size={16} /> },
    { id: 'daily',     title: 'Daily',     icon: <Clock size={16} /> },
    { id: 'others',    title: 'Others',    icon: <Calendar size={16} /> },
];

const PRIORITY_COLORS = {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#ef4444'
};

const TaskManager = ({ userInfo, onClose, isFullPage = false }) => {
    const [tasks, setTasks] = useState([]);
    const [newTask, setNewTask] = useState('');
    const [newPriority, setNewPriority] = useState('low');
    const [activeCol, setActiveCol] = useState('others');
    const [searchQuery, setSearchQuery] = useState('');
    const [editingTask, setEditingTask] = useState(null);
    const [filterPriority, setFilterPriority] = useState('all');

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
                { title: newTask, category: activeCol, priority: newPriority },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setTasks([...tasks, data]);
            setNewTask('');
        } catch (err) {
            console.error('Failed to add task', err);
        }
    };

    const updateTaskDetail = async (taskId, updates) => {
        try {
            const token = userInfo?.token;
            const { data } = await axios.put(`${API_URL}/tasks/${taskId}`, 
                updates,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setTasks(tasks.map(t => t._id === taskId ? data : t));
            if (editingTask?._id === taskId) setEditingTask(data);
        } catch (err) {
            console.error('Failed to update task', err);
        }
    };

    const toggleTaskStatus = async (task) => {
        const newStatus = task.status === 'completed' ? 'pending' : 'completed';
        updateTaskDetail(task._id, { status: newStatus });
    };

    const deleteTask = async (taskId) => {
        if (!window.confirm('Delete this task?')) return;
        try {
            const token = userInfo?.token;
            await axios.delete(`${API_URL}/tasks/${taskId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTasks(tasks.filter(t => t._id !== taskId));
            if (editingTask?._id === taskId) setEditingTask(null);
        } catch (err) {
            console.error('Failed to delete task', err);
        }
    };

    const onDragEnd = async (result) => {
        const { destination, source, draggableId } = result;
        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        const newTasks = Array.from(tasks);
        const taskToMove = { ...newTasks.find(t => t._id === draggableId) };
        const filtered = newTasks.filter(t => t._id !== draggableId);
        
        taskToMove.category = destination.droppableId;
        
        const colTasks = filtered.filter(t => t.category === destination.droppableId);
        const otherTasks = filtered.filter(t => t.category !== destination.droppableId);
        
        colTasks.splice(destination.index, 0, taskToMove);
        
        const updatedColTasks = colTasks.map((t, idx) => ({ ...t, order: idx }));
        const finalTasks = [...otherTasks, ...updatedColTasks];
        
        setTasks(finalTasks);

        try {
            const token = userInfo?.token;
            await axios.put(`${API_URL}/tasks/reorder`, 
                { tasks: updatedColTasks.map(t => ({ id: t._id, order: t.order, category: t.category })) },
                { headers: { Authorization: `Bearer ${token}` } }
            );
        } catch (err) {
            console.error('Failed to sync order', err);
            fetchTasks();
        }
    };

    const filteredTasks = tasks.filter(t => {
        const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPriority = filterPriority === 'all' || t.priority === filterPriority;
        return matchesSearch && matchesPriority;
    });

    const getColProgress = (colId) => {
        const colTasks = tasks.filter(t => t.category === colId);
        if (colTasks.length === 0) return 0;
        const completed = colTasks.filter(t => t.status === 'completed').length;
        return Math.round((completed / colTasks.length) * 100);
    };

    return (
        <div className="task-overlay" onClick={onClose}>
            <div className={`task-panel ${editingTask ? 'with-details' : ''}`} onClick={e => e.stopPropagation()}>
                <div className="task-main-content">
                    <div className="task-header">
                        <div className="task-header-title">
                            <BarChart2 className="header-icon" />
                            <h3>NexTask <span className="premium-badge">Pro</span></h3>
                        </div>
                        <div className="task-header-actions">
                            <div className="search-box">
                                <Search size={14} />
                                <input 
                                    type="text" 
                                    placeholder="Search tasks..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            {!isFullPage && <button className="task-close" onClick={onClose}><X size={20} /></button>}
                        </div>
                    </div>

                    <form className="task-input-section premium" onSubmit={handleAddTask}>
                        <div className="input-group">
                            <input 
                                type="text" 
                                placeholder="Create a new task..." 
                                value={newTask}
                                onChange={(e) => setNewTask(e.target.value)}
                            />
                            <div className="input-options">
                                <select value={activeCol} onChange={(e) => setActiveCol(e.target.value)}>
                                    {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                </select>
                                <select 
                                    value={newPriority} 
                                    onChange={(e) => setNewPriority(e.target.value)}
                                    className={`priority-select ${newPriority}`}
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>
                        </div>
                        <button type="submit" className="add-task-btn">
                            <Plus size={20} /> Add Task
                        </button>
                    </form>

                    <DragDropContext onDragEnd={onDragEnd}>
                        <div className="task-board">
                            {COLUMNS.map(col => (
                                <div key={col.id} className={`task-column ${col.id}`}>
                                    <div className="column-header">
                                        <div className="title-row">
                                            {col.icon}
                                            <span>{col.title}</span>
                                            <span className="count">{filteredTasks.filter(t => t.category === col.id).length}</span>
                                        </div>
                                        <div className="progress-bar-wrap">
                                            <div className="progress-bar" style={{ width: `${getColProgress(col.id)}%` }}></div>
                                        </div>
                                    </div>

                                    <Droppable droppableId={col.id}>
                                        {(provided, snapshot) => (
                                            <div 
                                                className={`task-list ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                                                {...provided.droppableProps}
                                                ref={provided.innerRef}
                                            >
                                                {filteredTasks
                                                    .filter(t => t.category === col.id)
                                                    .map((task, index) => (
                                                        <Draggable key={task._id} draggableId={task._id} index={index}>
                                                            {(provided, snapshot) => (
                                                                    <div 
                                                                        className={`task-item ${task.status === 'completed' ? 'completed' : ''} ${snapshot.isDragging ? 'dragging' : ''} ${editingTask?._id === task._id ? 'active' : ''}`}
                                                                        ref={provided.innerRef}
                                                                        {...provided.draggableProps}
                                                                        {...provided.dragHandleProps}
                                                                        onClick={() => setEditingTask(task)}
                                                                    >
                                                                    <button 
                                                                        className="status-btn" 
                                                                        onClick={(e) => { e.stopPropagation(); toggleTaskStatus(task); }}
                                                                    >
                                                                        {task.status === 'completed' ? <CheckCircle size={18} /> : <Circle size={18} />}
                                                                    </button>
                                                                    <div className="task-content">
                                                                        <span className="task-title">{task.title}</span>
                                                                        <div className="task-badges">
                                                                            <span className={`priority-badge ${task.priority}`}>
                                                                                {task.priority}
                                                                            </span>
                                                                            {task.dueDate && (
                                                                                <span className="due-badge">
                                                                                    <Calendar size={10} /> {new Date(task.dueDate).toLocaleDateString()}
                                                                                </span>
                                                                            )}
                                                                            {task.subtasks?.length > 0 && (
                                                                                <span className="subtask-badge">
                                                                                    <List size={10} /> {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <button 
                                                                        className="delete-btn" 
                                                                        onClick={(e) => { e.stopPropagation(); deleteTask(task._id); }}
                                                                    >
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

                {editingTask && (
                    <div className="task-details-panel">
                        <div className="details-header">
                            <h4>Task Details</h4>
                            <button className="icon-btn" onClick={() => setEditingTask(null)}><X size={18} /></button>
                        </div>
                        
                        <div className="details-body">
                            <div className="detail-section">
                                <label><Type size={14} /> Title</label>
                                <input 
                                    type="text" 
                                    value={editingTask.title} 
                                    onChange={(e) => updateTaskDetail(editingTask._id, { title: e.target.value })}
                                />
                            </div>

                            <div className="detail-row">
                                <div className="detail-section half">
                                    <label><Flag size={14} /> Priority</label>
                                    <select 
                                        value={editingTask.priority} 
                                        onChange={(e) => updateTaskDetail(editingTask._id, { priority: e.target.value })}
                                        className={editingTask.priority}
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>
                                <div className="detail-section half">
                                    <label><CalendarIcon size={14} /> Due Date</label>
                                    <input 
                                        type="date" 
                                        value={editingTask.dueDate ? new Date(editingTask.dueDate).toISOString().split('T')[0] : ''} 
                                        onChange={(e) => updateTaskDetail(editingTask._id, { dueDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="detail-section">
                                <label><AlignLeft size={14} /> Description</label>
                                <textarea 
                                    placeholder="Add more details..."
                                    value={editingTask.description}
                                    onChange={(e) => updateTaskDetail(editingTask._id, { description: e.target.value })}
                                />
                            </div>

                            <div className="detail-section subtasks">
                                <label><List size={14} /> Checklist</label>
                                <div className="subtask-list">
                                    {editingTask.subtasks?.map((st, idx) => (
                                        <div key={idx} className="subtask-item">
                                            <input 
                                                type="checkbox" 
                                                checked={st.completed}
                                                onChange={(e) => {
                                                    const newSubtasks = [...editingTask.subtasks];
                                                    newSubtasks[idx].completed = e.target.checked;
                                                    updateTaskDetail(editingTask._id, { subtasks: newSubtasks });
                                                }}
                                            />
                                            <input 
                                                type="text" 
                                                value={st.text} 
                                                onChange={(e) => {
                                                    const newSubtasks = [...editingTask.subtasks];
                                                    newSubtasks[idx].text = e.target.value;
                                                    updateTaskDetail(editingTask._id, { subtasks: newSubtasks });
                                                }}
                                            />
                                            <button onClick={() => {
                                                const newSubtasks = editingTask.subtasks.filter((_, i) => i !== idx);
                                                updateTaskDetail(editingTask._id, { subtasks: newSubtasks });
                                            }}><Trash2 size={12} /></button>
                                        </div>
                                    ))}
                                    <button className="add-subtask" onClick={() => {
                                        const newSubtasks = [...(editingTask.subtasks || []), { text: '', completed: false }];
                                        updateTaskDetail(editingTask._id, { subtasks: newSubtasks });
                                    }}>
                                        <Plus size={14} /> Add subtask
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TaskManager;
