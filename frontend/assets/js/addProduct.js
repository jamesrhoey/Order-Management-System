// API URL
const API_URL = 'http://localhost:4000/api';

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
                <td colspan="5" class="text-center">No products found</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = products.map(product => `
        <tr>
            <td>${product._id}</td>
            <td>${product.productName}</td>
            <td>${product.price}</td>
            <td>
                <div>
                    <span>${product.ingredients.slice(0, 3).join(', ')}...</span>
                    <button class="btn btn-text text-dark p-0" data-bs-toggle="modal" 
                            data-bs-target="#ingredientsModal" 
                            onclick="showIngredients('${product.ingredients.join(', ')}')">
                        See More
                    </button>
                </div>
            </td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="deleteProduct('${product._id}')">
                    Delete
                </button>
            </td>
        </tr>
    `).join('');
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