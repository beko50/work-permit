import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from './components/ui/card';
import { Button } from './components/ui/button';
import { Input, Select } from './components/ui/form';
import { Table, TableHead, TableBody, TableRow, TableCell } from './components/ui/table';
import { ChevronDown } from 'lucide-react';

const PendingApprovals = () => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchParams, setSearchParams] = useState({
    requestId: '', 
    contractor: '',
    company: '',
    startDate: '11/18/2023',
    endDate: '12/18/2024'
  });

  // Filter only pending permits
  const pendingPermits = [
    { id: 'C97-1', status: 'Pending', workflowName: 'Job Safety Permit', company: 'Epsin Company', jobDescription: 'Check RTG and STS', receiverName: 'Dennis Appiah', submissionDate: '10/30/2024' },
    { id: 'C97-1', status: 'Pending', workflowName: 'Job Safety Permit', company: 'Epsin Company', jobDescription: 'Check RTG and STS', receiverName: 'Dennis Appiah', submissionDate: '10/30/2024'}
  ];

  const Dropdown = ({ 
    options, 
    onSelect, 
    className = '' 
  }) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleSelect = (selectedOption) => {
      onSelect(selectedOption);
      setIsOpen(false);
    };
  
    return (
      <div className={`relative ${className}`}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-md bg-white border shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <span className="text-sm font-medium">Actions</span>
          <ChevronDown className="h-5 w-5 text-blue-500" />
        </button>
        {isOpen && (
          <ul className="absolute z-10 w-28 border rounded-md mt-2 bg-gray-50 shadow-lg overflow-auto">
            {options.map((option) => (
              <li
                key={option}
                onClick={() => handleSelect(option)}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
              >
                {option}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  const handleDropdownAction = (action, permitId) => {
    console.log(`Action ${action} selected for permit ${permitId}`);
    // Implement specific actions like view, edit, etc.
  };

  return (
    <div className="w-full p-4">
      {/* Search Section */}
      <div className="mb-4 flex justify-between items-start gap-2">
        <Card className="flex-1 p-4">
          <div className="flex flex-col gap-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input 
                  placeholder="Search permit ID number" 
                  value={searchParams.requestId} 
                  onChange={(e) => setSearchParams({ ...searchParams, requestId: e.target.value })} 
                  className="w-full"
                />
              </div>
              <div className="flex-1">
                <Input 
                  placeholder="Search contractor" 
                  value={searchParams.contractor} 
                  onChange={(e) => setSearchParams({ ...searchParams, contractor: e.target.value })} 
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
                    placeholder="Search company" 
                    value={searchParams.company} 
                    onChange={(e) => setSearchParams({ ...searchParams, company: e.target.value })}
                    className="w-full"
                  />
                </div>
                <div className="col-span-9 flex items-center gap-2 pl-20">
                  <span className="text-sm font-medium text-gray-600 whitespace-nowrap">Filter date:</span>
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
          <h1 className="text-2xl font-semibold">Pending Job Permits</h1>
        </CardHeader>
        <CardContent className="p-4">
          {/* Table */}
          <Table>
            <TableHead>
              <TableRow>
                <TableCell className="w-8">
                  <input type="checkbox" className="cursor-pointer rounded border-gray-300" />
                </TableCell>
                <TableCell>
                  <Button variant="ghost" className="text-sm font-medium">
                    Command 
                  </Button>
                </TableCell>
                <TableCell className="text-base font-medium">Permit ID</TableCell>
                <TableCell className="text-base font-medium">Permit Type</TableCell>
                <TableCell className="text-base font-medium">Company</TableCell>
                <TableCell className="text-base font-medium">Job Description</TableCell>
                <TableCell className="text-base font-medium">Permit Receiver</TableCell>
                <TableCell className="text-base font-medium">Submission Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pendingPermits.map((permit) => (
                <TableRow key={permit.id}>
                  <TableCell><input type="checkbox" className="cursor-pointer rounded border-gray-300" /></TableCell>
                  <TableCell>
                    <Dropdown
                      options={['View', 'Edit', 'Print']}
                      onSelect={(action) => handleDropdownAction(action, permit.id)}
                      className="text-sm font-medium"
                    >
                      Actions
                    </Dropdown>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{permit.id}</span>
                      <span className="text-orange-500">{permit.status}</span>
                    </div>
                  </TableCell>
                  <TableCell>{permit.workflowName}</TableCell>
                  <TableCell>{permit.company}</TableCell>
                  <TableCell>{permit.jobDescription}</TableCell>
                  <TableCell>{permit.receiverName}</TableCell>
                  <TableCell>{permit.submissionDate}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex justify-end mt-4 text-sm text-gray-500">
            Rows per page: 15 | 1-1 of 1
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PendingApprovals;