const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const authHeader = req.get('Authorization');
    if (!authHeader) {
        const error = new Error('Not authenticated');
        error.statusCode = 401;
        throw error;
    }
    const token = authHeader.split(' ')[1];
    let decodedToken;
    try {
        decodedToken = jwt.verify(token, process.env.JWT_STRING);
    }catch (err) {
        err.statusCode = 500;
        throw err;
    }

    if(!decodedToken) {
        const error = new Error('Not authenticated');
        error.statusCode = 401;
        throw error;
    }
    if(decodedToken.role.role !== 'client') {
        const error = new Error('Not a client');
        error.statusCode = 401;
        throw error;
    }
    req.userId = decodedToken.userId;
    req.specificId = decodedToken.role.role | null;
    req.role = decodedToken.role;
    next();
}