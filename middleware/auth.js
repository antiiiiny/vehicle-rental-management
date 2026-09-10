const jwt = require('jsonwebtoken');
const { ApiError } = require('./errorHandler');

function verifyToken(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return next(new ApiError(401, 'Authentication token missing', 'NO_TOKEN'));
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.id, role: payload.role };
    next();
  } catch (err) {
    next(new ApiError(401, 'Invalid or expired token', 'INVALID_TOKEN'));
  }
}

module.exports = verifyToken;
