import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from "./components/ui/card";
import { Button } from "./components/ui/button";
import Input from "./components/ui/input";
import { X, Clock } from 'lucide-react';
import { Dropdown } from './components/ui/dropdown';
import logo from './assets/mps_logo.jpg';

const PermitForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    permitDuration: '',
    department: '',
    jobLocation: '',
    subLocation: '',
    plantDetail: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    navigate('/dashboard/permits/job-permits');
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      // Save form data to database
      console.log('Submitting form data:', formData);
      // Navigate to next page
      navigate('/dashboard/permits/job-permits/create/step2');
    } catch (error) {
      console.error('Error creating permit:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const departmentOptions = ['IT', 'Operations', 'Asset Maintenance', 'QHSSE'];

  return (
    <div className="p-4">
      <Card className="w-full max-w-4xl mx-auto bg-white relative">
        <CardHeader className="relative border-b pb-2 pt-2 flex items-center">
          <img src={logo} alt="Company Logo" className="h-[80px] w-[80px]" />
          <h1 className="text-xl font-semibold flex-grow text-center">JOB SAFETY PERMIT</h1>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="absolute top-2 right-2"
          >
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>

        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Section A */}
            <div>
              <h2 className="font-semibold mb-4">
                1. GENERAL INFORMATION
                <span className="block text-sm text-red-600">* indicates must-fill field</span>
              </h2>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <div className="border p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                      <label className="block text-sm font-medium mr-32">Start Date *</label>
                      <label className="block text-sm font-medium">Time</label>
                    </div>
                    <div className="flex gap-4">
                      <div className="relative flex-1">
                        <Input
                          type="date"
                          className="border rounded-lg px-3 py-2 w-full"
                          value={formData.startDate}
                          onChange={(e) => handleInputChange('startDate', e.target.value)}
                        />
                      </div>
                      <div className="relative flex-1">
                        <Input
                          type="time"
                          className="border rounded-lg px-3 py-2 w-full"
                          value={formData.startTime}
                          onChange={(e) => handleInputChange('startTime', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                      <label className="block text-sm font-medium mr-32">End Date *</label>
                      <label className="block text-sm font-medium">Time</label>
                    </div>
                    <div className="flex gap-4">
                      <div className="relative flex-1">
                        <Input
                          type="date"
                          className="border rounded-lg px-3 py-2 w-full"
                          value={formData.endDate}
                          onChange={(e) => handleInputChange('endDate', e.target.value)}
                        />
                      </div>
                      <div className="relative flex-1">
                        <Input
                          type="time"
                          className="border rounded-lg px-3 py-2 w-full"
                          value={formData.endTime}
                          onChange={(e) => handleInputChange('endTime', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Permit Duration * <span className="text-gray-500 font-normal">(Max 7 days)</span>
                    </label>
                    <Input
                      type="text"
                      value={formData.permitDuration}
                      onChange={(e) => handleInputChange('permitDuration', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Department *
                    </label>
                    <Dropdown
                      options={departmentOptions}
                      value={formData.department}
                      onChange={(value) => handleInputChange('department', value)}
                      className="w-full"
                      dropdownIcon="▾"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Job Location *
                    </label>
                    <Input
                      type="text"
                      value={formData.jobLocation}
                      onChange={(e) => handleInputChange('jobLocation', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Sub Location *
                    </label>
                    <Input
                      type="text"
                      value={formData.subLocation}
                      onChange={(e) => handleInputChange('subLocation', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Plant/Equipment Detail *
                    </label>
                    <Input
                      type="text"
                      value={formData.plantDetail}
                      onChange={(e) => handleInputChange('plantDetail', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 mt-6">
            <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Next'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PermitForm;