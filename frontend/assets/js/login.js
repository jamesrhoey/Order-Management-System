// Define the handleLogin function
async function handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        // Show loading state
        Swal.fire({
            title: 'Logging in...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const response = await fetch('http://localhost:4000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        
        // Close loading state
        Swal.close();

        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Login failed');
        }

        // Store token and user info in localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify({
            id: data.user.id,
            username: data.user.username
        }));

        // Show success message
        await Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: data.message || 'Login successful',
            timer: 1000,
            showConfirmButton: false
        });

        // Redirect to dashboard
        window.location.href = 'index.html';

    } catch (error) {
        console.error('Login error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Login Failed',
            text: error.message || 'An error occurred during login',
            confirmButtonText: 'Try Again'
        });
    }
}

// Add event listener when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Check token on page load
    const token = localStorage.getItem('token');
    // Only redirect if we're not already on the login page
    if ((!token || !isValidJWT(token)) && !window.location.pathname.includes('login.html')) {
        localStorage.clear();
        setTimeout(() => {
            window.location.href = '/frontend/login.html';
        }, 100);
    }
});

// Token validation function
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
