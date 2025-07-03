const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const emailService = require('../services/emailService');

// User Signup
exports.signup = async (req, res) => {
    const { username, email, password, confirmPassword, terms } = req.body;

    if (!username || !email || !password || !confirmPassword || !terms) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: 'Signup Successful' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// User Login
exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ token });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Forgot Password
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

        user.verificationCode = verificationCode;
        user.verificationCodeExpires = expiry;
        await user.save();

        await emailService.sendVerificationCode(email, verificationCode);

        res.status(200).json({ message: 'Verification code sent to email' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Reset Password
exports.resetPassword = async (req, res) => {
    const { email, verificationCode, newPassword, confirmPassword } = req.body;
    if (!email || !verificationCode || !newPassword || !confirmPassword) {
        return res.status(400).json({ message: 'All fields are required' });
    }
    if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
    }
    try {
        const user = await User.findOne({ email });
        if (!user || user.verificationCode !== verificationCode) {
            return res.status(400).json({ message: 'Invalid verification code' });
        }
        if (user.verificationCodeExpires < new Date()) {
            return res.status(400).json({ message: 'Verification code expired' });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        user.verificationCode = undefined;
        user.verificationCodeExpires = undefined;
        await user.save();

        res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};