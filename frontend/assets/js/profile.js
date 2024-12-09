const API_URL = 'http://localhost:4000/api';

// Load profile information
async function loadProfile() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login.html';
            return;
        }

        const response = await fetch(`${API_URL}/users/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load profile');
        }

        const data = await response.json();
        
        // Update profile information
        document.getElementById('adminUsername').textContent = data.username;
        document.getElementById('profileUsername').textContent = data.username;
        document.getElementById('profileCreatedAt').textContent = new Date(data.createdAt).toLocaleDateString();
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load profile information'
        });
    }
}

// Change Password
document.getElementById('changePasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;

    if (newPassword !== confirmNewPassword) {
        Swal.fire({
            icon: 'error',
            title: 'Password Mismatch',
            text: 'New passwords do not match!'
        });
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/users/change-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                currentPassword,
                newPassword
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to change password');
        }

        Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'Password updated successfully'
        });

        // Close modal and reset form
        const modal = bootstrap.Modal.getInstance(document.getElementById('changePasswordModal'));
        modal.hide();
        e.target.reset();

    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message
        });
    }
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
    Swal.fire({
        title: 'Logout',
        text: 'Are you sure you want to logout?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, logout'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.removeItem('token');
            window.location.href = './login.html';
        }
    });
});
function goBack() {
    if (document.referrer) {
        // Go back to the previous page if there is one
        window.location.href = document.referrer;
    } else {
        // Default to index.html if there's no referrer
        window.location.href = 'index.html';
    }
}
// Load profile when page loads
document.addEventListener('DOMContentLoaded', loadProfile);
