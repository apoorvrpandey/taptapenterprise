const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

function isAuthenticated(req, res, next) {
  const token = req.cookies['jwt'];
  if (token) {
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({ error: 'Invalid token' });
      } else {
        req.user = decoded; // Attach the decoded user object to the request
        return next();
      }
    });
  } else {
    return res.status(401).json({ error: 'No token provided' });
  }
}

module.exports = isAuthenticated;
