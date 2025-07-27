const mongoose = require('mongoose');

// Contact Schema
const contactSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        trim: true,
        lowercase: true,
        match: [
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            'Please provide a valid email address'
        ]
    },
    phone: {
        type: String,
        trim: true,
        maxlength: [20, 'Phone number cannot exceed 20 characters'],
        default: ''
    },
    message: {
        type: String,
        required: [true, 'Message is required'],
        trim: true,
        maxlength: [1000, 'Message cannot exceed 1000 characters']
    },
    submittedAt: {
        type: Date,
        default: Date.now
    },
    ipAddress: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['new', 'read', 'replied', 'archived'],
        default: 'new'
    },
    replied: {
        type: Boolean,
        default: false
    },
    repliedAt: {
        type: Date
    }
});

// Index for better query performance
contactSchema.index({ submittedAt: -1 });
contactSchema.index({ email: 1 });
contactSchema.index({ status: 1 });

// Virtual for formatted date
contactSchema.virtual('formattedDate').get(function() {
    return this.submittedAt.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
});

// Instance method to mark as read
contactSchema.methods.markAsRead = function() {
    this.status = 'read';
    return this.save();
};

// Instance method to mark as replied
contactSchema.methods.markAsReplied = function() {
    this.status = 'replied';
    this.replied = true;
    this.repliedAt = new Date();
    return this.save();
};

// Static method to get recent contacts
contactSchema.statics.getRecent = function(limit = 10) {
    return this.find()
        .sort({ submittedAt: -1 })
        .limit(limit)
        .select('name email phone message submittedAt status');
};

// Static method to get contacts by status
contactSchema.statics.getByStatus = function(status) {
    return this.find({ status })
        .sort({ submittedAt: -1 })
        .select('name email phone message submittedAt status');
};

// Pre-save middleware to clean data
contactSchema.pre('save', function(next) {
    // Remove extra whitespace
    if (this.name) this.name = this.name.trim();
    if (this.email) this.email = this.email.trim().toLowerCase();
    if (this.phone) this.phone = this.phone.trim();
    if (this.message) this.message = this.message.trim();
    
    next();
});

// Export the model
const Contact = mongoose.model('Contact', contactSchema);

module.exports = Contact;