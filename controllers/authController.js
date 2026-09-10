const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { signToken } = require('../utils/token');
const { ApiError } = require('../middleware/errorHandler');

async function register(req, res, next) {
  try {
    const { name, email, password, role, branchId } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      throw new ApiError(409, 'Email is already registered', 'DUPLICATE_KEY');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      passwordHash,
      role: role === 'admin' ? 'customer' : role, // block self-promotion to admin via public register
      branchId,
    });

    const token = signToken(user);
    res.status(201).json({
      success: true,
      message: 'Registered successfully',
      data: {
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
      },
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!user) {
      throw new ApiError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      throw new ApiError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
    }

    const token = signToken(user);
    res.json({
      success: true,
      message: 'Logged in successfully',
      data: {
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
      },
    });
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      throw new ApiError(404, 'User not found', 'NOT_FOUND');
    }
    res.json({ success: true, message: 'OK', data: { user } });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, me };
