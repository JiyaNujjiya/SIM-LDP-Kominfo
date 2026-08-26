const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
        return res.status(401).json({ message: 'Akses ditolak! Token tidak ditemukan.' });
    }

    // Mengambil token dengan memisahkan kata 'Bearer' dan kodenya
    const token = authHeader.startsWith('Bearer ') 
        ? authHeader.substring(7, authHeader.length) 
        : authHeader;

    try {
        const verified = jwt.verify(token.trim(), process.env.JWT_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).json({ message: 'Token tidak valid!' });
    }
};