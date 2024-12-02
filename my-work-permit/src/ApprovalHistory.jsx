import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from './components/ui/card';
import { Button } from './components/ui/button';
import { Input, Select } from './components/ui/form';
import { Table, TableHead, TableBody, TableRow, TableCell } from './components/ui/table';
import { Eye } from 'lucide-react';

const ApprovalHistory = () => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchParams, setSearchParams] = useState({
    permitId: '',
    approval: '',
    approver: '',
    receivedDate: ''
  });

  const approvalHistory = [
    {
      approval: 'APPROVAL',
      workflowName: 'Permit to Work',
      permitId: 'C97-1',
      taskName: 'EHS Manager',
      content: 'Demo',
      approver: 'Edward Zhou',
      receivedDate: '10/5/2024'
    },
    {
      approval: 'APPROVAL',
      workflowName: 'Job Safety Permit',
      permitId: 'P-4',
      taskName: 'Department Manager',
      content: 'Demo',
      approver: 'Administrator',
      receivedDate: '11/11/2024'
    },
    {
      approval: 'APPROVAL',
      workflowName: 'Permit to Work',
      permitId: 'C93-2',
      taskName: 'Department manager of construction area',
      content: 'Department Manager',
      approver: 'HF.LOU',
      receivedDate: '3/28/2024'
    },
    // Add more approval history data here
  ];

  return (
    <div className="w-full p-4">
      {/* Search Section */}
      <div className="mb-4 flex justify-between items-start gap-2">
  <Card className="flex-1 p-4">
    <div className="flex flex-col gap-4">
      <div className="flex gap-4">
        <div className="flex-1">
          <Input 
            placeholder="Search Permit ID number" 
            value={searchParams.permitId} 
            onChange={(e) => setSearchParams({ ...searchParams, permitId: e.target.value })} 
            className="w-full"
          />
        </div>
        <div className="flex-1">
          <Select 
            placeholder="Search Permit type" 
            value={searchParams.permitType} 
            onChange={(e) => setSearchParams({ ...searchParams, permitType: e.target.value })} 
            options={['Job Safety Permits', 'Permit to Work']} 
            className="w-full"
          />
        </div>
        <Button variant="primary" onClick={() => console.log('search')} className="w-[150px]">
          Search
        </Button>
      </div>

      {showAdvanced && (
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-3">
            <Input 
              placeholder="Search approver" 
              value={searchParams.approver} 
              onChange={(e) => setSearchParams({ ...searchParams, approver: e.target.value })}
              className="w-full"
            />
          </div>
          <div className="col-span-6 flex items-center gap-2 pl-20">
            <span className="text-sm font-medium text-gray-600 whitespace-nowrap">Received date:</span>
            <div className="flex-1 flex gap-2">
              <Input 
                type="date" 
                value={searchParams.startDate} 
                onChange={(e) => setSearchParams({ ...searchParams, startDate: e.target.value })} 
                className="flex-1"
              />
              <span className="self-center text-gray-400">→</span>
              <Input 
                type="date" 
                value={searchParams.endDate} 
                onChange={(e) => setSearchParams({ ...searchParams, endDate: e.target.value })} 
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
    className="border-blue-500 text-blue-500 hover:bg-blue-50">
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
                <TableCell className="text-base font-medium">Approvals</TableCell>
                <TableCell className="text-base font-medium">Permit Type</TableCell>
                <TableCell className="text-base font-medium">Permit ID</TableCell>
                <TableCell className="text-base font-medium">Task Name</TableCell>
                <TableCell className="text-base font-medium">Content </TableCell>
                <TableCell className="text-base font-medium">Approver</TableCell>
                <TableCell className="text-base font-medium">Received Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {approvalHistory.map((item, index) => (
                <TableRow key={index}>
                  <TableCell><input type="checkbox" className="rounded border-gray-300" /></TableCell>
                  <TableCell>
                  <Button
                  variant="primary"
                  size="sm"
                  className="inline-flex items-center justify-center px-2 py-1 rounded-md text-xs font-medium">
                  <Eye size={14} className="mr-1" /> View
                </Button>
                  </TableCell>
                  <TableCell>{item.workflowName}</TableCell>
                  <TableCell>{item.permitId}</TableCell>
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