    document.addEventListener('DOMContentLoaded', function() {
        fetchTransactions();
    });

    async function fetchTransactions() {
        try {
            const tableBody = document.getElementById('transactionTableBody');
            
            if (!tableBody) {
                console.error('Could not find element with ID "transactionTableBody"');
                return;
            }

            const response = await fetch('http://localhost:4000/api/transactions');
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message || 'Failed to fetch transactions');
            }

            const transactions = result.data;
            
            if (!Array.isArray(transactions)) {
                throw new Error('Invalid data format received from server');
            }

            tableBody.innerHTML = '';
            
            if (transactions.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center">No transactions found.</td>
                    </tr>
                `;
                return;
            }
            
            transactions.forEach(transaction => {
                if (transaction.orderId) {
                    const transactionDate = new Date(transaction.transactionDate).toLocaleDateString();
                    
                    // Escape special characters for the onclick attributes
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

            if (tableBody.innerHTML === '') {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center">No completed transactions found.</td>
                    </tr>
                `;
            }
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
        const modal = new bootstrap.Modal(document.getElementById('viewTransactionDetailsModal'));
        
        document.getElementById('viewTransactionItems').textContent = products;
        document.getElementById('viewTotalAmount').textContent = `₱${amount.toFixed(2)}`;
        document.getElementById('viewPaymentMethod').textContent = paymentMethod;
        document.getElementById('viewDeliveryAddress').textContent = deliveryAddress;
        document.getElementById('viewContactNumber').textContent = contactNumber;
        document.getElementById('viewNotes').textContent = notes || 'No notes provided';
        
        modal.show();
    }
