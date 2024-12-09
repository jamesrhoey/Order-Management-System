    document.addEventListener('DOMContentLoaded', function() {
        fetchTransactions();
    });

    let currentPage = 1;
    const itemsPerPage = 7;
    let selectedDate = new Date().toISOString().split('T')[0];

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
        
        // Update modal content with new design
        modalElement.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header" style="background-color: #1a1a1a; color: white;">
                        <h5 class="modal-title">
                            <i class="fa fa-info-circle me-2"></i>Transaction Details
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <h6 class="fw-bold">Customer Name:</h6>
                            <p>${customerName || 'N/A'}</p>
                        </div>
                        <div class="mb-3">
                            <h6 class="fw-bold">Products:</h6>
                            <p>${products || 'N/A'}</p>
                        </div>
                        <div class="mb-3">
                            <h6 class="fw-bold">Total Amount:</h6>
                            <p>${formattedAmount}</p>
                        </div>
                        <div class="mb-3">
                            <h6 class="fw-bold">Payment Method:</h6>
                            <p><span class="badge ${getPaymentMethodBadgeClass(paymentMethod)}">${paymentMethod || 'N/A'}</span></p>
                        </div>
                        <div class="mb-3">
                            <h6 class="fw-bold">Delivery Address:</h6>
                            <p>${deliveryAddress || 'N/A'}</p>
                        </div>
                        <div class="mb-3">
                            <h6 class="fw-bold">Contact Number:</h6>
                            <p>${contactNumber || 'N/A'}</p>
                        </div>
                        <div class="mb-3">
                            <h6 class="fw-bold">Notes:</h6>
                            <p>${notes || 'No notes provided'}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        modal.show();
    }

    // Add helper function for payment method badge
    function getPaymentMethodBadgeClass(method) {
        if (!method) return 'bg-secondary';
        
        switch (method.toLowerCase()) {
            case 'cash':
                return 'bg-success';
            case 'gcash':
                return 'bg-primary';
            default:
                return 'bg-secondary';
        }
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

    function filterTransactionsByDate(date) {
        selectedDate = date;
        fetchTransactions();
    }

    function displayTransactions(transactions) {
        const tableBody = document.getElementById('transactionTableBody');
        tableBody.innerHTML = '';
        
        // Remove existing controls if they exist
        const existingControls = document.querySelector('.transactions-controls');
        if (existingControls) {
            existingControls.remove();
        }
        
        // Add date picker and print button controls
        const controls = `
            <div class="d-flex justify-content-between align-items-center mb-3 transactions-controls">
                <div class="d-flex align-items-center gap-2">
                    <input type="date" 
                           class="form-control" 
                           onchange="filterTransactionsByDate(this.value)"
                           value="${selectedDate}"
                           style="width: auto;">
                </div>
                <div class="d-flex gap-2">
                    <button onclick="printAllTransactions()" class="btn btn-secondary">
                        <i class="fas fa-print me-2"></i>Print All
                    </button>
                    <button onclick="printTransactions()" class="btn btn-primary">
                        <i class="fas fa-print me-2"></i>Print Daily
                    </button>
                </div>
            </div>
        `;
        document.querySelector('.table-responsive').insertAdjacentHTML('beforebegin', controls);

        // Filter transactions by date
        let filteredTransactions = transactions;
        if (selectedDate) {
            const selectedDateStr = new Date(selectedDate).toDateString();
            filteredTransactions = transactions.filter(transaction => {
                const transactionDate = new Date(transaction.transactionDate).toDateString();
                return transactionDate === selectedDateStr;
            });
        }

        // If no transactions, show message
        if (!Array.isArray(filteredTransactions) || filteredTransactions.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-4">
                        <i class="fa fa-info-circle me-2"></i>
                        No transactions found for ${new Date(selectedDate).toLocaleDateString()}
                    </td>
                </tr>
            `;
            updateTableInfo(filteredTransactions || []);
            renderPaginationControls(0);
            return;
        }

        // Calculate pagination
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const paginatedTransactions = filteredTransactions.slice(start, end);

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
                        <td>
                            <div class="d-flex align-items-center" style="max-width: 200px;">
                                <div class="d-flex align-items-center gap-2 text-start">
                                    <i class="fas fa-user-circle text-primary" style="font-size: 1.5rem;"></i>
                                    <div class="text-truncate" style="max-width: 150px;" title="${transaction.orderId.customerName || 'N/A'}">
                                        ${transaction.orderId.customerName || 'N/A'}
                                    </div>
                                </div>
                            </div>
                        </td>
                        <td>
                            <a href="#" class="text-primary text-decoration-none" 
                               onclick="viewOrderDetails(
                                   '${escapedProducts}',
                                   '${escapedAddress}',
                                   '${transaction.orderId.contactNumber || 'N/A'}',
                                   '${escapedNotes}',
                                   ${transaction.amount},
                                   '${transaction.paymentMethod || 'N/A'}',
                                   '${transaction.orderId.customerName || 'N/A'}'
                               )">
                                <i class="fas fa-eye me-1"></i>View Details
                            </a>
                        </td>
                        <td>₱${transaction.amount ? transaction.amount.toFixed(2) : '0.00'}</td>
                    </tr>
                `;
                tableBody.innerHTML += row;
            }
        });

        // Update the table info with the filtered transactions array
        updateTableInfo(filteredTransactions);
        
        // Update pagination controls
        renderPaginationControls(filteredTransactions.length);
    }

    // Add new function for printing all transactions
    async function printAllTransactions() {
        try {
            const response = await fetch('http://localhost:4000/api/transactions');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const result = await response.json();
            const transactions = result.data;

            // Create print content
            const printContent = `
                <div class="p-4">
                    <div class="text-center mb-4">
                        <h2>Complete Transaction Report</h2>
                        <p>Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
                    </div>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr>
                                <th style="border: 1px solid #000; padding: 8px;">No.</th>
                                <th style="border: 1px solid #000; padding: 8px;">Date</th>
                                <th style="border: 1px solid #000; padding: 8px;">Customer</th>
                                <th style="border: 1px solid #000; padding: 8px;">Amount</th>
                                <th style="border: 1px solid #000; padding: 8px;">Payment Method</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${transactions.map((transaction, index) => `
                                <tr>
                                    <td style="border: 1px solid #000; padding: 8px;">${index + 1}</td>
                                    <td style="border: 1px solid #000; padding: 8px;">${new Date(transaction.transactionDate).toLocaleDateString()}</td>
                                    <td style="border: 1px solid #000; padding: 8px;">${transaction.orderId?.customerName || 'N/A'}</td>
                                    <td style="border: 1px solid #000; padding: 8px;">₱${transaction.amount ? transaction.amount.toFixed(2) : '0.00'}</td>
                                    <td style="border: 1px solid #000; padding: 8px;">${transaction.paymentMethod || 'N/A'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <div style="margin-top: 20px;">
                        <p style="margin: 5px 0;"><strong>Total Transactions:</strong> ${transactions.length}</p>
                        <p style="margin: 5px 0;"><strong>Total Amount:</strong> ₱${transactions.reduce((sum, t) => sum + (t.amount || 0), 0).toFixed(2)}</p>
                    </div>
                </div>
            `;

            // Create a temporary container
            const printContainer = document.createElement('div');
            printContainer.innerHTML = printContent;
            document.body.appendChild(printContainer);

            // Configure pdf options
            const opt = {
                margin: 0.5,
                filename: `all-transactions-${new Date().toISOString().split('T')[0]}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
            };

            // Generate PDF
            html2pdf().set(opt).from(printContainer).save().then(() => {
                document.body.removeChild(printContainer);
            });

        } catch (error) {
            console.error('Error generating PDF:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to generate PDF. Please try again.'
            });
        }
    }

    // Keep the existing printTransactions function
    async function printTransactions() {
        try {
            const response = await fetch('http://localhost:4000/api/transactions');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const result = await response.json();
            let transactions = result.data;

            // Filter transactions by selected date
            const selectedDateStr = new Date(selectedDate).toDateString();
            transactions = transactions.filter(transaction => {
                const transactionDate = new Date(transaction.transactionDate).toDateString();
                return transactionDate === selectedDateStr;
            });

            // Create print content
            const printContent = `
                <div class="p-4">
                    <div class="text-center mb-4">
                        <h2>Daily Transaction Report</h2>
                        <p>Date: ${new Date(selectedDate).toLocaleDateString()}</p>
                        <p>Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
                    </div>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr>
                                <th style="border: 1px solid #000; padding: 8px;">No.</th>
                                <th style="border: 1px solid #000; padding: 8px;">Date</th>
                                <th style="border: 1px solid #000; padding: 8px;">Customer</th>
                                <th style="border: 1px solid #000; padding: 8px;">Amount</th>
                                <th style="border: 1px solid #000; padding: 8px;">Payment Method</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${transactions.map((transaction, index) => `
                                <tr>
                                    <td style="border: 1px solid #000; padding: 8px;">${index + 1}</td>
                                    <td style="border: 1px solid #000; padding: 8px;">${new Date(transaction.transactionDate).toLocaleDateString()}</td>
                                    <td style="border: 1px solid #000; padding: 8px;">${transaction.orderId?.customerName || 'N/A'}</td>
                                    <td style="border: 1px solid #000; padding: 8px;">₱${transaction.amount ? transaction.amount.toFixed(2) : '0.00'}</td>
                                    <td style="border: 1px solid #000; padding: 8px;">${transaction.paymentMethod || 'N/A'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <div style="margin-top: 20px;">
                        <p style="margin: 5px 0;"><strong>Total Transactions:</strong> ${transactions.length}</p>
                        <p style="margin: 5px 0;"><strong>Total Amount:</strong> ₱${transactions.reduce((sum, t) => sum + (t.amount || 0), 0).toFixed(2)}</p>
                    </div>
                </div>
            `;

            // Create a temporary container
            const printContainer = document.createElement('div');
            printContainer.innerHTML = printContent;
            document.body.appendChild(printContainer);

            // Configure pdf options
            const opt = {
                margin: 0.5,
                filename: `daily-transactions-${selectedDate}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
            };

            // Generate PDF
            html2pdf().set(opt).from(printContainer).save().then(() => {
                document.body.removeChild(printContainer);
            });

        } catch (error) {
            console.error('Error generating PDF:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to generate PDF. Please try again.'
            });
        }
    }

    // Make sure to call displayTransactions whenever you load or update the transactions
    // For example:
    fetch('http://localhost:4000/api/transactions')
        .then(response => response.json())
        .then(result => {
            const transactions = result.data;
            if (!Array.isArray(transactions)) {
                throw new Error('Invalid data format received from server');
            }
            displayTransactions(transactions);
        })
        .catch(error => {
            console.error('Error:', error);
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
        });

