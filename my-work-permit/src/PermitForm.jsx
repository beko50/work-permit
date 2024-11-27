import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from "./components/ui/card";
import { Button } from "./components/ui/button";
import Input from "./components/ui/input";
import { X, CloudUpload } from 'lucide-react';
import { Dropdown } from './components/ui/dropdown';
import logo from './assets/mps_logo.jpg';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { addMinutes, format } from 'date-fns';

const PermitForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    // Section 1 fields
    startDate: new Date(),
    startTime: new Date(),
    endDate: new Date(),
    endTime: new Date(),
    permitDuration: '',
    department: '',
    jobLocation: '',
    subLocation: '',
    plantDetail: '',
    // Section 2 fields
    jobDescription: '',
    permitReceiver: '',
    jobCompany: '',
    contractCompanyName: '',
    staffID: '',
    riskAssessment: [],
    permitRequired: [],
    numberofWorkers:'',
    workerDetails:[],
    // Section 3 fields
    hazardIdentification:[],
    jobRequirement:[],
  });

  const [currentSection, setCurrentSection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileToUpload, setFileToUpload] = useState([]);
  const [otherHazardText, setOtherHazardText] = useState([]);  //Specify other hazard with text
  const [otherGasesText, setOtherGasesText] = useState([]);  //Specify other gases with text

  const departmentOptions = ['IT', 'Operations', 'Asset Maintenance', 'QHSSE'];
  const jobCompanyOptions = ['Contract Company','MPS Employee'];
  const permitTypes = ['Civil Work','Excavation','Confined Space','Electrical Work','Work at Height','Hazardous/Dangerous Substance','On/Near Water','Hot Work','Pressure Systems'];
  const hazardOptions = ['Fall from-height','Hazardous substances','Buried Services','Gas/Fumes','Environmental Pollution','Lone working','Overhead Services','Oxygen deficiency','Improper Communication',
    'High/Low Temperature','Container falling from truck','Adverse weather','Noise','Sharp Objects','Poor Lighting','Slip/Trip/Falls','High/Low Pressure','Electricity','Falling Objects','Explosives','Work over water',
    'Confined space','Moving trucks/machinery','Smoke/Dust','Stored energy','Collapse of structure','Ionizing radiation','Unprotected edge','Manual handling','Fire','Heat/Cold stress','Truck collision','VDU','Other (Specify)']  
  const jobRequirementOptions = ['MEWP, Crane, Leader Scaffolding', 'Combustible substances identified','Gas cylinder with flashback Arrestor','Job Safety Analysis/Method statement/RA','Appropriate fire extinguisher available','Isolations','Log Out Tag Out',
    'Area barricaded with caution tape','MSDS Avaialble','Fire watch available','Workers receive Safety Induction & Toolbox Briefing','Drain pits/equipment covered','Area of work ventilated','Fall prevention and protection equipment','Fire blankets provided',
    'Dangerous/ Hazardous management plan/Procedures','All process lines bleed','Equipment water wash/oil free','Suitable PPE Available for Workers','Area/ Equipment sufficiently cool to enter','Lifting equipment certified per Dock regulation','Area free from organic toxic, hazardous material & safe',
    'Equipment Operators possess valid License','Buried services identified','Electrical equipment earthed','Access to washing facilities','U/g electric,telecom and pipelines adequately supported and protected','Workers trained in Pre use of Life jacks','Adequate access/ egress provided',
    'Safe limit water level/weather conditions set appropriate','Continuous gas detection is present if required','Rescue plan available & workers trained','Means of communication available','Safety Watch/ Attendant','Boats equipped with emergency equipment',
    'Oxygen content in confined spaces detected','List other gases detected']
  
const handleInputChange = (field, value) => {
    // Existing logic for other input changes
    if (field === 'numberOfWorkers') {
      // When number of workers changes, update worker details array
      const numWorkers = parseInt(value, 10) || 0;
      const currentWorkers = formData.workerDetails;
      
      if (numWorkers > currentWorkers.length) {
        // Add new worker rows
        const newWorkers = Array.from({ length: numWorkers - currentWorkers.length }, () => ({
          name: '',
        }));
        setFormData(prev => ({
          ...prev,
          [field]: value,
          workerDetails: [...currentWorkers, ...newWorkers]
        }));
      } else if (numWorkers < currentWorkers.length) {
        // Remove extra worker rows
        setFormData(prev => ({
          ...prev,
          [field]: value,
          workerDetails: currentWorkers.slice(0, numWorkers)
        }));
      } else {
        // Just update the number of workers
        setFormData(prev => ({
          ...prev,
          [field]: value
        }));
      }
    } else if (field.startsWith('workerName_')) {
      // Update specific worker name
      const index = parseInt(field.split('_')[1], 10);
      const updatedWorkerDetails = [...formData.workerDetails];
      updatedWorkerDetails[index] = { ...updatedWorkerDetails[index], name: value };
      
      setFormData(prev => ({
        ...prev,
        workerDetails: updatedWorkerDetails
      }));
    } else if (field === 'permitRequired') {
        // New permit required logic
        const updatedPermits = value;
        setFormData(prev => ({
          ...prev,
          [field]: updatedPermits
        }));
      } else if (field === 'hazardIdentification') {
        // New hazard identification logic
        const updatedHazards = value;
        setFormData(prev => ({
          ...prev,
          [field]: updatedHazards
        }));
      } else if (field === 'jobRequirement') {
            // New job requirement logic
            const updatedJobRequirements = value;
            setFormData(prev => ({
              ...prev,
              [field]: updatedJobRequirements
            }));
      }else {
      // Existing input change logic
      setFormData(prev => ({
        ...prev,
        [field]: value,
        ...(field === 'jobCompany' && value !== 'Contract Company' 
          ? { contractCompanyName: '' } 
          : {})
      }));
    }
  };

  const handleClose = () => {
    navigate('/dashboard/permits/job-permits');
  };

  const handlePrevious = () => {
    setCurrentSection(currentSection - 1);
  };

  const handleNext = () => {
    setCurrentSection(currentSection + 1);
  };

  const handleFileUpload = (event) => {
    const newFiles = Array.from(event.target.files);
    setFileToUpload((prev) => [...prev, ...newFiles]);
    setFormData((prev) => ({
      ...prev,
      riskAssessment: [...prev.riskAssessment, ...newFiles],
    }));
  };

  const handleFileDrop = (event) => {
    event.preventDefault();
    const newFiles = Array.from(event.dataTransfer.files);
    setFileToUpload((prev) => [...prev, ...newFiles]);
    setFormData((prev) => ({
      ...prev,
      riskAssessment: [...prev.riskAssessment, ...newFiles],
    }));
  };

  const handleFileRemove = (index) => {
    const updatedFiles = [...fileToUpload];
    updatedFiles.splice(index, 1);
    setFileToUpload(updatedFiles);
    setFormData((prev) => ({
      ...prev,
      riskAssessment: updatedFiles,
    }));
  };

  const handleCheckboxChange = (hazard, checked) => {
    let updatedHazards;
    if (checked) {
      updatedHazards = [...formData.hazardIdentification, hazard];
    } else {
      updatedHazards = formData.hazardIdentification.filter(h => h !== hazard);
      
      // If unchecking 'Other (Specify)', clear the text
      if (hazard === 'Other (Specify)') {
        setOtherHazardText('');
      }
    }
    
    handleInputChange('hazardIdentification', updatedHazards);
  };

  const handleOtherHazardTextChange = (e) => {
    const text = e.target.value;
    setOtherHazardText(text);

    // Ensure 'Other (Specify)' is added to hazards when text is entered
    const isOtherInHazards = formData.hazardIdentification.includes('Other (Specify)');
    if (text.trim() && !isOtherInHazards) {
      handleInputChange('hazardIdentification', [...formData.hazardIdentification, 'Other (Specify)']);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      // Save form data to database
      console.log('Submitting form data:', formData);
      // Navigate to next page
      navigate('/dashboard/permits/job-permits/create/step2', { state: { formData } });
    } catch (error) {
      console.error('Error creating permit:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

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
            {currentSection === 1 && (
                <div className="space-y-6">
                {/* Section 1 */}
                <div>
                <h2 className="font-semibold mb-4 relative">
                    <span className="relative after:content-[''] after:block after:w-full after:h-1 after:bg-gray-500 after:mb-1 after:shadow-md">
                    1. GENERAL INFORMATION
                    </span>
                    <span className="block text-sm text-red-600">
                    * indicates must-fill field
                    </span>
                </h2>
    
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-6">
                      {/* Start Date and Time */}
                      <div className="border p-4 rounded-lg">
                        <div className="flex items-center mb-2">
                          <label className="block text-sm font-medium mr-32">Start Date *</label>
                          <label className="block text-sm font-medium">Time</label>
                        </div>
                        <div className="flex gap-4">
                          {/* Start Date */}
                          <div className="flex-1">
                            <DatePicker
                              id="startDateInput"
                              selected={formData.startDate}
                              onChange={(date) => handleInputChange('startDate', date)}
                              className="border rounded-lg px-3 py-2 w-full"
                              dateFormat="yyyy-MM-dd"
                            />
                          </div>
    
                          {/* Start Time */}
                          <div className="flex-1">
                            <DatePicker
                              id="startTimeInput"
                              selected={formData.startTime}
                              onChange={(date) => handleInputChange('startTime', date)}
                              showTimeSelect
                              showTimeSelectOnly
                              timeIntervals={15}
                              timeCaption="Time"
                              dateFormat="h:mm aa"
                              className="border rounded-lg px-3 py-2 w-full"
                            />
                          </div>
                        </div>
                      </div>
    
                      {/* End Date and Time */}
                      <div className="border p-4 rounded-lg">
                        <div className="flex items-center mb-2">
                          <label className="block text-sm font-medium mr-32">End Date *</label>
                          <label className="block text-sm font-medium">Time</label>
                        </div>
                        <div className="flex gap-4">
                          {/* End Date */}
                          <div className="flex-1">
                            <DatePicker
                              id="endDateInput"
                              selected={formData.endDate}
                              onChange={(date) => handleInputChange('endDate', date)}
                              className="border rounded-lg px-3 py-2 w-full"
                              dateFormat="yyyy-MM-dd"
                            />
                          </div>
    
                          {/* End Time */}
                          <div className="flex-1">
                            <DatePicker
                              id="endTimeInput"
                              selected={formData.endTime}
                              onChange={(date) => handleInputChange('endTime', date)}
                              showTimeSelect
                              showTimeSelectOnly
                              timeIntervals={15}
                              timeCaption="Time"
                              dateFormat="h:mm aa"
                              className="border rounded-lg px-3 py-2 w-full"
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
            )}
          
          {currentSection === 2 && (
              <div className="space-y-6"> 
                {/* Section 2 */}
                <div> 
                <h2 className="font-semibold mb-4 relative">
                    <span className="relative after:content-[''] after:block after:w-full after:h-1 after:bg-gray-500 after:mb-1 after:shadow-md">
                    2. NATURE OF WORK
                    </span>
                    <span className="block text-sm text-red-600">
                    * indicates must-fill field
                    </span>
                </h2>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-6">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Job Description *
                        </label>
                        <Input
                          type="text"
                          value={formData.jobDescription}
                          onChange={(e) => handleInputChange('jobDescription', e.target.value)}
                          placeholder="Provide detailed description of the job"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Permit Receiver *
                        </label>
                        <Input
                          type="text"
                          value={formData.permitReceiver}
                          onChange={(e) => handleInputChange('permitReceiver', e.target.value)}
                          placeholder="Name of permit receiver"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Job Company *
                          </label>
                          <Dropdown
                            options={jobCompanyOptions}
                            value={formData.jobCompany}
                            onChange={(value) => handleInputChange('jobCompany', value)}
                            className="w-full"
                            dropdownIcon="▾"
                          />
                        </div>

                        {formData.jobCompany === 'Contract Company' && (
                          <div>
                            <label className="block text-sm font-medium mb-1">
                              Company Name *
                            </label>
                            <Input
                              type="text"
                              value={formData.contractCompanyName || ''}
                              onChange={(e) => handleInputChange('contractCompanyName', e.target.value)}
                              placeholder="Enter contract company name"
                            />
                          </div>
                        )}
                        </div>
                      
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Staff ID *
                        </label>
                        <Input
                          type="text"
                          value={formData.staffID}
                          onChange={(e) => handleInputChange('staffID', e.target.value)}
                          placeholder="Enter staff ID"
                        />
                      </div>   
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Number of Workers *
                          </label>
                          <Input
                            type="number"
                            min="0"
                            max="20"
                            value={formData.numberOfWorkers}
                            onChange={(e) => handleInputChange('numberOfWorkers', e.target.value)}
                            placeholder="Enter number of workers"
                          />
                        </div>
                    </div>                  
                
                    
                    <div className="border p-4 rounded-lg">
                        <label className="block text-sm font-medium mb-1">
                          Risk Assessment/Job Safety Analysis *
                        </label>
                        <div
                          className="flex flex-col items-center justify-center w-full h-32 bg-gray-100 rounded-lg cursor-pointer border-dashed border-2 border-blue-400"
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={handleFileDrop}
                        >
                          <input
                            type="file"
                            id="riskAssessmentUpload"
                            multiple
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                          <label
                            htmlFor="riskAssessmentUpload"
                            className="flex flex-col items-center space-y-2"
                          >
                            <CloudUpload className="h-8 w-8 text-blue-500" />
                            <span className="text-blue-500 font-medium">Click To Upload Documents</span>
                          </label>
                        </div>

                        {fileToUpload.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-sm font-semibold mb-2">Uploaded Documents</h4>
                            <div className="space-y-2">
                              {fileToUpload.map((file, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between bg-gray-200 p-2 rounded-lg"
                                >
                                  <div className="flex items-center space-x-2">
                                    {/* Show a PDF or image icon based on file type */}
                                    <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                                      {file.name.split('.').pop().toUpperCase()}
                                    </span>
                                    <span className="text-sm text-gray-700 truncate">
                                      {file.name}
                                    </span>
                                  </div>
                                  <button
                                    className="text-red-500 hover:text-red-700"
                                    onClick={() => handleFileRemove(index)}
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>
                       
                    <div>
                        <label className="block text-sm font-medium mb-3">
                          Permit(s) Required *
                        </label>
                        <div className="grid grid-cols-3 gap-4">
                          {permitTypes.map((permitType) => (
                            <label key={permitType} className="inline-flex items-center">
                              <input
                                type="checkbox"
                                value={permitType}
                                checked={formData.permitRequired.includes(permitType)}
                                onChange={(e) => {
                                  const updatedPermits = e.target.checked
                                    ? [...formData.permitRequired, permitType]
                                    : formData.permitRequired.filter(p => p !== permitType);
                                  handleInputChange('permitRequired', updatedPermits);
                                }}
                                className="form-checkbox h-4 w-4 text-blue-600 border-gray-300 rounded mr-2 align-middle"
                              />
                              <span className="text-sm">{permitType}</span>
                            </label>
                          ))}
                        </div>
                    </div>

              {/* Worker Details Table */}
              {formData.numberOfWorkers > 0 && (
                <div className="border p-4 rounded-lg">
                  <h4 className="text-sm font-semibold mb-3">Worker Details</h4>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border p-2 text-center">S/N</th>
                        <th className="border p-2 text-center">Workers Name *</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.workerDetails.map((worker, index) => (
                        <tr key={index}>
                          <td className="border p-2 text-center">{index + 1}</td>
                          <td className="border p-2">
                            <Input
                              type="text"
                              value={worker.name}
                              onChange={(e) => handleInputChange(`workerName_${index}`, e.target.value)}
                              placeholder={`Enter worker ${index + 1} name`}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
                </div>
                </div>
              </div>
            )}   

            {currentSection === 3 && (
                <div className="space-y-6">
                {/* Section 3 & 4*/}
                <div>
                <h2 className="font-semibold mb-4 relative">
                    <span className="relative after:content-[''] after:block after:w-full after:h-1 after:bg-gray-500 after:mb-1 after:shadow-md">
                    3. HAZARD IDENTIFICATION
                    </span>
                </h2>
                <div>
                <div className="grid grid-cols-4 gap-4">
                    {hazardOptions.map((hazard) => (
                    <div key={hazard} className="relative">
                        <label className="inline-flex items-center">
                        <input
                            type="checkbox"
                            value={hazard}
                            checked={formData.hazardIdentification.includes(hazard)}
                            onChange={(e) => handleCheckboxChange(hazard, e.target.checked)}
                            className="form-checkbox h-4 w-4 text-blue-600 border-gray-300 rounded mr-2 align-middle"
                        />
                        <span className="text-sm">{hazard}</span>
                        </label>
                        
                        {/* Conditional text input for 'Other (Specify)' */}
                        {hazard === 'Other (Specify)' && 
                        formData.hazardIdentification.includes(hazard) && (
                        <input
                            type="text"
                            value={otherHazardText}
                            onChange={handleOtherHazardTextChange}
                            placeholder="Specify other hazard"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                        )}
                    </div>
                    ))}
                </div>
                </div>
                <h2 className="font-semibold mt-7 mb-4 relative">
                    <span className="relative after:content-[''] after:block after:w-full after:h-1 after:bg-gray-500 after:mb-1 after:shadow-md">
                    4. JOB REQUIREMENTS
                    </span>
                </h2>
                <div>
                <div className="grid grid-cols-3 gap-4">
                  {jobRequirementOptions.map((requirement) => (
                    <div key={requirement} className="relative">
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          value={requirement}
                          checked={formData.jobRequirement.includes(requirement)}
                          onChange={(e) => {
                            const updatedRequirements = e.target.checked
                              ? [...formData.jobRequirement, requirement]
                              : formData.jobRequirement.filter(r => r !== requirement);
                            handleInputChange('jobRequirement', updatedRequirements);
                          }}
                          className="form-checkbox h-4 w-4 text-blue-600 border-gray-300 rounded mr-2 align-middle"
                        />
                        <span className="text-sm">{requirement}</span>
                      </label>
                    </div>
                  ))}
                </div>
                </div>
                </div>
              </div>
            )}

          {/* Form Actions */}
          <div className="flex justify-center gap-4 mt-6">
            {currentSection > 1 && (
              <Button
                variant="secondary"
                onClick={handlePrevious}
                className="bg-gray-600 text-white hover:bg-gray-700"
              >
                Previous
              </Button>
            )}
            {currentSection < 4 && (
              <Button
                variant="secondary"
                onClick={handleNext}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                Next
              </Button>
            )}
            {currentSection === 4 && (
              <Button
                variant="secondary"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-green-600 text-white hover:bg-green-700 flex items-center gap-2"
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </Button>
            )}
            </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PermitForm;