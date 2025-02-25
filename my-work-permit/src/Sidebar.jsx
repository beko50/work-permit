import React, { useState, useEffect } from 'react';
import { useNavigate,Routes,Route,useLocation,Outlet } from 'react-router-dom';
import Icons from '../src/components/ui/icons';
import UserProfileDropdown from './components/UserProfileDropdown';
import { useAuth } from './context/AuthContext';
import ViewPermits from './ViewPermits';
import Home from './Home';

const SidebarItem = ({ icon, label, isOpen, onClick, children, isActive, path, subPaths = [] }) => {
  // Check if any submenu path is active
  const isAnySubmenuActive = subPaths.some(subPath => path === subPath);
  const activeClass = isActive || isAnySubmenuActive ? 'border-r-4 border-blue-500 bg-blue-50' : '';
  const activeTextClass = isActive || isAnySubmenuActive ? 'text-blue-500' : 'text-gray-700';

  return (
    <div className="mb-1">
      <div 
        onClick={onClick}
        className={`flex items-center p-3 rounded-lg cursor-pointer hover:bg-blue-50 ${activeClass}`}
      >
        <div className={`p-2 ${activeTextClass}`}>{icon}</div>
        <span className={`ml-2 ${activeTextClass}`}>{label}</span>
        {children && (
          <Icons.ChevronDown className={`ml-auto ${isOpen ? 'rotate-180' : ''} ${activeTextClass}`} />
        )}
      </div>
      {isOpen && children && (
        <div className="ml-12 mt-1 space-y-1">
          {children}
        </div>
      )}
    </div>
  );
};

// Separate component for submenu items to properly handle active state
const SubmenuItem = ({ label, path, currentPath, onClick }) => {
  const isActive = currentPath === path;
  return (
    <div
      className={`py-2 px-3 text-sm rounded-md hover:bg-blue-50 cursor-pointer ${
        isActive ? 'text-blue-500 bg-blue-50 font-medium' : 'text-gray-700'
      }`}
      onClick={onClick}
    >
      {label}
    </div>
  );
};

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarMode, setSidebarMode] = useState('full');
  const [expandedMenus, setExpandedMenus] = useState([]);

  // Abednego 20-01-2025
  const [currentUser, SetCurrentUser] = useState();

  useEffect(() => {
    const saveData = window.localStorage.getItem('jkkkkcdvyuscgjkyasfgyudcvkidscvjhcytdjftyad7guilllllaycfui');
    const parsedData = JSON.parse(saveData);
    SetCurrentUser(parsedData?.user);
  }, []);

  // Add this useEffect for initial redirect
  useEffect(() => {
    if (currentUser?.roleId?.trim() === 'RCV' && location.pathname === '/dashboard') {
      navigate('/dashboard/permits/job-permits');
    }
  }, [currentUser, location.pathname, navigate]);

  // Set initially expanded menus based on current path
  useEffect(() => {
    // Check which menu should be expanded based on the current path
    if (location.pathname.includes('/dashboard/permits/')) {
      if (!expandedMenus.includes('permits')) {
        setExpandedMenus(prev => [...prev, 'permits']);
      }
    }
    
    if (location.pathname.includes('/dashboard/my-tasks/')) {
      if (!expandedMenus.includes('myTasks')) {
        setExpandedMenus(prev => [...prev, 'myTasks']);
      }
    }
  }, [location.pathname]);

  const isLimitedUser = currentUser?.roleId?.trim() !== 'HOD' && currentUser?.roleId?.trim() !== 'ISS' && currentUser?.roleId?.trim() !== 'QA';

  // Update the getUserRoleDisplay function
  const getUserRoleDisplay = () => {
    const roleId = currentUser?.roleId?.trim();
    switch(roleId) {
      case 'RCV': return 'Permit Receiver';
      case 'ISS': return 'Permit Issuer';
      case 'HOD': return 'Head of Department';
      case 'QA': return 'QHSSE Approver';
      // default: return 'User';
    }
  };

  const toggleSidebar = () => {
    // Toggle between 'full' and 'icons' modes
    setSidebarMode((prev) => (prev === 'full' ? 'icons' : 'full'));
  };

  const toggleMenu = (menuName) => {
    setExpandedMenus(prev => {
      // If menu is already expanded, remove it
      if (prev.includes(menuName)) {
        return prev.filter(menu => menu !== menuName);
      }
      // Otherwise add it to expanded menus
      return [...prev, menuName];
    });
  };

  const getSidebarClasses = () => {
    return sidebarMode === 'full' ? 'w-64' : 'w-24';
  };

  // Define submenu paths for each main menu
  const permitSubPaths = [
    '/dashboard/permits/job-permits',
    '/dashboard/permits/job-permits/create',
    '/dashboard/permits/permit-to-work'
  ];
  
  const myTasksSubPaths = [
    '/dashboard/my-tasks/view-permits',
    '/dashboard/my-tasks/pending-approvals',
    '/dashboard/my-tasks/approval-history'
  ];

  const renderSidebarContent = () => {
    return (
      <>
        <div className="p-4 border-b">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Icons.User />
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
              icon={<Icons.Home />}
              label={sidebarMode === 'full' ? 'Home' : ''}
              onClick={() => navigate('/dashboard')}
              isActive={location.pathname === '/dashboard'}
              path={location.pathname}
            />
          )}

          {/* Permits Request - visible to all users */}
          <SidebarItem
            icon={<Icons.Calendar />}
            label={sidebarMode === 'full' ? 'Permits Request' : ''}
            isOpen={sidebarMode === 'full' && expandedMenus.includes('permits')}
            onClick={() => toggleMenu('permits')}
            isActive={permitSubPaths.includes(location.pathname)}
            path={location.pathname}
            subPaths={permitSubPaths}
          >
            {sidebarMode === 'full' && (
              <>
                <SubmenuItem 
                  label="Request for Job Permit"
                  path="/dashboard/permits/job-permits"
                  currentPath={location.pathname}
                  onClick={() => navigate('/dashboard/permits/job-permits')}
                />
                <SubmenuItem 
                  label="Permit To Work"
                  path="/dashboard/permits/permit-to-work"
                  currentPath={location.pathname}
                  onClick={() => navigate('/dashboard/permits/permit-to-work')}
                />
              </>
            )}
          </SidebarItem>

          {/* My Tasks - Only for Issuers and HODs */}
          {!isLimitedUser && (
            <SidebarItem
              icon={<Icons.Tasks />}
              label={sidebarMode === 'full' ? 'My Tasks' : ''}
              isOpen={sidebarMode === 'full' && expandedMenus.includes('myTasks')}
              onClick={() => toggleMenu('myTasks')}
              isActive={myTasksSubPaths.includes(location.pathname)}
              path={location.pathname}
              subPaths={myTasksSubPaths}
            >
              {sidebarMode === 'full' && (
                <>
                  <SubmenuItem 
                    label="View All Permits"
                    path="/dashboard/my-tasks/view-permits"
                    currentPath={location.pathname}
                    onClick={() => navigate('/dashboard/my-tasks/view-permits')}
                  />
                  <SubmenuItem 
                    label="Approval History"
                    path="/dashboard/my-tasks/approval-history"
                    currentPath={location.pathname}
                    onClick={() => navigate('/dashboard/my-tasks/approval-history')}
                  />
                </>
              )}
            </SidebarItem>
          )}
                    
          {/* Jobs Monitoring - Only for Issuers and HODs */}
          {!isLimitedUser && (
            <SidebarItem
              icon={<Icons.Chart />}
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
              <Icons.Menu />
            </button>
            <div className="text-lg font-semibold">MPS Work Permit System</div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2">
              <Icons.Bell />
            </button>
            
            <UserProfileDropdown />
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
              {sidebarMode === 'full' ? <Icons.ChevronLeft /> : <Icons.ChevronRight />}
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