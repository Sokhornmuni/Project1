const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const app = express();

// Middleware to parse incoming JSON requests
app.use(express.json());

// MongoDB connection
mongoose.connect('mongodb+srv://user22:user12345@cluster0.6l6lx.mongodb.net/badminton-booking-system?retryWrites=true&w=majority&appName=Cluster0', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('MongoDB connected');
}).catch(err => {
    console.error('MongoDB connection error:', err);
});

// Mongoose schema and model for User
const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    password: { type: String, required: true },
    email: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);

// Registration service (POST)
app.post('/register', async (req, res) => {
    const { username, password, email } = req.body;

    if (!username || !password || !email) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = new User({ username, password: hashedPassword, email });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully', user: newUser });
});

// Login service (POST)
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Compare the provided password with the stored hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.status(200).json({ message: 'Login successful', user: user });
});

// Search service (GET)
app.get('/search', async (req, res) => {
    const { username } = req.query;
    
    if (!username) {
        return res.status(400).json({ message: 'Username query parameter is required' });
    }

    const foundUser = await User.find({ username: { $regex: username, $options: 'i' } });
    if (foundUser.length === 0) {
        return res.status(404).json({ message: 'No users found' });
    }

    res.status(200).json({ users: foundUser });
});

// Profile update service (PUT)
app.put('/profile/:username', async (req, res) => {
    const { username } = req.params; 
    const { newusername, email, password } = req.body;

    // Find the user by the current username in the URL
    const user = await User.findOne({ username });
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    // If a new username is provided, validate if it's already taken
    if (newusername) {
        const existingUser = await User.findOne({ username: newusername });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already taken' });
        }
        user.username = newusername;
    }

    // Update email and password if provided
    if (email) user.email = email;
    if (password) user.password = await bcrypt.hash(password, 10);

    await user.save();

    res.status(200).json({ message: 'Profile updated successfully', user });
});

// Delete user service (DELETE)
app.delete('/user/:username', async (req, res) => {
    const { username } = req.params;

    const user = await User.findOneAndDelete({ username });
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User deleted successfully' });
});

// Start the server
app.listen(3000, () => {
    console.log('Server running on port 3000');
});
