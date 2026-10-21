const jwt = require('jsonwebtoken');

const COOKIE_NAME = 'demode_token';

function getCookies(req) {
    const cookies = {};

    for (const part of (req.headers.cookie || '').split(';')) {
        const index = part.indexOf('=');

        if (index === -1) continue;

        const name = part.slice(0, index).trim();
        const value = part.slice(index + 1).trim();

        cookies[name] = value;
    }

    return cookies;
}

function createToken(user) {
    return jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET,
        {
            expiresIn: '2h',
            algorithm: 'HS256'
        }
    );
}

function getUser(req) {
    const cookies = getCookies(req);
    const token = cookies[COOKIE_NAME];

    if (!token) return null;

    try {
        return jwt.verify(token, process.env.JWT_SECRET, {
            algorithms: ['HS256']
        });
    } catch {
        return null;
    }
}

function requireAuth(req) {
    const user = getUser(req);

    if (!user) {
        const error = new Error('Connexion requise');
        error.status = 401;
        throw error;
    }

    return user;
}

function sessionCookie(token) {
    const secure = process.env.NODE_ENV === 'production' ? 'Secure; ' : '';
    return `${COOKIE_NAME}=${token}; ${secure}HttpOnly; SameSite=Strict; Path=/; Max-Age=7200`;
}

function logoutCookie() {
    const secure = process.env.NODE_ENV === 'production' ? 'Secure; ' : '';
    return `${COOKIE_NAME}=; ${secure}HttpOnly; SameSite=Strict; Path=/; Max-Age=0`;
}

module.exports = {
    createToken,
    getUser,
    requireAuth,
    sessionCookie,
    logoutCookie
};
