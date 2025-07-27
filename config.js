require('dotenv').config();

const config = {
    // MongoDB connection string
    mongoURI: process.env.MONGODB_URI || 'mongodb://localhost:27017/portfolio_db',
    
    // Alternative MongoDB Atlas connection (replace with your credentials)
    // mongoURI: 'mongodb+srv://<username>:<password>@cluster0.mongodb.net/portfolio_db?retryWrites=true&w=majority',
    
    // Database options
    options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10, // Maintain up to 10 socket connections
        serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        bufferMaxEntries: 0, // Disable mongoose buffering
        bufferCommands: false, // Disable mongoose buffering
    }
};

module.exports = config;