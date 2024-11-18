import React, { useState } from 'react';
import { useNavigate,Routes,Route,useLocation } from 'react-router-dom';
import Home from './Home';

const SidebarItem = ({ icon, label, isOpen, onClick, children, isActive, path }) => {
    const activeClass = isActive ? 'border-r-4 border-blue-500 bg-blue-50' : '';
    const activeTextClass = isActive ? 'text-blue-500' : 'text-gray-700';


  return (
    <div className="mb-1">
      <div 
        onClick={onClick}
        className={`flex items-center p-3 rounded-lg cursor-pointer hover:bg-blue-50 ${activeClass}`}
      >
        <div className={`p-2 ${activeTextClass}`}>{icon}</div>
        <span className={`ml-2 ${activeTextClass}`}>{label}</span>
        {children && (
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`ml-auto h-5 w-5 transform transition-transform ${isOpen ? 'rotate-180' : ''} ${activeTextClass}`} 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        )}
      </div>
      {isOpen && children && (
        <div className="ml-12 mt-1 space-y-1">
        {React.Children.map(children, child => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, {
              className: `py-2 px-3 text-sm rounded-md hover:bg-blue-50 cursor-pointer ${
                path === child.props.onClick?.toString().match(/\'(.+)\'/)?.[1] 
                  ? 'text-blue-500 bg-blue-50' 
                  : 'text-gray-700'
              }`
            });
          }
          return child;
        })}
      </div>
      )}
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [expandedMenu, setExpandedMenu] = useState('myTasks'); // Set My Tasks as initially expanded

  const toggleMenu = (menuName) => {
    setExpandedMenu(expandedMenu === menuName ? null : menuName);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-md hover:bg-gray-100 lg:hidden"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="text-lg font-semibold">HSE Management System</div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
              </svg>
            </button>
            <button className="p-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r transform transition-transform duration-200 ease-in-out lg:translate-x-0`}>
          <div className="h-full flex flex-col">
            <div className="p-4 border-b">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium">Administrator</div>
                  <div className="text-sm text-gray-500">Admin</div>
                </div>
              </div>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              <SidebarItem 
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                  </svg>
                } 
                label="Home"
                onClick={() => navigate('/dashboard')}
                isActive={location.pathname === '/dashboard'}
                path={location.pathname}
              />

              <SidebarItem 
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                } 
                label="Permits Request"
                isActive={location.pathname === '/workflow'}
                path={location.pathname}
              />

              <SidebarItem 
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                  </svg>
                } 
                label="My Tasks"
                isOpen={expandedMenu === 'myTasks'}
                onClick={() => toggleMenu('myTasks')}
                isActive={['/view-permits', '/approval-history', '/view-jobs'].includes(location.pathname)}
                path={location.pathname}
              >
                <div 
                  className="py-2 px-3 text-sm rounded-md hover:bg-gray-100 cursor-pointer"
                  onClick={() => navigate('/view-permits')}
                >
                  View Permits
                </div>
                <div 
                  className="py-2 px-3 text-sm rounded-md hover:bg-gray-100 cursor-pointer"
                  onClick={() => navigate('/approval-history')}
                >
                  Approval History
                </div>
                <div 
                  className="py-2 px-3 text-sm rounded-md hover:bg-gray-100 cursor-pointer"
                  onClick={() => navigate('/view-jobs')}
                >
                  View Jobs
                </div>
              </SidebarItem>

              <SidebarItem 
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                } 
                label="Jobs Monitoring"
                isActive={location.pathname === '/monitoring'}
                path={location.pathname}
              />
            </nav>

            <div className="p-4 border-t text-xs text-gray-500">
              ©2024 Copyright version 0.1
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/view-permits" element={<div>View Permits Content</div>} />
            <Route path="/approval-history" element={<div>Approval History Content</div>} />
            <Route path="/view-jobs" element={<div>View Jobs Content</div>} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;