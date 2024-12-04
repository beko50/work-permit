import React, { useState } from 'react';

const Tabs = ({ tabs, activeTab, onTabChange }) => {
  const [currentTab, setCurrentTab] = useState(activeTab);

  const handleTabChange = (tab) => {
    setCurrentTab(tab);
    onTabChange(tab);
  };

  return (
    <div>
      <div className="flex border-b">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            className={`px-4 py-2 border-b-2 ${tab.value === currentTab ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-500'}`}
            onClick={() => handleTabChange(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Tabs;