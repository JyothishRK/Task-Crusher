import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  CheckCircle, 
  Zap, 
  Target, 
  TrendingUp, 
  Users, 
  Star,
  Play,
  X,
  Calendar,
  BarChart3,
  Clock,
  CheckSquare
} from 'lucide-react';

const LandingPage = () => {
  const [activeFeature, setActiveFeature] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  // Add custom animations to the document
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slide-in-left {
        from { transform: translateX(-50px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slide-in-up {
        from { transform: translateY(30px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      @keyframes slide-in-right {
        from { transform: translateX(50px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes fade-in-up {
        from { transform: translateY(30px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      @keyframes float-slow {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
      }
      @keyframes float-medium {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-15px); }
      }
      @keyframes float-fast {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-8px); }
      }
      .animate-slide-in-left { animation: slide-in-left 0.8s ease-out; }
      .animate-slide-in-up { animation: slide-in-up 0.8s ease-out; }
      .animate-slide-in-right { animation: slide-in-right 0.8s ease-out; }
      .animate-fade-in-up { animation: fade-in-up 1s ease-out; }
      .animate-float-slow { animation: float-slow 3s ease-in-out infinite; }
      .animate-float-medium { animation: float-medium 2.5s ease-in-out infinite; }
      .animate-float-fast { animation: float-fast 2s ease-in-out infinite; }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    setIsVisible(true);
    
    // Auto-rotate features
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 3);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: <Target className="h-8 w-8" />,
      title: "Smart Task Management",
      description: "Organize tasks with intelligent categorization and priority levels"
    },
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: "Progress Tracking",
      description: "Monitor your productivity with detailed analytics and insights"
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Lightning Fast",
      description: "Built for speed with instant updates and real-time synchronization"
    }
  ];

  const demoFeatures = [
    {
      icon: <CheckSquare className="h-6 w-6" />,
      title: "Task Creation",
      description: "Create tasks with titles, descriptions, due dates, and priority levels"
    },
    {
      icon: <Calendar className="h-6 w-6" />,
      title: "Calendar View",
      description: "Visualize your tasks in daily, weekly, and monthly calendar layouts"
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Progress Analytics",
      description: "Track completion rates, productivity trends, and time management insights"
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: "Time Tracking",
      description: "Monitor time spent on tasks and optimize your workflow efficiency"
    }
  ];



  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-blue-200 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97-.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900">Sync'd</span>
            </div>
            
            {/* Navigation Buttons - Visible on both mobile and desktop */}
            <div className="flex items-center space-x-3">
              <Link 
                to="/signin" 
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200 text-sm sm:text-base"
              >
                Sign In
              </Link>
              <Link 
                to="/signup" 
                className="bg-blue-600 text-white px-4 sm:px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 sm:pt-24 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight px-2">
              Stay{' '}
              <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                Sync'd
              </span>
              , Stay{' '}
              <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                Productive
              </span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed px-4">
              The ultimate task management app that keeps you organized, focused, and in sync. 
              Transform your workflow with intelligent features and seamless synchronization.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-8 sm:mb-12 px-4">
              <Link 
                to="/signup" 
                className="group bg-blue-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg hover:bg-blue-700 transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl flex items-center space-x-2 w-full sm:w-auto justify-center"
              >
                <span>Start Syncing</span>
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform duration-200" />
              </Link>
              <button 
                onClick={() => setShowDemo(true)}
                className="group flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors duration-200 w-full sm:w-auto justify-center"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors duration-200">
                  <Play className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 ml-1" />
                </div>
                <span className="font-medium text-sm sm:text-base">See How It Works</span>
              </button>
            </div>
          </div>

          {/* Hero Image/Animation */}
          <div className={`transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="relative max-w-4xl mx-auto px-4">
              <div className="bg-gradient-to-r from-blue-100 to-blue-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                  {features.map((feature, index) => (
                    <div 
                      key={index}
                      className={`p-4 sm:p-6 bg-white rounded-xl sm:rounded-2xl shadow-lg transition-all duration-500 ${
                        activeFeature === index 
                          ? 'transform scale-105 shadow-xl ring-2 ring-blue-200' 
                          : 'hover:transform hover:scale-105 hover:shadow-xl'
                      }`}
                    >
                      <div className="text-blue-600 mb-3 sm:mb-4 flex justify-center">{feature.icon}</div>
                      <h3 className="font-semibold text-gray-900 mb-2 text-center text-sm sm:text-base">{feature.title}</h3>
                      <p className="text-gray-600 text-xs sm:text-sm text-center">{feature.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>


        </div>
      </section>

      {/* Simple Middle Section */}
      <section className="py-8 sm:py-12 md:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          {/* Icon Container */}
          <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-gradient-to-r from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 md:mb-8 animate-pulse hover:animate-bounce transition-all duration-300 hover:scale-110 hover:shadow-lg">
            <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 text-blue-600 animate-pulse" />
          </div>
          
          {/* Title */}
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6 animate-fade-in-up px-2 sm:px-4 leading-tight">
            <span className="inline-block animate-slide-in-left mb-1 sm:mb-0">Simple.</span>
            <br className="sm:hidden" />
            <span className="inline-block animate-slide-in-up mx-1 sm:mx-0">Powerful.</span>
            <br className="sm:hidden" />
            <span className="inline-block animate-slide-in-right">Effective.</span>
          </h2>
          
          {/* Description */}
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-300 px-3 sm:px-4 mb-6 sm:mb-8">
            Sync'd combines simplicity with powerful features to give you the perfect task management experience. 
            <br className="hidden sm:block" />
            No complex setup, no learning curve - just pure productivity.
          </p>
          
          {/* Floating Elements - Hidden on very small screens */}
          <div className="relative mt-6 sm:mt-8 md:mt-12 hidden sm:block">
            <div className="absolute -top-4 -left-4 sm:-left-8 w-3 h-3 sm:w-4 sm:h-4 bg-blue-200 rounded-full animate-float-slow"></div>
            <div className="absolute -top-6 sm:-top-8 -right-6 sm:-right-12 w-2 h-2 sm:w-3 sm:h-3 bg-blue-300 rounded-full animate-float-medium"></div>
            <div className="absolute -bottom-4 sm:-bottom-6 left-6 sm:left-12 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full animate-float-fast"></div>
            <div className="absolute -bottom-3 sm:-bottom-4 -right-6 sm:-right-8 w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full animate-float-slow"></div>
          </div>
          
          {/* Mobile-friendly floating elements */}
          <div className="relative mt-6 sm:hidden">
            <div className="flex justify-center space-x-4">
              <div className="w-2 h-2 bg-blue-200 rounded-full animate-float-slow"></div>
              <div className="w-2 h-2 bg-blue-300 rounded-full animate-float-medium"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-float-fast"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white pb-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="border-t border-gray-800 mt-8 sm:mt-12 pt-6 sm:pt-8 text-center">
            <p className="text-gray-400 text-sm sm:text-base">
              © 2025 Sync'd. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Demo Modal */}
      {showDemo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowDemo(false)}></div>
          <div className="relative bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">See How Sync'd Works</h3>
                <button
                  onClick={() => setShowDemo(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <X className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>
              <p className="text-gray-600 mt-2 text-sm sm:text-base">Get a quick overview of Sync'd's key features and how they work together</p>
            </div>
            
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 gap-4 sm:gap-6">
                {demoFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <div className="text-blue-600">{feature.icon}</div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">{feature.title}</h4>
                      <p className="text-xs sm:text-sm text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl">
                <h4 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">Ready to try it yourself?</h4>
                <p className="text-gray-600 mb-4 text-sm sm:text-base">Experience the power of Sync'd with our free trial. No credit card required.</p>
                <div className="flex flex-col gap-3">
                  <Link
                    to="/signup"
                    onClick={() => setShowDemo(false)}
                    className="bg-blue-600 text-white px-4 sm:px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 text-center text-sm sm:text-base"
                  >
                    Start Free Trial
                  </Link>
                  <button
                    onClick={() => setShowDemo(false)}
                    className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200 text-sm sm:text-base"
                  >
                    Maybe Later
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
