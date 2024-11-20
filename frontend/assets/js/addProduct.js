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
// Handle Delete Product
function handleDeleteProduct(event) {
    const productId = event.target.closest('button').dataset.id;

    // Use SweetAlert for confirmation instead of the default confirm dialog
    Swal.fire({
        title: 'Are you sure?',
        text: 'Do you want to delete this product?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'No, cancel!',
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(`http://localhost:4000/api/products/${productId}`, {
                method: 'DELETE',
            })
            .then(response => response.json())
            .then(() => {
                fetchProducts();  // Refresh the product list after deletion

                // Show SweetAlert for successful deletion
                Swal.fire({
                    icon: 'success',
                    title: 'Deleted!',
                    text: 'Product has been deleted successfully.',
                    confirmButtonText: 'Okay'
                });
            })
            .catch(error => {
                // Show SweetAlert for error
                Swal.fire({
                    icon: 'error',
                    title: 'Error!',
                    text: 'There was an error deleting the product.',
                    confirmButtonText: 'Try Again'
                });
            });
        }
    });
}


// Handle Update Product
function handleUpdateProduct(event) {
    const productId = event.target.closest('button').dataset.id; // Get the product ID
    fetch(`http://localhost:4000/api/products/${productId}`)
        .then(response => response.json())
        .then(product => {
            console.log('Product to update:', product);

            // Pre-fill the form fields with current product data
            document.getElementById('productName').value = product.productName;
            document.getElementById('productPrice').value = product.price;
            document.getElementById('productIngredients').value = product.ingredients;

            // Show the modal
            const addProductModal = new bootstrap.Modal(document.getElementById('addProductModal'));
            addProductModal.show();

            // Add a submit event listener to handle the update
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

                // Use the productId here to make the fetch request
                fetch(`http://localhost:4000/api/products/${productId}`, {
                    method: 'PATCH',
                    body: formData,  // Send FormData with the request
                })
                .then(response => response.json())
                .then(data => {
                    console.log('Product updated:', data);
                    fetchProducts();  // Refresh the product list after updating
                    document.getElementById('addProductForm').reset();  // Clear the form
                    addProductModal.hide();  // Hide the modal after update

                    // Show SweetAlert for successful update
                    Swal.fire({
                        icon: 'success',
                        title: 'Updated!',
                        text: 'Product has been updated successfully.',
                        showConfirmButton: true,
                        confirmButtonText: 'Okay'
                    });
                })
                .catch(error => {
                    console.error('Error updating product:', error);
                    // Show SweetAlert for error
                    Swal.fire({
                        icon: 'error',
                        title: 'Error!',
                        text: 'There was an error updating the product.',
                        confirmButtonText: 'Try Again'
                    });
                });
            });
        })
        .catch(error => {
            console.error('Error fetching product for update:', error);
        });
}

// Function to add a new product
function addProduct(event) {
    event.preventDefault(); // Prevent the form from reloading the page

    // Get the values from the form fields
    const productName = document.getElementById('productName').value;
    const productPrice = document.getElementById('productPrice').value;
    const productIngredients = document.getElementById('productIngredients').value;
    const productImage = document.getElementById('productImage').files[0]; // Get the uploaded image

    // Create a new FormData object to send the data (including the file) to the server
    const formData = new FormData();
    formData.append('productName', productName);
    formData.append('price', productPrice);
    formData.append('ingredients', productIngredients);

    // Append the image file if it exists
    if (productImage) {
        formData.append('image', productImage);
    }

    // Send the form data to the server to create a new product
    fetch('http://localhost:4000/api/products', {
        method: 'POST',
        body: formData,  // The body should be the FormData object containing all fields
    })
    .then(response => response.json())
    .then(data => {
        console.log('Product added:', data);

        // Fetch the products again to update the product list
        fetchProducts();

        // Reset the form and close the modal
        document.getElementById('addProductForm').reset();
        const addProductModal = new bootstrap.Modal(document.getElementById('addProductModal'));
        addProductModal.hide();

        // Show SweetAlert for successful addition
        Swal.fire({
            icon: 'success',
            title: 'Added!',
            text: 'Product has been added successfully.',
            confirmButtonText: 'Okay'
        });
    })
    .catch(error => {
        console.error('Error adding product:', error);
        // Show SweetAlert for error
        Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: 'There was an error adding the product.',
            confirmButtonText: 'Try Again'
        });
    });
}

// Add event listener for the add product form submission
document.getElementById('addProductForm').addEventListener('submit', addProduct);

// Fetch products when the page loads
fetchProducts();
