import React from 'react';

const StatusCard = ({ title, subtitle, data }) => {
  return (
    <div className="bg-white rounded-lg shadow border">
      <div className="p-4 border-b">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">{title}</h2>
          <span className="text-sm text-gray-500">{subtitle}</span>
        </div>
      </div>
      <div className="p-4">
        <div className="divide-y">
          {data.map(({ status, summary, statusCn }) => (
            <div key={status} className="py-2 flex justify-between">
              <span className="text-gray-600">{status} {statusCn}</span>
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
    { status: 'Approved', statusCn: '已批准', summary: 1 },
    { status: 'Completed', statusCn: '完成', summary: 1 },
    { status: 'Expired', statusCn: '期满', summary: 3 },
    { status: 'For approval', statusCn: '待审批', summary: 12 },
    { status: 'Rejected', statusCn: '拒绝', summary: 1 },
    { status: 'Unfinished', statusCn: '未完工', summary: 7 },
  ];

  const visitorRequests = [
    { status: 'Approved', statusCn: '已批准', summary: 18 },
    { status: 'Cancelled', statusCn: '取消', summary: 1 },
    { status: 'For Approval', statusCn: '待审批', summary: 16 },
    { status: 'Saved', statusCn: '暂存', summary: 3 },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Welcome to your Dashboard</h1>
        <p className="text-gray-600">Here's an overview of your permits and requests.</p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <StatusCard 
          title="Permit To Work(PTW)" 
          subtitle="承包商工作申请单 (25)" 
          data={ptw}
        />
        <StatusCard 
          title="Visitor Request Form" 
          subtitle="访客申请单 (38)" 
          data={visitorRequests}
        />
      </div>
    </div>
  );
};

export default Home;