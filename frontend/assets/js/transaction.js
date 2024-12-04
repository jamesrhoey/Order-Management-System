    document.addEventListener('DOMContentLoaded', function() {
        fetchTransactions();
    });

    let currentPage = 1;
    const itemsPerPage = 8;

    function renderTransactions(transactions) {
        const tableBody = document.getElementById('transactionTableBody');
        tableBody.innerHTML = '';

        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const paginatedTransactions = transactions.slice(start, end);

        paginatedTransactions.forEach(transaction => {
            if (transaction.orderId) {
                const transactionDate = new Date(transaction.transactionDate).toLocaleDateString();
                const escapedProducts = (transaction.orderId.products || 'N/A').replace(/'/g, "\\'");
                const escapedAddress = (transaction.orderId.deliveryAddress || 'N/A').replace(/'/g, "\\'");
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
                                        '${transaction.orderId.contactNumber || 'N/A'}',
                                        '${escapedNotes}',
                                        ${transaction.amount},
                                        '${transaction.paymentMethod || 'N/A'}',
                                        '${transaction.orderId.customerName || 'N/A'}'
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

        // Create pagination container
        const paginationContainer = document.createElement('div');
        paginationContainer.className = 'pagination-container d-flex gap-2';

        // Previous button
        const prevButton = document.createElement('button');
        prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
        prevButton.className = `btn btn-outline-secondary ${currentPage === 1 ? 'disabled' : ''}`;
        prevButton.onclick = () => {
            if (currentPage > 1) {
                currentPage--;
                fetchTransactions();
            }
        };
        paginationContainer.appendChild(prevButton);

        // Page numbers
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, startPage + 4);

        // Adjust start page if we're near the end
        if (endPage - startPage < 4) {
            startPage = Math.max(1, endPage - 4);
        }

        // First page and ellipsis
        if (startPage > 1) {
            const firstButton = createPageButton(1);
            paginationContainer.appendChild(firstButton);
            if (startPage > 2) {
                const ellipsis = document.createElement('span');
                ellipsis.className = 'btn btn-outline-secondary disabled';
                ellipsis.textContent = '...';
                paginationContainer.appendChild(ellipsis);
            }
        }

        // Page numbers
        for (let i = startPage; i <= endPage; i++) {
            const pageButton = createPageButton(i);
            paginationContainer.appendChild(pageButton);
        }

        // Last page and ellipsis
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                const ellipsis = document.createElement('span');
                ellipsis.className = 'btn btn-outline-secondary disabled';
                ellipsis.textContent = '...';
                paginationContainer.appendChild(ellipsis);
            }
            const lastButton = createPageButton(totalPages);
            paginationContainer.appendChild(lastButton);
        }

        // Next button
        const nextButton = document.createElement('button');
        nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
        nextButton.className = `btn btn-outline-secondary ${currentPage === totalPages ? 'disabled' : ''}`;
        nextButton.onclick = () => {
            if (currentPage < totalPages) {
                currentPage++;
                fetchTransactions();
            }
        };
        paginationContainer.appendChild(nextButton);

        paginationControls.appendChild(paginationContainer);
    }

    // Helper function to create page buttons
    function createPageButton(pageNumber) {
        const button = document.createElement('button');
        button.textContent = pageNumber;
        button.className = `btn ${currentPage === pageNumber ? 'btn-primary' : 'btn-outline-primary'}`;
        button.onclick = () => {
            if (currentPage !== pageNumber) {
                currentPage = pageNumber;
                fetchTransactions();
            }
        };
        return button;
    }

    async function fetchTransactions() {
        try {
            const response = await fetch('http://localhost:4000/api/transactions');
            
            if (!response.ok) {
                console.log('Response status:', response.status);
                console.log('Response text:', await response.text());
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            const transactions = result.data;
            
            if (!Array.isArray(transactions)) {
                throw new Error('Invalid data format received from server');
            }

            displayTransactions(transactions);
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

    function viewOrderDetails(products, deliveryAddress, contactNumber, notes, amount, paymentMethod, customerName) {
        const modalElement = document.getElementById('viewTransactionDetailsModal');
        
        if (!modalElement) {
            console.error('Modal element not found');
            return;
        }
        
        const modal = new bootstrap.Modal(modalElement);
        
        const formattedAmount = new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(amount);
        
        document.getElementById('viewCustomerName').textContent = customerName || 'N/A';
        document.getElementById('viewTransactionItems').textContent = products || 'N/A';
        document.getElementById('viewTotalAmount').textContent = formattedAmount;
        document.getElementById('viewPaymentMethod').textContent = paymentMethod || 'N/A';
        document.getElementById('viewDeliveryAddress').textContent = deliveryAddress || 'N/A';
        document.getElementById('viewContactNumber').textContent = contactNumber || 'N/A';
        document.getElementById('viewNotes').textContent = notes || 'No notes provided';
        
        document.getElementById('viewTransactionItems').parentElement.style.display = 'block';
        document.getElementById('viewDeliveryAddress').parentElement.style.display = 'block';
        document.getElementById('viewContactNumber').parentElement.style.display = 'block';
        
        modal.show();
    }

    function updateTableInfo(transactions) {
        const totalEntries = transactions.length;
        const startEntry = totalEntries === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1;
        const endEntry = Math.min(currentPage * itemsPerPage, totalEntries);

        // Update the display
        document.getElementById('startEntry').textContent = startEntry;
        document.getElementById('endEntry').textContent = endEntry;
        document.getElementById('totalEntries').textContent = totalEntries;
    }

    function displayTransactions(transactions) {
        const tableBody = document.getElementById('transactionTableBody');
        tableBody.innerHTML = '';
        
        // Calculate pagination
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const paginatedTransactions = transactions.slice(start, end);

        // If no transactions, show message
        if (transactions.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center">
                        No transactions found
                    </td>
                </tr>
            `;
        } else {
            paginatedTransactions.forEach((transaction, index) => {
                if (transaction.orderId) {
                    const transactionDate = new Date(transaction.transactionDate).toLocaleDateString();
                    const escapedProducts = (transaction.orderId.products || 'N/A').replace(/'/g, "\\'");
                    const escapedAddress = (transaction.orderId.deliveryAddress || 'N/A').replace(/'/g, "\\'");
                    const escapedNotes = (transaction.notes || 'No notes').replace(/'/g, "\\'");
                    
                    // Calculate the global index
                    const globalIndex = start + index + 1;
                    
                    const row = `
                        <tr>
                            <td>${globalIndex}</td>
                            <td>${transactionDate}</td>
                            <td>${transaction.orderId.customerName || 'N/A'}</td>
                            <td>
                                <button class="btn btn-link text-primary text-decoration-none" 
                                        onclick="viewOrderDetails(
                                            '${escapedProducts}',
                                            '${escapedAddress}',
                                            '${transaction.orderId.contactNumber || 'N/A'}',
                                            '${escapedNotes}',
                                            ${transaction.amount},
                                            '${transaction.paymentMethod || 'N/A'}',
                                            '${transaction.orderId.customerName || 'N/A'}'
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
        }

        // Update the table info with the full transactions array
        updateTableInfo(transactions);
        
        // Update pagination controls
        renderPaginationControls(transactions.length);
    }
    // Make sure to call displayTransactions whenever you load or update the transactions
    // For example:
    fetch('your-api-endpoint')
        .then(response => response.json())
        .then(transactions => {
            displayTransactions(transactions);
        })
        .catch(error => console.error('Error:', error));

