document.getElementById('addProductForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const productName = document.getElementById('productName').value;
    const productPrice = document.getElementById('productPrice').value;
    const productIngredients = document.getElementById('productIngredients').value;
    const productImage = document.getElementById('productImage').files[0];

    // Check if all fields are populated
    if (!productName || !productPrice || !productIngredients || !productImage) {
        alert('Please fill in all fields and upload an image.');
        return;
    }

    // Create a new FormData object
    const formData = new FormData();
    formData.append('productName', productName);
    formData.append('price', productPrice);
    formData.append('ingredients', productIngredients);
    formData.append('image', productImage);

    // Make the API request to add the product
    fetch('http://localhost:4000/api/products', {
        method: 'POST',
        body: formData,  // send FormData with the request
    })
    .then(response => response.json())
    .then(data => {
        console.log('API Response Data:', data);

        if (data.error) {
            console.error('Error adding product:', data.error);
            alert('Error adding product: ' + data.error);
            return;
        }

        console.log('Product added:', data);

        // Fetch products after adding
        fetchProducts();

        // Close the modal
        const addProductModal = bootstrap.Modal.getInstance(document.getElementById('addProductModal'));
        addProductModal.hide();

        // Reset the form
        document.getElementById('addProductForm').reset();
    })
    .catch(error => {
        console.error('Error:', error);
    });
});

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
                            <img src="http://localhost:4000/uploads/${product.image}" class="card-img-top" alt="Product Image">
                            <div class="card-body text-center">
                                <h5 class="card-title text-white">${product.productName}</h5>
                                <p class="card-text text-white">₱${product.price}</p>
                                <p class="card-text text-white">Ingredients: ${product.ingredients}</p>
                            </div>
                        </div>
                    </div>
                `;
                // Append each product card to the product list
                productList.insertAdjacentHTML('beforeend', productCard);
            });
        })
        .catch(error => {
            console.error('Error fetching products:', error);
        });
}

// Fetch products when the page loads
fetchProducts();
