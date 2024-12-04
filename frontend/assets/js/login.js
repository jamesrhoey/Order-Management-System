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
            // Store the token
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Show success message with gif
            await Swal.fire({
                title: 'Login Successful',
                html: '<div>Redirecting to your dashboard...</div>',
                imageUrl: '/frontend/assets/images/loading.gif',
                imageAlt: 'Loading...',
                allowOutsideClick: false,
                showConfirmButton: false,
                timerProgressBar: true,
                timer: 2000,
                width: '300px',
                imageWidth: 150,
                imageHeight: 150
            });

            // Redirect to dashboard
            window.location.href = '/frontend/index.html';
        } else {
            const Toast = Swal.mixin({
                toast: true,
                position: "top-end",
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
                didOpen: (toast) => {
                    toast.onmouseenter = Swal.stopTimer;
                    toast.onmouseleave = Swal.resumeTimer;
                }
            });
            
            Toast.fire({
                icon: "error",
                title: data.message || 'Login failed'
            });
        }
    } catch (error) {
        const Toast = Swal.mixin({
            toast: true,
            position: "top-end",
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            didOpen: (toast) => {
                toast.onmouseenter = Swal.stopTimer;
                toast.onmouseleave = Swal.resumeTimer;
            }
        });
        
        Toast.fire({
            icon: "error",
            title: "Something went wrong. Please try again."
        });
    }
});
