const { recompileSchema } = require('../models/inventoryModel');
const User = require('../models/userModel');
const jwt = require('jsonwebtoken')

const createToken = (_id, role) => {
    return jwt.sign({ _id, recompileSchema}, process.env.SECRET, { expiresIn: '3d' })
}
// login user
const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.login(email, password);

        // create a token
        const token = createToken(user._id, user.role);

        res.status(200).json({ 
            email: user.email,
            name: user.name,
            role: user.role,
            token
            });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}
// signup user
const signupUser = async (req, res) => {
    const { name, email, password, role } = req.body;

    try {
        const user = await User.signup(name, email, password, role);

        // create a token
        const token = createToken(user._id, user.role);

        res.status(200).json({ 
            email: user.email, 
            name: user.name,
            role: user.role,
            token });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

module.exports = { signupUser, loginUser };