// API URL
const API_URL = 'http://localhost:4000/api';

// Add these variables at the top of the file
const ITEMS_PER_PAGE = 7;
let currentPage = 1;
let totalProducts = [];

// Fetch all products
async function fetchProducts() {
    try {
        const response = await fetch(`${API_URL}/products`, {
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
            
            // Get form elements
            const productNameInput = document.getElementById('productName');
            const productPriceInput = document.getElementById('productPrice');
            const productIngredientsInput = document.getElementById('productIngredients');

            // Validate that all required elements exist
            if (!productNameInput || !productPriceInput || !productIngredientsInput) {
                console.error('Required form elements not found');
                return;
            }

            const formData = {
                productId: Date.now().toString(),
                productName: productNameInput.value,
                price: Number(productPriceInput.value),
                ingredients: productIngredientsInput.value
            };

            try {
                console.log('Sending request to:', `${API_URL}/products`);
                console.log('Request payload:', formData);
                
                const response = await fetch(`${API_URL}/products`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Server response:', errorText);
                    throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
                }

                const result = await response.json();
                console.log('Success response:', result);
                
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: 'Product added successfully'
                });
                
                // Reset form and close modal
                addProductForm.reset();
                const modal = bootstrap.Modal.getInstance(document.getElementById('addProductModal'));
                if (modal) {
                    modal.hide();
                }
                
                // Refresh the products list
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
    }
});

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

// Display products in the table
function displayProducts(products) {
    const tbody = document.getElementById('userDetails');
    if (!products || products.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-4">
                    <i class="fa fa-info-circle me-2"></i>No products found
                </td>
            </tr>
        `;
        return;
    }

    // Store the products globally
    totalProducts = products;
    
    // Calculate pagination
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedProducts = products.slice(startIndex, endIndex);
    
    tbody.innerHTML = paginatedProducts.map((product, index) => {
        const ingredientsArray = Array.isArray(product.ingredients) ? product.ingredients : product.ingredients.split(',');
        
        return `
        <tr>
            <td>${startIndex + index + 1}</td>
            <td style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px;">
                <div class="d-flex align-items-center">
                    <i class="fas fa-utensils me-2"></i>
                    <span>${product.productName}</span>
                </div>
            </td>
            <td>₱${product.price.toFixed(2)}</td>
            <td>
                <a href="#" class="text-primary text-decoration-none" 
                   onclick="viewProductDetails('${product.productName}', '${product.price}', '${ingredientsArray.join(', ')}')">
                    <i class="fas fa-eye me-1"></i>View Ingredients
                </a>
            </td>
            <td class="text-center">
                <button class="btn btn-danger btn-sm" onclick="deleteProduct('${product._id}')">
                    <i class="fa fa-trash"></i>
                </button>
            </td>
        </tr>
        `;
    }).join('');

    // Update pagination controls
    renderPaginationControls(products.length);
}

// Replace the existing displayPagination function with this new one
function renderPaginationControls(totalItems) {
    const paginationControls = document.getElementById('pagination');
    paginationControls.innerHTML = '';
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

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
            displayProducts(totalProducts);
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
            displayProducts(totalProducts);
        }
    };
    paginationContainer.appendChild(nextButton);

    paginationControls.appendChild(paginationContainer);
}

// Add this helper function for creating page buttons
function createPageButton(pageNumber) {
    const button = document.createElement('button');
    button.textContent = pageNumber;
    button.className = `btn ${currentPage === pageNumber ? 'btn-primary' : 'btn-outline-primary'}`;
    button.onclick = () => {
        if (currentPage !== pageNumber) {
            currentPage = pageNumber;
            displayProducts(totalProducts);
        }
    };
    return button;
}

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

function viewProductDetails( ingredients) {
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
                        <i class="fa fa-info-circle me-2"></i>Ingredients
                    </h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <p>${ingredients || 'No ingredients listed'}</p>
                </div>
            </div>
        </div>
    `;
    
    modal.show();
}