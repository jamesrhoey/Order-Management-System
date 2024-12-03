    document.addEventListener('DOMContentLoaded', function() {
        fetchTransactions();
    });

    let currentPage = 1;
    const itemsPerPage = 10;

    function renderTransactions(transactions) {
        const tableBody = document.getElementById('transactionTableBody');
        tableBody.innerHTML = '';

        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const paginatedTransactions = transactions.slice(start, end);

        paginatedTransactions.forEach(transaction => {
            if (transaction.orderId) {
                const transactionDate = new Date(transaction.transactionDate).toLocaleDateString();
                const escapedProducts = (transaction.products || 'N/A').replace(/'/g, "\\'");
                const escapedAddress = (transaction.deliveryAddress || 'N/A').replace(/'/g, "\\'");
                const escapedNotes = (transaction.notes || 'No notes').replace(/'/g, "\\'");
                
                const row = `
                    <tr>
                        <td>${transaction._id || 'N/A'}</td>
                        <td>${transactionDate}</td>
                        <td>${transaction.orderId.customerName || 'N/A'}</td>
                        <td>
                            <button class="btn btn-link text-primary text-decoration-none" 
                                    onclick="viewOrderDetails(
                                        '${escapedProducts}',
                                        '${escapedAddress}',
                                        '${transaction.contactNumber || 'N/A'}',
                                        '${escapedNotes}',
                                        ${transaction.amount},
                                        '${transaction.paymentMethod || 'N/A'}'
                                    )">
                                View Details
                            </button>
                        </td>
                        <td>₱${transaction.amount ? transaction.amount.toFixed(2) : '0.00'}</td>
                    </tr>
                `;
                tableBody.innerHTML += row;
            }
        });

        renderPaginationControls(transactions.length);
    }

    function renderPaginationControls(totalItems) {
        const paginationControls = document.getElementById('paginationControls');
        paginationControls.innerHTML = '';

        const totalPages = Math.ceil(totalItems / itemsPerPage);

        for (let i = 1; i <= totalPages; i++) {
            const button = document.createElement('button');
            button.textContent = i;
            button.className = 'btn btn-secondary mx-1';
            button.onclick = () => {
                currentPage = i;
                fetchTransactions();
            };
            paginationControls.appendChild(button);
        }
    }

    async function fetchTransactions() {
        try {
            const response = await fetch('http://localhost:4000/api/transactions');
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message || 'Failed to fetch transactions');
            }

            const transactions = result.data;
            
            if (!Array.isArray(transactions)) {
                throw new Error('Invalid data format received from server');
            }

            renderTransactions(transactions);
        } catch (error) {
            console.error('Error fetching transactions:', error);
            const tableBody = document.getElementById('transactionTableBody');
            if (tableBody) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center text-danger">
                            Error loading transactions. Please try again later.
                        </td>
                    </tr>
                `;
            }
        }
    }

    function viewOrderDetails(products, deliveryAddress, contactNumber, notes, amount, paymentMethod) {
        // Get the modal element first
        const modalElement = document.getElementById('viewTransactionDetailsModal');
        
        // Check if the modal element exists
        if (!modalElement) {
            console.error('Modal element not found');
            return;
        }
        
        // Initialize the modal
        const modal = new bootstrap.Modal(modalElement);
        
        // Format the amount with commas and 2 decimal places
        const formattedAmount = new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(amount);
        
        // Set the modal content
        document.getElementById('viewTransactionItems').textContent = products || 'No products listed';
        document.getElementById('viewTotalAmount').textContent = formattedAmount;
        document.getElementById('viewPaymentMethod').textContent = paymentMethod || 'N/A';
        document.getElementById('viewDeliveryAddress').textContent = deliveryAddress || 'N/A';
        document.getElementById('viewContactNumber').textContent = contactNumber || 'N/A';
        document.getElementById('viewNotes').textContent = notes || 'No notes provided';
        
        // Show the modal
        modal.show();
    }
