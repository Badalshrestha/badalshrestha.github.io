const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Contact Schema (inline)
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
    status: {
        type: String,
        enum: ['new', 'read', 'replied', 'archived'],
        default: 'new'
    }
});

const Contact = mongoose.model('Contact', contactSchema);

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB connection (inline config)
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/portfolio_db';
mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('MongoDB connected successfully');
    console.log('Database:', mongoose.connection.name);
})
.catch(err => {
    console.error('MongoDB connection error:', err);
    console.log('Continuing without database...');
});

// Email transporter configuration - CORRECTED METHOD NAME
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
    }
});

// API Routes
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, phone, message } = req.body;

        // Validation
        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and message are required fields.'
            });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address.'
            });
        }

        // Save to database (if connected)
        if (mongoose.connection.readyState === 1) {
            const newContact = new Contact({
                name: name.trim(),
                email: email.trim().toLowerCase(),
                phone: phone ? phone.trim() : '',
                message: message.trim(),
                submittedAt: new Date()
            });

            await newContact.save();
            console.log('Contact saved to database');
        } else {
            console.log('Database not connected, skipping save');
        }

        // Send email notification
        const mailOptions = {
            from: process.env.EMAIL_USER || 'your-email@gmail.com',
            to: 'badal1811@gmail.com',
            subject: `New Portfolio Contact: ${name}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333; border-bottom: 2px solid #4A90E2; padding-bottom: 10px;">
                        New Contact Form Submission
                    </h2>
                    
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #4A90E2; margin-top: 0;">Contact Details:</h3>
                        <p><strong>Name:</strong> ${name}</p>
                        <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
                        ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
                        <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
                    </div>
                    
                    <div style="background: #fff; padding: 20px; border-left: 4px solid #4A90E2; margin: 20px 0;">
                        <h3 style="color: #333; margin-top: 0;">Message:</h3>
                        <p style="line-height: 1.6; color: #555;">${message}</p>
                    </div>
                </div>
            `
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log('Email sent successfully');
        } catch (emailError) {
            console.error('Email sending failed:', emailError.message);
        }

        res.status(200).json({
            success: true,
            message: 'Thank you for your message! I will get back to you soon.'
        });

    } catch (error) {
        console.error('Contact form error:', error);
        
        res.status(500).json({
            success: false,
            message: 'Sorry, there was an error sending your message. Please try again later.'
        });
    }
});

// Get all contacts (admin endpoint)
app.get('/api/contacts', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({
                success: false,
                message: 'Database not connected'
            });
        }

        const contacts = await Contact.find()
            .sort({ submittedAt: -1 })
            .limit(100);
        
        res.status(200).json({
            success: true,
            contacts: contacts
        });
    } catch (error) {
        console.error('Get contacts error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching contacts'
        });
    }
});

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle 404 errors
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Visit: http://localhost:${PORT}`);
});

module.exports = app;