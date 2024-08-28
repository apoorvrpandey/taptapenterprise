const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_Secret_Key;

function isAuthenticated(req, res, next) {
  const token = req.cookies.userAdminToken;

  if (!token) {
    return res.redirect('/login');
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error('Error verifying JWT:', err);
      return res.redirect('/login');
    } else {
      req.user = decoded; // Attach the decoded user object to the request
      return next();
    }
  });
}

module.exports = isAuthenticated;
