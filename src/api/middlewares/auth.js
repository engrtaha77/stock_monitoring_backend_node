import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(401).json({ message: 'Authentication failed! Token is required.' });
  }

  jwt.verify(token.split(' ')[1], process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Authentication failed! Invalid token.' });
    }

    req.user = decoded; // { id, role }
    console.log(req.user);
    next();
  });
};

// Role-based authorization middleware
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    console.log(req.user)
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: insufficient role' });
    }
    next();
  };
};

export default authMiddleware;
