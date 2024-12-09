const API_URL = 'http://localhost:4000/api';

async function makeAuthenticatedRequest(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    
    if (!token) {
        console.error('No token found');
        window.location.href = '/frontend/login.html';
        return;
    }

    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
    };

    console.log('Making request with headers:', headers);

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers
        });

        console.log('Response status:', response.status);

        const data = await response.json();

        if (!response.ok) {
            // Handle token expiration or invalidity
            if (response.status === 401) {
                console.error('Authentication failed:', data);
                localStorage.clear();
                window.location.href = '/frontend/login.html';
                return;
            }
            throw new Error(data.message || 'Request failed');
        }

        return data;
    } catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
}

module.exports = { makeAuthenticatedRequest }; 