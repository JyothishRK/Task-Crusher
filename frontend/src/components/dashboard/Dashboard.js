import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  CheckCircle, 
  Clock, 
  Calendar,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import TaskCard from '../tasks/TaskCard';
import AddTaskModal from '../tasks/AddTaskModal';
import { format, addDays, subDays, isToday, isSameDay } from 'date-fns';

const Dashboard = () => {
  const { user, loading: authLoading, apiCall } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());



  useEffect(() => {
    if (user && !authLoading && !hasInitialized) {
      const timer = setTimeout(() => {
        setHasInitialized(true);
        fetchTasks();
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [user, authLoading, hasInitialized]);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await apiCall('/api/tasks');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const tasksData = await response.json();
      setTasks(tasksData);
    } catch (error) {
      if (error.message === 'Authentication failed') {
        setTasks([]);
        return;
      }
      
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  // Add immediate fetch when component mounts
  useEffect(() => {
    if (user && !authLoading) {
      fetchTasks();
    }
  }, [user, authLoading, fetchTasks]);

  const handleTaskAdded = (newTask) => {
    // Immediately add the new task to the local state for instant UI update
    setTasks(prev => [newTask, ...prev]);
    
    // Also refresh from API to ensure consistency
    setTimeout(() => {
      fetchTasks();
    }, 100);
  };

  const handleTaskUpdated = (updatedTask) => {
    // Immediately update the task in local state for instant UI update
    setTasks(prev => prev.map(task => 
      task._id === updatedTask._id ? updatedTask : task
    ));
    
    // Also refresh from API to ensure consistency
    setTimeout(() => {
      fetchTasks();
    }, 100);
  };

  const handleTaskDeleted = (taskId) => {
    // Immediately remove the task from local state for instant UI update
    setTasks(prev => prev.filter(task => task._id !== taskId));
    
    // Also refresh from API to ensure consistency
    setTimeout(() => {
      fetchTasks();
    }, 100);
  };

  // Generate 7 days around selected date
  const getWeekDays = () => {
    const days = [];
    const currentDate = new Date(selectedDate);
    
    // Go back 3 days
    for (let i = 3; i > 0; i--) {
      days.push(subDays(currentDate, i));
    }
    
    // Add current day
    days.push(currentDate);
    
    // Go forward 3 days
    for (let i = 1; i <= 3; i++) {
      days.push(addDays(currentDate, i));
    }
    
    return days;
  };

  // Get tasks for a specific date
  const getTasksForDate = (date) => {
    return tasks.filter(task => {
      try {
        const taskDate = new Date(task.dueDate);
        return isSameDay(taskDate, date);
      } catch (error) {
        return false;
      }
    });
  };

  // Navigate to previous/next week
  const navigateWeek = (direction) => {
    if (direction === 'prev') {
      setSelectedDate(prev => subDays(prev, 7));
    } else {
      setSelectedDate(prev => addDays(prev, 7));
    }
  };

  // Show error if no user
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-4">Please sign in to access your dashboard.</p>
          <button 
            onClick={() => window.location.href = '/signin'}
            className="btn-primary"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  // Always show the dashboard, even if tasks fail to load
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Show error if no user
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-4">Please sign in to access your dashboard.</p>
          <button 
            onClick={() => window.location.href = '/signin'}
            className="btn-primary"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  const weekDays = getWeekDays();
  const currentDayTasks = getTasksForDate(selectedDate);
  const pendingTasks = currentDayTasks.filter(task => !task.isCompleted);
  const completedTasks = currentDayTasks.filter(task => task.isCompleted);
  


  return (
    <div className="space-y-4">
      {/* Welcome Header - Full Width */}
      <div className="bg-gradient-purple w-full py-6 text-white">
        <div className="text-center px-4">
          <h1 className="text-xl font-bold">Welcome, {user?.name}! 👋</h1>
          <p className="text-primary-100 mt-1 text-sm">Manage your tasks for today</p>
        </div>
      </div>

      {/* Main Content with Padding */}
      <div className="px-4 space-y-4">

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigateWeek('prev')}
          className="p-2 text-gray-600 hover:text-gray-800"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-semibold text-gray-900">
          {format(selectedDate, 'MMMM yyyy')}
        </h2>
        <button
          onClick={() => navigateWeek('next')}
          className="p-2 text-gray-600 hover:text-gray-800"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* 7-Day Calendar View */}
      <div className="grid grid-cols-7 gap-2 mb-6">
        {weekDays.map((day, index) => {
          const dayTasks = getTasksForDate(day);
          const isCurrentDay = isToday(day);
          const isSelected = isSameDay(day, selectedDate);
          
          return (
            <button
              key={index}
              onClick={() => setSelectedDate(day)}
              className={`p-3 rounded-lg text-center transition-all ${
                isSelected
                  ? 'bg-primary-600 text-white shadow-lg'
                  : isCurrentDay
                  ? 'bg-primary-100 text-primary-700 border-2 border-primary-300'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <div className="text-xs font-medium mb-1">
                {format(day, 'EEE')}
              </div>
              <div className={`text-lg font-bold ${
                isSelected ? 'text-white' : 'text-gray-900'
              }`}>
                {format(day, 'd')}
              </div>
              
            </button>
          );
        })}
      </div>

      {/* Selected Date Header */}
      <div className="text-center mb-4">
        <h3 className="text-xl font-bold text-gray-900">
          {isToday(selectedDate) ? 'Today' : format(selectedDate, 'EEEE, MMMM d')}
        </h3>
        <p className="text-gray-600 text-sm">
          {loading ? 'Loading tasks...' : `${currentDayTasks.length} task${currentDayTasks.length !== 1 ? 's' : ''} scheduled`}
        </p>
      </div>

      {/* Tasks for Selected Date */}
      {currentDayTasks.length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks scheduled</h3>
          <p className="text-gray-500 mb-4">Use the + button below to add a task</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Pending Tasks */}
          {pendingTasks.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <Clock className="h-5 w-5 text-warning-600 mr-2" />
                Pending Tasks ({pendingTasks.length})
              </h4>
              <div className="space-y-3">
                {pendingTasks.map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    onTaskUpdated={handleTaskUpdated}
                    onTaskDeleted={handleTaskDeleted}
                    allowActions={isToday(selectedDate) && !task.isCompleted}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Completed Tasks */}
          {completedTasks.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <CheckCircle className="h-5 w-5 text-success-600 mr-2" />
                Completed Tasks ({completedTasks.length})
              </h4>
              <div className="space-y-3">
                {completedTasks.map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    onTaskUpdated={handleTaskUpdated}
                    onTaskDeleted={handleTaskDeleted}
                    allowActions={false}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Task Modal */}
      {showAddTask && (
        <AddTaskModal
          onClose={() => setShowAddTask(false)}
          onTaskAdded={handleTaskAdded}
        />
      )}
      </div>
    </div>
  );
};

export default Dashboard;
