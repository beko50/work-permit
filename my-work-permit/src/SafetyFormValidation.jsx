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

  // Section-specific validations
  jobDescription: Yup.string().when('$currentSection', {
    is: 2,
    then: (schema) =>
      schema
        .required('Job Description is required')
        .min(10, 'Job Description must be at least 10 characters long')
        .max(500, 'Job Description cannot exceed 500 characters'),
    otherwise: (schema) => schema.notRequired(),
  }),
  permitReceiver: Yup.string().when('$currentSection', {
    is: 2,
    then: (schema) =>
      schema
        .required('Permit Receiver is required')
        .min(2, 'Permit Receiver name must be at least 2 characters long')
        .max(100, 'Permit Receiver name cannot exceed 100 characters')
        .matches(/^[a-zA-Z\s]+$/, 'Permit Receiver name can only contain letters and spaces'),
    otherwise: (schema) => schema.notRequired(),
  }),
  jobCompany: Yup.string().when('currentSection', {
    is: 2,
    then: (schema) => schema.required('Job Company is required'),
  }),
  contractCompanyName: Yup.string().when('currentSection', {
    is: 2,
    then: (schema) =>
      Yup.string().when('jobCompany', {
        is: 'Contract Company',
        then: (schema) =>
          schema
            .required('Contract Company Name is required')
            .min(2, 'Company name must be at least 2 characters long')
            .max(100, 'Company name cannot exceed 100 characters'),
      }),
  }),
  staffID: Yup.string().when('currentSection', {
    is: 2,
    then: (schema) => schema.max(20, 'Staff ID cannot exceed 20 characters'),
  }),
  numberOfWorkers: Yup.number().when('currentSection', {
    is: 2,
    then: (schema) =>
      schema
        .required('Number of Workers is required')
        .min(1, 'At least one worker is required')
        .max(20, 'Maximum 20 workers allowed'),
  }),
  riskAssessment: Yup.array().when('currentSection', {
    is: 2,
    then: (schema) =>
      schema
        .required('At least one Risk Assessment document is required')
        .min(1, 'At least one Risk Assessment document is required')
        .test('file-type', 'Invalid file type. Allowed types: jpg, jpeg, png, doc, docx, pdf', (files) => {
          return files.every((file) => {
            const allowedTypes = ['jpg', 'jpeg', 'png', 'doc', 'docx', 'pdf'];
            const fileExt = file.name.split('.').pop().toLowerCase();
            return allowedTypes.includes(fileExt);
          });
        })
        .test('file-size', 'Files must be not larger than 4MB each', (files) => {
          return files.every((file) => file.size <= 4 * 1024 * 1024);
        }),
  }),
  permitRequired: Yup.array().when('currentSection', {
    is: 2,
    then: (schema) =>
      schema.required('At least one Permit Type must be selected').min(1, 'At least one Permit Type must be selected'),
  }),
  workerDetails: Yup.array().when('currentSection', {
    is: 2,
    then: (schema) =>
      Yup.array().when('numberOfWorkers', {
        is: (numberOfWorkers) => numberOfWorkers > 0,
        then: (schema) =>
          schema
            .of(
              Yup.object().shape({
                name: Yup.string()
                  .required('Worker name is required')
                  .min(2, 'Worker name must be at least 2 characters long')
                  .max(100, 'Worker name cannot exceed 100 characters'),
              })
            )
            .min(1, 'Worker details are required')
            .test('correct-number-of-workers', 'Worker details must match the number of workers specified', function (
              workerDetails
            ) {
              const { numberOfWorkers } = this.parent;
              return workerDetails.length === Number(numberOfWorkers);
            }),
      }),
  }),
});

export default SafetyFormValidation;