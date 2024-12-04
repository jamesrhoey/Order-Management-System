document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        console.log('Attempting login with:', { username });

        const response = await fetch('http://localhost:4000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);

        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }

        // Store the token
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Show success message
        await Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: 'Login successful',
            timer: 1500
        });

        // Redirect to dashboard
        window.location.href = '/frontend/index.html';

    } catch (error) {
        console.error('Full login error:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack
        });

        Swal.fire({
            icon: 'error',
            title: 'Login Failed',
            text: error.message || 'Unable to connect to the server'
        });
    }
});
