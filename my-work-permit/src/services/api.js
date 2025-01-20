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
      localStorage.removeItem('token');
      const response = await fetch(`${API_URL}/users/logout`, {
        method: 'POST',
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

  async getPermits(searchParams = {}) {
    try {
      // Build query string from search params
      const queryParams = new URLSearchParams();
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value) {
          queryParams.append(key, value);
        }
      });
  
      // Make the request
      const response = await fetch(`${API_URL}/permits?${queryParams.toString()}`, {
        method: 'GET',
        credentials: 'include',
        headers: getAuthHeaders(),
      });
  
      // Log the full response for debugging
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
  
      // Check if response is OK
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      // Try to parse the response as JSON
      const data = await response.json();
      console.log('Response data:', data);
  
      // Format the permits data
      const formattedPermits = Array.isArray(data) ? data.map(permit => ({
        JobPermitID: permit.JobPermitID,
        PermitReceiver: permit.PermitReceiver,
        ContractCompanyName: permit.ContractCompanyName || 'N/A',
        Status: permit.Status,
        Created: permit.Created,
      })) : [];
  
      return {
        data: formattedPermits,
        total: formattedPermits.length,
        success: true
      };
  
    } catch (error) {
      console.error('Error fetching permits:', error);
      return {
        data: [],
        total: 0,
        success: false,
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

  // Add search permits method
  async searchPermits(searchParams) {
    try {
      const queryParams = new URLSearchParams();
      
      // Map and add search parameters
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value) {
          queryParams.append(key, value);
        }
      });

      const response = await fetch(`${API_URL}/permits/search?${queryParams.toString()}`, {
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
        data: data.permits,
        total: data.total,
        success: true
      };

    } catch (error) {
      console.error('Error searching permits:', error);
      return {
        data: [],
        total: 0,
        success: false,
        error: error.message || 'Failed to search permits'
      };
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