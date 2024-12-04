document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('http://localhost:4000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        
        if (response.ok) {
            // Clear any existing data
            localStorage.clear();
            
            // Store the JWT token, not the secret
            localStorage.setItem('token', data.token);
            
            // Debug: Log the stored token
            const storedToken = localStorage.getItem('token');
            console.log('Stored token:', storedToken);

            // Store user data
            localStorage.setItem('user', JSON.stringify(data.user));

            // Redirect to dashboard
            window.location.href = '/frontend/index.html';
        } else {
            throw new Error(data.message || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Login Failed',
            text: error.message || 'An error occurred during login'
        });
    }
});

// Add this function to verify token format
function isValidJWT(token) {
    if (typeof token !== 'string') return false;
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    try {
        parts.forEach(part => atob(part.replace(/-/g, '+').replace(/_/g, '/')));
        return true;
    } catch (e) {
        return false;
    }
}

// Check token on page load
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token || !isValidJWT(token)) {
        localStorage.clear();
        window.location.href = '/frontend/login.html';
    }
});
