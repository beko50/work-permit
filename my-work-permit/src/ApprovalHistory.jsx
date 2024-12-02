import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from './components/ui/card';
import { Button } from './components/ui/button';
import { Table, TableHead, TableBody, TableRow, TableCell } from './components/ui/table';

const ApprovalHistory = () => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchParams, setSearchParams] = useState({
    requestId: '',
    approval: '',
    approver: '',
    receivedDate: ''
  });

  const approvalHistory = [
    {
      approval: 'APPROVAL / 審批',
      workflowName: 'Work To Permits / 承包商工作申請單',
      approvalStatus: 'Pending / 待審批',
      requestId: 'C97-1',
      taskName: 'EHS Manager',
      content: 'Demo',
      approver: 'Edward Zhou',
      receivedDate: '10/5/2024'
    },
    {
      approval: 'APPROVAL / 審批',
      workflowName: 'Request for Permanent Property Form / 房地產証申請單',
      approvalStatus: 'Pending / 待審批',
      requestId: 'P-4',
      taskName: 'Department Manager',
      content: 'Demo',
      approver: 'Administrator',
      receivedDate: '11/11/2024'
    },
    {
      approval: 'APPROVAL / 審批',
      workflowName: 'Work To Permits / 承包商工作申請單',
      approvalStatus: 'Pending / 待審批',
      requestId: 'C93-2',
      taskName: 'Department manager of construction area(建工處)',
      content: 'Department Manager',
      approver: 'HF.LOU',
      receivedDate: '3/28/2024'
    },
    // Add more approval history data here
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Rejected': return 'text-red-500';
      case 'Approved': return 'text-green-500';
      case 'Pending': return 'text-orange-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="w-full p-4">
      {/* Search Section */}
      <div className="mb-4 flex justify-between items-start gap-2">
        <Card className="flex-1 p-4">
          <div className="flex flex-col gap-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  placeholder="Search request ID"
                  value={searchParams.requestId}
                  onChange={(e) => setSearchParams({ ...searchParams, requestId: e.target.value })}
                  className="w-full"
                />
              </div>
              <div className="flex-1">
                <select
                  placeholder="Search approval status"
                  value={searchParams.approval}
                  onChange={(e) => setSearchParams({ ...searchParams, approval: e.target.value })}
                  className="w-full"
                >
                  <option value="">All</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
              <Button variant="primary" onClick={() => console.log('search')} className="w-[150px]">
                Search
              </Button>
            </div>

            {showAdvanced && (
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-3">
                  <input
                    placeholder="Search approver"
                    value={searchParams.approver}
                    onChange={(e) => setSearchParams({ ...searchParams, approver: e.target.value })}
                    className="w-full"
                  />
                </div>
                <div className="col-span-6 flex items-center gap-2 pl-20">
                  <span className="text-sm font-medium text-gray-600 whitespace-nowrap">Received date:</span>
                  <div className="flex-1 flex gap-2">
                    <input
                      type="date"
                      value={searchParams.receivedDate}
                      onChange={(e) => setSearchParams({ ...searchParams, receivedDate: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
        <Button
          variant="outline"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="border-blue-500 text-blue-500 hover:bg-blue-50"
        >
          {showAdvanced ? 'Hide Advanced Search' : 'Show Advanced Search'}
        </Button>
      </div>

      {/* Main Content Card */}
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-semibold">Approval History</h1>
        </CardHeader>
        <CardContent className="p-4">
          {/* Table */}
          <Table>
            <TableHead>
              <TableRow>
                <TableCell className="w-8">
                  <input type="checkbox" className="rounded border-gray-300" />
                </TableCell>
                <TableCell className="text-base font-medium">Approval</TableCell>
                <TableCell className="text-base font-medium">Workflow Name</TableCell>
                <TableCell className="text-base font-medium">Approval Status</TableCell>
                <TableCell className="text-base font-medium">Request ID</TableCell>
                <TableCell className="text-base font-medium">Task Name</TableCell>
                <TableCell className="text-base font-medium">Content / 内容</TableCell>
                <TableCell className="text-base font-medium">Approver</TableCell>
                <TableCell className="text-base font-medium">Received Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {approvalHistory.map((item, index) => (
                <TableRow key={index}>
                  <TableCell><input type="checkbox" className="rounded border-gray-300" /></TableCell>
                  <TableCell>{item.approval}</TableCell>
                  <TableCell>{item.workflowName}</TableCell>
                  <TableCell><span className={getStatusColor(item.approvalStatus)}>{item.approvalStatus}</span></TableCell>
                  <TableCell>{item.requestId}</TableCell>
                  <TableCell>{item.taskName}</TableCell>
                  <TableCell>{item.content}</TableCell>
                  <TableCell>{item.approver}</TableCell>
                  <TableCell>{item.receivedDate}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex justify-end mt-4 text-sm text-gray-500">
            Rows per page: 15 | 1-3 of 3
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApprovalHistory;