// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';


import React, { useEffect, useState } from 'react';
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
import { Formik, Form, Field,getIn } from 'formik';
import SafetyFormValidation, { calculatePermitDuration } from './SafetyFormValidation';
import { api } from './services/api'

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
  const [sectionItemsMap, setSectionItemsMap] = useState({});

  // Add this useEffect to fetch section items when component mounts
  useEffect(() => {
    const fetchSectionItems = async () => {
      try {
        const { sections } = await api.getFormSections();
        console.log('Fetched sections:', sections);
  
        const mapping = {};
        sections.forEach(section => {
          section.items.forEach(item => {
            const key = `${section.sectionName}-${item.label}`;
            mapping[key] = item.sectionItemId;
            console.log(`Mapping created: ${key} -> ${item.sectionItemId}`); // Debug log
          });
        });
        setSectionItemsMap(mapping);
        console.log('Full mapping:', mapping);
      } catch (error) {
        console.error('Error fetching form sections:', error);
      }
    };
  
    fetchSectionItems();
  }, []);

// Add this helper function
const getSectionItemId = (sectionName, itemLabel) => {
  const key = `${sectionName}-${itemLabel}`;
  return sectionItemsMap[key];
};


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
  

  const handleInputChange = (field, value, setFieldValue) => {
  setFieldValue(field, value, true);
  
  // Special handling for contract type changes
  if (field === 'contractType') {
    if (value === 'Internal / MPS') {
      setFieldValue('contractCompanyName', '', true);
      setFormData(prev => ({
        ...prev,
        contractCompanyName: '',
        staffID: ''
      }));
    } else if (value === 'External / Contract Company') {
      setFieldValue('staffID', '', true);
      setFormData(prev => ({
        ...prev,
        staffID: ''
      }));
    }
  }
  
  // Number of workers handling
  if (field === 'numberOfWorkers') {
    const numWorkers = parseInt(value, 10) || 0;
    const currentWorkers = formData.workerDetails;
    
    if (numWorkers > currentWorkers.length) {
      const newWorkers = Array.from(
        { length: numWorkers - currentWorkers.length },
        () => ({ name: '' })
      );
      const updatedWorkers = [...currentWorkers, ...newWorkers];
      
      setFormData(prev => ({
        ...prev,
        [field]: value,
        workerDetails: updatedWorkers
      }));
      
      setFieldValue('numberOfWorkers', value, true);
      setFieldValue('workerDetails', updatedWorkers, true);
      
      // Initialize touched state for new workers
      updatedWorkers.forEach((_, index) => {
        setFieldValue(`workerDetails.${index}.name`, '', true);
      });
    } else if (numWorkers < currentWorkers.length) {
      const updatedWorkers = currentWorkers.slice(0, numWorkers);
      
      setFormData(prev => ({
        ...prev,
        [field]: value,
        workerDetails: updatedWorkers
      }));
      
      setFieldValue('numberOfWorkers', value, true);
      setFieldValue('workerDetails', updatedWorkers, true);
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
      setFieldValue('numberOfWorkers', value, true);
    }
  } 
  // Worker name handling - updated for Formik field paths
  else if (field.includes('workerDetails.') && field.endsWith('.name')) {
    const index = parseInt(field.split('.')[1], 10);
    const updatedWorkerDetails = [...formData.workerDetails];
    updatedWorkerDetails[index] = { ...updatedWorkerDetails[index], name: value };
    
    setFormData(prev => ({
      ...prev,
      workerDetails: updatedWorkerDetails
    }));
    setFieldValue('workerDetails', updatedWorkerDetails, true);
    setFieldValue(field, value, true);
  }
  // Array field handling
  else if (['permitRequired', 'hazardIdentification', 'jobRequirement', 
            'ppeRequirement', 'precautionaryMeasure', 'precaution', 
            'hazardousEnergies'].includes(field)) {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setFieldValue(field, value, true);
  }
  // Simple field handling
  else {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setFieldValue(field, value, true);
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
          : currentSection === 2
          ? ['jobDescription', 'permitReceiver', 'contractType', ...(formData.contractType === 'External / Contract Company' ? ['contractCompanyName'] : []), ...(formData.contractType === 'Internal / MPS' ? ['staffID'] : []), 'numberOfWorkers', 'workerDetails', 'riskAssessment', 'permitRequired']
          : currentSection === 3
          ? ['hazardIdentification', 'jobRequirement', 'ppeRequirement', 'otherHazardText', 'otherGasesText', 'otherPPEText']
          : currentSection === 4
          ? ['precautionaryMeasure', 'precaution', 'hazardousEnergies', 'breakPreparation', 'otherControlsText', 'otherDangerousGoodsText', 'otherHazardousEnergyText', 'otherBreakPreparationText', 'acVoltageDe', 'dcVoltageDe']
          : [];
  
      // Validate the entire form
      const errors = await validateForm();
  
      // Filter errors to only those in the current section
      const sectionErrors = Object.keys(errors).reduce((acc, field) => {
        if (fieldsToValidate.includes(field)) {
          acc[field] = errors[field];
        }
        return acc;
      }, {});
  
      // Set all relevant fields as touched
      const touchedFields = fieldsToValidate.reduce((acc, field) => {
        if (field === 'workerDetails' && formData.numberOfWorkers > 0) {
          acc[field] = formData.workerDetails.map(() => ({
            name: true,
          }));
        } else {
          acc[field] = true;
        }
        return acc;
      }, {});
  
      // Set all relevant fields as touched
      setTouched(touchedFields, true);
  
      // If there are any validation errors, prevent proceeding
      if (Object.keys(sectionErrors).length > 0) {
        console.log(`Section ${currentSection} validation errors:`, sectionErrors);
        return false; // Return false to indicate validation failed
      }
  
      // If we're in section 4 and no errors, proceed with submission
      if (currentSection === 4) {
        return true; // Return true to indicate validation passed
      }
  
      // For other sections, proceed to next section
      setCurrentSection(currentSection + 1);
      return true; // Return true to indicate validation passed
    } catch (error) {
      console.error('Validation error:', error);
      return false; // Return false on error
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
  const handleCheckboxChange = (hazard, checked, setFieldValue, setFieldTouched) => {
    let updatedHazards;
    if (checked) {
      updatedHazards = [...formData.hazardIdentification, hazard];
    } else {
      updatedHazards = formData.hazardIdentification.filter(h => h !== hazard);
      
      if (hazard === 'Other (Specify)') {
        setOtherHazardText('');
        setFieldValue('otherHazardText', '');
      }
    }
    
    handleInputChange('hazardIdentification', updatedHazards, setFieldValue);
    setFieldTouched('hazardIdentification', true, false);
  };

  const handleOtherHazardTextChange = (e, setFieldValue, setFieldTouched) => {
    const text = e.target.value;
    setOtherHazardText(text);
    setFieldValue('otherHazardText', text);
    setFieldTouched('otherHazardText', true, false);
  
    const isOtherInHazards = formData.hazardIdentification.includes('Other (Specify)');
    if (text.trim() && !isOtherInHazards) {
      handleInputChange('hazardIdentification', [...formData.hazardIdentification, 'Other (Specify)'], setFieldValue);
    }
  };

  //Job Requirement Checkbox change
  const handleJobRequirementCheckboxChange = (requirement, checked, setFieldValue, setFieldTouched) => {
    let updatedRequirements;
    if (checked) {
      updatedRequirements = [...formData.jobRequirement, requirement];
    } else {
      updatedRequirements = formData.jobRequirement.filter(r => r !== requirement);
      
      // If unchecking 'List other gases detected', clear the text
      if (requirement === 'List other gases detected') {
        setOtherGasesText('');
        setFieldValue('otherGasesText', '');
      }
    }
    
    handleInputChange('jobRequirement', updatedRequirements, setFieldValue);
    setFieldTouched('jobRequirement', true, false);
  };
  
  const handleOtherGasesTextChange = (e, setFieldValue, setFieldTouched) => {
    const text = e.target.value;
    setOtherGasesText(text);
    setFieldValue('otherGasesText', text);
    setFieldTouched('otherGasesText', true, false);
  
    const isOtherGasesInRequirements = formData.jobRequirement.includes('List other gases detected');
    if (text.trim() && !isOtherGasesInRequirements) {
      handleInputChange('jobRequirement', [...formData.jobRequirement, 'List other gases detected'], setFieldValue);
    }
  };

  //PPE Requirements checkbox changes
  const handlePPECheckboxChange = (ppe, checked, setFieldValue, setFieldTouched) => {
    let updatedPPE;
    if (checked) {
      updatedPPE = [...formData.ppeRequirement, ppe];
    } else {
      updatedPPE = formData.ppeRequirement.filter(p => p !== ppe);
      
      // If unchecking 'Other (Specify)', clear the text
      if (ppe === 'Other (Specify)') {
        setOtherPPEText('');
        setFieldValue('otherPPEText', '');
      }
    }
    
    handleInputChange('ppeRequirement', updatedPPE, setFieldValue);
    setFieldTouched('ppeRequirement', true, false);
  };
  
  const handleOtherPPETextChange = (e, setFieldValue, setFieldTouched) => {
    const text = e.target.value;
    setOtherPPEText(text);
    setFieldValue('otherPPEText', text);
    setFieldTouched('otherPPEText', true, false);
  
    const isOtherInPPE = formData.ppeRequirement.includes('Other (Specify)');
    if (text.trim() && !isOtherInPPE) {
      handleInputChange('ppeRequirement', [...formData.ppeRequirement, 'Other (Specify)'], setFieldValue);
    }
  };


  // Precautionary Measures Checkbox Changes
  const handlePrecautionaryMeasureCheckboxChange = (measure, checked, setFieldValue, setFieldTouched) => {
    let updatedMeasures = checked 
      ? [...(formData.precautionaryMeasure || []), measure]
      : formData.precautionaryMeasure.filter(p => p !== measure);
    
    // Update form data
    handleInputChange('precautionaryMeasure', updatedMeasures, setFieldValue);
    setFieldTouched('precautionaryMeasure', true, false); // Changed to false to prevent validation
  };

// PRECAUTION CHECKBOXES
const handlePrecautionCheckboxChange = (precaution, checked, setFieldValue, setFieldTouched) => {
  let updatedPrecautions = checked
    ? [...(formData.precaution || []), precaution]
    : formData.precaution.filter(p => p !== precaution);
  
  handleInputChange('precaution', updatedPrecautions, setFieldValue);
  setFieldTouched('precaution', true, false); // Changed to false to prevent validation

  if (!checked && precaution === 'Additional Controls (Specify)') {
    setOtherControlsText('');
    setFieldValue('otherControlsText', '');
    setFieldTouched('otherControlsText', true, false);
  }
};

const handleOtherControlsTextChange = (e, setFieldValue, setFieldTouched) => {
  const text = e.target.value;
  setOtherControlsText(text);
  setFieldValue('otherControlsText', text);
  setFieldTouched('otherControlsText', true);

  const isAdditionalControlsInPrecautions = formData.precaution.includes('Additional Controls (Specify)');
  if (text.trim() && !isAdditionalControlsInPrecautions) {
    setFieldValue('precaution', [...formData.precaution, 'Additional Controls (Specify)']);
    setFieldTouched('precaution', true);
  }
};

const handleAcVoltageDeCheckboxChange = (option, checked, setFieldValue, setFieldTouched) => {
  let updatedAcVoltageDe = checked ? [option] : [];
  handleInputChange('acVoltageDe', updatedAcVoltageDe, setFieldValue);
  setFieldTouched('acVoltageDe', true, false); // Changed to false to prevent validation
};

const handleDcVoltageDeCheckboxChange = (option, checked, setFieldValue, setFieldTouched) => {
  let updatedDcVoltageDe = checked ? [option] : [];
  handleInputChange('dcVoltageDe', updatedDcVoltageDe, setFieldValue);
  setFieldTouched('dcVoltageDe', true, false); // Changed to false to prevent validation
};

// HAZARDOUS ENERGIES CHECKBOXES
const handleHazardousEnergiesCheckboxChange = (energy, checked, setFieldValue, setFieldTouched) => {
  let updatedEnergies = checked 
    ? [...(formData.hazardousEnergies || []), energy] 
    : formData.hazardousEnergies.filter(e => e !== energy);
  
  handleInputChange('hazardousEnergies', updatedEnergies, setFieldValue);
  setFieldTouched('hazardousEnergies', true, false); // Changed to false to prevent validation

  if (!checked) {
    if (energy === 'Dangerous goods/chemicals (Specify)') {
      setOtherDangerousGoodsText('');
      setFieldValue('otherDangerousGoodsText', '');
      setFieldTouched('otherDangerousGoodsText', true, false);
    }
    if (energy === 'Other(Specify)') {
      setOtherHazardousEnergyText('');
      setFieldValue('otherHazardousEnergyText', '');
      setFieldTouched('otherHazardousEnergyText', true, false);
    }
    if (energy === 'Electricity') {
      handleInputChange('acVoltageDe', [], setFieldValue);
      handleInputChange('dcVoltageDe', [], setFieldValue);
      setFieldTouched('acVoltageDe', true, false);
      setFieldTouched('dcVoltageDe', true, false);
    }
  }
};

const handleOtherDangerousGoodsTextChange = (e, setFieldValue, setFieldTouched) => {
  const text = e.target.value;
  setOtherDangerousGoodsText(text);
  setFieldValue('otherDangerousGoodsText', text);
  setFieldTouched('otherDangerousGoodsText', true);

  const isDangerousGoodsInEnergies = formData.hazardousEnergies.includes('Dangerous goods/chemicals (Specify)');
  if (text.trim() && !isDangerousGoodsInEnergies) {
    setFieldValue('hazardousEnergies', [...formData.hazardousEnergies, 'Dangerous goods/chemicals (Specify)']);
    setFieldTouched('hazardousEnergies', true);
  }
};

const handleOtherHazardousEnergyTextChange = (e, setFieldValue, setFieldTouched) => {
  const text = e.target.value;
  setOtherHazardousEnergyText(text);
  setFieldValue('otherHazardousEnergyText', text);
  setFieldTouched('otherHazardousEnergyText', true);

  const isOtherEnergyInEnergies = formData.hazardousEnergies.includes('Other(Specify)');
  if (text.trim() && !isOtherEnergyInEnergies) {
    setFieldValue('hazardousEnergies', [...formData.hazardousEnergies, 'Other(Specify)']);
    setFieldTouched('hazardousEnergies', true);
  }
};

const handleBreakPreparationCheckboxChange = (breakPrep, checked, setFieldValue, setFieldTouched) => {
  let updatedBreakPreparation = checked
      ? [...(formData.breakPreparation || []), breakPrep]
      : formData.breakPreparation.filter(b => b !== breakPrep);

  handleInputChange('breakPreparation', updatedBreakPreparation, setFieldValue);
  setFieldTouched('breakPreparation', true);

  if (!checked && breakPrep === 'Other (Specify)') {
    setOtherBreakPreparationText('');
    setFieldValue('otherBreakPreparationText', '');
  }
};

const handleOtherBreakPreparationTextChange = (e, setFieldValue, setFieldTouched) => {
  const text = e.target.value;
  setOtherBreakPreparationText(text);
  setFieldValue('otherBreakPreparationText', text);
  setFieldTouched('otherBreakPreparationText', true);

  const isOtherBreakPreparationInList = formData.breakPreparation.includes('Other (Specify)');
  if (text.trim() && !isOtherBreakPreparationInList) {
    setFieldValue('breakPreparation', [...formData.breakPreparation, 'Other (Specify)']);
    setFieldTouched('breakPreparation', true);
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
          onSubmit={async (values, { setTouched }) => {
            setIsSubmitting(true);
            try {
              setIsSubmitting(true);
                console.log('Form Values:', values); // Debug log

                // Format the dates with time
                const startDateTime = values.startDate && values.startTime ? 
                  new Date(`${format(values.startDate, 'yyyy-MM-dd')} ${format(values.startTime, 'HH:mm')}`) : null;
                const endDateTime = values.endDate && values.endTime ? 
                  new Date(`${format(values.endDate, 'yyyy-MM-dd')} ${format(values.endTime, 'HH:mm')}`) : null;

                // Transform worker details safely
                const workersNames = Array.isArray(values.workerDetails) ?
                  values.workerDetails
                    .map(worker => worker?.name?.trim())
                    .filter(Boolean)
                    .join(', ') : '';

                    console.log('Section item mappings:', {
                      'Permits Required': values.permitRequired?.map(item => ({
                          item,
                          id: getSectionItemId('Permits Required', item)
                      })),
                      'Hazard Identification': values.hazardIdentification?.map(item => ({
                          item,
                          id: getSectionItemId('Hazard Identification', item)
                      })),
                      'Job Requirements': values.jobRequirement?.map(item => ({
                          item,
                          id: getSectionItemId('Job Requirements', item)
                      })),
                      'PPE Requirements': values.ppeRequirement?.map(item => ({
                          item,
                          id: getSectionItemId('PPE Requirements', item)
                      })),
                      'Precautionary Measures': values.precautionaryMeasure?.map(item => ({
                          item,
                          id: getSectionItemId('Precautionary Measures', item)
                      })),
                      'Hazardous Energies': values.hazardousEnergies?.map(item => ({
                          item,
                          id: getSectionItemId('Hazardous Energies', item)
                      })),
                      'AC Voltage': values.hazardousEnergies?.includes('Electricity') ? 
                          values.acVoltageDe?.map(item => ({
                              item,
                              id: getSectionItemId('AC Voltage', item)
                          })) : [],
                      'DC Voltage': values.hazardousEnergies?.includes('Electricity') ? 
                          values.dcVoltageDe?.map(item => ({
                              item,
                              id: getSectionItemId('DC Voltage', item)
                          })) : [],
                      'Break Preparation': values.breakPreparation?.map(item => ({
                          item,
                          id: getSectionItemId('Break Preparation', item)
                      }))
                  });

                // Prepare the data for submission with null checks
                const submitData = {
                  startDate: startDateTime?.toISOString(),
                  endDate: endDateTime?.toISOString(),
                  permitDuration: parseInt(values.permitDuration) || 0,
                  department: values.department || '',
                  jobLocation: values.jobLocation || '',
                  subLocation: values.subLocation || '',
                  plantDetail: values.plantDetail || '',
                  jobDescription: values.jobDescription || '',
                  permitReceiver: values.permitReceiver || '',
                  contractType: values.contractType || '',
                  contractCompanyName: values.contractType === 'External / Contract Company' ? 
                    values.contractCompanyName : null,
                  staffID: values.contractType === 'Internal / MPS' ? 
                    values.staffID : null,
                  numberOfWorkers: parseInt(values.numberOfWorkers) || 0,
                  workersNames,
                  checkboxSelections: [
                    // Transform permit types with null checks
                    ...(Array.isArray(values.permitRequired) ? values.permitRequired : []).map(item => ({
                      sectionItemId: getSectionItemId('Permits Required', item),
                      isChecked: 'Yes'
                    })),
                    
                    // Transform hazard identifications
                    ...(Array.isArray(values.hazardIdentification) ? values.hazardIdentification : []).map(item => ({
                      sectionItemId: getSectionItemId('Hazard Identification', item),
                      isChecked: 'Yes',
                      textInput: item === 'Other (Specify)' ? otherHazardText : null
                    })),
                    
                    // Transform job requirements
                    ...(Array.isArray(values.jobRequirement) ? values.jobRequirement : []).map(item => ({
                      sectionItemId: getSectionItemId('Job Requirements', item),
                      isChecked: 'Yes',
                      textInput: item === 'List other gases detected' ? otherGasesText : null
                    })),
                    
                    // Transform PPE requirements
                    ...(Array.isArray(values.ppeRequirement) ? values.ppeRequirement : []).map(item => ({
                      sectionItemId: getSectionItemId('PPE Requirements', item),
                      isChecked: 'Yes',
                      textInput: item === 'Other (Specify)' ? otherPPEText : null
                    })),
                    
                    // Transform precautionary measures
                    ...(Array.isArray(values.precautionaryMeasure) ? values.precautionaryMeasure : []).map(item => ({
                      sectionItemId: getSectionItemId('Precautionary Measures', item),
                      isChecked: 'Yes'
                    })),
                    
                    // Transform hazardous energies
                    ...(Array.isArray(values.hazardousEnergies) ? values.hazardousEnergies : []).map(item => ({
                      sectionItemId: getSectionItemId('Hazardous Energies', item),
                      isChecked: 'Yes',
                      textInput: item === 'Other (Specify)' ? otherHazardousEnergyText : null
                    })),

                    // Include voltage selections if electricity is selected
                    ...(values.hazardousEnergies?.includes('Electricity') ? [
                      ...(Array.isArray(values.acVoltageDe) ? values.acVoltageDe : []).map(voltage => ({
                        sectionItemId: getSectionItemId('AC Voltage', voltage),
                        isChecked: 'Yes'
                      })),
                      ...(Array.isArray(values.dcVoltageDe) ? values.dcVoltageDe : []).map(voltage => ({
                        sectionItemId: getSectionItemId('DC Voltage', voltage),
                        isChecked: 'Yes'
                      }))
                    ] : []),

                    // Transform break preparation
                    ...(Array.isArray(values.breakPreparation) ? values.breakPreparation : []).map(item => ({
                      sectionItemId: getSectionItemId('Break Preparation', item),
                      isChecked: 'Yes',
                      textInput: item === 'Other (Specify)' ? otherBreakPreparationText : null
                    }))
                  ]
                };

                console.log('Submit Data:', submitData); // Debug log

                // Submit the form using the API
                const response = await api.createPermit(submitData);
                
                console.log('API Response:', response); // Debug log

                // Navigate to success page
                navigate('/dashboard/permits/job-permits/success', { 
                  state: { success: true, permitId: response.jobPermitId } 
                });
              } catch (error) {
                console.error('Error details:', error); // Detailed error logging
                // Handle error appropriately
              } finally {
                setIsSubmitting(false);
              }
            }}
          validateOnChange={true}
          validationContext={{ currentSection }}
          validateOnBlur={true}
        >
          {({ errors, touched, setFieldValue,validateForm,setTouched,setFieldTouched}) => (
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
                          Permit Duration
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
                          Location / Plant / Equipment Detail <span className="text-red-600">*</span>
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
                          setFieldValue('staffID', ''); // Reset related fields
                          setFieldValue('contractCompanyName', '');
                        }}
                        className={`w-full ${
                          errors.contractType && touched.contractType 
                            ? 'border-red-500 bg-red-50' 
                            : ''
                        }`}
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
                        value={formData.staffID || ''}
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
                      {errors.permitRequired && touched.permitRequired && (
                      <div className="text-red-600 text-sm mt-1">{errors.permitRequired}</div>
                    )}
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
                </div>

                {/* Worker Details Table */}
                {formData.numberOfWorkers > 0 && (
                <div className="border p-4 rounded-lg">
                  <h4 className="text-sm font-semibold mb-3">Worker Details</h4>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border p-2 text-center">S/N</th>
                        <th className="border p-2 text-center">Worker's Name *</th>
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
                              handleInputChange(`workerDetails.${index}.name`, e.target.value, setFieldValue);
                            }}
                            onBlur={() => {
                              setFieldTouched(`workerDetails.${index}.name`, true);
                            }}
                            placeholder={`Enter worker ${index + 1} name`}
                            className={`w-full ${
                              errors.workerDetails?.[index]?.name && 
                              touched.workerDetails?.[index]?.name
                                ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                                : ''
                            }`}
                          />
                            {errors.workerDetails?.[index]?.name && 
                             touched.workerDetails?.[index]?.name && (
                              <div className="text-red-600 text-xs mt-1">
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
                {errors.hazardIdentification && touched.hazardIdentification && (
                <div className="text-red-500 text-sm mb-2">{errors.hazardIdentification}</div>
                )}
                <div>
                <div className="grid grid-cols-4 gap-4">
                  {hazardOptions.map((hazard) => (
                    <div key={hazard} className="relative">
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          value={hazard}
                          checked={formData.hazardIdentification.includes(hazard)}
                          onChange={(e) => handleCheckboxChange(hazard, e.target.checked, setFieldValue, setFieldTouched)}
                          className="form-checkbox h-4 w-4 text-blue-600 cursor-pointer border-gray-300 rounded mr-2 align-middle"
                        />
                        <span className="text-sm">{hazard}</span>
                      </label>

                      {hazard === 'Other (Specify)' && 
                      formData.hazardIdentification.includes(hazard) && (
                        <input
                          type="text"
                          value={otherHazardText}
                          onChange={(e) => handleOtherHazardTextChange(e, setFieldValue,setFieldTouched)}
                          placeholder="Type other hazard"
                          className={`mt-1 block w-full border rounded-md text-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                            errors.otherHazardText && touched.otherHazardText ? 'border-red-500 bg-red-50' : 'border-gray-300'
                          }`}
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
                {errors.jobRequirement && touched.jobRequirement && (
                <div className="text-red-500 text-sm mb-2">{errors.jobRequirement}</div>
                )}
                <div>
                <div className="grid grid-cols-3 gap-4">
                    {jobRequirementOptions.map((requirement) => (
                      <div key={requirement} className="relative">
                        <label className="inline-flex items-center">
                          <input
                            type="checkbox"
                            value={requirement}
                            checked={formData.jobRequirement.includes(requirement)}
                            onChange={(e) => handleJobRequirementCheckboxChange(requirement, e.target.checked,setFieldValue,setFieldTouched)}
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
                            onChange={(e) => handleOtherGasesTextChange(e, setFieldValue,setFieldTouched)}
                            placeholder="Type other gases"
                            className={`mt-1 block w-full border rounded-md text-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                              errors.otherGasesText && touched.otherGasesText ? 'border-red-500 bg-red-50' : 'border-gray-300'
                            }`}
                          />
                        )}
                      </div>
                    ))}
                </div>
                </div>
                </div>
                <h2 className="font-semibold mt-7 mb-4 relative">
                    <span className="relative after:content-[''] after:block after:w-full after:h-1 after:bg-gray-500 after:mb-1 after:shadow-md">
                    5. PPE REQUIREMENTS
                    </span>
                </h2>
                {errors.ppeRequirement && touched.ppeRequirement && (
                <div className="text-red-500 text-sm mb-2">{errors.ppeRequirement}</div>
                )}
                <div>
                <div className="grid grid-cols-4 gap-4">
                  {ppeRequirementOptions.map((ppe) => (
                  <div key={ppe} className="relative">
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        value={ppe}
                        checked={formData.ppeRequirement.includes(ppe)}
                        onChange={(e) => handlePPECheckboxChange(ppe, e.target.checked,setFieldValue,setFieldTouched)}
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

                        onChange={(e) => handleOtherPPETextChange(e,setFieldValue,setFieldTouched)}
                        placeholder="Type other PPE"
                        className={`mt-1 block w-full border rounded-md text-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                          errors.otherPPEText && touched.otherPPEText ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
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
                {errors.precautionaryMeasure && touched.precautionaryMeasure && (
                <div className="text-red-500 text-sm mb-2">{errors.precautionaryMeasure}</div>
                 )}
                <div className="grid grid-cols-2 gap-4">
                    {precautionaryMeasureOptions.map((measure) => (
                    <div key={measure} className="relative">
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          value={measure}
                          checked={formData.precautionaryMeasure.includes(measure)}
                          onChange={(e) => handlePrecautionaryMeasureCheckboxChange(measure, e.target.checked,setFieldValue,setFieldTouched)}
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
                {errors.precaution && touched.precaution && (
                <div className="text-red-500 text-sm mb-2">{errors.precaution}</div>
                )}
                <div>
                <div className="grid grid-cols-3 gap-4">
                {precautionOptions.map((precaution) => (
                 <div key={precaution} className="relative">
                   <label className="inline-flex items-center">
                     <input
                       type="checkbox"
                       value={precaution}
                       checked={formData.precaution.includes(precaution)}
                       onChange={(e) => handlePrecautionCheckboxChange(precaution, e.target.checked,setFieldValue,setFieldTouched)}
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
                       onChange={(e) => handleOtherControlsTextChange(e, setFieldValue, setFieldTouched)}
                       placeholder="Type additional controls"
                       className={`mt-1 block w-full border rounded-md text-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                        errors.otherControlsText && touched.otherControlsText ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
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
                {errors.hazardousEnergies && touched.hazardousEnergies&& (
                <div className="text-red-500 text-sm mb-2">{errors.hazardousEnergies}</div>
                )}
                <div>
                <div className="grid grid-cols-4 gap-4">
                  {hazardousEnergiesOptions.map((energy) => (
                    <div key={energy} className="relative">
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          value={energy}
                          checked={formData.hazardousEnergies.includes(energy)}
                          onChange={(e) => handleHazardousEnergiesCheckboxChange(energy, e.target.checked, setFieldValue, setFieldTouched)}
                          className="form-checkbox h-4 w-4 text-blue-600 cursor-pointer border-gray-300 rounded mr-2 align-middle"
                        />
                        <span className="text-sm">{energy}</span>
                      </label>

                      {(energy === 'Dangerous goods/chemicals (Specify)' || energy === 'Other(Specify)') && 
                       formData.hazardousEnergies.includes(energy) && (
                        <input
                          type="text"
                          value={energy === 'Dangerous goods/chemicals (Specify)' ? otherDangerousGoodsText : otherHazardousEnergyText}
                          onChange={(e) => energy === 'Dangerous goods/chemicals (Specify)'
                             ? handleOtherDangerousGoodsTextChange(e, setFieldValue, setFieldTouched)
                             : handleOtherHazardousEnergyTextChange(e, setFieldValue, setFieldTouched)
                            }
                          placeholder={
                            energy === 'Dangerous goods/chemicals (Specify)' 
                              ? 'Type dangerous goods' 
                              : 'Type hazardous energies'
                          }
                          className={`mt-1 block w-full border rounded-md text-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                            (energy === 'Dangerous goods/chemicals (Specify)' && errors.otherDangerousGoodsText && touched.otherDangerousGoodsText) || 
                            (energy === 'Other(Specify)' && errors.otherHazardousEnergyText && touched.otherHazardousEnergyText)
                              ? 'border-red-500 bg-red-50' 
                              : 'border-gray-300'
                          }`}
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
                            onChange={(e) => handleBreakPreparationCheckboxChange(option, e.target.checked,setFieldValue,setFieldTouched)}
                            className="form-checkbox h-4 w-4 text-blue-600 cursor-pointer border-gray-300 rounded mr-2"
                          />
                          <span className="text-sm">{option}</span>
                        </label>
                        {option === 'Other (Specify)' && formData.breakPreparation.includes(option) && (
                          <input
                            type="text"
                            value={otherBreakPreparationText}
                            onChange={(e) => handleOtherBreakPreparationTextChange(e, setFieldValue, setFieldTouched)}
                            placeholder="Specify break preparation"
                            className={`mt-1 block w-full border rounded-md text-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                              errors.otherBreakPreparationText && touched.otherBreakPreparationText ? 'border-red-500 bg-red-50' : 'border-gray-300'
                            }`}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                {formData.hazardousEnergies.includes('Electricity') && (
                  <div className="mb-4 mt-4">
                  <p className="text-red-600 font-medium">Identify Voltage handle*</p>
                  {((errors.acVoltageDe || errors.dcVoltageDe) && (touched.acVoltageDe || touched.dcVoltageDe)) && (
                    <div className="text-red-500 text-sm mb-2">
                      {errors.acVoltageDe || errors.dcVoltageDe}
                    </div>
                  )}
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
                              onChange={(e) => handleAcVoltageDeCheckboxChange(option, e.target.checked,setFieldValue,setFieldTouched)}
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
                                onChange={(e) => handleDcVoltageDeCheckboxChange(option, e.target.checked,setFieldValue,setFieldTouched)}
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
                        checked={formData.disclaimerAccepted} // Ensure this is bound to the form state
                        onChange={e => setFieldValue('disclaimerAccepted', e.target.checked)} // Update state on change
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
                    {errors.disclaimerAccepted && touched.disclaimerAccepted && (
                      <div className="mt-2 flex items-center text-red-700">
                        <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-semibold">{errors.disclaimerAccepted}</span>
                      </div>
                    )}
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
              type="submit"
              variant="success"
              className="bg-green-600 text-white hover:bg-green-700 flex items-center gap-2"
              disabled={isSubmitting}
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

//export default SafetyForm;









//Sidebar.jsx
import React, { useState } from 'react';
import { useNavigate,Routes,Route,useLocation,Outlet } from 'react-router-dom';
import ViewPermits from './ViewPermits';
import Home from './Home';

const SidebarItem = ({ icon, label, isOpen, onClick, children, isActive, path, isCreatePermitActive }) => {
    const activeClass = isActive || isCreatePermitActive ? 'border-r-4 border-blue-500 bg-blue-50' : '';
    const activeTextClass = isActive || isCreatePermitActive ? 'text-blue-500' : 'text-gray-700';

  return (
    <div className="mb-1">
      <div 
        onClick={onClick}
        className={`flex items-center p-3 rounded-lg cursor-pointer hover:bg-blue-50 ${activeClass}`}
      >
        <div className={`p-2 ${activeTextClass}`}>{icon}</div>
        <span className={`ml-2 ${activeTextClass}`}>{label}</span>
        {children && (
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`ml-auto h-5 w-5 transform transition-transform ${isOpen ? 'rotate-180' : ''} ${activeTextClass}`} 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        )}
      </div>
      {isOpen && children && (
        <div className="ml-12 mt-1 space-y-1">
        {React.Children.map(children, child => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, {
              className: `py-2 px-3 text-sm rounded-md hover:bg-blue-50 cursor-pointer ${
                path === child.props.onClick?.toString().match(/\'(.+)\'/)?.[1] 
                  ? 'text-blue-500 bg-blue-50' 
                  : 'text-gray-700'
              }`
            });
          }
          return child;
        })}
      </div>
      )}
    </div>
  );
};

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarMode, setSidebarMode] = useState('full'); // 'full', 'icons'
  const [expandedMenu, setExpandedMenu] = useState(null);

  const toggleSidebar = () => {
      // Toggle between 'full' and 'icons' modes
      setSidebarMode((prev) => (prev === 'full' ? 'icons' : 'full'));
  };

  const toggleMenu = (menuName) => {
      setExpandedMenu(expandedMenu === menuName ? null : menuName);
  };

  const getSidebarClasses = () => {
      return sidebarMode === 'full' ? 'w-64' : 'w-24';
  };

  const renderSidebarContent = () => {
      return (
          <>
              <div className="p-4 border-b">
                  <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-blue-100">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                              <path
                                  fillRule="evenodd"
                                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z"
                                  clipRule="evenodd"
                              />
                          </svg>
                      </div>
                      {sidebarMode === 'full' && (
                          <div>
                              <div className="font-medium">Administrator</div>
                              <div className="text-sm text-gray-500">Admin</div>
                          </div>
                      )}
                  </div>
              </div>

              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                  <SidebarItem
                      icon={
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                          </svg>
                      }
                      label={sidebarMode === 'full' ? 'Home' : ''}
                      onClick={() => navigate('/dashboard')}
                      isActive={location.pathname === '/dashboard'}
                      path={location.pathname}
                  />

                  <SidebarItem
                      icon={
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path
                                  fillRule="evenodd"
                                  d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                                  clipRule="evenodd"
                              />
                          </svg>
                      }
                      label={sidebarMode === 'full' ? 'Permits Request' : ''}
                      isOpen={sidebarMode === 'full' && expandedMenu === 'permits'}
                      onClick={() => toggleMenu('permits')}
                      isActive={['/dashboard/permits/job-permits', '/dashboard/permits/permit-to-work'].includes(location.pathname)}
                      isCreatePermitActive={location.pathname === '/dashboard/permits/job-permits/create'}
                      path={location.pathname}
                  >
                      {sidebarMode === 'full' && (
                          <>
                              <div
                                  className="py-2 px-3 text-sm rounded-md hover:bg-gray-100 cursor-pointer"
                                  onClick={() => navigate('/dashboard/permits/job-permits')}
                              >
                                  Job Safety Permits
                              </div>
                              <div
                                  className="py-2 px-3 text-sm rounded-md hover:bg-gray-100 cursor-pointer"
                                  onClick={() => navigate('/dashboard/permits/permit-to-work')}
                              >
                                  Permit To Work
                              </div>
                          </>
                      )}
                  </SidebarItem>
                  <SidebarItem
                      icon={
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                          </svg>
                      }
                      label={sidebarMode === 'full' ? 'My Tasks' : ''}
                      isOpen={sidebarMode === 'full' && expandedMenu === 'myTasks'}
                      onClick={() => toggleMenu('myTasks')}
                      isActive={['/dashboard/my-tasks/view-permits','/dashboard/my-tasks/pending-approvals', '/dashboard/my-tasks/approval-history'].includes(location.pathname)}
                      path={location.pathname}>
                      {sidebarMode === 'full' && (
                          <>
                              <div
                                  className="py-2 px-3 text-sm rounded-md hover:bg-gray-100 cursor-pointer"
                                  onClick={() => navigate('/dashboard/my-tasks/pending-approvals')}
                              >
                                  Pending Approvals
                              </div>
                              <div
                                  className="py-2 px-3 text-sm rounded-md hover:bg-gray-100 cursor-pointer"
                                  onClick={() => navigate('/dashboard/my-tasks/view-permits')}
                              >
                                  View All Permits
                              </div>
                              <div
                                  className="py-2 px-3 text-sm rounded-md hover:bg-gray-100 cursor-pointer"
                                  onClick={() => navigate('/dashboard/my-tasks/approval-history')}
                              >
                                  Approval History
                              </div>
                          </>
                      )}
                  </SidebarItem>
                    
                  <SidebarItem
                      icon={
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                      }
                      label={sidebarMode === 'full' ? 'Jobs Monitoring' : ''}
                      onClick={() => navigate('/dashboard/jobs-monitoring')}
                      isActive={location.pathname === '/dashboard/jobs-monitoring'}
                      path={location.pathname}
                  />
              </nav>

              {sidebarMode === 'full' && (
                  <div className="p-4 border-t text-xs text-gray-500">
                      ©2024 Copyright version 0.1
                  </div>
              )}
          </>
      );
  };

  return (
      <div className="min-h-screen flex flex-col">
          <header className="bg-white shadow-sm border-b fixed w-full z-20 h-16">
          <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-4">
            <button 
              onClick={toggleSidebar}
              className="p-2 rounded-md hover:bg-gray-100 lg:hidden"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="text-lg font-semibold">QHSSE Management System</div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
              </svg>
            </button>
            <button className="p-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
          </header>

          <div className="flex flex-1 pt-16">
              <aside className={`${getSidebarClasses()} transition-all duration-300 ease-in-out bg-white border-r fixed h-screen z-10`}>
                  <div className="h-full flex flex-col relative">
                      {renderSidebarContent()}

                      {/* Toggle button */}
                      <button
                        onClick={toggleSidebar}
                        className="absolute top-5 -right-4 bg-blue-500 p-1.5 rounded-full shadow hover:bg-blue-600 focus:outline-none z-10"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d={sidebarMode === 'full' ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'}
                          />
                        </svg>
                      </button>

                  </div>
              </aside>

              <main
                className="flex-1 p-6 overflow-y-auto transition-all duration-300"
                style={{
                  marginLeft: sidebarMode === 'full' ? '16rem' : '6rem', // Adjust margin based on sidebarMode
                }}
              >
                <Outlet />
              </main>
          </div>
      </div>
  );
};

//export default Sidebar;





// JobSafetyPermit
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent } from './components/ui/card';
import { Button } from './components/ui/button';
import { Input, Select } from './components/ui/form';
import { Table, TableHead, TableBody, TableRow, TableCell } from './components/ui/table';
import { RefreshCw, PlusCircle, XCircle, ChevronDown } from 'lucide-react';
import SafetyForm from './SafetyForm';
import PermitToWorkForm from './PTWForm';

const JobSafetyPermit = () => {
  const navigate = useNavigate();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isPermitFormOpen, setIsPermitFormOpen] = useState(false);
  const [searchParams, setSearchParams] = useState({
    permitId: '', 
    contractor: '',
    company: '',
    status: '',
    startDate: '11/18/2023',
    endDate: '12/18/2024'
  });
  const handleCreatePermit = () => {
    navigate('/dashboard/permits/job-permits/create');
  };

  const handleViewPTW = () => {
    setIsPermitFormOpen(true);
  };

  const permits = [
    { id: 'C95-1', status: 'Rejected', company: 'MPS Ghana Ltd', jobDescription: 'Internal job', receiverName: 'Bernard Ofori', submissionDate: '2/20/2024'},
    { id: 'C96-1', status: 'Approved', company: 'MTN Ghana', jobDescription: 'Fix Network', receiverName: 'Yaw Sarpong', submissionDate: '8/28/2024'},
    { id: 'C97-1', status: 'Pending', company: 'Epsin Company', jobDescription: 'Check RTG and STS', receiverName: 'Dennis Appiah', submissionDate: '10/30/2024'}
  ];
  
  const Dropdown = ({ 
    children, 
    options, 
    onSelect, 
    className = '' 
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (selectedOption) => {
    onSelect(selectedOption);
    setIsOpen(false);
  };
  
  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'Rejected': return 'text-red-500';
      case 'Approved': return 'text-green-500';
      case 'Pending': return 'text-orange-500';
      default: return 'text-gray-500';
    }
  };

  const handleDropdownAction = (action, permitId) => {
    switch (action) {
      case 'View':
        console.log(`Viewing permit: ${permitId}`);
        break;
      case 'Edit':
        console.log(`Editing permit: ${permitId}`);
        navigate(`/dashboard/permits/job-permits/edit/${permitId}`);
        break;
      case 'Print':
        console.log(`Printing permit: ${permitId}`);
        // Add your print logic here
        break;
      default:
        console.log(`Unknown action: ${action}`);
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
                <Input 
                  placeholder="Search Permit ID number" 
                  value={searchParams.permitId} 
                  onChange={(e) => setSearchParams({ ...searchParams, permitId: e.target.value })} 
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
                  <Select 
                    placeholder="Sort Permit status" 
                    value={searchParams.status} 
                    onChange={(e) => setSearchParams({ ...searchParams, status: e.target.value })} 
                    options={['Approved', 'Pending', 'Rejected']} 
                    className="w-full"
                  />
                </div>
                <div className="col-span-3">
                  <Input 
                    placeholder="Search company" 
                    value={searchParams.company} 
                    onChange={(e) => setSearchParams({ ...searchParams, company: e.target.value })}
                    className="w-full"
                  />
                </div>
                <div className="col-span-6 flex items-center gap-2 pl-20">
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
          <h1 className="text-2xl font-semibold">Job Safety Permits</h1>
        </CardHeader>
        <CardContent className="p-4">
          {/* Action Buttons */}
          <div className="flex gap-2 mb-4">
            <Button 
              variant="secondary" 
              className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
              onClick={() => console.log('refresh')}
            >
              <RefreshCw className="w-4 h-4" />
              REFRESH
            </Button>
            <Button
              variant='secondary' 
              className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
              onClick={handleCreatePermit}
            >
              <PlusCircle className="w-4 h-4" />
              CREATE PERMIT
            </Button>
            <Button 
              variant="destructive"
              className="flex items-center gap-2 text-red-600 hover:bg-red-50 border-none"
              onClick={() => console.log('revoke')}
            >
              <XCircle className="w-4 h-4" />
              REVOKE PERMIT
            </Button>
            <Button onClick={handleViewPTW}>
              View PTW
            </Button>

          </div>

          {/* Table */}
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                <Button variant="ghost" className="text-sm font-medium">
                    Command 
                  </Button>
                </TableCell>
                <TableCell className="text-base font-medium">Permit ID</TableCell>
                <TableCell className="text-base font-medium">Company</TableCell>
                <TableCell className="text-base font-medium">Job Description</TableCell>
                <TableCell className="text-base font-medium">Permit Receiver</TableCell>
                <TableCell className="text-base font-medium">Submission Date</TableCell>
                
              </TableRow>
            </TableHead>
              <TableBody>
                {permits.map((permit) => (
                  <TableRow key={permit.id}>
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
                        <span className={getStatusColor(permit.status)}>{permit.status}</span>
                      </div>
                    </TableCell>
                    <TableCell>{permit.company}</TableCell>
                    <TableCell>{permit.jobDescription}</TableCell>
                    <TableCell>{permit.receiverName}</TableCell>
                    <TableCell>{permit.submissionDate}</TableCell>
                  </TableRow>
                  ))}
                </TableBody>
          </Table>

          <div className="flex justify-end mt-4 text-sm text-gray-500">
            Rows per page: 15 | 1-3 of 3
          </div>
        </CardContent>
      </Card>
      {isPermitFormOpen && (
        <PermitToWorkForm onClose={() => setIsPermitFormOpen(false)} />
      )}
    </div>
  );
};

export default JobSafetyPermit;
