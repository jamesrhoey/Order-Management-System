document.getElementById('loginForm').addEventListener('submit', async (e) => {
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

        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }

        // Store token and user info in localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify({
            id: data.user.id,
            username: data.user.username
        }));

        console.log('Authentication Token:', data.token);
        console.log('User Data:', data.user);

        // Show success message
        Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: 'Login successful',
            timer: 1000,
            showConfirmButton: false
        }).then(() => {
            // Redirect to dashboard
            window.location.href = 'index.html';
        });

    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Login Failed',
            text: error.message
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
    // Only redirect if we're not already on the login page
    if ((!token || !isValidJWT(token)) && !window.location.pathname.includes('login.html')) {
        localStorage.clear();
        setTimeout(() => {
            window.location.href = '/frontend/login.html';
        }, 100);
    }
});
