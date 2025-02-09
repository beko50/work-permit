const API_URL = 'http://localhost:5000/api';
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

const sectionNameMapping = {
  permitRequired: 'Permit Required',
  hazardIdentification: 'Hazard Identification',
  jobRequirement: 'Job Requirements',
  ppeRequirement: 'PPE Requirements',
  precautionaryMeasure: 'Precautionary Measures',
  precaution: 'Precautions',
  hazardousEnergies: 'Hazardous Energies',
  acVoltageDe: 'AC Voltage',
  dcVoltageDe: 'DC Voltage',
  breakPreparation: 'Break Preparation'
};

const sectionItemsCache = {
  cache: null,
  async initialize() {
    if (!this.cache) {
      try {
        const response = await fetch(`${API_URL}/permits/form-sections`, {
          credentials: 'include',
          headers: getAuthHeaders(),
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const { sections } = await response.json();
        
        this.cache = {};
        sections.forEach(section => {
          section.items.forEach(item => {
            const key = `${section.sectionName.toLowerCase()}-${item.label.toLowerCase()}`;
            this.cache[key] = {
              sectionItemId: item.sectionItemId,
              allowTextInput: item.allowTextInput
            };
          });
        });
      } catch (error) {
        console.error('Error initializing cache:', error);
        this.cache = {};
        throw error;
      }
    }
    return this.cache;
  },
  
  get(sectionName, itemLabel) {
    if (!this.cache) {
      throw new Error('Cache not initialized');
    }
    const key = `${sectionName.toLowerCase()}-${itemLabel.toLowerCase()}`;
    return this.cache[key];
  }
};

export const api = {
  // Existing auth endpoints
  async register(userData) {
    try {
      console.log('Registration data:', {
        ...userData,
        departmentId: userData.departmentId  // Verify this is included
      });
      const response = await fetch(`${API_URL}/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(userData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Throw error with the message from the server
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      // Re-throw the error with the proper message
      throw error;
    }
  },

  async login(credentials) {
    try {
      const response = await fetch(`${API_URL}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(credentials),
      });

      const data = await response.json();
    
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      
      return data;
    } catch (error) {
      throw error;
    }
  },

  async logout() {
    try {
      window.localStorage.clear()
      window.location.href = '/'
    } catch (error) {
      throw error;
    }
  },

  async getRoles() {
    try {
      const response = await fetch(`${API_URL}/users/roles`, {
        credentials: 'include',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching roles:', error);
      throw error;
    }
  },

  async getDepartments() {
    try {
      const response = await fetch(`${API_URL}/users/departments`, {
        credentials: 'include',
        headers: getAuthHeaders(),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      // console.log(data)
      return data.map(dept => ({
        DepartmentID: dept.DepartmentID, 
        DepartmentName: dept.DepartmentName  // Adjust based on your actual return structure
      }));
    } catch (error) {
      console.error('Error fetching departments:', error);
      throw error;
    }
  },

  async getUserProfile() {
    try {
      const response = await fetch(`${API_URL}/users/profile`, {
        credentials: 'include',
        headers: getAuthHeaders(),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  // New permit endpoints
  async getFormSections() {
    const response = await fetch(`${API_URL}/permits/form-sections`, {
      method: 'GET',
      credentials: 'include',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Form Sections Data:', data); // Add this log
    return data;
  },

  async createPermit(permitData) {
    try {
      await sectionItemsCache.initialize();
      
      // Ensure checkboxSelections is properly structured
      const checkboxSelections = Array.isArray(permitData.checkboxSelections) 
        ? permitData.checkboxSelections.map(selection => ({
            sectionItemId: parseInt(selection.sectionItemId),
            selected: Boolean(selection.selected),
            textInput: selection.textInput || null
          }))
        : [];
  
      // Log the request body before sending
      const requestBody = {
        ...permitData,
        checkboxSelections
      };
      
      console.log('Request body before sending:', JSON.stringify(requestBody));

      if (permitData.riskAssessmentDocuments) {
        permitData.riskAssessmentDocuments = permitData.riskAssessmentDocuments.map(doc => ({
          ...doc,
          data: doc.data.startsWith('data:') ? doc.data : `data:image/png;base64,${doc.data}`
        }));
      }
  
      const response = await fetch(`${API_URL}/permits`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(requestBody)
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
  
      return await response.json();
    } catch (error) {
      console.error('Error in createPermit:', error);
      throw error;
    }
  },

  async getPermits(queryParams, currentUser) {
    try {
      const params = new URLSearchParams();
      
      // Add all query parameters
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value);
        }
      });

      // Add user context for proper filtering
      if (currentUser) {
        params.append('userRoleId', currentUser.roleId?.trim() || '');
        params.append('userDepartmentId', currentUser.departmentId?.trim() || '');
        
        // Add full name for ISS assignments
        if (currentUser.firstName && currentUser.lastName) {
          params.append('userFullName', `${currentUser.firstName} ${currentUser.lastName}`.trim());
        }
        
        if (currentUser.userId) {
          params.append('userId', currentUser.userId);
        }
      }

      const response = await fetch(`${API_URL}/permits?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data: data.permits || [],
        total: data.pagination?.totalCount || 0,
        totalPages: data.pagination?.totalPages || 0,
      };

    } catch (error) {
      console.error('Error fetching permits:', error);
      return {
        success: false,
        data: [],
        total: 0,
        totalPages: 0,
        error: error.message || 'Failed to fetch permits'
      };
    }
},

  async getPermitById(permitId) {
    try {
      const response = await fetch(`${API_URL}/permits/${permitId}`, {
        method: 'GET',
        credentials: 'include',
        headers: getAuthHeaders(),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      
      // Ensure RiskAssessmentDocument is properly formatted
      if (data.permit?.RiskAssessmentDocument) {
        if (!data.permit.RiskAssessmentDocument.startsWith('data:')) {
          data.permit.RiskAssessmentDocument = `data:image/png;base64,${data.permit.RiskAssessmentDocument}`;
        }
      }
  
      return {
        data,
        success: true
      };
    } catch (error) {
      console.error('Error fetching permit:', error);
      return {
        data: null,
        success: false,
        error: error.message || 'Failed to fetch permit'
      };
    }
  },

  async getPermitsByDepartment(departmentId) {
    try {
      const response = await fetch(`${API_URL}/permits/department/${departmentId}`, {
        method: 'GET',
        credentials: 'include',
        headers: getAuthHeaders(),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      return {
        data: data.permits || data, // Handle different possible response structures
        success: true
      };
    } catch (error) {
      console.error('Error fetching department permits:', error);
      return {
        data: [],
        success: false,
        error: error.message
      };
    }
  },

  // Add search permits method
  async searchPermits(searchParams, currentUser) {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });

      // Ensure the department field matches the backend
    if (searchParams.department) {
      queryParams.append('department', searchParams.department); // Use 'department' as the key
    }

      const response = await fetch(`${API_URL}/permits/search?${queryParams}`, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch permits');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching permits:', error);
      return {
        success: false,
        error: error.message,
        data: [],
        total: 0,
        totalPages: 0,
        currentPage: 1
      };
    }
  },

  async approvePermit({ jobPermitId, status, comments = '' }) {
    try {
      const response = await fetch(`${API_URL}/permits/approve`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ 
          jobPermitId, 
          status, 
          comments 
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
  
      return await response.json();
    } catch (error) {
      console.error('Permit approval error:', error);
      throw error;
    }
  },


  // PERMIT TO WORK -- SECOND PHASE
  async createPermitToWork(permitData) {
    try {
      const response = await fetch(`${API_URL}/permits/permit-to-work`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(permitData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create permit to work');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating permit to work:', error);
      throw error;
    }
  },

  // Get a specific Permit to Work by ID
  async getPermitToWorkById(permitToWorkId) {
    try {
      const response = await fetch(`${API_URL}/permits/permit-to-work/${permitToWorkId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include'
      });
  
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch permit to work');
      }
  
      const responseData = await response.json();
      // Return the data directly without additional wrapping
      return responseData;
    } catch (error) {
      console.error('Error fetching permit to work:', error);
      throw error;
    }
  },

  async getPermitToWorkByJobPermitId(jobPermitId) {
    try {
      const response = await fetch(`${API_URL}/permits/permit-to-work/job-permit/${jobPermitId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include'
      });
  
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch permit to work');
      }
  
      const data = await response.json();
      return {
        success: true,
        data: data.data
      };
    } catch (error) {
      console.error('Error fetching permit to work:', error);
      throw error;
    }
  },

  // Get all Permits to Work based on user role
  async getPermitsToWork() {
    try {
      const response = await fetch(`${API_URL}/permits/permit-to-work`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include'
      });
  
      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(errorMessage || 'Failed to fetch permits to work');
      }
  
      const data = await response.json(); // Parse the JSON response
      return {
        success: true,
        data: data.permits // Return the permits array
      };
    } catch (error) {
      console.error('Error fetching permits to work:', error);
      throw error;
    }
  },
  

  // Approve/Reject a Permit to Work
  async approvePermitToWork(permitToWorkId, approvalData) {
    try {
      const response = await fetch(`${API_URL}/permits/permit-to-work/${permitToWorkId}/approve`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          permitToWorkId, // Explicitly include this
          status: approvalData.status,
          comments: approvalData.comments
        })
      });
  
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to process approval');
      }
  
      return await response.json();
    } catch (error) {
      console.error('Error processing permit approval:', error);
      throw error;
    }
  },

  async updatePermitStatus(permitId, status) {
    const response = await fetch(`${API_URL}/permits/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ permitId, status }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }
};

// Initialize the cache when the module loads
sectionItemsCache.initialize().catch(console.error);

export default api;