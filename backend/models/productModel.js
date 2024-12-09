const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    productId: {
        type: String,
        required: true,
        unique: true
    },
    productName: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        enum: ['Starters', 'Pasta', 'Mains', 'Dessert'],
        default: 'Mains'
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
                return Array.isArray(v) && v.length > 0;
            },
            message: 'Product must have at least one ingredient'
        }
    },
    image: {
        type: String,
        required: false
    }
}, {
    timestamps: true
});

// Add index for faster queries
productSchema.index({ productName: 1 });
productSchema.index({ price: 1 });
productSchema.index({ category: 1 });

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

// Add static method to find products by category
productSchema.statics.findByCategory = function(category) {
    return this.find({ category });
};

const Product = mongoose.model('Product', productSchema);

module.exports = Product;

