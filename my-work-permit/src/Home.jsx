import React from 'react';

const StatusCard = ({ title, data }) => {
  // Calculate the total summary count
  const totalSummary = data.reduce((total, item) => total + item.summary, 0);

  return (
    <div className="bg-white rounded-lg shadow-md border-gray-200 border">
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">
            {title} <span className="text-gray-500 text-sm">({totalSummary})</span>
          </h2>
        </div>
        <div className="flex justify-between mt-2 text-sm font-medium text-gray-500">
          <span>Status</span>
          <span className="text-right">Summary</span>
        </div>
      </div>
      <div className="p-4">
        <div className="divide-y divide-gray-200">
          {data.map(({ status, summary }) => (
            <div key={status} className="py-2 flex justify-between items-center">
              <span className="text-gray-600 font-medium">{status}</span>
              <span className="font-medium text-gray-800">{summary}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Home = () => {
  const jobSafety = [
    { status: 'Pending', summary: 6 },
    { status: 'Approved', summary: 10 },
    { status: 'Rejected', summary: 5 },
    { status: 'Revoked', summary: 2 },
  ];

  const ptw = [
    { status: 'Active', summary: 6 },
    { status: 'Expired', summary: 3 },
    { status: 'Rejected', summary: 4 },
    { status: 'Revoked', summary: 1 },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-gray-900 mb-4">Welcome to your Dashboard</h1>
      <p className="text-gray-600 mb-3">Here's an overview of your Safety Permits and Permits to Work in the last 30 days</p>
      <div className="grid md:grid-cols-2 gap-6">
        <StatusCard title="Job Safety Permits" data={jobSafety} />
        <StatusCard title="Permit To Work" data={ptw} />
      </div>
    </div>
  );
};

export default Home;