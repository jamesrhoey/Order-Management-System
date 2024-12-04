const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
    transactionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction',
        required: true
    },
    totalAmount: {
        type: Number,
        required: true
    },
    items: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true
        },
        unitPrice: {
            type: Number,
            required: true
        },
        subtotal: {
            type: Number,
            required: true
        }
    }],
    saleDate: {
        type: Date,
        default: Date.now
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Completed', 'Refunded', 'Failed'],
        default: 'Pending'
    },
    salesPerson: {
        type: String,
        required: true
    },
    customerDetails: {
        name: String,
        contact: String,
        email: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Sale', saleSchema);
