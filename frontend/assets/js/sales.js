// Constants
const API_URL = 'http://localhost:4000/api';

// Function to fetch sales data
async function fetchSales() {
    try {
        const token = localStorage.getItem('token');
        console.log('Token from localStorage:', token); // Debug log

        if (!token) {
            console.error('No token found');
            window.location.href = '/frontend/login.html';
            return;
        }

        const response = await fetch(`${API_URL}/sales`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch sales');
        }

        return data;
    } catch (error) {
        console.error('Error fetching sales:', error);
        throw error;
    }
}

// Function to display sales in a table
async function displaySales() {
    try {
        const result = await fetchSales();
        const salesData = result.data;
        const tableBody = document.getElementById('salesTableBody');
        
        if (!tableBody) {
            console.error('Sales table body not found');
            return;
        }

        tableBody.innerHTML = '';

        salesData.forEach(sale => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${sale._id}</td>
                <td>${new Date(sale.saleDate).toLocaleDateString()}</td>
                <td>${sale.customerDetails?.name || 'N/A'}</td>
                <td>₱${sale.totalAmount.toFixed(2)}</td>
                <td>${sale.paymentStatus}</td>
                <td>
                    <button class="btn btn-info btn-sm" onclick="viewSaleDetails('${sale._id}')">
                        View
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteSale('${sale._id}')">
                        Delete
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error displaying sales:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load sales data'
        });
    }
}

// Function to view sale details
async function viewSaleDetails(saleId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/sales/${saleId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message);
        }

        const sale = data.data;
        
        Swal.fire({
            title: 'Sale Details',
            html: `
                <div class="text-left">
                    <p><strong>Sale ID:</strong> ${sale._id}</p>
                    <p><strong>Date:</strong> ${new Date(sale.saleDate).toLocaleString()}</p>
                    <p><strong>Customer:</strong> ${sale.customerDetails?.name || 'N/A'}</p>
                    <p><strong>Total Amount:</strong> ₱${sale.totalAmount.toFixed(2)}</p>
                    <p><strong>Payment Status:</strong> ${sale.paymentStatus}</p>
                    <p><strong>Items:</strong></p>
                    <ul>
                        ${sale.items.map(item => `
                            <li>${item.productId.productName} - ${item.quantity} x ₱${item.unitPrice.toFixed(2)}</li>
                        `).join('')}
                    </ul>
                </div>
            `,
            width: '600px'
        });
    } catch (error) {
        console.error('Error viewing sale details:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load sale details'
        });
    }
}

// Function to delete a sale
async function deleteSale(saleId) {
    try {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/sales/${saleId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message);
            }

            await Swal.fire(
                'Deleted!',
                'Sale has been deleted.',
                'success'
            );

            // Refresh the sales table
            await displaySales();
        }
    } catch (error) {
        console.error('Error deleting sale:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to delete sale'
        });
    }
}

// Add this function to create a test sale
async function createTestSale() {
    try {
        const token = localStorage.getItem('token');
        const testSale = {
            transactionId: "65f2d1234567890123456789", // You'll need a valid transaction ID
            items: [{
                productId: "65f2d1234567890123456789", // You'll need a valid product ID
                quantity: 1,
                unitPrice: 100,
                subtotal: 100
            }],
            totalAmount: 100,
            salesPerson: "admin",
            customerDetails: {
                name: "Test Customer",
                contact: "1234567890",
                email: "test@example.com"
            },
            paymentStatus: "Completed"
        };

        const response = await fetch(`${API_URL}/sales`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testSale)
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to create test sale');
        }

        Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'Test sale created successfully'
        });

        // Refresh the sales display
        await displaySales();
    } catch (error) {
        console.error('Error creating test sale:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to create test sale'
        });
    }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    displaySales();
});
