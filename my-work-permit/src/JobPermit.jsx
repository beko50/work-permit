import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from './components/ui/card';
import { Button } from './components/ui/button';
import { Input, Select } from './components/ui/form';
import { Table, TableHead, TableBody, TableRow, TableCell } from './components/ui/table';
import { ExportToExcel } from './components/ui/export';
import { Refresh, Withdraw, Delete, PreventEmail } from './components/ui/actions';

const JobPermit = () => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchParams, setSearchParams] = useState({
    requestId: '', 
    contractor: '',
    company: '',
    status: '',
    startDate: '11/18/2023',
    endDate: '12/18/2024'
  });

  const permits = [
    { id: 'C95-1', status: 'Rejected', company: 'MPS Ghana Ltd', jobDescription: 'Internal job', receiverName: 'Bernard Ofori', startDate: '2/20/2024', endDate: '7/12/2023', finishDate: '7/12/2023' },
    { id: 'C96-1', status: 'Approved', company: 'MTN Ghana', jobDescription: 'Fix Network', receiverName: 'Yaw Sarpong', startDate: '8/28/2024', endDate: '7/12/2023', finishDate: '7/12/2023' },
    { id: 'C97-1', status: 'Pending', company: 'Epsin Company', jobDescription: 'Check RTG and STS', receiverName: 'Dennis Appiah', startDate: '10/30/2024', endDate: '7/12/2023', finishDate: '7/12/2023' }
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
      <div className="mb-4 flex space-x-2">
        <Input 
          placeholder="Search permit ID number" 
          value={searchParams.requestId} 
          onChange={(e) => setSearchParams({ ...searchParams, requestId: e.target.value })} 
          className="w-[200px]"
        />
        <Input 
          placeholder="Search contractor" 
          value={searchParams.contractor} 
          onChange={(e) => setSearchParams({ ...searchParams, contractor: e.target.value })} 
          className="w-[200px]"
        />
        <Button variant="primary" onClick={() => console.log('search')}>
          Search
        </Button>
        <Button 
          variant="primary" 
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="ml-auto"
        >
          {showAdvanced ? 'Hide Advanced Search' : 'Show Advanced Search'}
        </Button>
      </div>

      {showAdvanced && (
        <Card className="border p-4 mb-4">
          <div className="grid grid-cols-2 gap-4">
            <Input 
              placeholder="Search company" 
              value={searchParams.company} 
              onChange={(e) => setSearchParams({ ...searchParams, company: e.target.value })}
              className="w-[200px]" 
            />
            <Select 
              placeholder="Search status" 
              value={searchParams.status} 
              onChange={(e) => setSearchParams({ ...searchParams, status: e.target.value })} 
              options={['Expired', 'Approved', 'For approval']} 
              className="w-[200px]"
            />
            <div className="col-span-2 flex gap-2">
              <Input 
                type="date" 
                value={searchParams.startDate} 
                onChange={(e) => setSearchParams({ ...searchParams, startDate: e.target.value })} 
                className="w-[200px]"
              />
              <span className="self-center">→</span>
              <Input 
                type="date" 
                value={searchParams.endDate} 
                onChange={(e) => setSearchParams({ ...searchParams, endDate: e.target.value })} 
              />
            </div>
          </div>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-2 mb-4">
        <Refresh onClick={() => console.log('refresh')} />
        <Button onClick={() => {}} className="border-blue-500 text-blue-500">+ CREATE</Button>
        <Withdraw onClick={() => console.log('withdraw')} />
        <Delete onClick={() => console.log('delete')} />
        <PreventEmail onClick={() => console.log('prevent email')} />
        <ExportToExcel data={permits} filename="permits">Export to Excel</ExportToExcel>
      </div>

      {/* Permits table */}
      <Card>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell className="w-8"><input type="checkbox" className="rounded border-gray-300" /></TableCell>
              <TableCell>
                <Button variant="ghost" className="text-sm">
                  Command ▼
                </Button>
              </TableCell>
              <TableCell>Permit ID</TableCell>
              <TableCell>Company</TableCell>
              <TableCell>Job Description</TableCell>
              <TableCell>Permit Receiver</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell>Finish Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {permits.map((permit) => (
              <TableRow key={permit.id}>
                <TableCell><input type="checkbox" className="rounded border-gray-300" /></TableCell>
                <TableCell><Button variant="ghost" className="text-sm">ACTIONS ▼</Button></TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{permit.id}</span>
                    <span className={getStatusColor(permit.status)}>{permit.status}</span>
                  </div>
                </TableCell>
                <TableCell>{permit.company}</TableCell>
                <TableCell>{permit.jobDescription}</TableCell>
                <TableCell>{permit.receiverName}</TableCell>
                <TableCell>{permit.startDate}</TableCell>
                <TableCell>{permit.endDate}</TableCell>
                <TableCell>{permit.finishDate}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <div className="flex justify-end mt-4 text-sm text-gray-500">Rows per page: 15 | 1-3 of 3</div>
    </div>
  );
};

export default JobPermit;