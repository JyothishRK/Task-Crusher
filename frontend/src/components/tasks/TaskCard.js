import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Circle, Trash2, Calendar, X, Pencil, Link, FileText } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const TaskCard = ({ task, onTaskUpdated, onTaskDeleted, allowActions = true }) => {
  const { apiCall } = useAuth();
  const navigate = useNavigate();
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
  const [isUpdating, setIsUpdating] = useState(false);

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
    if (isUpdating) return;
    
    setIsUpdating(true);
    try {
      // Filter out empty links
      const validLinks = editFormData.links.filter(link => link.url.trim() !== '');
      
      const response = await apiCall(`/api/tasks/${task._id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          ...editFormData,
          links: validLinks
        })
      });

      if (response.ok) {
        const updatedTask = await response.json();
        onTaskUpdated(updatedTask);
        setShowEditModal(false);
      } else {
        console.error('Failed to update task');
      }
    } catch (error) {
      console.error('Error updating task:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleComplete = async (e) => {
    e.stopPropagation(); // Prevent navigation when clicking complete button
    try {
      const response = await apiCall(`/api/tasks/${task._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isCompleted: !task.isCompleted })
      });

      if (response.ok) {
        const updatedTask = await response.json();
        onTaskUpdated(updatedTask);
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation(); // Prevent navigation when clicking delete button
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        const response = await apiCall(`/api/tasks/${task._id}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          onTaskDeleted(task._id);
        }
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  const handleTaskClick = () => {
    // Don't navigate if edit modal is open
    if (showEditModal) return;
    navigate(`/task/${task._id}`);
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

  return (
    <div 
      className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200 cursor-pointer"
      onClick={handleTaskClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <button
            onClick={handleComplete}
            disabled={!allowActions}
            className={`flex-shrink-0 ${!allowActions ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110 transition-transform'}`}
          >
            {task.isCompleted ? (
              <CheckCircle className="h-6 w-6 text-green-500" />
            ) : (
              <Circle className="h-6 w-6 text-gray-400" />
            )}
          </button>
          
          <div className="flex-1 min-w-0">
            <h3 className={`font-medium text-gray-900 ${task.isCompleted ? 'line-through text-gray-500' : ''}`}>
              {task.title}
            </h3>
            {task.description && (
              <p className={`text-sm text-gray-600 mt-1 ${task.isCompleted ? 'line-through text-gray-400' : ''}`}>
                {task.description}
              </p>
            )}
            
            {/* Display Links */}
            {task.links && task.links.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {task.links.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md transition-colors"
                  >
                    <Link className="h-3 w-3 mr-1" />
                    {link.label || 'Link'}
                  </a>
                ))}
              </div>
            )}
            
            {/* Display Additional Notes */}
            {task.additionalNotes && (
              <div className="mt-2 flex items-start">
                <FileText className="h-3 w-3 text-gray-400 mr-1 mt-0.5 flex-shrink-0" />
                <p className={`text-xs text-gray-500 ${task.isCompleted ? 'line-through text-gray-400' : ''}`}>
                  {task.additionalNotes}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 ml-4">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
            {getPriorityText(task.priority)}
          </span>
          
          {allowActions && !task.isCompleted && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openEditModal();
                }}
                className="text-purple-600 hover:text-purple-800 p-1 rounded hover:bg-purple-50 transition-colors"
                title="Edit task"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={handleDelete}
                className="text-gray-500 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                title="Delete task"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Edit Task Modal */}
      {showEditModal && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowEditModal(false);
            }
          }}
        >
          {/* Modal Container */}
          <div 
            className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Edit Task</h3>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowEditModal(false);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
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
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="date"
                      id="edit-dueDate"
                      name="dueDate"
                      value={editFormData.dueDate}
                      onChange={(e) => setEditFormData({...editFormData, dueDate: e.target.value})}
                      className="input-field pl-10"
                      required
                    />
                  </div>
                </div>

                {/* Priority and Category Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      <Link className="inline h-4 w-4 mr-2" />
                      Related Links
                    </label>
                    <button
                      type="button"
                      onClick={addLink}
                      className="inline-flex items-center px-2 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                    >
                      Add Link
                    </button>
                  </div>
                  
                  {editFormData.links.length === 0 && (
                    <p className="text-sm text-gray-500 italic">No links added yet</p>
                  )}
                  
                  {editFormData.links.map((link, index) => (
                    <div key={index} className="flex space-x-2 mb-2">
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
                        className="px-2 py-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
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
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpdating ? 'Updating...' : 'Update Task'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskCard;
