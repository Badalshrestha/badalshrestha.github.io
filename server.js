const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const config = require('./config/database');
const Contact = require('./models/Contact');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Connect to MongoDB
mongoose.connect(config.mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// Email transporter configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
    }
});

// API Routes

// Contact form submission
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

        // Save to database
        const newContact = new Contact({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            phone: phone ? phone.trim() : '',
            message: message.trim(),
            submittedAt: new Date()
        });

        await newContact.save();

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
                    
                    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                        <p style="color: #666; font-size: 12px;">
                            This email was sent from your portfolio website contact form.
                        </p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);

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

// Get all contacts (admin endpoint - you might want to add authentication)
app.get('/api/contacts', async (req, res) => {
    try {
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