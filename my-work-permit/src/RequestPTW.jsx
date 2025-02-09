import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from './components/ui/card';
import { Button } from './components/ui/button';
import  Input  from './components/ui/input';
import { Label } from './components/ui/label';
import { Calendar } from 'lucide-react';
import { Dialog } from './components/ui/dialog';
import logo from './assets/mps_logo.jpg';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { api } from './services/api';

const RequestPTW = ({ jobPermit, onClose, onSubmitSuccess }) => {
    const [formData, setFormData] = useState({
      entryDate: null,
      exitDate: null,
      workDuration: 1
    });
    
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [error, setError] = useState('');
    const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Convert job permit dates to Date objects and set to start of day
    const jobStartDate = jobPermit?.StartDate ? new Date(jobPermit.StartDate) : null;
    const jobEndDate = jobPermit?.EndDate ? new Date(jobPermit.EndDate) : null;
    
    // Helper function to compare dates (ignoring time)
    const isSameOrAfterDate = (date1, date2) => {
      if (!date1 || !date2) return false;
      const d1 = new Date(date1);
      const d2 = new Date(date2);
      return new Date(d1.setHours(0, 0, 0, 0)) >= new Date(d2.setHours(0, 0, 0, 0));
    };

  useEffect(() => {
    if (formData.entryDate && formData.exitDate) {
      const diffTime = Math.abs(formData.exitDate - formData.entryDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      setFormData(prev => ({ ...prev, workDuration: diffDays }));
      
      // Validate work duration
      if (diffDays > 5) {
        setError('Request cannot exceed 5 days');
        setIsSubmitDisabled(true);
        return;
      }

      // Validate entry date using the new comparison function
      if (!isSameOrAfterDate(formData.entryDate, jobStartDate)) {
        setError('Entry date cannot be earlier than Job Permit start date');
        setIsSubmitDisabled(true);
        return;
      }

      // Clear error if all validations pass
      setError('');
      setIsSubmitDisabled(false);
    }
  }, [formData.entryDate, formData.exitDate, jobStartDate]);
  
    const validateForm = () => {
      if (!formData.entryDate) {
        setError('Please select an entry date');
        return false;
      }
      if (!formData.exitDate) {
        setError('Please select an exit date');
        return false;
      }
      if (formData.exitDate < formData.entryDate) {
        setError('Exit date cannot be before entry date');
        return false;
      }
      if (!isSameOrAfterDate(formData.entryDate, jobStartDate)) {
        setError('Entry date cannot be earlier than Job Permit start date');
        return false;
      }
      return true;
    };
  
    const handleSubmit = (e) => {
      e.preventDefault();
      if (validateForm() && !isSubmitDisabled) {
        setShowConfirmation(true);
      }
    };
  
    const handleConfirm = async() => {
      try {
        if (!jobPermit?.JobPermitID) {
          setError('Invalid Job Permit ID');
          return;
        }
        setIsSubmitting(true);
        // Format dates for API request
        const permitData = {
          jobPermitId: jobPermit.JobPermitID,
          entryDate: formData.entryDate.toISOString(),
          exitDate: formData.exitDate.toISOString(),
          workDuration: formData.workDuration
        };
    
        // Call API to create permit
        const response = await api.createPermitToWork(permitData);
        
        if (response.message) {
          // You might want to add a toast notification here
          console.log('Permit to Work created successfully');
          onClose(); // Close the form
          
          // Trigger a refresh of the parent component's data
          if (onSubmitSuccess) {
            onSubmitSuccess();
          }
        }
      } catch (error) {
        setError(error.message || 'Failed to create permit to work');
      } finally {
        setIsSubmitting(false);
        setShowConfirmation(false);
      }
    };

    const formatDate = (date) => {
      return date ? new Date(date).toLocaleDateString('en-GB') : 'N/A';
    };
  
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-full max-w-3xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="w-[80px]">
                <img src={logo} alt="Company Logo" className="h-[80px] w-[80px]" />
              </div>
              <div className="flex-grow ml-40">
                <h1 className="text-xl font-semibold">REQUEST PERMIT TO WORK</h1>
              </div>
            </div>
          </CardHeader>
  
          <div className="px-6 py-2 border-b">
            <p className="text-sm text-gray-500">JOB PERMIT ID: JP-{jobPermit?.JobPermitID?.toString().padStart(4, '0')}</p>
            <p className="text-sm text-gray-500">
            JOB PERMIT VALID FROM: {formatDate(jobStartDate)} - {formatDate(jobEndDate)}
          </p>
          </div>
  
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <Label className="mb-2">Entry Date</Label>
                  <div className="relative">
                    <DatePicker
                      selected={formData.entryDate}
                      onChange={(date) => setFormData(prev => ({ ...prev, entryDate: date, exitDate: null }))}
                      minDate={new Date()}
                      dateFormat="dd/MM/yyyy"
                      className="w-full p-2 border rounded-md pl-10"
                      placeholderText="Select entry date"
                    />
                    <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div className="flex flex-col">
                  <Label className="mb-2">Exit Date</Label>
                  <div className="relative">
                    <DatePicker
                      selected={formData.exitDate}
                      onChange={(date) => setFormData(prev => ({ ...prev, exitDate: date }))}
                      minDate={formData.entryDate || new Date()}
                      dateFormat="dd/MM/yyyy"
                      className="w-full p-2 border rounded-md pl-10"
                      placeholderText="Select exit date"
                    />
                    <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="flex flex-col w-48">
                <Label className="mb-2">Work Duration (Days)</Label>
                <Input 
                  type="number"
                  required
                  disabled
                  value={formData.workDuration}
                  className="bg-gray-100 text-center"
                />
                {error && (
                  <p className="text-sm text-red-500 break-normal">{error}</p>
                )}
              </div>
            </form>
          </CardContent>
  
          <CardFooter className="flex justify-end gap-4">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button 
              type="submit" 
              onClick={handleSubmit} 
              disabled={isSubmitDisabled || error !== ''}
            >
              Submit Request
            </Button>
          </CardFooter>
        </Card>
  
        {/* Confirmation Dialog */}
        {showConfirmation && (
          <Dialog
            isOpen={showConfirmation}
            onClose={() => !isSubmitting && setShowConfirmation(false)}
            title="Confirm Permit to Work Request"
          >
            <div className="text-center">
              <p className="mb-4 text-gray-700">
                Are you sure you want to submit this Permit to Work request from{' '}
                {formData.entryDate ? formData.entryDate.toLocaleDateString('en-GB') : ''} to{' '}
                {formData.exitDate ? formData.exitDate.toLocaleDateString('en-GB') : ''}{' '}
                ({formData.workDuration} days)?
              </p>
              <div className="flex justify-center space-x-4">
                <Button 
                  variant="outline"
                  onClick={() => setShowConfirmation(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  variant='success'
                  onClick={handleConfirm}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </Button>
              </div>
            </div>
          </Dialog>
        )}
      </div>
    );
  };
  
  export default RequestPTW;