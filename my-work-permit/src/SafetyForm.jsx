import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Dialog } from './components/ui/dialog';
import Input from "./components/ui/input";
import { X, CloudUpload } from 'lucide-react';
import { Dropdown } from './components/ui/dropdown';
import logo from './assets/mps_logo.jpg';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { addMinutes, format } from 'date-fns';
import { Formik, Form, Field } from 'formik';
import SafetyFormValidation, { calculatePermitDuration } from './SafetyFormValidation';

const SafetyForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    // Section 1 fields
    startDate: null,
    startTime: null,
    endDate: null,
    endTime: null,
    permitDuration: '',
    department: '',
    jobLocation: '',
    subLocation: '',
    plantDetail: '',
    // Section 2 fields
    jobDescription: '',
    permitReceiver: '',
    contractType: '',
    contractCompanyName: '',
    staffID: '',
    riskAssessment: [],
    permitRequired: [],
    numberOfWorkers:'',
    workerDetails:[],
    // Section 3 fields
    hazardIdentification:[],
    jobRequirement:[],
    ppeRequirement:[],
    // Section 4 fields
    precautionaryMeasure:[],
    precaution:[],
    hazardousEnergies:[],
    acVoltageDe:[],
    dcVoltageDe:[],
    breakPreparation:[],
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileToUpload, setFileToUpload] = useState([]);
  const [otherHazardText, setOtherHazardText] = useState([]);  //Specify other hazard with text
  const [otherGasesText, setOtherGasesText] = useState([]);  //Specify other gases with text
  const [otherPPEText, setOtherPPEText] = useState([]);  //Specify other ppe with text
  const [otherControlsText, setOtherControlsText] = useState('');  //Specify other additional controls with text
  const [otherDangerousGoodsText, setOtherDangerousGoodsText] = useState('');  //Specify dangerous goods/chemcials with text
  const [otherHazardousEnergyText, setOtherHazardousEnergyText] = useState(''); //Specify other hazardous energies with text
  const [otherBreakPreparationText, setOtherBreakPreparationText] = useState('');


  const departmentOptions = ['IT', 'Operations', 'Asset Maintenance', 'QHSSE'];
  const jobLocationOptions = ['Gates','Authorities Building','MPS Admin Building','Workshop Building','Scanners Area','OCR Area','Inspection Platform','Yard','Quayside','Powerhouse','Fuel Station']
  const contractTypeOptions = ['Internal / MPS','External / Contract Company'];
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
  const ppeRequirementOptions = ['Overalls','Safety Shoes/Gum boots/Helmet','Fall Arrest Equipment','Safety Belt','Jersey barriers','Life Jacket','Welding suit','Dust Mask/ Respiratory Protection','Warning Signs',
    'Insulated Tool','PVC Suit','Rubber Mat','Face shield','Lone Worker Radio','Safety Goggles','Safety Gloves','High Visibility Vest','Emergency Self-containing Breathing Apparatus','Other (Specify)']
  const precautionaryMeasureOptions = ['Affected persons notified of the work','Adequate barriers & notices erected to mark exclusion zone','Lifting equipment subject to inspection before work','Work area free from hazardous chemicals','Safe means of access/egress in place',
    'Nearest Fire extinguisher, Escape Exit and Route','Firm level ground for ladders, scaffolds and Mobile access','Waste material remove safely (waste chute,winch)','Protection against adverse weather conditions','Overhead/Buried Services avoided (precautions taken)','Falling materials/objects prevented (tools secured, toe boards, etc.)',
    'Ladder extends about 1m beyond highest rung (top 3 rungs unused)','Roof boards,ladders and other equipment access in good condition','Safety harness inspected and in good condition','Proposed work method ensures minimal spread of contaminants','Risk assessment/JSA takes into account affected parties','Less hazardous option adopted',
    'All portable hand powered tools inspected and in good condition','Fall prevented by fall arrest and harness with anchor points','Falls prevented by guard rails or equivalent']
  const precautionOptions = ['Workers appropriately qualified in boat use according to class of waters involved','PFDs and lifesaving equipment available and inspected before use','Earthing of equipment required','Control measures adopted reduces risk ALARP','Other hazardous sources identified and controlled',
    'Suitable Anchorage/ Harness points available','Moving machine parts secured','Fuse withdrawal required','All electrical power sources identified, isolated and appropriately tagged','Physical wire disconnection required','Additional Controls (Specify)']
  const hazardousEnergiesOptions = ['Electricity','Steam','Vacuum','Pressurized System','Falling Objects','Moving Parts','Water/Liquid','Lasers','Dangerous goods/chemicals (Specify)','Hydraulic fluid','Ionizing radiation','Other(Specify)',]
  const AcVoltageOptions = ['0V to 240V','241V to 430V','431V to 3300V','11,000V to 33,000V']
  const DcVoltageOptions = ['0V to 50V','51V to 600V','Less than 600V']
  const breakPreparationOptions = ['Clean','Depressurize','Drain/Vent','Cool/Warm','Purge free from hazardous substances','Other (Specify)']
  

const handleInputChange = (field, value,setFieldValue) => {
    setFieldValue(field, value,true);

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
      } else if (field === 'ppeRequirement') {
        // New PPE requirement logic
        const updatedPPERequirements = value;
        setFormData(prev => ({
          ...prev,
          [field]: updatedPPERequirements
        }));
      } else if (field === 'precautionaryMeasure') {
        // Precautionary measure logic
        const updatedPrecautionaryMeasures = value;
        setFormData(prev => ({
          ...prev,
          [field]: updatedPrecautionaryMeasures
        }));
      } else if (field === 'precaution') {
        // Precautions logic
        const updatedPrecaution = value;
        setFormData(prev => ({
          ...prev,
          [field]: updatedPrecaution
        }));
      } else if (field === 'hazardousEnergies') {
        // Hazardous Energies logic
        const updatedPrecaution = value;
        setFormData(prev => ({
          ...prev,
          [field]: updatedPrecaution
        }));
      } else if (field === 'acVoltageDe') {
        setFormData(prev => ({
          ...prev,
          [field]: value
        }));
      } else if (field === 'dcVoltageDe') {
        setFormData(prev => ({
          ...prev,
          [field]: value
        }));
      } else if (field === 'breakPreparation') {
        setFormData(prev => ({
          ...prev,
          [field]: value
        }));
      } else {
      // Existing input change logic
      setFormData(prev => ({
        ...prev,
        [field]: value,
        ...(field === 'contractType' && value !== 'External / Contract Company' 
          ? { contractCompanyName: '' } 
          : {})
      }));
    }
  };

  // Function to handle date/time change and recalculate permit duration
  const handleDateChange = (field, value, setFieldValue) => {
    // Update form data
    setFormData(prevData => {
      const updatedData = { ...prevData, [field]: value };
      
      // Recalculate permit duration
      const duration = calculatePermitDuration(updatedData.startDate, updatedData.endDate);
      updatedData.permitDuration = duration;
      
      return updatedData;
    });
  
    // Update Formik values
    setFieldValue(field, value);
    setFieldValue('permitDuration', calculatePermitDuration(
      field === 'startDate' ? value : formData.startDate, 
      field === 'endDate' ? value : formData.endDate
    ));
  };

  const handleClose = () => {
    navigate('/dashboard/permits/job-permits');
  };

  const handleSaveDraft = () => {
    // Implement your save draft logic here
    // For example:
    // savePermitDraft(formData);
    setIsSubmitting(true);
  };

  const handleInitiateClose = () => {
    setIsDialogOpen(true);
  };

  const handlePrevious = (e) => {
    e.preventDefault(); // Prevent form submission
    if (currentSection > 1) {
      setCurrentSection(currentSection - 1);
    }
  };

  const handleNext = async (e, validateForm, setTouched) => {
    e.preventDefault();
  
    try {
      // Determine fields to validate based on the current section
      const fieldsToValidate =
        currentSection === 1
          ? ['startDate', 'startTime', 'endDate', 'endTime', 'permitDuration', 'department', 'jobLocation', 'subLocation', 'plantDetail']
          : ['jobDescription', 'permitReceiver', 'contractType', ...(formData.contractType === ' External / Contract Company' ? ['contractCompanyName'] : []), 'numberOfWorkers', 'workerDetails', 'riskAssessment', 'permitRequired'];
  
      // Validate only fields in the current section
      const errors = await validateForm();
  
      // Filter errors to only those in the current section
      const sectionErrors = Object.keys(errors).reduce((acc, field) => {
        if (fieldsToValidate.includes(field)) {
          acc[field] = errors[field];
        }
        return acc;
      }, {});
  
      if (Object.keys(sectionErrors).length === 0) {
        // No validation errors for the current section; proceed
        setCurrentSection(currentSection + 1);
      } else {
        // Mark relevant fields as touched
        setTouched(
          fieldsToValidate.reduce((acc, field) => {
            if (sectionErrors[field]) acc[field] = true;
            return acc;
          }, {})
        );
      }
    } catch (error) {
      console.error("Validation error:", error);
    }
  };
  
  const handleFileUpload = (event, setFieldValue) => {
    const newFiles = Array.from(event.target.files);
    const updatedFiles = [...fileToUpload, ...newFiles];  // Merge with existing files
    setFileToUpload(updatedFiles);  // Update local state
    setFieldValue('riskAssessment', updatedFiles);  // Update Formik state with array directly
  };
  
  const handleFileDrop = (event, setFieldValue) => {
    event.preventDefault();
    const newFiles = Array.from(event.dataTransfer.files);
    const updatedFiles = [...fileToUpload, ...newFiles];  // Merge with existing files
    setFileToUpload(updatedFiles);  // Update local state
    setFieldValue('riskAssessment', updatedFiles);  // Update Formik state with array directly
  };
  
  const handleFileRemove = (index, setFieldValue) => {
    const updatedFiles = fileToUpload.filter((_, i) => i !== index);
    setFileToUpload(updatedFiles);
    setFieldValue('riskAssessment', updatedFiles);
  };

  //Hazard Checkboxes change
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

  //Job Requirement Checkbox change
  const handleJobRequirementCheckboxChange = (requirement, checked) => {
    let updatedRequirements;
    if (checked) {
      updatedRequirements = [...formData.jobRequirement, requirement];
    } else {
      updatedRequirements = formData.jobRequirement.filter(r => r !== requirement);
      
      // If unchecking 'List other gases detected', clear the text
      if (requirement === 'List other gases detected') {
        setOtherGasesText('');
      }
    }
    
    handleInputChange('jobRequirement', updatedRequirements);
  };

  const handleOtherGasesTextChange = (e) => {
    const text = e.target.value;
    setOtherGasesText(text);
  
    // Ensure 'List other gases' is added to job requirements when text is entered
    const isOtherGasesInRequirements = formData.jobRequirement.includes('List other gases detected');
    if (text.trim() && !isOtherGasesInRequirements) {
      handleInputChange('jobRequirement', [...formData.jobRequirement, 'List other gases detected']);
    }
  };

  //PPE Requirements checkbox changes
  const handlePPECheckboxChange = (ppe, checked) => {
    let updatedPPE;
    if (checked) {
      updatedPPE = [...formData.ppeRequirement, ppe];
    } else {
      updatedPPE = formData.ppeRequirement.filter(p => p !== ppe);
      
      // If unchecking 'Other (Specify)', clear the text
      if (ppe === 'Other (Specify)') {
        setOtherPPEText('');
      }
    }
    
    handleInputChange('ppeRequirement', updatedPPE);
  };

  const handleOtherPPETextChange = (e) => {
    const text = e.target.value;
    setOtherPPEText(text);

    // Ensure 'Other (Specify)' is added to PPE requirements when text is entered
    const isOtherInPPE = formData.ppeRequirement.includes('Other (Specify)');
    if (text.trim() && !isOtherInPPE) {
      handleInputChange('ppeRequirement', [...formData.ppeRequirement, 'Other (Specify)']);
    }
  };

  const handlePrecautionaryMeasureCheckboxChange = (measure, checked) => {
    let updatedMeasures;
    if (checked) {
      updatedMeasures = [...formData.precautionaryMeasure, measure];
    } else {
      updatedMeasures = formData.precautionaryMeasure.filter(p => p !== measure);
    }
    
    handleInputChange('precautionaryMeasure', updatedMeasures);
  };

  // PRECAUTION CHECKBOXES
  const handlePrecautionCheckboxChange = (precaution, checked) => {
    let updatedPrecautions;
    if (checked) {
      updatedPrecautions = [...formData.precaution, precaution];
    } else {
      updatedPrecautions = formData.precaution.filter(p => p !== precaution);
      
      // If unchecking 'Additional Controls (Specify)', clear the text
      if (precaution === 'Additional Controls (Specify)') {
        setOtherControlsText('');
      }
    }
    
    handleInputChange('precaution', updatedPrecautions);
  };

  const handleOtherControlsTextChange = (e) => {
    const text = e.target.value;
    setOtherControlsText(text);
  
    // Ensure 'Additional Controls (Specify)' is added when text is entered
    const isAdditionalControlsInPrecautions = formData.precaution.includes('Additional Controls (Specify)');
    if (text.trim() && !isAdditionalControlsInPrecautions) {
      handleInputChange('precaution', [...formData.precaution, 'Additional Controls (Specify)']);
    }
  };

  const handleAcVoltageDeCheckboxChange = (option, checked) => {
    let updatedAcVoltageDe;
    if (checked) {
      updatedAcVoltageDe = [option]; // Single selection
    } else {
      updatedAcVoltageDe = []; 
    }
    
    handleInputChange('acVoltageDe', updatedAcVoltageDe);
  };
  
  const handleDcVoltageDeCheckboxChange = (option, checked) => {
    let updatedDcVoltageDe;
    if (checked) {
      updatedDcVoltageDe = [option]; // (single selection)
    } else {
      updatedDcVoltageDe = []; 
    }
    
    handleInputChange('dcVoltageDe', updatedDcVoltageDe);
  };

  //HAZARDOUS ENERGIES CHECKBOXES
  const handleHazardousEnergiesCheckboxChange = (energy, checked) => {
    let updatedEnergies;
    if (checked) {
      updatedEnergies = [...formData.hazardousEnergies, energy];
    } else {
      updatedEnergies = formData.hazardousEnergies.filter(e => e !== energy);
      
      // If unchecking 'Dangerous goods/chemicals (Specify)' or 'Other(Specify)', clear the text
      if (energy === 'Dangerous goods/chemicals (Specify)') {
        setOtherDangerousGoodsText('');
      }
      if (energy === 'Other(Specify)') {
        setOtherHazardousEnergyText('');
      }
    }
    
    handleInputChange('hazardousEnergies', updatedEnergies);
  };

  const handleOtherDangerousGoodsTextChange = (e) => {
    const text = e.target.value;
    setOtherDangerousGoodsText(text);
  
    const isDangerousGoodsInEnergies = formData.hazardousEnergies.includes('Dangerous goods/chemicals (Specify)');
    if (text.trim() && !isDangerousGoodsInEnergies) {
      handleInputChange('hazardousEnergies', [...formData.hazardousEnergies, 'Dangerous goods/chemicals (Specify)']);
    }
  };
  
  const handleOtherHazardousEnergyTextChange = (e) => {
    const text = e.target.value;
    setOtherHazardousEnergyText(text);
  
    const isOtherEnergyInEnergies = formData.hazardousEnergies.includes('Other(Specify)');
    if (text.trim() && !isOtherEnergyInEnergies) {
      handleInputChange('hazardousEnergies', [...formData.hazardousEnergies, 'Other(Specify)']);
    }
  };

  const handleBreakPreparationCheckboxChange = (breakPrep, checked) => {
    let updatedBreakPreparation;
    if (checked) {
      updatedBreakPreparation = [...formData.breakPreparation, breakPrep];
    } else {
      updatedBreakPreparation = formData.breakPreparation.filter(h => h !== breakPrep);
      
      // If unchecking 'Other (Specify)', clear the text
      if (breakPrep === 'Other (Specify)') {
        setOtherBreakPreparationText('');
      }
    }
    
    handleInputChange('breakPreparation', updatedBreakPreparation);
  };
  
  const handleOtherBreakPreparationTextChange = (e) => {
    const text = e.target.value;
    setOtherBreakPreparationText(text);
  
    // Ensure 'Other (Specify)' is added to break preparation when text is entered
    const isOtherInBreakPreparation = formData.breakPreparation.includes('Other (Specify)');
    if (text.trim() && !isOtherInBreakPreparation) {
      handleInputChange('breakPreparation', [...formData.breakPreparation, 'Other (Specify)']);
    }
  };


  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      console.log('Submitting form data:', formData);
  
      // Simulate saving form data to the database
      await new Promise(resolve => setTimeout(resolve, 1000));
  
      // Navigate to success page with success status
      navigate('/dashboard/permits/job-permits/success', { 
        state: { success: true } 
      });
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
          onClick={handleInitiateClose}
          disabled={isSubmitting}
          className="absolute top-2 right-2 transition-transform duration-300 hover:scale-110 group"
        >
          <X className="h-5 w-5 group-hover:h-6 group-hover:w-6 transition-all duration-300" />
        </Button>
        </CardHeader>

        {/* Confirmation Dialog */}
        {isDialogOpen && (
          <Dialog
            isOpen={isDialogOpen}
            onClose={() => setIsDialogOpen(false)} // Handles dialog closing
            onSaveDraft={handleSaveDraft}
            title="Confirm Close"
          >
            <div className="text-center">
              <p className="mb-4 text-gray-700">Are you sure you want to close this?</p>
              <div className="flex justify-center space-x-4">
                <Button 
                  variant="primary" 
                  onClick={() => {
                    handleSaveDraft();
                    handleClose();
                  }}
                >
                  Save as Draft and Close
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={handleClose}
                >
                  Close Without Saving
                </Button>
              </div>
            </div>
          </Dialog>
        )}

        <CardContent className="p-6">
        <Formik
          initialValues={formData}
          validationSchema={SafetyFormValidation}
          onSubmit={(values) => {
            console.log('Form Submitted:', values);
            navigate('/success');
          }}
          validateOnChange={true}
          validationContext={{ currentSection }}
          validateOnBlur={true}
        >
          {({ errors, touched, setFieldValue,validateForm,setTouched}) => (
            <Form>
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
                        <label className="block text-sm font-medium mr-32">Start Date <span className="text-red-600">*</span></label>
                        <label className="block text-sm font-medium">Time</label>
                      </div>
                      <div className="flex gap-4">
                        {/* Start Date */}
                         <div className="flex-1">
                           <DatePicker
                             id="startDateInput"
                             selected={formData.startDate}
                             placeholderText="Select date"
                             onChange={(date) => handleDateChange('startDate', date,setFieldValue)}
                             className={`border rounded-lg px-3 py-2 w-full ${
                               errors.startDate && touched.startDate 
                                 ? 'border-red-500 bg-red-50' 
                                 : 'border-gray-300'
                             }`}
                      
                             dateFormat="yyyy-MM-dd"                         
                           />
                           {errors.startDate && touched.startDate && (
                          <div className="text-red-600 text-sm mt-1">{errors.startDate}</div>
                           )}
                         </div>

                          {/* Start Time */}
                          <div className="flex-1">
                            <DatePicker
                              id="startTimeInput"
                              selected={formData.startTime}
                              onChange={(date) => handleDateChange('startTime', date,setFieldValue)}
                              showTimeSelect
                              showTimeSelectOnly
                              timeCaption="Time"
                              dateFormat="h:mm aa"
                              placeholderText="Select time"
                              className={`border rounded-lg px-3 py-2 w-full ${
                                errors.startTime && touched.startTime 
                                  ? 'border-red-500 bg-red-50' 
                                  : 'border-gray-300'
                              }`}
                            />
                            {errors.startTime && touched.startTime && (
                          <div className="text-red-600 text-sm mt-1">{errors.startTime}</div>
                           )}
                          </div>
                        </div>
                      </div>
                          
                      {/* End Date and Time */}
                      <div className="border p-4 rounded-lg">
                        <div className="flex items-center mb-2">
                          <label className="block text-sm font-medium mr-32">End Date <span className="text-red-600">*</span></label>
                          <label className="block text-sm font-medium">Time</label>
                        </div>
                        <div className="flex gap-4">
                          {/* End Date */}
                            <div className="flex-1">
                              <DatePicker
                                id="endDateInput"
                                selected={formData.endDate}
                                placeholderText="Select date"
                                onChange={(date) => handleDateChange('endDate', date,setFieldValue)}
                                className={`border rounded-lg px-3 py-2 w-full ${
                                  errors.endDate && touched.endDate 
                                    ? 'border-red-500 bg-red-50' 
                                    : 'border-gray-300'
                                }`}
                                dateFormat="yyyy-MM-dd"
                              />
                            </div>
                    
                          {/* End Time */}
                          <div className="flex-1">
                            <DatePicker
                              id="endTimeInput"
                              selected={formData.endTime}
                              onChange={(date) => handleDateChange('endTime', date,setFieldValue)}
                              showTimeSelect
                              showTimeSelectOnly
                              timeCaption="Time"
                              dateFormat="h:mm aa"
                              placeholderText="Select time"
                              className={`border rounded-lg px-3 py-2 w-full ${
                                errors.endTime && touched.endTime
                                  ? 'border-red-500 bg-red-50' 
                                  : 'border-gray-300'
                              }`}                             
                            />
                            {errors.endTime && touched.endTime && (
                          <div className="text-red-600 text-sm mt-1">{errors.endTime}</div>
                           )}
                          </div>
                        </div>
                      </div>
                    </div>
    
                    <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium mb-1">
                          Permit Duration <span className="text-gray-500 font-normal">(Max 7 days)</span>
                        </label>
                        <Input
                          type="text"
                          name="permitDuration"
                          value={formData.permitDuration}
                          readOnly
                          className={`border rounded-lg px-3 py-2 w-full bg-gray-100 cursor-not-allowed ${
                            errors.permitDuration && touched.permitDuration 
                              ? 'border-red-500 bg-red-50' 
                              : 'bg-gray-100'
                          }`}
                        />
                        {errors.permitDuration && touched.permitDuration && (
                          <div className="text-red-600 text-sm mt-1">{errors.permitDuration}</div>
                        )}
                      </div>

                      {/* Department Dropdown */}
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Department <span className="text-red-600">*</span>
                        </label>
                        <Dropdown
                          options={departmentOptions}
                          value={formData.department}
                          onChange={(value) => {
                            handleInputChange('department', value, setFieldValue);
                          }}
                          className={`w-full ${
                            errors.department && touched.department 
                              ? 'border-red-500 bg-red-50' 
                              : ''
                          }`}
                          dropdownIcon="▾"
                        />
                        {errors.department && touched.department && (
                          <div className="text-red-600 text-sm mt-1">{errors.department}</div>
                        )}
                      </div>
                    </div>
    
                    <div className="grid grid-cols-2 gap-6">
                     {/* Job Location Dropdown */}
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Job Location <span className="text-red-600">*</span>
                        </label>
                        <Dropdown
                          name="jobLocation"
                          options={jobLocationOptions}
                          value={formData.jobLocation}
                          onChange={(value) => {
                            handleInputChange('jobLocation', value, setFieldValue);
                          }}
                          className={`w-full ${
                            errors.jobLocation && touched.jobLocation 
                              ? 'border-red-500 bg-red-50' 
                              : ''
                          }`}
                          dropdownIcon="▾"
                        />
                        {errors.jobLocation && touched.jobLocation && (
                          <div className="text-red-600 text-sm mt-1">{errors.jobLocation}</div>
                        )}
                      </div>
                      {/* Sub Location Input */}
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Sub Location <span className="text-red-600">*</span>
                        </label>
                        <Input
                          type="text"
                          name="subLocation"
                          value={formData.subLocation}
                          onChange={(e) => {
                            handleInputChange('subLocation', e.target.value, setFieldValue);
                          }}
                          placeholder="Enter specific location"
                          className={`w-full ${
                            errors.subLocation && touched.subLocation 
                              ? 'border-red-500 bg-red-50' 
                              : ''
                          }`}
                        />
                      </div>
                    </div>
    
                   {/* Plant/Location/Equipment Detail */}
                    <div className="grid grid-cols-1 gap-6">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Plant/Location/Equipment Detail <span className="text-red-600">*</span>
                        </label>
                        <Input
                          type="text"
                          name="plantDetail"
                          value={formData.plantDetail}
                          onChange={(e) => {
                            handleInputChange('plantDetail', e.target.value, setFieldValue);
                          }}
                          placeholder="Enter details of the job location"
                          className={`w-full ${
                            errors.plantDetail && touched.plantDetail 
                              ? 'border-red-500 bg-red-50' 
                              : ''
                          }`}
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
              Job Description <span className="text-red-600">*</span>
            </label>
            <Input
              type="text"
              name="jobDescription"
              value={formData.jobDescription}
              onChange={(e) => {
                handleInputChange('jobDescription', e.target.value, setFieldValue);
              }}
              placeholder="Enter detailed description of the job"
              className={`w-full ${
                errors.jobDescription && touched.jobDescription 
                  ? 'border-red-500 bg-red-50' 
                  : ''
              }`}
            />
            {errors.jobDescription && touched.jobDescription && (
              <div className="text-red-600 text-sm mt-1">{errors.jobDescription}</div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-sm font-medium mb-1">
              Permit Receiver <span className="text-red-600">*</span>
            </label>
            <Input
              type="text"
              name="permitReceiver"
              value={formData.permitReceiver}
              onChange={(e) => {
                handleInputChange('permitReceiver', e.target.value, setFieldValue);
              }}
              placeholder="Name of permit receiver"
              className={`w-full ${
                errors.permitReceiver && touched.permitReceiver 
                  ? 'border-red-500 bg-red-50' 
                  : ''
              }`}
            />
            {errors.permitReceiver && touched.permitReceiver && (
              <div className="text-red-600 text-sm mt-1">{errors.permitReceiver}</div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
  <div>
    <label className="block text-sm font-medium mb-1">
      Contract Type <span className="text-red-600">*</span>
    </label>
    <Dropdown
      name="contractType"
      options={contractTypeOptions}
      value={formData.contractType}
      onChange={(value) => {
        handleInputChange('contractType', value, setFieldValue);
      }}
      className={`w-full ${
        errors.contractType && touched.contractType 
          ? 'border-red-500 bg-red-50' 
          : ''
      }`}
      dropdownIcon="▾"
    />
    {errors.contractType && touched.contractType && (
      <div className="text-red-600 text-sm mt-1">{errors.contractType}</div>
    )}
  </div>

  {formData.contractType === 'External / Contract Company' && (
    <div>
      <label className="block text-sm font-medium mb-1">
        Company Name <span className="text-red-600">*</span>
      </label>
      <Input
        type="text"
        name="contractCompanyName"
        value={formData.contractCompanyName || ''}
        onChange={(e) => {
          handleInputChange('contractCompanyName', e.target.value, setFieldValue);
        }}
        placeholder="Enter contract company name"
        className={`w-full ${
          errors.contractCompanyName && touched.contractCompanyName 
            ? 'border-red-500 bg-red-50' 
            : ''
        }`}
      />
      {errors.contractCompanyName && touched.contractCompanyName && (
        <div className="text-red-600 text-sm mt-1">{errors.contractCompanyName}</div>
      )}
    </div>
  )}
</div>
          
        <div className="grid grid-cols-2 gap-6">
        <div>
    <label className="block text-sm font-medium mb-1">
      Staff ID {formData.contractType === 'Internal / MPS' && <span className="text-red-600">*</span>}
      {formData.contractType !== 'Internal / MPS' && <span className="text-gray-500 font-normal">(Optional)</span>}
    </label>
    <Input
      type="text"
      name="staffID"
      value={formData.staffID}
      onChange={(e) => {
        handleInputChange('staffID', e.target.value, setFieldValue);
      }}
      placeholder="Enter staff ID"
      className={`w-full ${
        errors.staffID && touched.staffID 
          ? 'border-red-500 bg-red-50' 
          : ''
      }`}
    />
    {errors.staffID && touched.staffID && (
      <div className="text-red-600 text-sm mt-1">{errors.staffID}</div>
    )}
  </div>  
            <div>
              <label className="block text-sm font-medium mb-1">
                Number of Workers <span className="text-red-600">*</span>
              </label>
              <Input
                type="number"
                name="numberOfWorkers"
                min="0"
                max="20"
                value={formData.numberOfWorkers}
                onChange={(e) => {
                  handleInputChange('numberOfWorkers', e.target.value, setFieldValue);
                }}
                placeholder="Enter number of workers"
                className={`w-full ${
                  errors.numberOfWorkers && touched.numberOfWorkers 
                    ? 'border-red-500 bg-red-50' 
                    : ''
                }`}
              />
              {errors.numberOfWorkers && touched.numberOfWorkers && (
                <div className="text-red-600 text-sm mt-1">{errors.numberOfWorkers}</div>
              )}
            </div>
        </div>                  
    
        <div className="border p-4 rounded-lg">
  <label className="block text-sm font-medium mb-1">
    Risk Assessment/Job Safety Analysis <span className="text-red-600">*</span>
  </label>
  <p className="text-xs text-gray-600 mt-1 mb-1">
    Uploaded documents must have one of the following extensions: 
    <span className="font-bold"> jpg, jpeg, png, doc, docx, pdf </span> 
    and <span className="font-bold">not larger than 4MB</span> each.
  </p>
  <div
    className={`flex flex-col items-center justify-center w-full h-32 bg-gray-100 rounded-lg cursor-pointer border-dashed border-2 ${
      errors.riskAssessment && touched.riskAssessment
        ? 'border-red-500'
        : 'border-blue-400'
    }`}
    onDragOver={(e) => {
      e.preventDefault();
      e.stopPropagation();
    }}
    onDrop={(e) => {
      e.preventDefault();
      e.stopPropagation();
      handleFileDrop(e,setFieldValue);
    }}
  >
    <input
      type="file"
      id="riskAssessmentUpload"
      multiple
      onChange={(e) => handleFileUpload(e, setFieldValue)}
      className="hidden"
      accept=".jpg,.jpeg,.png,.doc,.docx,.pdf"
    />
    <label
      htmlFor="riskAssessmentUpload"
      className="flex flex-col items-center space-y-2"
    >
      <CloudUpload className="h-8 w-8 text-blue-500" />
      <span className="text-blue-500 font-medium">Click To Upload Documents</span>
    </label>
  </div>
  {errors.riskAssessment && touched.riskAssessment && (
    <div className="text-red-600 text-sm mt-1">{errors.riskAssessment}</div>
  )}

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
              <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                {file.name.split('.').pop().toUpperCase()}
              </span>
              <span className="text-sm text-gray-700 truncate">
                {file.name}
              </span>
            </div>
            <button
              type="button"
              className="text-red-500 hover:text-red-700"
              onClick={() => handleFileRemove(index, setFieldValue)}
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
              Permit(s) Required <span className="text-red-600">*</span>
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
                      handleInputChange('permitRequired', updatedPermits, setFieldValue);
                    }}
                    className="form-checkbox h-4 w-4 text-blue-600 cursor-pointer border-gray-300 rounded mr-2 align-middle"
                  />
                  <span className="text-sm">{permitType}</span>
                </label>
              ))}
            </div>
            {errors.permitRequired && touched.permitRequired && (
              <div className="text-red-600 text-sm mt-1">{errors.permitRequired}</div>
            )}
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
                        name={`workerDetails.${index}.name`}
                        value={worker.name}
                        onChange={(e) => {
                          const updatedWorkerDetails = [...formData.workerDetails];
                          updatedWorkerDetails[index] = { 
                            ...updatedWorkerDetails[index], 
                            name: e.target.value 
                          };
                          handleInputChange('workerDetails', updatedWorkerDetails, setFieldValue);
                        }}
                        placeholder={`Enter worker ${index + 1} name`}
                        className={`w-full ${
                          errors.workerDetails?.[index]?.name && touched.workerDetails?.[index]?.name
                            ? 'border-red-500 bg-red-50'
                            : ''
                        }`}
                      />
                      {errors.workerDetails?.[index]?.name && touched.workerDetails?.[index]?.name && (
                        <div className="text-red-600 text-sm mt-1">
                          {errors.workerDetails[index].name}
                        </div>
                      )}
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
                {/* Section 3 & 4 & 5*/}
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
                            className="form-checkbox h-4 w-4 text-blue-600 cursor-pointer border-gray-300 rounded mr-2 align-middle"
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
                            placeholder="Type other hazard"
                            className="mt-1 block w-full border border-gray-300 rounded-md text-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
                            onChange={(e) => handleJobRequirementCheckboxChange(requirement, e.target.checked)}
                            className="form-checkbox h-4 w-4 text-blue-600 cursor-pointer border-gray-300 rounded mr-2 align-middle"
                          />
                          <span className="text-sm">{requirement}</span>
                        </label>

                        {/* Conditional text input for 'List other gases detected' */}
                        {requirement === 'List other gases detected' && 
                        formData.jobRequirement.includes(requirement) && (
                          <input
                            type="text"
                            value={otherGasesText}
                            onChange={handleOtherGasesTextChange}
                            placeholder="Type other gases"
                            className="mt-1 block w-full border border-gray-300 rounded-md text-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        )}
                      </div>
                    ))}
                </div>
                </div>
                </div>
                <h2 className="font-semibold mt-7 mb-4 relative">
                    <span className="relative after:content-[''] after:block after:w-full after:h-1 after:bg-gray-500 after:mb-1 after:shadow-md">
                    4. PPE REQUIREMENTS
                    </span>
                </h2>
                <div>
                <div className="grid grid-cols-4 gap-4">
                  {ppeRequirementOptions.map((ppe) => (
                  <div key={ppe} className="relative">
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        value={ppe}
                        checked={formData.ppeRequirement.includes(ppe)}
                        onChange={(e) => handlePPECheckboxChange(ppe, e.target.checked)}
                        className="form-checkbox h-4 w-4 text-blue-600 cursor-pointer border-gray-300 rounded mr-2 align-middle"
                      />
                      <span className="text-sm">{ppe}</span>
                    </label>
                    
                    {/* Conditional text input for 'Other (Specify)' */}
                    {ppe === 'Other (Specify)' && 
                    formData.ppeRequirement.includes(ppe) && (
                      <input
                        type="text"
                        value={otherPPEText}
                        onChange={handleOtherPPETextChange}
                        placeholder="Type other PPE"
                        className="mt-1 block w-full border border-gray-300 rounded-md text-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    )}
                  </div>
                 ))}
                </div>
                </div>
              </div>
            )}
            
            {currentSection === 4 && (
                <div className="space-y-6">
                {/* Section 6 */}
                <div>
                <h2 className="font-semibold mb-4 relative">
                    <span className="relative after:content-[''] after:block after:w-full after:h-1 after:bg-gray-500 after:mb-1 after:shadow-md">
                    6. PRECAUTIONARY MEASURES
                    </span>
                    <span className="block text-sm text-red-600">
                    * Tick Mandatory
                    </span>
                </h2>
                <div>
                <div className="grid grid-cols-2 gap-4">
                    {precautionaryMeasureOptions.map((measure) => (
                    <div key={measure} className="relative">
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          value={measure}
                          checked={formData.precautionaryMeasure.includes(measure)}
                          onChange={(e) => handlePrecautionaryMeasureCheckboxChange(measure, e.target.checked)}
                          className="form-checkbox h-4 w-4 text-blue-600 cursor-pointer border-gray-300 rounded mr-2 align-middle"
                        />
                        <span className="text-sm">{measure}</span>
                      </label>
                    </div>
                    ))}
                </div>
                </div>
                <h2 className="font-semibold mt-7 mb-4 relative">
                    <span className="relative after:content-[''] after:block after:w-full after:h-1 after:bg-gray-500 after:mb-1 after:shadow-md">
                    7. PRECAUTIONS
                    </span>
                </h2>
                <div>
                <div className="grid grid-cols-3 gap-4">
                {precautionOptions.map((precaution) => (
                 <div key={precaution} className="relative">
                   <label className="inline-flex items-center">
                     <input
                       type="checkbox"
                       value={precaution}
                       checked={formData.precaution.includes(precaution)}
                       onChange={(e) => handlePrecautionCheckboxChange(precaution, e.target.checked)}
                       className="form-checkbox h-4 w-4 text-blue-600 cursor-pointer border-gray-300 rounded mr-2 align-middle"
                     />
                     {precaution === 'Additional Controls (Specify)' ? (
                       <span className="text-sm font-semibold">{precaution}</span>
                     ) : (
                       <span className="text-sm">{precaution}</span>
                     )}
                   </label>
                    
                   {precaution === 'Additional Controls (Specify)' && 
                   formData.precaution.includes(precaution) && (
                     <input
                       type="text"
                       value={otherControlsText}
                       onChange={handleOtherControlsTextChange}
                       placeholder="Type additional controls"
                       className="mt-1 block w-full border border-gray-300 rounded-md text-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                     />  //
                   )}
                 </div>
                ))}
                </div>
                
                </div>
                </div>
                <h2 className="font-semibold mt-7 mb-4 relative">
                    <span className="relative after:content-[''] after:block after:w-full after:h-1 after:bg-gray-500 after:mb-1 after:shadow-md">
                    8. HAZARDOUS ENERGIES
                    </span>
                </h2>
                <div>
                <div className="grid grid-cols-4 gap-4">
                  {hazardousEnergiesOptions.map((energy) => (
                    <div key={energy} className="relative">
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          value={energy}
                          checked={formData.hazardousEnergies.includes(energy)}
                          onChange={(e) => handleHazardousEnergiesCheckboxChange(energy, e.target.checked)}
                          className="form-checkbox h-4 w-4 text-blue-600 cursor-pointer border-gray-300 rounded mr-2 align-middle"
                        />
                        <span className="text-sm">{energy}</span>
                      </label>

                      {(energy === 'Dangerous goods/chemicals (Specify)' || energy === 'Other(Specify)') && 
                       formData.hazardousEnergies.includes(energy) && (
                        <input
                          type="text"
                          value={energy === 'Dangerous goods/chemicals (Specify)' ? otherDangerousGoodsText : otherHazardousEnergyText}
                          onChange={energy === 'Dangerous goods/chemicals (Specify)' ? handleOtherDangerousGoodsTextChange : handleOtherHazardousEnergyTextChange}
                          placeholder={
                            energy === 'Dangerous goods/chemicals (Specify)' 
                              ? 'Type dangerous goods' 
                              : 'Type hazardous energies'
                          }
                          className="mt-1 block w-full border border-gray-300 rounded-md text-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />    
                      )}
                    </div>
                  ))}
                </div>
                <div className="mb-4 mt-4">
                  <p className="font-medium border-b-2 border-black w-max">Preparation for Break : </p>
                  <div className="flex flex-wrap gap-4 mt-2">
                    {breakPreparationOptions.map((option) => (
                      <div key={option} className="flex items-center">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            value={option}
                            checked={formData.breakPreparation.includes(option)}
                            onChange={(e) => handleBreakPreparationCheckboxChange(option, e.target.checked)}
                            className="form-checkbox h-4 w-4 text-blue-600 cursor-pointer border-gray-300 rounded mr-2"
                          />
                          <span className="text-sm">{option}</span>
                        </label>
                        {option === 'Other (Specify)' && formData.breakPreparation.includes(option) && (
                          <input
                            type="text"
                            value={otherBreakPreparationText}
                            onChange={handleOtherBreakPreparationTextChange}
                            placeholder="Specify break preparation"
                            className="mt-1 block w-full border border-gray-300 rounded-md text-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                {formData.hazardousEnergies.includes('Electricity') && (
                  <div className="mb-4 mt-4">
                  <p className="text-red-600 font-medium">Identify Voltage handle*</p>
                  <div>
                    <div className="flex items-center">
                      <p className="border-b-2 border-black w-max mr-4 font-medium">A.C Voltage De-Energized : </p>
                      <div className="flex space-x-4">
                        {AcVoltageOptions.map((option) => (
                          <label key={option} className="flex items-center">
                            <input
                              type="checkbox"
                              value={option}
                              checked={formData.acVoltageDe.includes(option)}
                              onChange={(e) => handleAcVoltageDeCheckboxChange(option, e.target.checked)}
                              className="form-checkbox h-4 w-4 text-blue-600 cursor-pointer border-gray-300 rounded mr-2"
                            />
                            <span className="text-sm">{option}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="flex items-center">
                        <p className="border-b-2 border-black w-max mr-4 font-medium">D.C Voltage De-Energized : </p>
                        <div className="flex space-x-4">
                          {DcVoltageOptions.map((option) => (
                            <label key={option} className="flex items-center">
                              <input
                                type="checkbox"
                                value={option}
                                checked={formData.dcVoltageDe.includes(option)}
                                onChange={(e) => handleDcVoltageDeCheckboxChange(option, e.target.checked)}
                                className="form-checkbox h-4 w-4 text-blue-600 cursor-pointer border-gray-300 rounded mr-2"
                              />
                              <span className="text-sm">{option}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                )}
                {/* Disclaimer Section */}
                <div>
                  <div className="mt-8 p-4 border border-red-500 bg-red-100">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        id="terms-checkbox"
                        className="form-checkbox h-4 w-4 text-green-600 cursor-pointer border-gray-300 rounded mr-2"
                      />
                      <span className="text-sm font-medium">
                        I agree to the safety precautions stated above
                      </span>
                    </label>
                    <p className="text-sm mt-2 text-red-600">
                      By checking this box, I confirm that I have thoroughly reviewed the hazard identifications and job requirements,
                      possess the necessary personal protective equipment (PPE), and have taken all appropriate precautionary measures. 
                      I also acknowledge that the organization is not liable for any consequences resulting from my negligence.
                    </p>
                  </div>
               </div>
              </div>
              </div>
            )}

          {/* Form Actions */}
          <div className="flex justify-center gap-4 mt-6">
            {currentSection > 1 && (
              <Button
                type="button"
                variant="secondary"
                onClick={(e) => handlePrevious(e)}
                className="bg-gray-600 text-white hover:bg-gray-700"
              >
                Previous
              </Button>
            )}
            {currentSection < 4 && (
              <Button
                variant="secondary"
                onClick={(e) => handleNext(e,validateForm, setTouched)}
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
            </Form>
            )}
          </Formik>
        </CardContent>
      </Card>
    </div>
  );
};

export default SafetyForm;