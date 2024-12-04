// Helper function for making authenticated requests
const makeAuthenticatedRequest = async (url, options = {}) => {
    const token = localStorage.getItem('token');
    
    // For debugging
    console.log('Using token:', token);

    if (!token) {
        throw new Error('No authentication token found');
    }

    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
    };

    // For debugging
    console.log('Request headers:', headers);

    const response = await fetch(url, {
        ...options,
        headers
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Request failed');
    }

    return response.json();
};
