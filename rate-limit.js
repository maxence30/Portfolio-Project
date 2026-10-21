const attempts = new Map();

const WINDOW = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function getClientIp(req) {
    return req.socket.remoteAddress || 'unknown';
}

function checkLoginLimit(req) {
    const ip = getClientIp(req);
    const now = Date.now();

    let record = attempts.get(ip);

    if (!record || now >= record.expiresAt) {
        record = {
            count: 0,
            expiresAt: now + WINDOW
        };

        attempts.set(ip, record);
    }

    if (record.count >= MAX_ATTEMPTS) {
        return {
            allowed: false,
            retryAfter: Math.ceil((record.expiresAt - now) / 1000)
        };
    }

    return { allowed: true };
}

function recordLoginFailure(req) {
    const ip = getClientIp(req);
    const now = Date.now();

    let record = attempts.get(ip);

    if (!record || now >= record.expiresAt) {
        record = {
            count: 0,
            expiresAt: now + WINDOW
        };
    }

    record.count++;
    attempts.set(ip, record);
}

function resetLoginLimit(req) {
    attempts.delete(getClientIp(req));
}

module.exports = {
    checkLoginLimit,
    recordLoginFailure,
    resetLoginLimit
};
