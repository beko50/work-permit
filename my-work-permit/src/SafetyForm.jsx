import React, { useEffect, useState,useRef } from 'react';
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
  const cardRef = useRef(null);
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
    locationDetail: '',
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
    disclaimerAccepted: false,
     // Add text field initializations
    otherHazardText: '',
    otherGasesText: '',
    otherPPEText: '',
    otherControlsText: '',
    otherDangerousGoodsText: '',
    otherHazardousEnergyText: '',
    otherBreakPreparationText: ''
  });

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const [currentUser, SetCurrentUser] = useState()

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await api.getDepartments();
        setDepartments(response.map(dept => dept.DepartmentName));
        setLoading(false);
      } catch (error) {
        console.error('Error fetching departments:', error);
        setLoading(false);
      }
    };
    fetchDepartments();
  }, []);

  const getSectionItemId = (sectionName, itemLabel) => {
    // Find the corresponding state key for the section
    const stateKey = sectionNameToStateKey[sectionName];
    if (!stateKey || !checkboxOptions[stateKey]) {
      console.warn(`No mapping found for section: ${sectionName}`);
      return null;
    }
  
    // Find the matching option and return its ID
    const matchingOption = checkboxOptions[stateKey].find(
      option => option.label === itemLabel
    );
  
    if (!matchingOption) {
      console.warn(`No matching option found for label: ${itemLabel} in section: ${sectionName}`);
      return null;
    }
  
    return matchingOption.id;
  };
  
  // Add state for storing checkbox options
  const [checkboxOptions, setCheckboxOptions] = useState({
    permitRequired: [],
    hazardIdentification: [],
    jobRequirement: [],
    ppeRequirement: [],
    precautionaryMeasure: [],
    precaution: [],
    hazardousEnergies: [],
    acVoltageDe: [],
    dcVoltageDe: [],
    breakPreparation: []
  });

  // Map section names to their corresponding state keys
  const sectionNameToStateKey = {
    'Permit Required': 'permitRequired',
    'Hazard Identification': 'hazardIdentification',
    'Job Requirements': 'jobRequirement',
    'PPE Requirements': 'ppeRequirement',
    'Precautionary Measures': 'precautionaryMeasure',
    'Precautions': 'precaution',
    'Hazardous Energies': 'hazardousEnergies',
    'AC Voltage': 'acVoltageDe',
    'DC Voltage': 'dcVoltageDe',
    'Break Preparation': 'breakPreparation'
  };

  // Fetch checkbox options from the database
  useEffect(() => {
    const fetchCheckboxOptions = async () => {
      try {
        const { sections } = await api.getFormSections();
        
       // Transform API response into checkbox options
      const options = {};
        sections.forEach(section => {
          const stateKey = sectionNameToStateKey[section.sectionName];
          if (stateKey) {
            options[stateKey] = section.items
              .sort((a, b) => a.displaySequence - b.displaySequence) // Sort by display sequence
              .map(item => ({
                id: item.sectionItemId,
                label: item.label,
                allowTextInput: item.allowTextInput === 'Yes'
              }));
          }
        });

        setCheckboxOptions(options);
      } catch (error) {
        console.error('Error fetching checkbox options:', error);
      }
    };

    fetchCheckboxOptions();
  }, []);

  useEffect(() => {
    if (!formData) return;
    
    const updateFormData = (prev) => ({
      ...prev,
      otherHazardText: formData.hazardIdentification?.includes('Other (Specify)') ? otherHazardText : '',
      otherGasesText: formData.jobRequirement?.includes('List other gases detected') ? otherGasesText : '',
      otherPPEText: formData.ppeRequirement?.includes('Other (Specify)') ? otherPPEText : ''
    });

    setFormData(updateFormData);
  }, [otherHazardText, otherGasesText, otherPPEText, formData.hazardIdentification, formData.jobRequirement, formData.ppeRequirement]);


   // Helper function to safely map section items
   const mapSectionItems = (items, sectionName, getTextInput = null) => {
    if (!Array.isArray(items) || items.length === 0) {
      console.log(`No items for section ${sectionName}`);
      return [];
    }
    
    return items.map(item => {
      const sectionItemId = getSectionItemId(sectionName, item);
      if (!sectionItemId) {
        console.warn(`No section item ID found for ${item} in ${sectionName}`);
        return null;
      }
  
      const result = {
        sectionItemId: sectionItemId,
        selected: true  // This will be converted to 1 in the database
      };
  
      if (getTextInput) {
        const textInput = getTextInput(item);
        if (textInput) {
          result.textInput = textInput;
        }
      }
  
      console.log(`Mapped item for ${sectionName}:`, result);
      return result;
    }).filter(Boolean);
  };

  const jobLocationOptions = ['Gates','Authorities Building','MPS Admin Building','Workshop Building','Scanners Area','OCR Area','Inspection Platform','Yard','Quayside','Powerhouse','Fuel Station']
  const contractTypeOptions = ['Internal / MPS','External / Contract Company'];

  const handleInputChange = (field, value, setFieldValue) => {
    if (field === 'contractType') {
      // Reset related fields when contract type changes
      setFormData(prev => ({
        ...prev,
        [field]: value,
        contractCompanyName: '',
        staffID: ''
      }));
      setFieldValue(field, value);
      setFieldValue('contractCompanyName', '');
      setFieldValue('staffID', '');
    } else if (field === 'numberOfWorkers') {
      // Update worker details array based on number of workers
      const numWorkers = parseInt(value) || 0;
      const workerDetails = Array(numWorkers).fill({ name: '' });
      
      setFormData(prev => ({
        ...prev,
        [field]: value,
        workerDetails
      }));
      setFieldValue(field, value);
      setFieldValue('workerDetails', workerDetails);
    } else if (field.includes('workerDetails.') && field.endsWith('.name')) {
      // Handle worker name updates
      const index = parseInt(field.split('.')[1], 10);
      const updatedWorkerDetails = [...formData.workerDetails];
      updatedWorkerDetails[index] = { ...updatedWorkerDetails[index], name: value };
      
      setFormData(prev => ({
        ...prev,
        workerDetails: updatedWorkerDetails
      }));
      setFieldValue('workerDetails', updatedWorkerDetails);
      setFieldValue(field, value);
    } else {
      // Handle all other fields
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
      setFieldValue(field, value);
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


  const handleInitiateClose = () => {
    setIsDialogOpen(true);
  };

  const handlePrevious = (e) => {
    e.preventDefault(); // Prevent form submission
    if (currentSection > 1) {
      setCurrentSection(currentSection - 1);

    // Scroll to top after a small delay
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 5);
  }
  };

  const handleNext = async (e, validateForm, setTouched) => {
    e.preventDefault();
  
    try {

      const currentValues = formData;
      // Determine fields to validate for the current section
      const fieldsToValidate =
        currentSection === 1
          ? ['startDate', 'startTime', 'endDate', 'endTime', 'permitDuration', 'department', 'jobLocation', 'subLocation', 'locationDetail']
          : currentSection === 2
          ? ['jobDescription', 'permitReceiver', 'contractType', ...(formData.contractType === 'External / Contract Company' ? ['contractCompanyName'] : []), ...(formData.contractType === 'Internal / MPS' ? ['staffID'] : []), 'numberOfWorkers', 'workerDetails', 'riskAssessment', 'permitRequired']
          : currentSection === 3
          ? [
            'hazardIdentification',
            'jobRequirement',
            'ppeRequirement',
            ...(currentValues.hazardIdentification?.includes('Other (Specify)') ? ['otherHazardText'] : []),
            ...(currentValues.jobRequirement?.includes('List other gases detected') ? ['otherGasesText'] : []),
            ...(currentValues.ppeRequirement?.includes('Other (Specify)') ? ['otherPPEText'] : [])
          ]
          : currentSection === 4
          ? ['precautionaryMeasure', 'precaution', 'hazardousEnergies', 'breakPreparation', 'otherControlsText', 'otherDangerousGoodsText', 'otherHazardousEnergyText', 'otherBreakPreparationText', 'acVoltageDe', 'dcVoltageDe']
          : [];
  
          // Debug log 2: Log fields that will be validated
          console.log('Fields to Validate:', fieldsToValidate);
      
          // Validate the form
          const errors = await validateForm();
      
          // Debug log 3: Log all validation errors
          console.log('All Validation Errors:', errors);
      
          // Set touched state for all text inputs when their corresponding checkboxes are selected
    const touchedFields = {
      ...fieldsToValidate.reduce((acc, field) => {
        acc[field] = true;
        return acc;
      }, {}),
      // Add touched state for text inputs based on checkbox selections
      ...(currentValues.hazardIdentification?.includes('Other (Specify)') ? { otherHazardText: true } : {}),
      ...(currentValues.jobRequirement?.includes('List other gases detected') ? { otherGasesText: true } : {}),
      ...(currentValues.ppeRequirement?.includes('Other (Specify)') ? { otherPPEText: true } : {}),
      ...(currentValues.precaution?.includes('Additional Controls (Specify)') ? { otherControlsText: true } : {}),
      ...(currentValues.hazardousEnergies?.includes('Dangerous goods/chemicals (Specify)') ? { otherDangerousGoodsText: true } : {}),
      ...(currentValues.hazardousEnergies?.includes('Other (Specify)') ? { otherHazardousEnergyText: true } : {}),
      ...(currentValues.breakPreparation?.includes('Other (Specify)') ? { otherBreakPreparationText: true } : {})
    };
    
    setTouched(touchedFields, true);
      
          // Debug log 4: Log touched fields
          console.log('Touched Fields:', touchedFields);
      
          // Filter errors for current section
          const sectionErrors = Object.keys(errors).reduce((acc, field) => {
            if (fieldsToValidate.includes(field)) {
              acc[field] = errors[field];
            }
            return acc;
          }, {});
      
          // Debug log 5: Log section-specific errors
          console.log('Section Errors:', sectionErrors);
          console.log('Has Errors:', Object.keys(sectionErrors).length > 0);
      
          // Check for validation errors with detailed logging
          if (Object.keys(sectionErrors).length > 0) {
            console.error('Validation failed for Section ${currentSection}. Details:', {
              sectionErrors,
              currentValues: {
                hazardIdentification: currentValues.hazardIdentification,
                otherHazardText: currentValues.otherHazardText,
                // Add other relevant fields here
              }
            });
            return false;
          }
      
          setCurrentSection(currentSection + 1);

          // Scroll to top after a small delay
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 5);
          return true;
        } catch (error) {
          console.error('Unexpected error during validation:', error);
          return false;
        }
      };
  
      const processFile = async (file) => {
        // First validate the file before processing
        const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB
        const validExtensions = ['jpg', 'jpeg', 'png', 'doc', 'docx', 'pdf'];
        
        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
          throw new Error(`File ${file.name} is too large. Maximum size is 4MB`);
        }
        
        // Validate file type
        const extension = file.name.split('.').pop().toLowerCase();
        if (!validExtensions.includes(extension)) {
          throw new Error(`File ${file.name} has invalid format. Allowed formats are: jpg, jpeg, png, doc, docx, pdf`);
        }
        
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          
          reader.onload = () => {
            resolve({
              name: file.name,
              type: file.type,
              size: file.size,
              data: reader.result
            });
          };
          
          reader.onerror = () => reject(new Error(`Error reading file ${file.name}`));
          reader.readAsDataURL(file);
        });
      };
  
      const handleFileUpload = async (event, setFieldValue, setFieldError) => {
        const newFiles = Array.from(event.target.files);
        
        try {
          const processedFiles = await Promise.all(newFiles.map(processFile));
          setFileToUpload(prevFiles => [...prevFiles, ...processedFiles]);
          setFieldValue('riskAssessment', processedFiles);
        } catch (error) {
          console.error('Error processing files:', error);
          setFieldError('riskAssessment', error.message);
        }
      };
  
      const handleFileDrop = async (event, setFieldValue, setFieldError) => {
        event.preventDefault();
        event.stopPropagation();
        
        const newFiles = Array.from(event.dataTransfer.files);
        try {
          const processedFiles = await Promise.all(newFiles.map(processFile));
          setFileToUpload(prevFiles => [...prevFiles, ...processedFiles]);
          setFieldValue('riskAssessment', processedFiles);
        } catch (error) {
          console.error('Error processing dropped files:', error);
          setFieldError('riskAssessment', error.message);
        }
      };
  
  const handleFileRemove = (index, setFieldValue) => {
    const updatedFiles = fileToUpload.filter((_, i) => i !== index);
    setFileToUpload(updatedFiles);
    setFieldValue('riskAssessment', updatedFiles);
  };

  const SectionHeader = ({ number, title,optional = false }) => (
    <h2 className="font-semibold mb-4 relative">
      <span className="relative after:content-[''] after:block after:w-full after:h-1 after:bg-gray-500 after:mb-1 after:shadow-md">
        {number}. {title.toUpperCase()}
        {optional && (
        <span className="text-gray-400 text-sm ml-2">(Not Compulsory)</span>
      )}
      </span>
    </h2>
  );

  const renderCheckboxGroup = (sectionKey, label, number, setFieldValue, errors, touched, setFieldTouched,setFieldError,isOptional = false) => {
    const options = checkboxOptions[sectionKey] || [];
    const currentValues = Array.isArray(formData[sectionKey]) ? formData[sectionKey] : [];

    const getGridClass = (number) => {
      // Sections 2-5 use 3 columns
      if (number >= 2 && number <= 5 ) {
        return "grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-0"; // Reduced vertical gap
      }
      // Sections 6-8 use 2 columns
      else if (number >= 6 && number <= 7) {
        return "grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-0"; // Reduced vertical gap
      }
      // Default to single column for other sections
      return "grid grid-cols-3 gap-1";
    };
  
    // Define all the constants and helper functions first
  const textStateSetters = {
    hazardIdentification: setOtherHazardText,
    jobRequirement: setOtherGasesText,
    ppeRequirement: setOtherPPEText,
    precaution: setOtherControlsText,
    hazardousEnergies: {
      otherDangerousGoods: setOtherDangerousGoodsText,
      otherHazardousEnergy: setOtherHazardousEnergyText
    },
    breakPreparation: setOtherBreakPreparationText
  };

  const textFieldValues = {
    hazardIdentification: otherHazardText,
    jobRequirement: otherGasesText,
    ppeRequirement: otherPPEText,
    precaution: otherControlsText,
    hazardousEnergies: {
      otherDangerousGoods: otherDangerousGoodsText,
      otherHazardousEnergy: otherHazardousEnergyText
    },
    breakPreparation: otherBreakPreparationText
  };

  const otherOptionLabels = {
    hazardIdentification: ['Other (Specify)'],
    jobRequirement: ['List other gases detected'],
    ppeRequirement: ['Other (Specify)'],
    precaution: ['Additional Controls (Specify)'],
    hazardousEnergies: ['Dangerous goods/chemicals (Specify)', 'Other (Specify)'],
    breakPreparation: ['Other (Specify)']
  };

  const handleCheckboxChange = (option, checked) => {
    // Special handling for AC and DC voltage sections
    if (sectionKey === 'acVoltageDe' || sectionKey === 'dcVoltageDe') {
      // If checking a box, clear other selections and only select the current one
      const updatedValues = checked ? [option.label] : [];
      setFormData(prev => ({
        ...prev,
        [sectionKey]: updatedValues
      }));
      setFieldValue(sectionKey, updatedValues);
    } else {
      // Original handling for other sections
      const updatedValues = checked
        ? [...currentValues, option.label]
        : currentValues.filter(v => v !== option.label);
      
      setFormData(prev => ({
        ...prev,
        [sectionKey]: updatedValues
      }));
      setFieldValue(sectionKey, updatedValues);
    
      // Handle text input fields when checkbox is changed
    const handleSpecifyOption = (fieldName, setterFunction) => {
      if (checked) {
        // When checking the box, immediately set touched and empty value
        setterFunction('');
        setFieldValue(fieldName, '');
        setFieldTouched(fieldName, true, true); // Set touched and trigger validation
        setFieldError(fieldName, 'This field is required');
      } else {
        // When unchecking, reset everything
        setterFunction('');
        setFieldValue(fieldName, '');
        setFieldTouched(fieldName, false);
        setFieldError(fieldName, undefined);
      }
    };

    // Handle each specific case
    if (sectionKey === 'hazardIdentification' && option.label === 'Other (Specify)') {
      handleSpecifyOption('otherHazardText', setOtherHazardText);
    }
    else if (sectionKey === 'jobRequirement' && option.label === 'List other gases detected') {
      handleSpecifyOption('otherGasesText', setOtherGasesText);
    }
    else if (sectionKey === 'ppeRequirement' && option.label === 'Other (Specify)') {
      handleSpecifyOption('otherPPEText', setOtherPPEText);
    }
    else if (sectionKey === 'precaution' && option.label === 'Additional Controls (Specify)') {
      handleSpecifyOption('otherControlsText', setOtherControlsText);
    }
    else if (sectionKey === 'hazardousEnergies') {
      if (option.label === 'Dangerous goods/chemicals (Specify)') {
        handleSpecifyOption('otherDangerousGoodsText', textStateSetters.hazardousEnergies.otherDangerousGoods);
      }
      else if (option.label === 'Other (Specify)') {
        handleSpecifyOption('otherHazardousEnergyText', textStateSetters.hazardousEnergies.otherHazardousEnergy);
      }
      else if (option.label === 'Electricity') {
        if (!checked) {
          setFieldValue('acVoltageDe', []);
          setFieldValue('dcVoltageDe', []);
        }
      }
    }
    else if (sectionKey === 'breakPreparation' && option.label === 'Other (Specify)') {
      handleSpecifyOption('otherBreakPreparationText', setOtherBreakPreparationText);
    }
  }
  };

  // Update handleTextChange to properly handle validation
const handleTextChange = (e, option) => {
  const text = e.target.value;
  
  const validateAndUpdateField = (fieldName, setter) => {
    setter(text);
    setFieldValue(fieldName, text);
    setFieldTouched(fieldName, true, true); // Trigger validation immediately
    if (!text.trim()) {
      setFieldError(fieldName, 'This field is required');
    } else {
      setFieldError(fieldName, undefined);
    }
  };

  if (sectionKey === 'breakPreparation' && option.label === 'Other (Specify)') {
    validateAndUpdateField('otherBreakPreparationText', setOtherBreakPreparationText);
  }
  else if (sectionKey === 'hazardousEnergies') {
    const sectionLabels = otherOptionLabels[sectionKey];
    if (option.label === sectionLabels[0]) {
      validateAndUpdateField('otherDangerousGoodsText', textStateSetters.hazardousEnergies.otherDangerousGoods);
    } else if (option.label === sectionLabels[1]) {
      validateAndUpdateField('otherHazardousEnergyText', textStateSetters.hazardousEnergies.otherHazardousEnergy);
    }
  }
  else if (sectionKey === 'precaution' && option.label === 'Additional Controls (Specify)') {
    validateAndUpdateField('otherControlsText', setOtherControlsText);
  }
  else if (sectionKey === 'hazardIdentification' && option.label === 'Other (Specify)') {
    validateAndUpdateField('otherHazardText', setOtherHazardText);
  }
  else if (sectionKey === 'jobRequirement' && option.label === 'List other gases detected') {
    validateAndUpdateField('otherGasesText', setOtherGasesText);
  }
  else if (sectionKey === 'ppeRequirement' && option.label === 'Other (Specify)') {
    validateAndUpdateField('otherPPEText', setOtherPPEText);
  }
};

  const getTextFieldError = (sectionKey, option) => {
    // Get the error and touched state based on the section and option
    if (sectionKey === 'hazardousEnergies') {
      const sectionLabels = otherOptionLabels[sectionKey];
      if (option.label === sectionLabels[0]) { // Dangerous goods/chemicals
        return errors.otherDangerousGoodsText && touched.otherDangerousGoodsText;
      } else if (option.label === sectionLabels[1]) { // Other hazardous energies
        return errors.otherHazardousEnergyText && touched.otherHazardousEnergyText;
      }
    } else {
      // Handle all other sections with text inputs
      const errorKeyMap = {
        'hazardIdentification': {
          'Other (Specify)': 'otherHazardText'
        },
        'jobRequirement': {
          'List other gases detected': 'otherGasesText'
        },
        'ppeRequirement': {
          'Other (Specify)': 'otherPPEText'
        },
        'precaution': {
          'Additional Controls (Specify)': 'otherControlsText'
        },
        'breakPreparation': {
          'Other (Specify)': 'otherBreakPreparationText'
        }
      };
  
      const errorKey = errorKeyMap[sectionKey]?.[option.label];
      if (errorKey) {
        return errors[errorKey] && touched[errorKey];
      }
    }
    return false;
  };

  const getTextFieldValue = (sectionKey, option) => {
    if (sectionKey === 'hazardousEnergies') {
      const sectionLabels = otherOptionLabels[sectionKey];
      if (option.label === sectionLabels[0]) {
        return textFieldValues.hazardousEnergies.otherDangerousGoods;
      } else if (option.label === sectionLabels[1]) {
        return textFieldValues.hazardousEnergies.otherHazardousEnergy;
      }
    } else if (sectionKey === 'precaution') {
      return textFieldValues.precaution;
    } else if (sectionKey === 'breakPreparation' && option.label === 'Other (Specify)') {
      return otherBreakPreparationText;
    }
    return textFieldValues[sectionKey];
  };

  const sectionError = errors[sectionKey] && touched[sectionKey];

  // Now return the JSX
  return (
    <div className="mb-4">
      <SectionHeader number={number} title={label} optional={isOptional}/>

      {/* Section-level error display */}
      {sectionError && (
        <div className="text-red-600 text-sm mb-3 pl-2">
          {errors[sectionKey]}
        </div>
      )}
      
      <div className={getGridClass(number)}>
        {options.map((option) => {
          const isChecked = currentValues.includes(option.label);
          const sectionLabels = otherOptionLabels[sectionKey] || [];
          const showTextInput = (sectionLabels.includes(option.label) || 
                               (sectionKey === 'precaution' && option.label === 'Additional Controls (Specify)')) && 
                               isChecked;
          
          return (
            <div key={option.id} className="relative p-2">
              <label className="inline-flex items-start">
                <input
                  type="checkbox"
                  value={option.label}
                  checked={isChecked}
                  onChange={(e) => handleCheckboxChange(option, e.target.checked)}
                  className="form-checkbox h-4 w-4 text-blue-600 cursor-pointer border-gray-300 rounded mt-1 mr-2"
                />
                <span className="text-sm">{option.label}</span>
              </label>
              
              {showTextInput && (
                <div className="mt-2 ml-6">
                  <input
                    type="text"
                    placeholder={`Specify ${option.label.toLowerCase()}`}
                    value={getTextFieldValue(sectionKey, option)}
                    onChange={(e) => handleTextChange(e, option)}
                    className={`block w-full border rounded-md text-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      getTextFieldError(sectionKey, option) ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  {getTextFieldError(sectionKey, option) && (
                    <div className="text-red-600 text-xs mt-1">
                      This field is required
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};


    useEffect(()=>{
      const saveData = window.localStorage.getItem('jkkkkcdvyuscgjkyasfgyudcvkidscvjhcytdjftyad7guilllllaycfui')
      const parsedData = JSON.parse(saveData)
      SetCurrentUser(parsedData?.user)
    }, [])


  return (
    <div className="p-4">
      <Card className="w-full max-w-4xl mx-auto bg-white relative" ref={cardRef}>
        <CardHeader className="relative border-b pb-2 pt-2 flex items-center">
          <img src={logo} alt="Company Logo" className="h-[80px] w-[80px]" />
          <h1 className="text-xl font-semibold flex-grow text-center"> SAFETY FORM</h1>
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
            title="Confirm Close"
          >
            <div className="text-center">
              <p className="mb-4 text-gray-700">Are you sure you want to close this?</p>
              <div className="flex justify-center space-x-4">
                <Button 
                  variant="secondary"
                  className="bg-gray-600 text-white hover:bg-gray-700"
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
          onSubmit={async (values, { setTouched,setFieldError }) => {
            setTouched({
              ...Object.keys(values).reduce((acc, key) => {
                acc[key] = true;
                return acc;
              }, {})
            });
            setIsSubmitting(true);
            try {
              setIsSubmitting(true);
                console.log('Form Values:', values); // Debug log

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
          
              // Collect all checkbox selections
              const checkboxSelections = [
                ...mapSectionItems(values.permitRequired, 'Permit Required'),
                ...mapSectionItems(values.hazardIdentification, 'Hazard Identification', 
                  item => item === 'Other (Specify)' ? values.otherHazardText : null),
                ...mapSectionItems(values.jobRequirement, 'Job Requirements',
                  item => item === 'List other gases detected' ? values.otherGasesText : null),
                ...mapSectionItems(values.ppeRequirement, 'PPE Requirements',
                  item => item === 'Other (Specify)' ? values.otherPPEText : null),
                ...mapSectionItems(values.precautionaryMeasure, 'Precautionary Measures'),
                ...mapSectionItems(values.precaution, 'Precautions', 
                  item => item === 'Additional Controls (Specify)' ? values.otherControlsText : null),
                ...mapSectionItems(values.hazardousEnergies, 'Hazardous Energies',
                  item => {
                    if (item === 'Dangerous goods/chemicals (Specify)') return values.otherDangerousGoodsText;
                    if (item === 'Other hazardous energies (Specify)') return values.otherHazardousEnergyText;
                    return null;
                  }),
                ...(values.hazardousEnergies?.includes('Electricity') ? [
                  ...mapSectionItems(values.acVoltageDe, 'AC Voltage'),
                  ...mapSectionItems(values.dcVoltageDe, 'DC Voltage')
                ] : []),
                ...mapSectionItems(values.breakPreparation, 'Break Preparation',
                  item => item === 'Other (Specify)' ? values.otherBreakPreparationText : null)
              ].filter(Boolean); // Remove any null/undefined entries
          
              // Prepare the data for submission
              const submitData = {
                user: currentUser,
                startDate: startDateTime?.toISOString(),
                endDate: endDateTime?.toISOString(),
                permitDuration: parseInt(values.permitDuration) || 0,
                department: values.department || '',
                jobLocation: values.jobLocation || '',
                subLocation: values.subLocation || '',
                locationDetail: values.locationDetail || '',
                jobDescription: values.jobDescription || '',
                permitReceiver: values.permitReceiver || '',
                contractType: values.contractType || '',
                contractCompanyName: values.contractType === 'External / Contract Company' ? 
                  values.contractCompanyName : null,
                staffID: values.contractType === 'Internal / MPS' ? 
                  values.staffID : null,
                documents: values.riskAssessment.map(file => ({
                  fileName: file.name,
                  fileType: file.type,
                  fileData: file.data
                })),
                numberOfWorkers: parseInt(values.numberOfWorkers) || 0,
                workersNames,
                checkboxSelections // Include the checkbox selections here
              };

              if (values.riskAssessment && values.riskAssessment.length > 0) {
                try {
                  submitData.riskAssessmentDocuments = values.riskAssessment.map(file => ({
                    fileName: file.name,
                    fileType: file.type,
                    data: file.data
                  }));
                } catch (error) {
                  console.error('Error processing files:', error);
                  throw error;
                }
              }
          
              console.log('Submit Data:', submitData);
              console.log('Checkbox Selections:', checkboxSelections); // Add this for debugging
          
              const response = await api.createPermit(submitData);
              console.log('API Response:', response);

              const FileList = ({ files, onRemove }) => (
                <div className="mt-4">
                  <h4 className="text-sm font-semibold mb-2">Uploaded Documents</h4>
                  <div className="space-y-2">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-200 p-2 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                            {file.type.split('/')[1].toUpperCase()}
                          </span>
                          <span className="text-sm text-gray-700 truncate">{file.name}</span>
                          <span className="text-xs text-gray-500">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <button
                          type="button"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => onRemove(index)}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
          
              navigate('/dashboard/permits/job-permits/success', { 
                state: { success: true, permitId: response.jobPermitId } 
              });
            } catch (error) {
              console.error('Error details:', error);
              if (error.response?.data?.message) {
                setFieldError('submit', error.response.data.message);
              } else if (error.message) {
                setFieldError('submit', error.message);
              } else {
                setFieldError('submit', 'An error occurred while submitting the form. Please try again.');
              }
            } finally {
              setIsSubmitting(false);
            }
            }}
          validateOnChange={true}
          validationContext={{ currentSection }}
          validateOnBlur={true}
        >
          {({ errors, touched,values, setFieldValue,validateForm,setTouched,setFieldTouched,setFieldError}) => (
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
                      
                             dateFormat="dd-MM-yyyy"                         
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
                                dateFormat="dd-MM-yyyy"
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
                      Estimated Work Duration <span className="text-gray-500 font-normal">(Days)</span>
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
                       {loading ? (
                         <div className="w-full h-10 bg-gray-100 animate-pulse rounded" />
                       ) : (
                         <Dropdown
                           options={departments}
                           value={formData.department}
                           onChange={(value) => handleInputChange('department', value, setFieldValue)}
                           className={`w-full ${errors.department && touched.department ? 'border-red-500 bg-red-50' : ''}`}
                           dropdownIcon="▾"
                         />
                       )}
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
                          name="locationDetail"
                          value={formData.locationDetail}
                          onChange={(e) => {
                            handleInputChange('locationDetail', e.target.value, setFieldValue);
                          }}
                          placeholder="Enter details of the job location"
                          className={`w-full ${
                            errors.locationDetail && touched.locationDetail 
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
                        onDrop={(e) => handleFileDrop(e, setFieldValue, setFieldError)}
                      >
                        <input
                          type="file"
                          id="riskAssessmentUpload"
                          multiple
                          onChange={(e) => handleFileUpload(e, setFieldValue, setFieldError)}
                          className="hidden"
                          accept=".jpg,.jpeg,.png,.doc,.docx,.pdf"
                        />
                        <label
                          htmlFor="riskAssessmentUpload"
                          className="flex flex-col items-center space-y-2"
                        >
                          <CloudUpload className="h-8 w-8 text-blue-500" />
                          <span className="text-blue-500 font-medium">Click To Upload Documents</span>
                          <span className="text-xs text-gray-500">
                            Max file size: 4MB. Supported formats: JPG, PNG, PDF, DOC, DOCX
                          </span>
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
                    {renderCheckboxGroup('permitRequired', 'Permit(s) Required','II', setFieldValue, errors, touched,setFieldTouched,setFieldError)}
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
                  <>
                    {renderCheckboxGroup('hazardIdentification', 'Hazard Identification', 3, setFieldValue, errors, touched,setFieldTouched,setFieldError)}
                    {renderCheckboxGroup('jobRequirement', 'Job Requirements', 4, setFieldValue, errors, touched,setFieldTouched,setFieldError)}
                    {renderCheckboxGroup('ppeRequirement', 'PPE Requirements', 5, setFieldValue, errors, touched,setFieldTouched,setFieldError)}
                  </>
              </div>
            )}
            
            {currentSection === 4 && (
                <div className="space-y-6">
                {/* Section 6 */}
                <div>

                {renderCheckboxGroup('precautionaryMeasure', 'Precautionary Measures', 6, setFieldValue, errors, touched,setFieldTouched,setFieldError)}
                    {renderCheckboxGroup('precaution', 'Precautions', 7, setFieldValue, errors, touched,setFieldTouched,setFieldError)}
                    {renderCheckboxGroup('hazardousEnergies', 'Hazardous Energies', 8, setFieldValue, errors, touched,setFieldTouched,setFieldError)}
                    {formData.hazardousEnergies.includes('Electricity') && (
                      <>
                        {renderCheckboxGroup('acVoltageDe', 'AC Voltage','', setFieldValue, errors, touched, setFieldTouched, setFieldError)}
                        {renderCheckboxGroup('dcVoltageDe', 'DC Voltage','', setFieldValue, errors, touched, setFieldTouched, setFieldError)}
                      </>
                    )}
                    {renderCheckboxGroup('breakPreparation', 'Break Preparation','', setFieldValue, errors, touched,setFieldTouched,setFieldError, true)}

                {/* Disclaimer Section */}
                <div>
                <div className="mt-8 p-4 border border-red-500 bg-red-100">
                  {errors.disclaimerAccepted && touched.disclaimerAccepted && (
                    <div className="mb-4 flex items-center text-red-700">
                      <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-sm font-semibold">{errors.disclaimerAccepted}</span>
                    </div>
                  )}
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      id="terms-checkbox"
                      className="form-checkbox h-4 w-4 text-green-600 cursor-pointer border-gray-300 rounded mr-2"
                      checked={values.disclaimerAccepted}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        setFieldValue('disclaimerAccepted', isChecked);
                        // Clear the error immediately when checked
                        if (isChecked) {
                          // This ensures the error disappears right away
                          setFieldTouched('disclaimerAccepted', false);
                        }
                      }}
                    />
                    <span className="text-sm font-medium">
                      I agree to the safety precautions stated above
                    </span>
                  </label>
                    
                  <p className="text-sm mt-2 text-red-600">
                    By checking this box, I confirm that I have thoroughly reviewed the hazard identifications and job requirements, possess the necessary personal protective equipment (PPE), and have taken all appropriate precautionary measures. I also acknowledge that the organization is not liable for any consequences resulting from my negligence.
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
                type="button"
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
                onClick={() => {
                  // Force the disclaimer to be marked as touched when submitting
                  setTouched({ ...touched, disclaimerAccepted: true }, true);
                }}
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