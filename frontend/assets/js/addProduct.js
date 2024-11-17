// Inside your handleUpdateProduct function
document.getElementById('addProductForm').addEventListener('submit', function updateFormSubmit(e) {
    e.preventDefault();

    const updatedProductName = document.getElementById('productName').value;
    const updatedProductPrice = document.getElementById('productPrice').value;
    const updatedProductIngredients = document.getElementById('productIngredients').value;
    const updatedProductImage = document.getElementById('productImage').files[0]; // Get the updated image

    // Create a new FormData object
    const formData = new FormData();
    formData.append('productName', updatedProductName);
    formData.append('price', updatedProductPrice);
    formData.append('ingredients', updatedProductIngredients);
    if (updatedProductImage) {
        formData.append('image', updatedProductImage); // Attach the image if it's provided
    }

    fetch(`http://localhost:4000/api/products/${productId}`, {
        method: 'PATCH',
        body: formData,  // Send FormData with the request
    })
    .then(response => response.json())
    .then(data => {
        console.log('Product updated:', data);
        fetchProducts();  // Refresh the product list after updating
        document.getElementById('addProductForm').reset();  // Clear the form
        const updateProductModal = bootstrap.Modal.getInstance(document.getElementById('addProductModal'));
        updateProductModal.hide();  // Hide the modal after update
    })
    .catch(error => {
        console.error('Error updating product:', error);
    });
});


// Function to fetch all products
// Function to fetch all products
// Function to fetch all products
function fetchProducts() {
    fetch('http://localhost:4000/api/products')
        .then(response => response.json())
        .then(data => {
            console.log('Fetched products:', data);

            // Clear the current product list
            const productList = document.getElementById('product');
            productList.innerHTML = '';

            // Loop through all products and display them
            data.forEach(product => {
                const productCard = `
                    <div class="col-sm-4 mb-4">
                        <div class="card product-card">
                            <img src="http://localhost:4000${product.image}" class="card-img-top" alt="Product Image">
                            <div class="card-body text-center">
                                <h5 class="card-title text-white">${product.productName}</h5>
                                <p class="card-text text-white">₱${product.price}</p>
                                <p class="card-text text-white">Ingredients: ${product.ingredients}</p>
                                
                                <!-- Add Delete and Update Icons -->
                                <div class="d-flex justify-content-around">
                                    <button class="btn btn-danger delete-btn" data-id="${product._id}"><i class="fas fa-trash"></i></button>
                                    <button class="btn btn-warning update-btn" data-id="${product._id}"><i class="fas fa-edit"></i></button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                // Append each product card to the product list
                productList.insertAdjacentHTML('beforeend', productCard);
            });

            // Add event listeners for Delete and Update buttons after products are displayed
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', handleDeleteProduct);
            });

            document.querySelectorAll('.update-btn').forEach(btn => {
                btn.addEventListener('click', handleUpdateProduct);
            });
        })
        .catch(error => {
            console.error('Error fetching products:', error);
        });
}

// Handle Delete Product
function handleDeleteProduct(event) {
    const productId = event.target.closest('button').dataset.id;
    const confirmDelete = confirm("Are you sure you want to delete this product?");
    
    if (confirmDelete) {
        fetch(`http://localhost:4000/api/products/${productId}`, {
            method: 'DELETE',
        })
        .then(response => response.json())
        .then(data => {
            console.log('Product deleted:', data);
            fetchProducts();  // Refresh the product list after deletion
        })
        .catch(error => {
            console.error('Error deleting product:', error);
        });
    }
}

// Handle Update Product
function handleUpdateProduct(event) {
    const productId = event.target.closest('button').dataset.id;
    fetch(`http://localhost:4000/api/products/${productId}`)
        .then(response => response.json())
        .then(product => {
            console.log('Product to update:', product);

            // Pre-fill the form fields with current product data
            document.getElementById('productName').value = product.productName;
            document.getElementById('productPrice').value = product.price;
            document.getElementById('productIngredients').value = product.ingredients;
            // Assuming you don't want to pre-fill the image field for updating, just leave it out

            // Show the modal
            const addProductModal = new bootstrap.Modal(document.getElementById('addProductModal'));
            addProductModal.show();

            // Add a submit event listener to handle the update
            document.getElementById('addProductForm').addEventListener('submit', function updateFormSubmit(e) {
                e.preventDefault();

                const updatedProductName = document.getElementById('productName').value;
                const updatedProductPrice = document.getElementById('productPrice').value;
                const updatedProductIngredients = document.getElementById('productIngredients').value;

                // Create a new FormData object
                const formData = new FormData();
                formData.append('productName', updatedProductName);
                formData.append('price', updatedProductPrice);
                formData.append('ingredients', updatedProductIngredients);

                fetch(`http://localhost:4000/api/products/${productId}`, {
                    method: 'PATCH',
                    body: formData,
                })
                .then(response => response.json())
                .then(data => {
                    console.log('Product updated:', data);
                    fetchProducts();  // Refresh the product list after updating
                    document.getElementById('addProductForm').reset();  // Clear the form
                    addProductModal.hide();  // Hide the modal after update
                })
                .catch(error => {
                    console.error('Error updating product:', error);
                });
            });
        })
        .catch(error => {
            console.error('Error fetching product for update:', error);
        });
}

// Fetch products when the page loads
fetchProducts();
