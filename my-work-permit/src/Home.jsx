import React from 'react';

const StatusCard = ({ title, data }) => {
  // Calculate the total summary count
  const totalSummary = data.reduce((total, item) => total + item.summary, 0);

  return (
    <div className="bg-white rounded-lg shadow border">
      <div className="p-4 border-b">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">
            {title} <span className="text-gray-500 text-sm">({totalSummary})</span>
          </h2>
        </div>
        <div className="flex justify-between mt-2 text-sm font-medium text-gray-500">
          <span>Status</span>
          <span className="text-right">Summary</span>
        </div>
      </div>
      <div className="p-4">
        <div className="divide-y">
          {data.map(({ status, summary }) => (
            <div key={status} className="py-2 flex justify-between">
              <span className="text-gray-600">{status}</span>
              <span className="font-medium">{summary}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Home = () => {
  const ptw = [
    { status: 'Pending', summary: 6 },
    { status: 'Approved', summary: 10 },
    { status: 'Rejected', summary: 5 },
    { status: 'Revoked', summary: 2 },
  ];

  const jobs = [
    { status: 'Ongoing', summary: 6 },
    { status: 'Completed', summary: 3 },
    { status: 'Stopped', summary: 1 },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Welcome to your Dashboard</h1>
        <p className="text-gray-600">Here's an overview of your Permits to Work and Jobs in the last 30 days</p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <StatusCard 
          title="Permit To Work"  
          data={ptw}
        />
        <StatusCard 
          title="Jobs" 
          data={jobs}
        />
      </div>
    </div>
  );
};

export default Home;