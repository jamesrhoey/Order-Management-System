// API URL
const API_URL = 'http://localhost:4000/api';

// Add these variables at the top of the file
const ITEMS_PER_PAGE = 7;
let currentPage = 1;
let totalProducts = [];
let currentCategory = '';

// Fetch all products
async function fetchProducts() {
    try {
        let url = `${API_URL}/products`;
        if (currentCategory) {
            url += `?category=${currentCategory}`;
        }
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        displayProducts(data);
    } catch (error) {
        console.error('Error fetching products:', error);
        Swal.fire({
            icon: 'error',
            title: 'Connection Error',
            text: 'Unable to connect to the server. Please make sure the server is running.',
            footer: 'Check if backend server is started on port 4000'
        });
    }
}

// Add new product
document.addEventListener('DOMContentLoaded', function() {
    const addProductForm = document.getElementById('addProductForm');
    
    if (addProductForm) {
        addProductForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const productName = document.getElementById('productName').value.trim();
            const productCategory = document.getElementById('productCategory').value;
            const productPrice = document.getElementById('productPrice').value;
            const ingredientsText = document.getElementById('productIngredients').value.trim();

            // Validate category
            if (!productCategory) {
                Swal.fire({
                    icon: 'error',
                    title: 'Invalid Input',
                    text: 'Please select a category'
                });
                return;
            }

            // Validate ingredients format
            if (!ingredientsText.includes(',')) {
                Swal.fire({
                    icon: 'error',
                    title: 'Invalid Format',
                    text: 'Please separate ingredients with commas'
                });
                return;
            }

            // Convert ingredients string to array and clean up
            const ingredients = ingredientsText
                .split(',')
                .map(item => item.trim())
                .filter(item => item.length > 0);

            if (ingredients.length === 0) {
                Swal.fire({
                    icon: 'error',
                    title: 'Invalid Input',
                    text: 'Please enter at least one ingredient'
                });
                return;
            }

            // Create the request payload
            const productData = {
                productId: Date.now().toString(),
                productName: productName,
                category: productCategory,
                price: Number(productPrice),
                ingredients: ingredients
            };

            console.log('Sending product data:', productData); // Debug log

            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    window.location.href = '/frontend/login.html';
                    return;
                }

                const response = await fetch('http://localhost:4000/api/products', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(productData)
                });

                const data = await response.json();
                console.log('Server response:', data);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}, message: ${JSON.stringify(data)}`);
                }

                // Success handling
                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: 'Product added successfully'
                });

                // Clear form and close modal
                addProductForm.reset();
                const modal = bootstrap.Modal.getInstance(document.getElementById('addProductModal'));
                modal.hide();

                // Refresh product list
                await fetchProducts();

            } catch (error) {
                console.error('Error adding product:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to add product. Please try again.'
                });
            }
        });

        // Add real-time validation for ingredients
        const ingredientsInput = document.getElementById('productIngredients');
        ingredientsInput.addEventListener('input', function() {
            const value = this.value.trim();
            const words = value.split(' ').filter(word => word.length > 0);
            const hasComma = value.includes(',');
            
            // Only show validation error if there are multiple words without commas
            if (words.length > 1 && !hasComma) {
                this.classList.add('is-invalid');
                // Remove existing feedback if any
                const existingFeedback = this.nextElementSibling;
                if (existingFeedback?.classList.contains('invalid-feedback')) {
                    existingFeedback.remove();
                }
                // Add new feedback
                const feedback = document.createElement('div');
                feedback.className = 'invalid-feedback';
                feedback.textContent = 'Please separate ingredients with commas';
                this.parentNode.appendChild(feedback);
            } else {
                this.classList.remove('is-invalid');
                const existingFeedback = this.nextElementSibling;
                if (existingFeedback?.classList.contains('invalid-feedback')) {
                    existingFeedback.remove();
                }
            }
        });
    }

    // Add category filter handler
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function() {
            currentCategory = this.value;
            currentPage = 1; // Reset to first page when filtering
            fetchProducts();
        });
    }

    // Initial products load
    fetchProducts();
});

// Add this function to check if the token exists
function checkAuthentication() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/frontend/login.html';
        return false;
    }
    return true;
}

// Delete product
async function deleteProduct(productId) {
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
            const response = await fetch(`${API_URL}/products/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            Swal.fire(
                'Deleted!',
                'Product has been deleted.',
                'success'
            );
            
            await fetchProducts();
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to delete product. Please try again.'
        });
    }
}

// Add this helper function for category badge styling
function getCategoryBadgeClass(category) {
    switch (category) {
        case 'Starters':
            return 'bg-info text-white';
        case 'Pasta':
            return 'bg-warning text-dark';
        case 'Mains':
            return 'bg-success text-white';
        case 'Dessert':
            return 'bg-danger text-white';
        default:
            return 'bg-secondary text-white';
    }
}

// Display products in the table
function displayProducts(products) {
    const tableBody = document.getElementById('userDetails');
    if (!tableBody) return;

    // Calculate pagination
    totalProducts = products;
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedProducts = products.slice(startIndex, endIndex);

    // Clear existing content
    tableBody.innerHTML = '';

    if (products.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="5" class="text-center py-4">
                <i class="fas fa-search me-2"></i>
                No products found${currentCategory ? ` in category "${currentCategory}"` : ''}.
            </td>
        `;
        tableBody.appendChild(row);
        return;
    }

    // Add products to table
    paginatedProducts.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.productId}</td>
            <td>${product.productName}</td>
            <td>₱${product.price}</td>
            <td>
                <button class="btn  text-primary" onclick="viewProductDetails('${product.productName}', '${product.category}', ${product.price}, '${product.ingredients.join(', ')}')">
                    <i class="fas fa-eye"></i> View Details
                </button>
            </td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="deleteProduct('${product._id}')">Delete</button>
            </td>
        `;
        tableBody.appendChild(row);
    });

    // Update pagination controls
    updatePaginationControls(products.length);
}

// Add the pagination control function
function updatePaginationControls(totalItems) {
    const paginationDiv = document.getElementById('pagination');
    if (!paginationDiv) return;

    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    
    // Clear existing pagination
    paginationDiv.innerHTML = '';
    
    // Don't show pagination if there's only one page or no items
    if (totalPages <= 1) return;

    // Create pagination container
    const nav = document.createElement('nav');
    const ul = document.createElement('ul');
    ul.className = 'pagination mb-0';

    // Previous button
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `
        <button class="page-link" onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    ul.appendChild(prevLi);

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${currentPage === i ? 'active' : ''}`;
        li.innerHTML = `
            <button class="page-link" onclick="changePage(${i})">${i}</button>
        `;
        ul.appendChild(li);
    }

    // Next button
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `
        <button class="page-link" onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
            <i class="fas fa-chevron-right"></i>
        </button>
    `;
    ul.appendChild(nextLi);

    nav.appendChild(ul);
    paginationDiv.appendChild(nav);
}

// Add the page change function
function changePage(newPage) {
    if (newPage < 1 || newPage > Math.ceil(totalProducts.length / ITEMS_PER_PAGE)) {
        return;
    }
    currentPage = newPage;
    displayProducts(totalProducts);
}

// Make sure these functions are available globally
window.changePage = changePage;

// Show ingredients modal
function showIngredients(ingredients) {
    document.getElementById('ingredientsContent').textContent = ingredients;
}

// Load products when page loads
document.addEventListener('DOMContentLoaded', fetchProducts);

// Add error event listener for server connection issues
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    Swal.fire({
        icon: 'error',
        title: 'Connection Error',
        text: 'Lost connection to the server. Please check your internet connection.',
        footer: 'Make sure the backend server is running'
    });
});

function viewProductDetails(productName, category, price, ingredients) {
    const modalElement = document.getElementById('viewProductDetailsModal');
    
    if (!modalElement) {
        console.error('Modal element not found');
        return;
    }
    
    const modal = new bootstrap.Modal(modalElement);
    
    modalElement.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header" style="background-color: #1a1a1a; color: white;">
                    <h5 class="modal-title">
                        <i class="fa fa-info-circle me-2"></i>${productName}
                    </h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="mb-3">
                        <h6 class="fw-bold">Category:</h6>
                        <span class="badge ${getCategoryBadgeClass(category)}">${category}</span>
                    </div>
                    <div class="mb-3">
                        <h6 class="fw-bold">Price:</h6>
                        <p>₱${price}</p>
                    </div>
                    <div class="mb-3">
                        <h6 class="fw-bold">Ingredients:</h6>
                        <ul class="list-unstyled">
                            ${ingredients.split(',').map(ingredient => `
                                <li class="mb-2">
                                    <i class="fas fa-check-circle text-success me-2"></i>
                                    ${ingredient.trim()}
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    modal.show();
}