import React, { useState, useEffect } from 'react';
import { useNavigate,Routes,Route,useLocation,Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ViewPermits from './ViewPermits';
import Home from './Home';

const SidebarItem = ({ icon, label, isOpen, onClick, children, isActive, path, isCreatePermitActive }) => {
    const activeClass = isActive || isCreatePermitActive ? 'border-r-4 border-blue-500 bg-blue-50' : '';
    const activeTextClass = isActive || isCreatePermitActive ? 'text-blue-500' : 'text-gray-700';

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

const Sidebar = () => {
  // const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarMode, setSidebarMode] = useState('full');
  const [expandedMenu, setExpandedMenu] = useState(null);

  // Abednego 20-01-2025
  const [currentUser, SetCurrentUser] = useState()

  useEffect(()=>{
    const saveData = window.localStorage.getItem('jkkkkcdvyuscgjkyasfgyudcvkidscvjhcytdjftyad7guilllllaycfui')
    const parsedData = JSON.parse(saveData)
    console.warn(parsedData)
    SetCurrentUser(parsedData?.user)
  }, [])

  // Add this useEffect for initial redirect
  useEffect(() => {
    if (currentUser?.roleId?.trim() === 'RCV' && location.pathname === '/dashboard') {
      navigate('/dashboard/permits/job-permits');
    }
  }, [currentUser, location.pathname, navigate]);

  const isLimitedUser = currentUser?.roleId?.trim() !== 'HOD' && currentUser?.roleId?.trim() !== 'ISS';

// Update the getUserRoleDisplay function
const getUserRoleDisplay = () => {
    const roleId = currentUser?.roleId?.trim();
    switch(roleId) {
        case 'RCV': return 'Permit Receiver';
        case 'ISS': return 'Permit Issuer';
        case 'HOD': return 'Head of Department';
        // default: return 'User';
    }
};

  const toggleSidebar = () => {
      // Toggle between 'full' and 'icons' modes
      setSidebarMode((prev) => (prev === 'full' ? 'icons' : 'full'));
  };

  const toggleMenu = (menuName) => {
      setExpandedMenu(expandedMenu === menuName ? null : menuName);
  };

  const getSidebarClasses = () => {
      return sidebarMode === 'full' ? 'w-64' : 'w-24';
  };

  const renderSidebarContent = () => {
      return (
          <>
              <div className="p-4 border-b">
                  <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-blue-100">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                              <path
                                  fillRule="evenodd"
                                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z"
                                  clipRule="evenodd"
                              />
                          </svg>
                      </div>
                      {sidebarMode === 'full' && (
                          <div>
                          <div className="font-medium">Welcome, {currentUser?.firstName}</div>
                          <div className="text-sm text-gray-500">{getUserRoleDisplay()}</div>
                        </div>
                      )}
                  </div>
              </div>

              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                  {/* Only show Home for Issuers and HODs */}
                  {!isLimitedUser && (
                    <SidebarItem
                      icon={
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                        </svg>
                      }
                      label={sidebarMode === 'full' ? 'Home' : ''}
                      onClick={() => navigate('/dashboard')}
                      isActive={location.pathname === '/dashboard'}
                      path={location.pathname}
                    />
                  )}

                  {/* Permits Request - visible to all users */}
                  <SidebarItem
                      icon={
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path
                                  fillRule="evenodd"
                                  d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                                  clipRule="evenodd"
                              />
                          </svg>
                      }
                      label={sidebarMode === 'full' ? 'Permits Request' : ''}
                      isOpen={sidebarMode === 'full' && expandedMenu === 'permits'}
                      onClick={() => toggleMenu('permits')}
                      isActive={['/dashboard/permits/job-permits', '/dashboard/permits/permit-to-work'].includes(location.pathname)}
                      isCreatePermitActive={location.pathname === '/dashboard/permits/job-permits/create'}
                      path={location.pathname}
                  >
                      {sidebarMode === 'full' && (
                          <>
                              <div
                                  className="py-2 px-3 text-sm rounded-md hover:bg-gray-100 cursor-pointer"
                                  onClick={() => navigate('/dashboard/permits/job-permits')}
                              >
                                  Job Safety Permits
                              </div>
                              <div
                                  className="py-2 px-3 text-sm rounded-md hover:bg-gray-100 cursor-pointer"
                                  onClick={() => navigate('/dashboard/permits/permit-to-work')}
                              >
                                  Permit To Work
                              </div>
                          </>
                      )}
                  </SidebarItem>

                 {/* My Tasks - Only for Issuers and HODs */}
                {!isLimitedUser && (
                  <SidebarItem
                    icon={
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                      </svg>
                    }
                    label={sidebarMode === 'full' ? 'My Tasks' : ''}
                    isOpen={sidebarMode === 'full' && expandedMenu === 'myTasks'}
                    onClick={() => toggleMenu('myTasks')}
                    isActive={['/dashboard/my-tasks/view-permits','/dashboard/my-tasks/pending-approvals', '/dashboard/my-tasks/approval-history'].includes(location.pathname)}
                    path={location.pathname}
                  >
                    {sidebarMode === 'full' && (
                      <>
                        <div
                          className="py-2 px-3 text-sm rounded-md hover:bg-gray-100 cursor-pointer"
                          onClick={() => navigate('/dashboard/my-tasks/pending-approvals')}
                        >
                          Pending Approvals
                        </div>
                        <div
                          className="py-2 px-3 text-sm rounded-md hover:bg-gray-100 cursor-pointer"
                          onClick={() => navigate('/dashboard/my-tasks/view-permits')}
                        >
                          View All Permits
                        </div>
                        <div
                          className="py-2 px-3 text-sm rounded-md hover:bg-gray-100 cursor-pointer"
                          onClick={() => navigate('/dashboard/my-tasks/approval-history')}
                        >
                          Approval History
                        </div>
                      </>
                    )}
                  </SidebarItem>
                )}
                    
                 {/* Jobs Monitoring - Only for Issuers and HODs */}
                  {!isLimitedUser && (
                    <SidebarItem
                      icon={
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      }
                      label={sidebarMode === 'full' ? 'Jobs Monitoring' : ''}
                      onClick={() => navigate('/dashboard/jobs-monitoring')}
                      isActive={location.pathname === '/dashboard/jobs-monitoring'}
                      path={location.pathname}
                    />
                  )}
              </nav>

              {sidebarMode === 'full' && (
                  <div className="p-4 border-t text-xs text-gray-500">
                      ©2024 Copyright version 0.1
                  </div>
              )}
          </>
      );
  };

  return (
      <div className="min-h-screen flex flex-col">
          <header className="bg-white shadow-sm border-b fixed w-full z-20 h-16">
          <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-4">
            <button 
              onClick={toggleSidebar}
              className="p-2 rounded-md hover:bg-gray-100 lg:hidden"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="text-lg font-semibold">QHSSE Management System</div>
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

          <div className="flex flex-1 pt-16">
              <aside className={`${getSidebarClasses()} transition-all duration-300 ease-in-out bg-white border-r fixed h-screen z-10`}>
                  <div className="h-full flex flex-col relative">
                      {renderSidebarContent()}

                      {/* Toggle button */}
                      <button
                        onClick={toggleSidebar}
                        className="absolute top-5 -right-4 bg-blue-500 p-1.5 rounded-full shadow hover:bg-blue-600 focus:outline-none z-10"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d={sidebarMode === 'full' ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'}
                          />
                        </svg>
                      </button>

                  </div>
              </aside>

              <main
                className="flex-1 p-6 overflow-y-auto transition-all duration-300"
                style={{
                  marginLeft: sidebarMode === 'full' ? '16rem' : '6rem', // Adjust margin based on sidebarMode
                }}
              >
                <Outlet />
              </main>
          </div>
      </div>
  );
};

export default Sidebar;