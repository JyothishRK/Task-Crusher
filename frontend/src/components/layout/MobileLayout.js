import React, { useState } from 'react';
import { Home, Plus, BarChart3, User } from 'lucide-react';
import Dashboard from '../dashboard/Dashboard';
import AddTaskModal from '../tasks/AddTaskModal';
import Profile from '../profile/Profile';

const MobileLayout = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAddTask, setShowAddTask] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  console.log('MobileLayout rendered with activeTab:', activeTab);

  const renderContent = () => {
    console.log('renderContent called with activeTab:', activeTab);
    switch (activeTab) {
      case 'dashboard':
        console.log('Rendering Dashboard component');
        return <Dashboard key={refreshKey} />;
      case 'add-task':
        console.log('Rendering Add Task component');
        return (
          <div className="p-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Add Task</h2>
            <p className="text-gray-600">Task creation form will go here</p>
          </div>
        );
      case 'analytics':
        console.log('Rendering Analytics component');
        return (
          <div className="p-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Analytics</h2>
            <p className="text-gray-600">Analytics dashboard will go here</p>
          </div>
        );
      case 'profile':
        console.log('Rendering Profile component');
        return <Profile />;
      default:
        console.log('Rendering default Dashboard component');
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content Area */}
      <div className="pb-20">
        {renderContent()}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex justify-around items-center">
          {/* Dashboard Tab */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
              activeTab === 'dashboard'
                ? 'text-primary-600 bg-primary-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Home className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Dashboard</span>
          </button>

          {/* Add Task Tab */}
          <button
            onClick={() => setShowAddTask(true)}
            className="flex flex-col items-center py-2 px-3 rounded-lg transition-colors text-primary-600 hover:text-primary-700"
          >
            <div className="h-6 w-6 mb-1 bg-primary-600 rounded-full flex items-center justify-center">
              <Plus className="h-4 w-4 text-white" />
            </div>
            <span className="text-xs font-medium">Add Task</span>
          </button>

          {/* Analytics Tab */}
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
              activeTab === 'analytics'
                ? 'text-primary-600 bg-primary-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <BarChart3 className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Analytics</span>
          </button>

          {/* Profile Tab */}
          <button
            onClick={() => {
              console.log('Profile tab clicked, setting activeTab to profile');
              setActiveTab('profile');
            }}
            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
              activeTab === 'profile'
                ? 'text-primary-600 bg-primary-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <User className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Profile</span>
          </button>
        </div>
      </div>

      {/* Add Task Modal */}
      {showAddTask && (
        <AddTaskModal
          onClose={() => setShowAddTask(false)}
          onTaskAdded={(newTask) => {
            setShowAddTask(false);
            setActiveTab('dashboard');
            // Trigger Dashboard refresh by changing the key
            // This forces the Dashboard component to re-mount and fetch fresh tasks
            setRefreshKey(prev => prev + 1);
          }}
        />
      )}
    </div>
  );
};

export default MobileLayout;
