import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  ArrowLeft, 
  CheckCircle, 
  Circle, 
  Calendar, 
  Clock, 
  Tag, 
  Edit, 
  Trash2,
  X,
  Plus,
  List,
  Link,
  FileText
} from 'lucide-react';
import { format, isToday, isTomorrow, isPast } from 'date-fns';

const TaskDetail = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { apiCall } = useAuth();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium',
    category: '',
    links: [],
    additionalNotes: ''
  });
  const [showSubtaskForm, setShowSubtaskForm] = useState(false);
  const [subtaskForm, setSubtaskForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium',
    category: '',
    repeatType: 'none',
    links: [],
    additionalNotes: ''
  });
  const [subtasks, setSubtasks] = useState([]);
  const [subtaskLoading, setSubtaskLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchTaskDetails();
    fetchSubtasks();
  }, [taskId, apiCall]);

  const fetchTaskDetails = async () => {
    try {
      setLoading(true);
      const response = await apiCall(`/api/tasks/${taskId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch task details');
      }
      
      const taskData = await response.json();
      setTask(taskData);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    try {
      const response = await apiCall(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ isCompleted: !task.isCompleted })
      });

      if (response.ok) {
        const updatedTask = await response.json();
        setTask(updatedTask);
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDelete = async () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      // Make the API call directly to avoid the apiCall wrapper throwing errors
      const API_BASE_URL = 'https://task-crusher.onrender.com';
      const url = `${API_BASE_URL}/api/tasks/${taskId}`;
      
      const response = await fetch(url, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        navigate('/dashboard');
      } else {
        const errorData = await response.json().catch(() => ({}));
        
        // Show user-friendly error message
        alert(`Failed to delete task: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      alert('Failed to delete task. Please try again.');
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  const openEditModal = () => {
    setEditFormData({
      title: task.title,
      description: task.description || '',
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      priority: task.priority || 'medium',
      category: task.category || '',
      links: task.links || [],
      additionalNotes: task.additionalNotes || ''
    });
    setShowEditModal(true);
  };

  const addLink = () => {
    setEditFormData(prev => ({
      ...prev,
      links: [...prev.links, { url: '', label: '' }]
    }));
  };

  const removeLink = (index) => {
    setEditFormData(prev => ({
      ...prev,
      links: prev.links.filter((_, i) => i !== index)
    }));
  };

  const updateLink = (index, field, value) => {
    setEditFormData(prev => ({
      ...prev,
      links: prev.links.map((link, i) => 
        i === index ? { ...link, [field]: value } : link
      )
    }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      // Filter out empty links
      const validLinks = editFormData.links.filter(link => link.url.trim() !== '');
      
      const response = await apiCall(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          ...editFormData,
          links: validLinks
        })
      });

      if (response.ok) {
        const updatedTask = await response.json();
        setTask(updatedTask);
        setShowEditModal(false);
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const fetchSubtasks = async () => {
    try {
      setSubtaskLoading(true);
      // Use the numeric taskId from the task object for the subtasks endpoint
      if (task && task.taskId) {
        const response = await apiCall(`/api/tasks/${task.taskId}/subtasks`);
        
        if (response.ok) {
          const subtasksData = await response.json();
          setSubtasks(subtasksData);
        }
      }
    } catch (error) {
      console.error('Error fetching subtasks:', error);
    } finally {
      setSubtaskLoading(false);
    }
  };

  const handleSubtaskSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await apiCall(`/api/tasks`, {
        method: 'POST',
        body: JSON.stringify({
          ...subtaskForm,
          parentId: task.taskId
        })
      });

      if (response.ok) {
        const newSubtask = await response.json();
        setSubtasks(prev => [...prev, newSubtask]);
        setSubtaskForm({ 
          title: '', 
          description: '', 
          dueDate: '',
          priority: 'medium',
          category: '',
          repeatType: 'none',
          links: [],
          additionalNotes: ''
        });
        setShowSubtaskForm(false);
      }
    } catch (error) {
      console.error('Error creating subtask:', error);
    }
  };

  const handleSubtaskComplete = async (subtaskId, isCompleted) => {
    try {
      const response = await apiCall(`/api/tasks/${subtaskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ isCompleted: !isCompleted })
      });

      if (response.ok) {
        const updatedSubtask = await response.json();
        setSubtasks(prev => prev.map(subtask => 
          subtask._id === subtaskId ? updatedSubtask : subtask
        ));
      }
    } catch (error) {
      console.error('Error updating subtask:', error);
    }
  };

  const handleSubtaskDelete = async (subtaskId) => {
    if (window.confirm('Are you sure you want to delete this subtask?')) {
      try {
        const response = await apiCall(`/api/tasks/${subtaskId}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          setSubtasks(prev => prev.filter(subtask => subtask._id !== subtaskId));
        }
      } catch (error) {
        console.error('Error deleting subtask:', error);
      }
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityText = (priority) => {
    return priority?.charAt(0).toUpperCase() + priority?.slice(1) || 'Medium';
  };

  const getDueDateText = (dueDate) => {
    const date = new Date(dueDate);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    if (isPast(date)) return 'Overdue';
    return format(date, 'EEEE, MMMM d, yyyy');
  };

  const getDueDateColor = (dueDate, isCompleted) => {
    if (isCompleted) return 'text-green-600';
    const date = new Date(dueDate);
    if (isPast(date)) return 'text-red-600';
    if (isToday(date)) return 'text-orange-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Task Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'The requested task could not be found.'}</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="btn-primary"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex flex-row gap-3">
            <button
              onClick={handleComplete}
              className={`flex items-center justify-center flex-1 px-4 py-3 rounded-lg transition-colors text-base font-medium ${
                task.isCompleted 
                  ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              {task.isCompleted ? (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Completed
                </>
              ) : (
                <>
                  <Circle className="h-5 w-5 mr-2" />
                  Complete
                </>
              )}
            </button>
            
            {!task.isCompleted && (
              <button
                onClick={openEditModal}
                className="flex items-center justify-center flex-1 px-4 py-3 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-base font-medium"
              >
                <Edit className="h-5 w-5 mr-2" />
                Edit
              </button>
            )}
            
            <button
              onClick={handleDelete}
              className="flex items-center justify-center flex-1 px-4 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-base font-medium"
            >
              <Trash2 className="h-5 w-5 mr-2" />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Task Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Task Header */}
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 space-y-3 sm:space-y-0">
              <div className="flex-1">
                <h1 className={`text-2xl sm:text-3xl font-bold text-gray-900 mb-2 ${
                  task.isCompleted ? 'line-through text-gray-500' : ''
                }`}>
                  {task.title}
                </h1>
                {task.description && (
                  <p className={`text-base sm:text-lg text-gray-600 ${task.isCompleted ? 'line-through text-gray-400' : ''}`}>
                    {task.description}
                  </p>
                )}
              </div>
              
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${getPriorityColor(task.priority)} self-start`}>
                {getPriorityText(task.priority)} Priority
              </span>
            </div>

            {/* Task Meta */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div className="flex items-center text-gray-600 text-sm sm:text-base">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
                <span className={getDueDateColor(task.dueDate, task.isCompleted)}>
                  {getDueDateText(task.dueDate)}
                </span>
              </div>
              
              {task.category && (
                <div className="flex items-center text-gray-600 text-sm sm:text-base">
                  <Tag className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
                  <span>{task.category}</span>
                </div>
              )}
              
              <div className="flex items-center text-gray-600 text-sm sm:text-base">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
                <span>
                  Created {format(new Date(task.createdAt), 'MMM d, yyyy')}
                </span>
              </div>
            </div>
          </div>

          {/* Links and Additional Notes - Only show if they exist */}
          {(task.links && task.links.length > 0) || task.additionalNotes ? (
            <div className="p-4 sm:p-6 pt-0 space-y-4">
              {/* Links Section */}
              {task.links && task.links.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Related Links</h4>
                  <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                    {task.links.map((link, index) => (
                      <a
                        key={index}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-md transition-colors"
                      >
                        <Link className="h-4 w-4 mr-2" />
                        {link.label || 'Link'}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Notes Section */}
              {task.additionalNotes && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Additional Notes</h4>
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                    <div className="flex items-start">
                      <FileText className="h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                      <p className="text-gray-600 text-sm sm:text-base">{task.additionalNotes}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Subtasks Section */}
        <div className="mt-6 sm:mt-8 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <List className="h-5 w-5 mr-2" />
                Subtasks ({subtasks.length})
              </h2>
              
              {!task.isCompleted && (
                <button
                  onClick={() => {
                    // Pre-populate form with parent task values for inheritance reference
                    setSubtaskForm({
                      title: '',
                      description: '',
                      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
                      priority: task.priority || 'medium',
                      category: task.category || '',
                      repeatType: task.repeatType || 'none',
                      links: task.links || [],
                      additionalNotes: task.additionalNotes || ''
                    });
                    setShowSubtaskForm(true);
                  }}
                  className="btn-primary flex items-center justify-center self-start sm:self-auto w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Subtask
                </button>
              )}
            </div>
          </div>
          
          <div className="p-4 sm:p-6">
            {subtaskLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : subtasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <List className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No subtasks yet</p>
                {!task.isCompleted && (
                  <p className="text-sm mt-2">Click "Add Subtask" to get started</p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {subtasks.map((subtask) => (
                  <div
                    key={subtask._id}
                    className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 rounded-lg border space-y-2 sm:space-y-0 ${
                      subtask.isCompleted 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <button
                        onClick={() => handleSubtaskComplete(subtask._id, subtask.isCompleted)}
                        disabled={task.isCompleted}
                        className={`flex-shrink-0 ${task.isCompleted ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110 transition-transform'}`}
                      >
                        {subtask.isCompleted ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <Circle className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                      
                      <div className="flex-1">
                        <h4 className={`font-medium text-gray-900 text-sm sm:text-base ${
                          subtask.isCompleted ? 'line-through text-gray-500' : ''
                        }`}>
                          {subtask.title}
                        </h4>
                        {subtask.description && (
                          <p className={`text-xs sm:text-sm text-gray-600 ${
                            subtask.isCompleted ? 'line-through text-gray-400' : ''
                          }`}>
                            {subtask.description}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-end space-x-2 sm:ml-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(subtask.priority)}`}>
                        {getPriorityText(subtask.priority)}
                      </span>
                      
                      {!task.isCompleted && (
                        <button
                          onClick={() => handleSubtaskDelete(subtask._id)}
                          className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                          title="Delete subtask"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Task Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Edit Task</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6">
              <form onSubmit={handleEditSubmit} className="space-y-4">
                {/* Title */}
                <div>
                  <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 mb-1">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    id="edit-title"
                    name="title"
                    value={editFormData.title}
                    onChange={(e) => setEditFormData({...editFormData, title: e.target.value})}
                    className="input-field"
                    placeholder="Enter task title"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="edit-description"
                    name="description"
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                    rows="3"
                    className="input-field"
                    placeholder="Enter task description (optional)"
                  />
                </div>

                {/* Due Date */}
                <div>
                  <label htmlFor="edit-dueDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    id="edit-dueDate"
                    name="dueDate"
                    value={editFormData.dueDate}
                    onChange={(e) => setEditFormData({...editFormData, dueDate: e.target.value})}
                    className="input-field"
                    required
                  />
                </div>

                {/* Priority and Category Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Priority */}
                  <div>
                    <label htmlFor="edit-priority" className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <select
                      id="edit-priority"
                      name="priority"
                      value={editFormData.priority}
                      onChange={(e) => setEditFormData({...editFormData, priority: e.target.value})}
                      className="input-field"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  {/* Category */}
                  <div>
                    <label htmlFor="edit-category" className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <input
                      type="text"
                      id="edit-category"
                      name="category"
                      value={editFormData.category}
                      onChange={(e) => setEditFormData({...editFormData, category: e.target.value})}
                      className="input-field"
                      placeholder="Enter category (optional)"
                    />
                  </div>
                </div>

                {/* Links Section */}
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 space-y-2 sm:space-y-0">
                    <label className="block text-sm font-medium text-gray-700">
                      <Link className="inline h-4 w-4 mr-2" />
                      Related Links
                    </label>
                    <button
                      type="button"
                      onClick={addLink}
                      className="inline-flex items-center px-2 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors self-start sm:self-auto"
                    >
                      Add Link
                    </button>
                  </div>
                  
                  {editFormData.links.length === 0 && (
                    <p className="text-sm text-gray-500 italic">No links added yet</p>
                  )}
                  
                  {editFormData.links.map((link, index) => (
                    <div key={index} className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mb-2">
                      <input
                        type="text"
                        placeholder="Link label (optional)"
                        value={link.label}
                        onChange={(e) => updateLink(index, 'label', e.target.value)}
                        className="flex-1 input-field text-sm"
                      />
                      <input
                        type="url"
                        placeholder="https://example.com"
                        value={link.url}
                        onChange={(e) => updateLink(index, 'url', e.target.value)}
                        className="flex-1 input-field text-sm"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => removeLink(index)}
                        className="px-2 py-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors self-start sm:self-auto"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Additional Notes */}
                <div>
                  <label htmlFor="edit-additionalNotes" className="block text-sm font-medium text-gray-700 mb-1">
                    <FileText className="inline h-4 w-4 mr-2" />
                    Additional Notes
                  </label>
                  <textarea
                    id="edit-additionalNotes"
                    name="additionalNotes"
                    value={editFormData.additionalNotes}
                    onChange={(e) => setEditFormData({...editFormData, additionalNotes: e.target.value})}
                    rows="3"
                    className="input-field"
                    placeholder="Any additional information, context, or reminders..."
                  />
                </div>

                {/* Submit Button */}
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="btn-secondary flex-1 w-full sm:w-auto"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary flex-1 w-full sm:w-auto"
                  >
                    Update Task
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Subtask Modal */}
      {showSubtaskForm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Add Subtask</h3>
              <button
                onClick={() => setShowSubtaskForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6">
              <form onSubmit={handleSubtaskSubmit} className="space-y-4">
                {/* Title */}
                <div>
                  <label htmlFor="subtask-title" className="block text-sm font-medium text-gray-700 mb-1">
                    Subtask Title *
                  </label>
                  <input
                    type="text"
                    id="subtask-title"
                    name="title"
                    value={subtaskForm.title}
                    onChange={(e) => setSubtaskForm({...subtaskForm, title: e.target.value})}
                    className="input-field"
                    placeholder="Enter subtask title"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="subtask-description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="subtask-description"
                    name="description"
                    value={subtaskForm.description}
                    onChange={(e) => setSubtaskForm({...subtaskForm, description: e.target.value})}
                    rows="3"
                    className="input-field"
                    placeholder="Enter subtask description (optional)"
                  />
                </div>

                {/* Due Date */}
                <div>
                  <label htmlFor="subtask-dueDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    id="subtask-dueDate"
                    name="dueDate"
                    value={subtaskForm.dueDate}
                    onChange={(e) => setSubtaskForm({...subtaskForm, dueDate: e.target.value})}
                    className="input-field"
                    placeholder="Select due date (optional)"
                  />
                </div>

                {/* Priority and Category Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Priority */}
                  <div>
                    <label htmlFor="subtask-priority" className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <select
                      id="subtask-priority"
                      name="priority"
                      value={subtaskForm.priority}
                      onChange={(e) => setSubtaskForm({...subtaskForm, priority: e.target.value})}
                      className="input-field"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  {/* Category */}
                  <div>
                    <label htmlFor="subtask-category" className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <input
                      type="text"
                      id="subtask-category"
                      name="category"
                      value={subtaskForm.category}
                      onChange={(e) => setSubtaskForm({...subtaskForm, category: e.target.value})}
                      className="input-field"
                      placeholder="e.g., Work, Personal, Health"
                    />
                  </div>
                </div>

                {/* Repeat Type */}
                <div>
                  <label htmlFor="subtask-repeatType" className="block text-sm font-medium text-gray-700 mb-1">
                    Repeat
                  </label>
                  <select
                    id="subtask-repeatType"
                    name="repeatType"
                    value={subtaskForm.repeatType}
                    onChange={(e) => setSubtaskForm({...subtaskForm, repeatType: e.target.value})}
                    className="input-field"
                  >
                    <option value="none">No Repeat</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                {/* Links Section */}
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 space-y-2 sm:space-y-0">
                    <label className="block text-sm font-medium text-gray-700">
                      Related Links
                    </label>
                    <button
                      type="button"
                      onClick={() => setSubtaskForm(prev => ({...prev, links: [...prev.links, '']}))}
                      className="inline-flex items-center px-2 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors self-start sm:self-auto"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Link
                    </button>
                  </div>
                  
                  {subtaskForm.links.length === 0 && (
                    <p className="text-sm text-gray-500 italic">No links added yet</p>
                  )}
                  
                  {subtaskForm.links.map((link, index) => (
                    <div key={index} className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mb-2">
                      <input
                        type="url"
                        placeholder="https://example.com"
                        value={link}
                        onChange={(e) => {
                          const newLinks = [...subtaskForm.links];
                          newLinks[index] = e.target.value;
                          setSubtaskForm({...subtaskForm, links: newLinks});
                        }}
                        className="flex-1 input-field text-sm"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newLinks = subtaskForm.links.filter((_, i) => i !== index);
                          setSubtaskForm({...subtaskForm, links: newLinks});
                        }}
                        className="px-2 py-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors self-start sm:self-auto"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Additional Notes */}
                <div>
                  <label htmlFor="subtask-additionalNotes" className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Notes
                  </label>
                  <textarea
                    id="subtask-additionalNotes"
                    name="additionalNotes"
                    value={subtaskForm.additionalNotes}
                    onChange={(e) => setSubtaskForm({...subtaskForm, additionalNotes: e.target.value})}
                    rows="3"
                    className="input-field"
                    placeholder="Any additional information, context, or reminders..."
                  />
                </div>

                {/* Submit Button */}
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowSubtaskForm(false)}
                    className="btn-secondary flex-1 w-full sm:w-auto"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary flex-1 w-full sm:w-auto"
                  >
                    Add Subtask
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Task</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "{task?.title}"? This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="btn-primary flex-1 bg-red-600 hover:bg-red-700"
                >
                  Delete Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskDetail;
