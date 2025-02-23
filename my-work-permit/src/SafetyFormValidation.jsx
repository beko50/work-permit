import * as Yup from 'yup';

// Helper function to calculate permit duration
export const calculatePermitDuration = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Include the start date in the calculation by adding one more day
  const difference = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;  // +1 to include the start date

  return difference > 0 ? difference : 0;
};

const SafetyFormValidation = Yup.object().shape({
  startDate: Yup.date()
    .required('Start Date is required')
    .test('is-today-or-later', 'Start Date cannot be in the past', (value) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalize to start of the day
      return value >= today;
    }),
  startTime: Yup.date()
    .required('Start Time is required')
    .test('is-current-or-later', 'Start Time cannot be earlier than current system time', function (value) {
      const now = new Date();
      const startDate = this.parent.startDate;

      // If start date is today, check time against current time
      if (startDate && new Date(startDate).toDateString() === now.toDateString()) {
        const combinedStartTime = new Date(startDate);
        combinedStartTime.setHours(value.getHours(), value.getMinutes(), value.getSeconds());
        return combinedStartTime >= now;
      }
      return true;
    }),

  endDate: Yup.date()
    .required('End Date is required')
    .test('is-greater-or-equal', 'End Date must be the same or after Start Date', function (value) {
      const { startDate } = this.parent;
      return value >= startDate;
    }),
  endTime: Yup.date()
    .required('End Time is required')
    .test('is-after-start-time', 'End Time cannot be earlier than Start Time', function (value) {
      const { startDate, startTime, endDate } = this.parent;

      if (startDate && startTime && endDate) {
        // Combine start date and start time
        const combinedStartTime = new Date(startDate);
        combinedStartTime.setHours(startTime.getHours(), startTime.getMinutes(), startTime.getSeconds());

        // Combine end date and end time
        const combinedEndTime = new Date(endDate);
        combinedEndTime.setHours(value.getHours(), value.getMinutes(), value.getSeconds());

        return combinedEndTime > combinedStartTime;
      }
      return true;
    }),

  permitDuration: Yup.number().min(1, 'Permit duration must be at least 1 day').required('Permit duration is required'),
  department: Yup.string().required('Department is required'),
  jobLocation: Yup.string().required('Job Location is required'),
  subLocation: Yup.string().required('Sub Location is required'),
  locationDetail: Yup.string().required('Plant/Location/Equipment Detail is required'),
  
  // Section 2 Validations
  jobDescription: Yup.string().required('Job Description is required'),
  permitReceiver: Yup.string().required('Permit Receiver is required'),
  contractType: Yup.string()
    .required('Contract Type is required'),
    
  contractCompanyName: Yup.string().when('contractType', {
    is: (val) => val === 'External / Contract Company',
    then: (schema) => schema.required('Contract Company Name is required'),
    otherwise: (schema) => schema.notRequired(),
  }),
  
  staffID: Yup.string().when('contractType', {
    is: (val) => val === 'Internal / MPS',
    then: (schema) => schema.required('Staff ID is required for MPS staff'),
    otherwise: (schema) => schema.notRequired(),
  }),

  numberOfWorkers: Yup.number()
    .min(0, 'Number of Workers cannot be less than 0')
    .max(20, 'Number of Workers cannot exceed 20')
    .required('Number of Workers is required'),
  riskAssessment: Yup.array()
    .min(1, 'At least one Risk Assessment document is required')
    .test('file-validation', 'Invalid file format or size', function (value) {
      if (!value || !Array.isArray(value)) return false;
      
      return value.every(file => {
        // Check file size (4MB in bytes)
        const MAX_FILE_SIZE = 4 * 1024 * 1024;
        
        // Handle processed file objects from our upload handler
        if (file && file.data && file.name && file.type) {
          // Calculate base64 size
          const base64Size = file.data.length * 0.75; // Approximate size from base64
          const validSize = base64Size <= MAX_FILE_SIZE;
          
          // Check file type from the stored type
          const validTypes = [
            'image/jpeg',
            'image/png',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          ];
          
          const validType = validTypes.includes(file.type);
          
          return validSize && validType;
        }
        
        // Handle File objects (during upload)
        if (file instanceof File) {
          const validSize = file.size <= MAX_FILE_SIZE;
          const extension = file.name.split('.').pop().toLowerCase();
          const validType = ['jpg', 'jpeg', 'png', 'doc', 'docx', 'pdf'].includes(extension);
          
          return validSize && validType;
        }
        
        return false;
      });
    }),
  permitRequired: Yup.array().min(1, 'At least one Permit is required'),

  workerDetails: Yup.array()
  .of(
    Yup.object().shape({
      name: Yup.string()
        .required('Worker Name is required')
        .min(1, 'Worker Name is required')
        .test('not-empty', 'Worker Name is required', 
          value => value && value.trim().length > 0)
    })
  )
  .min(1, 'At least one worker must be listed if workers are present')
  .test('all-names-filled', 'All worker names must be filled', function(value) {
    return value?.every(worker => worker.name && worker.name.trim().length > 0) ?? false;
  }),

  // Section 3 Validations
  hazardIdentification: Yup.array()
    .min(1, 'At least one hazard must be checked')
    .required('Hazard identification is required'),
  otherHazardText: Yup.string().when(['hazardIdentification'], {
    is: (hazardIdentification) => 
      Array.isArray(hazardIdentification) && 
      hazardIdentification.includes('Other (Specify)'),
    then: () => Yup.string().required('Please specify other hazard'),
    otherwise: () => Yup.string()
  }),

  jobRequirement: Yup.array()
    .min(1, 'At least one Job Requirement must be checked')
    .required('Job requirements are required'),
  otherGasesText: Yup.string()
    .test('other-gases-required', 'Please specify other gases', function(value) {
      const requirements = this.parent.jobRequirement;
      return !requirements?.includes('List other gases detected') || (requirements?.includes('List other gases detected') && !!value);
    }),

  ppeRequirement: Yup.array()
    .min(1, 'At least one PPE Requirement must be checked')
    .required('PPE requirements are required'),
  otherPPEText: Yup.string()
    .test('other-ppe-required', 'Please specify other PPE', function(value) {
      const ppe = this.parent.ppeRequirement;
      return !ppe?.includes('Other (Specify)') || (ppe?.includes('Other (Specify)') && !!value);
    }),

  //Section 4 Validations
  precautionaryMeasure: Yup.array()
    .min(1, 'At least one Precautionary Measure must be checked')
    .required('Precautionary measures are required'),

  precaution: Yup.array()
    .min(1, 'At least one Precaution must be checked')
    .required('Precautions are required'),
  otherControlsText: Yup.string()
    .test('other-controls-required', 'Please specify additional controls', function(value) {
      const precautions = this.parent.precaution;
      return !precautions?.includes('Additional Controls (Specify)') || 
        (precautions?.includes('Additional Controls (Specify)') && !!value);
    }),

  hazardousEnergies: Yup.array()
    .min(1, 'At least one Hazardous Energy must be checked')
    .required('Hazardous energies are required'),
  otherDangerousGoodsText: Yup.string()
    .test('dangerous-goods-required', 'Please specify dangerous goods', function(value) {
      const energies = this.parent.hazardousEnergies;
      return !energies?.includes('Dangerous goods/chemicals (Specify)') || 
        (energies?.includes('Dangerous goods/chemicals (Specify)') && !!value);
    }),
  otherHazardousEnergyText: Yup.string()
    .test('other-energy-required', 'Please specify other hazardous energy', function(value) {
      const energies = this.parent.hazardousEnergies;
      return !energies?.includes('Other(Specify)') || 
        (energies?.includes('Other(Specify)') && !!value);
    }),

  breakPreparation: Yup.array(),

  otherBreakPreparationText: Yup.string()
    .test('other-break-required', 'Please specify other break preparation', function(value) {
      const preparations = this.parent.breakPreparation;
      return !preparations?.includes('Other (Specify)') || 
        (preparations?.includes('Other (Specify)') && !!value);
    }),

    acVoltageDe: Yup.array()
  .when('hazardousEnergies', {
    is: (energies) => energies?.includes('Electricity'),
    then: () => Yup.array()
      .min(1, 'At least one A.C/D.C Voltage must be selected when Electricity is checked')
      .required('A.C Voltage is required when Electricity is checked'),
    otherwise: () => Yup.array().notRequired(),
  }),

dcVoltageDe: Yup.array()
  .when('hazardousEnergies', {
    is: (energies) => energies?.includes('Electricity'),
    then: () => Yup.array()
      .min(1, 'At least one A.C/D.C Voltage must be selected when Electricity is checked')
      .required('D.C Voltage is required when Electricity is checked'),
    otherwise: () => Yup.array().notRequired(),
  }),

  disclaimerAccepted: Yup.boolean()
    .oneOf([true], 'You must agree to the safety precautions')
    .required('You must agree to the safety precautions')
});

export default SafetyFormValidation;