import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent, CardTitle } from './components/ui/card';
import { Button, IconButton } from './components/ui/button';
import { Input, Select } from './components/ui/form';
import { Table, TableHead, TableBody, TableRow, TableCell } from './components/ui/table';
import { ExportToExcel } from './components/ui/export';
import { Refresh, Withdraw, Delete, PreventEmail } from './components/ui/actions';

const ViewPermits = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useState({
    request: '',
    company: '',
    contractor: '',
    status: '',
    startDate: '',
    endDate: ''
  });

  const permits = [
    {
      command: 'ACTIONS',
      request: 'C95-1',
      company: 'Yau Lee Construction (Singapore) Pte. Ltd.',
      jobDescription: 'engineer permit',
      po: '351',
      startDate: '2/20/2024',
      endDate: '7/12/2023',
      finishDate: '7/12/2023'
    },
    {
      command: 'ACTIONS',
      request: 'C96-1',
      company: 'Wan Chung Construction (Singapore) Pte. Ltd.',
      jobDescription: 'engineer permit',
      po: '351',
      startDate: '8/28/2024',
      endDate: '7/12/2023',
      finishDate: '7/12/2023'
    },
    {
      command: 'ACTIONS',
      request: 'C97-1',
      company: 'Wan Chung Construction (Singapore) Pte. Ltd.',
      jobDescription: 'engineer permit',
      po: '351',
      startDate: '10/30/2024',
      endDate: '7/12/2023',
      finishDate: '7/12/2023'
    }
  ];

  const handleSearch = () => {
    // Implement search logic based on searchParams
  };

  const handleRefresh = () => {
    // Fetch latest permits data
  };

  const handleCreate = () => {
    navigate('/create-permit');
  };

  const handleAction = (action, permit) => {
    switch (action) {
      case 'WITHDRAW':
        // Implement withdraw logic
        break;
      case 'DELETE':
        // Implement delete logic
        break;
      case 'PREVENTEMAIL':
        // Implement prevent email logic
        break;
      default:
        break;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>View Permits</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-6 gap-4 mb-4">
          <Input
            label="Request#"
            value={searchParams.request}
            onChange={(e) => setSearchParams({ ...searchParams, request: e.target.value })}
          />
          <Input
            label="Company Name"
            value={searchParams.company}
            onChange={(e) => setSearchParams({ ...searchParams, company: e.target.value })}
          />
          <Input
            label="Contractor"
            value={searchParams.contractor}
            onChange={(e) => setSearchParams({ ...searchParams, contractor: e.target.value })}
          />
          <Select
            label="Status"
            value={searchParams.status}
            onChange={(e) => setSearchParams({ ...searchParams, status: e.target.value })}
            options={['', 'New', 'Open', 'InProgress', 'Resolved', 'Closed']}
          />
          <Input
            label="Start Date"
            type="date"
            value={searchParams.startDate}
            onChange={(e) => setSearchParams({ ...searchParams, startDate: e.target.value })}
          />
          <Input
            label="End Date"
            type="date"
            value={searchParams.endDate}
            onChange={(e) => setSearchParams({ ...searchParams, endDate: e.target.value })}
          />
        </div>
        <div className="flex justify-end mb-4">
          <Button onClick={handleSearch}>Search</Button>
          <Button className="ml-2" onClick={handleRefresh}>
            Refresh
          </Button>
          <Button className="ml-2" onClick={handleCreate}>
            Create
          </Button>
          <ExportToExcel className="ml-2" data={permits} filename="permits">
            Export to Excel
          </ExportToExcel>
        </div>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Command</TableCell>
              <TableCell>Request#</TableCell>
              <TableCell>Name of Company (Full name)</TableCell>
              <TableCell>Job Description</TableCell>
              <TableCell>PO #</TableCell>
              <TableCell>Start Date and Time</TableCell>
              <TableCell>End Date and Time</TableCell>
              <TableCell>Finish Date and Time</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {permits.map((permit, index) => (
              <TableRow key={index}>
                <TableCell>{permit.command}</TableCell>
                <TableCell>{permit.request}</TableCell>
                <TableCell>{permit.company}</TableCell>
                <TableCell>{permit.jobDescription}</TableCell>
                <TableCell>{permit.po}</TableCell>
                <TableCell>{permit.startDate}</TableCell>
                <TableCell>{permit.endDate}</TableCell>
                <TableCell>{permit.finishDate}</TableCell>
                <TableCell>
                  <Refresh onClick={() => handleAction('REFRESH', permit)} />
                  <Withdraw onClick={() => handleAction('WITHDRAW', permit)} />
                  <Delete onClick={() => handleAction('DELETE', permit)} />
                  <PreventEmail onClick={() => handleAction('PREVENTEMAIL', permit)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default ViewPermits;
