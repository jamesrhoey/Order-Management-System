const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    productId: {
        type: Number,
        required: true,
        unique: true
    },
    productName: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    ingredients: {
        type: [String],
        required: true,
        validate: {
            validator: function(v) {
                return v && v.length > 0; // Ensures at least one ingredient
            },
            message: 'Product must have at least one ingredient'
        }
    },
    image: {
        type: String,  // Store the image URL or path
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true // Automatically manage createdAt and updatedAt
});

// Add index for faster queries
productSchema.index({ productName: 1 });
productSchema.index({ price: 1 });

// Pre-save middleware to update the updatedAt timestamp
productSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Instance method to format the ingredients list
productSchema.methods.getFormattedIngredients = function() {
    return this.ingredients.join(', ');
};

// Static method to find products within a price range
productSchema.statics.findByPriceRange = function(minPrice, maxPrice) {
    return this.find({
        price: { 
            $gte: minPrice, 
            $lte: maxPrice 
        }
    });
};

const Product = mongoose.model('Product', productSchema);

module.exports = Product;