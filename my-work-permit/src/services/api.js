const API_URL = 'http://172.20.20.221:5000/api';
//const API_URL = 'http://localhost:5000/api';
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

  async addAdmin(adminData) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
  
      const response = await fetch(`${API_URL}/users/admin/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          firstName: adminData.firstName,
          lastName: adminData.lastName,
          email: adminData.email.toLowerCase(),
          password: adminData.password,
          departmentId: adminData.departmentId,
          roleId: 'ADMIN',
          userType: 'Internal',
          isActive: true,
          contractCompanyName: 'MPS Ghana'
        })
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add admin');
      }
  
      return await response.json();
    } catch (error) {
      console.error('Error adding admin:', error);
      throw error;
    }
  },

  async adminLogin(credentials) {
    try {
      const response = await fetch(`${API_URL}/users/admin/login`, {
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

  async updateUserActivation(userId, isActive) {
    const response = await fetch(`${API_URL}/users/admin/users/${userId}/activate`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isActive }),
    });
    if (!response.ok) throw new Error('Failed to update user activation status');
    return response.json();
  },

  async logout() {
    try {
      window.localStorage.clear()
      // window.location.href = '/'
    } catch (error) {
      throw error;
    }
  },

  forgotPassword: async (email) => {
    try {
      const response = await fetch(`${API_URL}/users/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });
  
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send reset email');
      }
  
      return await response.json();
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  },
  
  resetPassword: async (token, newPassword) => {
    try {
      const response = await fetch(`${API_URL}/users/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token,
          newPassword
        })
      });
  
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to reset password');
      }
  
      return await response.json();
    } catch (error) {
      console.error('Reset password error:', error);
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

  async getUsers() {
    try {
      const token = localStorage.getItem('token'); // or however you store your token
      console.log('Using token:', token); // Debug log
      
      const response = await fetch(`${API_URL}/users/admin/users`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch users');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  async updateUserRole(userId, data) {
    const response = await fetch(`${API_URL}/users/admin/users/${userId}/role`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update user role');
    return response.json();
  },

  async deleteUser(userId) {
    const response = await fetch(`${API_URL}/users/admin/users/${userId}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete user');
    return response.json();
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
  
      const responseData = await response.json();

    // Ensure the response data is properly structured
    if (!responseData.success) {
      throw new Error(responseData.message || 'Failed to fetch permit');
    }

    // Make sure documents are properly formatted with base64 data
    if (responseData.data.documents) {
      responseData.data.documents = responseData.data.documents.map(doc => ({
        ...doc,
        fileData: doc.fileData.startsWith('data:') 
          ? doc.fileData 
          : `data:${doc.fileType};base64,${doc.fileData}`
      }));
    }

    return responseData;
  } catch (error) {
    console.error('Error fetching permit:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch permit',
      data: null
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
    // if (searchParams.department) {
    //   queryParams.append('department', searchParams.department); // Use 'department' as the key
    // }

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

  async searchPTW(searchParams, currentUser) {
    try {
      const queryParams = new URLSearchParams();
      
      if (searchParams.permitId) {
        // Ensure permitId is passed as a number
        queryParams.append('permitId', searchParams.permitId.toString());
      }
      
      queryParams.append('page', searchParams.page);
      queryParams.append('limit', searchParams.limit);
  
      const response = await fetch(`${API_URL}/permits/permit-to-work/search?${queryParams}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include'
      });
  
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to search permits');
      }
  
      return data;
    } catch (error) {
      console.error('Error searching permits:', error);
      return {
        success: false,
        message: error.message,
        data: []
      };
    }
  },
  
  async completePermitToWork(permitToWorkId, completionData) {
    try {
      const response = await fetch(`${API_URL}/permits/permit-to-work/${permitToWorkId}/complete`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          stage: completionData.stage,
          remarks: completionData.remarks
        })
      });
  
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to process completion');
      }
  
      return await response.json();
    } catch (error) {
      console.error('Error processing permit completion:', error);
      throw error;
    }
  },
  
  /*async updatePermitStatus(permitId, status) {
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
  } */


  //REVOCATION PHASE
  async initiateRevocation(permits, reason) {
    try {
      const response = await fetch(`${API_URL}/permits/revoke/initiate`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          permits,
          reason
        })
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
  
      return await response.json();
    } catch (error) {
      console.error('Error initiating revocation:', error);
      throw error;
    }
  },

  async revokePermits(permits, reason) {
    try {
        const response = await fetch(`${API_URL}/permits/revoke/initiate`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                permits,  // Keep the full permit objects with id and type
                reason
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to initiate permit revocation');
        }

        const data = await response.json();
        
        if (!response.ok) {
            // Return the complete error message from the backend
            throw new Error(data.message || 'Failed to initiate permit revocation');
        }

        return {
            success: true,
            data,
            message: data.message
        };

    } catch (error) {
        // Propagate the complete error message
        throw error;
    }
},
  
  // Approve revocation (QHSSE/QA only)
  async approveRevocation(permits, status, comments) {
    try {
      console.log('Sending revocation request:', {
        permits,
        status,
        comments
      });
  
      const response = await fetch(`${API_URL}/permits/revoke/approve`, {
        method: 'POST',
        credentials: 'include',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          permits,
          status,
          comments
        })
      });
  
      // Log response details for debugging
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
  
      return await response.json();
    } catch (error) {
      console.error('Error approving revocation:', error);
      throw error;
    }
  },
  
  // Get permits pending revocation approval (for QHSSE/QA dashboard)
  async getPendingRevocations() {
    try {
      const response = await fetch(`${API_URL}/permits/revoke/pending`, {
        method: 'GET',
        credentials: 'include',
        headers: getAuthHeaders()
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
  
      return await response.json();
    } catch (error) {
      console.error('Error fetching pending revocations:', error);
      throw error;
    }
  },

};

// Initialize the cache when the module loads
sectionItemsCache.initialize().catch(console.error);

export default api;