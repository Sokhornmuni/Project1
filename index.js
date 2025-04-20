const express = require('express');
const app = express();
const bcrypt = require('bcryptjs');

// Middleware to parse incoming JSON requests
app.use(express.json());

let users = []; // In-memory user storage (replace with database in a real application)

// Registration service (POST)
app.post('/register', async (req, res) => {
    const { username, password, email } = req.body;

    if (!username || !password || !email) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = { username, password: hashedPassword, email };
    users.push(newUser);

    res.status(201).json({ message: 'User registered successfully', user: newUser });
});

// Login service (POST)
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    const user = users.find(u => u.username === username);
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
app.get('/search', (req, res) => {
    const { username } = req.query;
    
    if (!username) {
        return res.status(400).json({ message: 'Username query parameter is required' });
    }

    const foundUser = users.filter(u => u.username.toLowerCase().includes(username.toLowerCase()));
    if (foundUser.length === 0) {
        return res.status(404).json({ message: 'No users found' });
    }

    res.status(200).json({ users: foundUser });
});

// Profile update service (PUT)
app.put('/profile/:username', (req, res) => {
    const { username } = req.params; // current username in URL (e.g., 'Munizin2')
    const { newusername, email, password } = req.body; // newusername to update, email and password for profile changes

    // Find the user by the current username in the URL
    const user = users.find(u => u.username === username);
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    // If a new username is provided, validate if it's already taken
    if (newusername) {
        const existingUser = users.find(u => u.username === newusername);
        if (existingUser) {
            return res.status(400).json({ message: 'Username already taken' });
        }
        user.username = newusername; // Update the username
    }

    // Update email and password if provided
    if (email) user.email = email;
    if (password) user.password = password;

    res.status(200).json({ message: 'Profile updated successfully', user });
});


// Delete user service (DELETE)
app.delete('/user/:username', (req, res) => {
    const { username } = req.params;

    const userIndex = users.findIndex(u => u.username === username);
    if (userIndex === -1) {
        return res.status(404).json({ message: 'User not found' });
    }

    users.splice(userIndex, 1);
    res.status(200).json({ message: 'User deleted successfully' });
});

// Start the server
app.listen(3000, () => {
    console.log('Server running on port 3000');
});
