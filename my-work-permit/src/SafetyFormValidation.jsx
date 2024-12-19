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
    })
    .test('max-duration', function (value) {
      const { startDate } = this.parent;
      return calculatePermitDuration(startDate, value) <= 7;
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

  permitDuration: Yup.number().max(7, 'Permit duration cannot exceed 7 days').required('Permit duration is required'),
  department: Yup.string().required('Department is required'),
  jobLocation: Yup.string().required('Job Location is required'),
  subLocation: Yup.string().required('Sub Location is required'),
  plantDetail: Yup.string().required('Plant/Location/Equipment Detail is required'),
  
  // Section 2 Validations
  jobDescription: Yup.string().required('Job Description is required'),
  permitReceiver: Yup.string().required('Permit Receiver is required'),
  contractType: Yup.string().required('Job Company is required'),
  contractCompanyName: Yup.string().when('contractType', {
    is: 'External / Contract Company',
    then: () => Yup.string().required('Contract Company Name is required'),
    otherwise: () => Yup.string().notRequired(),
  }),
  staffID: Yup.string().when('contractType', {
    is: 'Internal / MPS',
    then: () => Yup.string().required('Staff ID is required for MPS staff'),
    otherwise: () => Yup.string().notRequired(),
  }),
  numberOfWorkers: Yup.number()
    .min(0, 'Number of Workers cannot be less than 0')
    .max(20, 'Number of Workers cannot exceed 20')
    .required('Number of Workers is required'),
  riskAssessment: Yup.array()
    .min(1, 'At least one Risk Assessment document is required')
    .test('file-size', 'Each file must not exceed 4MB', (files) =>
      files.every((file) => file.size <= 4 * 1024 * 1024)
    )
    .test('file-type', 'Unsupported file type', (files) =>
      files.every((file) => ['jpg', 'jpeg', 'png', 'doc', 'docx', 'pdf'].includes(file.name.split('.').pop().toLowerCase()))
    ),
  permitRequired: Yup.array().min(1, 'At least one Permit is required'),

  workerDetails: Yup.array()
    .of(
      Yup.object().shape({
        name: Yup.string().required('Worker Name is required'),
      })
    )
    .min(1, 'At least one worker must be listed if workers are present'),
});

export default SafetyFormValidation;