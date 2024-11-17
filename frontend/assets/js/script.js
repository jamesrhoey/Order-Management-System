// Fetch products from the backend API and populate the table
async function fetchProducts() {
    try {
        const response = await fetch('http://localhost:4000/api/products/');
        if (!response.ok) {
            throw new Error('Failed to fetch products');
        }

        const products = await response.json();
        populateTable(products); 
    } catch (error) {
        console.error('Error:', error);
    }
}

// Function to dynamically populate the table with fetched products
function populateTable(products) {
    const tableBody = document.getElementById("userDetails");
    tableBody.innerHTML = ""; // Clear existing rows

    products.forEach(product => {
        const row = document.createElement("tr");

        // Create table cells
        const nameCell = document.createElement("td");
        nameCell.textContent = product.productName;

        const priceCell = document.createElement("td");
        priceCell.textContent = `$${product.price}`;

        const ingredientsCell = document.createElement("td");
        ingredientsCell.textContent = product.ingredients;

        // Add a dummy "status" column for filtering purposes
        const statusCell = document.createElement("td");
        statusCell.textContent = "completed"; // Example status (replace as needed)

        // Append cells to the row
        row.appendChild(nameCell);
        row.appendChild(priceCell);
        row.appendChild(ingredientsCell);
        row.appendChild(statusCell);

        // Append the row to the table
        tableBody.appendChild(row);
    });
}

// Filter all rows
function filterAll() {
    const table = document.getElementById("userDetails");
    const tr = table.getElementsByTagName("tr");
    for (let i = 0; i < tr.length; i++) {
        tr[i].style.display = ""; // Show all rows
    }
}

// Filter rows by "completed" status
function filterPassed() {
    filterByStatus("completed");
}

// Filter rows by "Failed" status
function filterFailed() {
    filterByStatus("Failed");
}

// Generic filter function by status
function filterByStatus(status) {
    const table = document.getElementById("userDetails");
    const tr = table.getElementsByTagName("tr");

    for (let i = 0; i < tr.length; i++) {
        const td = tr[i].getElementsByTagName("td");
        let found = false;

        for (let j = 0; j < td.length; j++) {
            if (td[j].textContent === status) {
                found = true;
            }
        }

        if (found) {
            tr[i].style.display = ""; // Show row if status matches
        } else {
            tr[i].style.display = "none"; // Hide row if status doesn't match
        }
    }
}

// Fetch products and populate the table on page load
fetchProducts();
