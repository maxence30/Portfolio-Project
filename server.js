const extraRoutes = require('./extra-routes');
const auth = require('./auth');
const rateLimit = require('./rate-limit');
const featuresRoutes = require('./features-routes');
require('dotenv').config();

const http = require('http');
const bcrypt = require('bcryptjs');
const db = require('./db');

const PORT = 3000;

function send(res, status, data, headers = {}) {
    res.writeHead(status, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': 'http://localhost:5500',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
        ...headers
    });
    res.end(JSON.stringify(data));
}

async function readBody(req) {
    let body = '';
    for await (const chunk of req) {
        body += chunk;
        if (Buffer.byteLength(body, 'utf8') > 10000) {
            const error = new Error('Données trop volumineuses');
            error.status = 413;
            throw error;
        }
    }
    try {
        const data = JSON.parse(body);

        if (data === null ||
            typeof data !== 'object' ||
            Array.isArray(data)) {
            const error = new Error('Un objet JSON est obligatoire');
            error.status = 400;
            throw error;
        }

        return data;
    } catch (error) {
        if (error.status) throw error;

        const invalidJson = new Error('JSON invalide');
        invalidJson.status = 400;
        throw invalidJson;
    }
}

const routes = {
    'GET /me': async (req) => {
        const user = auth.requireAuth(req);
        const [rows] = await db.query(
            'SELECT id, username, email, description, experience, portfolio, role FROM users WHERE id = ?',
            [user.id]
        );

        if (!rows.length) {
            return { status: 401, data: { error: 'Compte introuvable' } };
        }

        return { status: 200, data: rows[0] };
    },

    'POST /logout': async () => ({
        status: 200,
        headers: {
            'Set-Cookie': auth.logoutCookie()
        },
        data: { message: 'Déconnexion effectuée' }
    }),

    'GET /users': async () => {
        const [rows] = await db.query(
            'SELECT id, username, description, experience, portfolio, role FROM users'
        );
        return { status: 200, data: rows };
    },

    'GET /projects': async () => {
        const [rows] = await db.query(
            'SELECT * FROM projects ORDER BY created_at DESC'
        );
        return { status: 200, data: rows };
    },

    'GET /skills': async () => {
        const [rows] = await db.query('SELECT * FROM skills');
        return { status: 200, data: rows };
    },

    'GET /applications': async (req) => {
        const user = auth.requireAuth(req);

        const [rows] = await db.query(
            `SELECT a.*
             FROM applications a
             JOIN projects p ON p.id = a.project_id
             WHERE a.applicant_id = ? OR p.user_id = ?
             ORDER BY a.created_at DESC`,
            [user.id, user.id]
        );

        return { status: 200, data: rows };
    },

    'GET /messages': async (req) => {
        const user = auth.requireAuth(req);

        const [rows] = await db.query(
            `SELECT *
             FROM messages
             WHERE sender_id = ? OR receiver_id = ?
             ORDER BY created_at DESC`,
            [user.id, user.id]
        );

        return { status: 200, data: rows };
    },

    'GET /ratings': async () => {
        const [rows] = await db.query(
            'SELECT * FROM ratings ORDER BY created_at DESC'
        );
        return { status: 200, data: rows };
    },

    'POST /users': async (req) => {
        const data = await readBody(req);
        const { username, email, password } = data;

        if (
            typeof username !== 'string' ||
            !username.trim() ||
            username.length > 50 ||
            typeof email !== 'string' ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
            email.length > 255 ||
            typeof password !== 'string' ||
            password.length < 8 ||
            Buffer.byteLength(password, 'utf8') > 72
        ) {
            return { status: 400, data: { error: 'Inscription invalide' } };
        }

        const hash = await bcrypt.hash(password, 12);
        const [result] = await db.query(
            'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
            [username.trim(), email.trim().toLowerCase(), hash]
        );

        return {
            status: 201,
            data: { message: 'Utilisateur créé', user_id: result.insertId }
        };
    },

    'POST /login': async (req) => {
        const limit = rateLimit.checkLoginLimit(req);

        if (!limit.allowed) {
            return {
                status: 429,
                headers: {
                    'Retry-After': String(limit.retryAfter)
                },
                data: {
                    error: 'Trop de tentatives. Réessayez plus tard.'
                }
            };
        }

        const { email, password } = await readBody(req);

        if (typeof email !== 'string' || typeof password !== 'string') {
            return { status: 400, data: { error: 'Données invalides' } };
        }

        const [users] = await db.query(
            'SELECT id, username, password_hash FROM users WHERE email = ?',
            [email.trim().toLowerCase()]
        );

        if (
            users.length === 0 ||
            !(await bcrypt.compare(password, users[0].password_hash))
        ) {
            rateLimit.recordLoginFailure(req);
            return { status: 401, data: { error: 'Identifiants incorrects' } };
        }

        rateLimit.resetLoginLimit(req);
        const token = auth.createToken(users[0]);

        return {
            status: 200,
            headers: {
                'Set-Cookie': auth.sessionCookie(token)
            },
            data: {
                message: 'Connexion réussie',
                user: {
                    id: users[0].id,
                    username: users[0].username
                }
            }
        };
    },

    'POST /projects': async (req) => {
        const currentUser = auth.requireAuth(req);
        const d = await readBody(req);

        if (
            typeof d.title !== 'string' ||
            !d.title.trim() || d.title.length > 150 ||
            typeof d.description !== 'string' ||
            !d.description.trim() || d.description.length > 5000 ||
            (d.category != null &&
                (typeof d.category !== 'string' || d.category.length > 100)) ||
            (d.city != null &&
                (typeof d.city !== 'string' || d.city.length > 100)) ||
            (d.remuneration != null &&
                !['paid', 'unpaid', 'volunteer'].includes(d.remuneration)) ||
            (d.work_type != null &&
                !['remote', 'onsite', 'hybrid'].includes(d.work_type)) ||
            (d.salary != null &&
                (typeof d.salary !== 'number' ||
                 !Number.isFinite(d.salary) ||
                 d.salary < 0 ||
                 d.salary > 99999999.99 ||
                 Math.abs(d.salary * 100 -
                     Math.round(d.salary * 100)) > 0.000001 ||
                 d.remuneration !== 'paid')) ||
            (d.remuneration === 'paid' && d.salary == null)
        ) {
            return { status: 400, data: { error: 'Projet invalide' } };
        }

        const [result] = await db.query(
            `INSERT INTO projects
             (user_id, title, description, category,
              remuneration, work_type, city, salary)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                currentUser.id,
                d.title.trim(),
                d.description.trim(),
                d.category || null,
                d.remuneration || 'unpaid',
                d.work_type || 'remote',
                d.city || null,
                d.remuneration === 'paid' ? d.salary : null
            ]
        );

        return {
            status: 201,
            data: { message: 'Projet créé', project_id: result.insertId }
        };
    },

    'POST /applications': async (req) => {
        const currentUser = auth.requireAuth(req);
        const d = await readBody(req);

        if (
            !Number.isInteger(d.project_id) || d.project_id <= 0 ||
            
            (d.message != null && (typeof d.message !== 'string' || d.message.length > 2000))
        ) {
            return { status: 400, data: { error: 'Candidature invalide' } };
        }

        const [projects] = await db.query(
            'SELECT user_id, status FROM projects WHERE id = ?',
            [d.project_id]
        );

        if (!projects.length) {
            return { status: 404, data: { error: 'Projet introuvable' } };
        }

        if (projects[0].user_id === currentUser.id) {
            return {
                status: 403,
                data: { error: 'Impossible de candidater à son propre projet' }
            };
        }

        if (projects[0].status !== 'open') {
            return {
                status: 409,
                data: { error: 'Ce projet ne reçoit plus de candidatures' }
            };
        }

        const [result] = await db.query(
            `INSERT INTO applications (project_id, applicant_id, message)
             VALUES (?, ?, ?)`,
            [d.project_id, currentUser.id, d.message || null]
        );

        return {
            status: 201,
            data: { message: 'Candidature envoyée', id: result.insertId }
        };
    },

    'POST /messages': async (req) => {
        const currentUser = auth.requireAuth(req);
        const d = await readBody(req);

        if (
            
            !Number.isInteger(d.receiver_id) || d.receiver_id <= 0 ||
            typeof d.content !== 'string' || !d.content.trim() || d.content.length > 5000 ||
            (d.project_id != null &&
                (!Number.isInteger(d.project_id) || d.project_id <= 0))
        ) {
            return { status: 400, data: { error: 'Message invalide' } };
        }

        if (d.receiver_id === currentUser.id) {
            return {
                status: 400,
                data: { error: 'Impossible de s envoyer un message' }
            };
        }

        if (!Number.isInteger(d.project_id) || d.project_id <= 0) {
            return {
                status: 400,
                data: { error: 'Un projet est obligatoire' }
            };
        }

        const [permissions] = await db.query(
            `SELECT p.id
             FROM projects p
             JOIN applications a ON a.project_id = p.id
             WHERE p.id = ?
               AND a.status = 'accepted'
               AND (
                   (p.user_id = ? AND a.applicant_id = ?)
                   OR
                   (p.user_id = ? AND a.applicant_id = ?)
               )
             LIMIT 1`,
            [
                d.project_id,
                currentUser.id,
                d.receiver_id,
                d.receiver_id,
                currentUser.id
            ]
        );

        if (!permissions.length) {
            return {
                status: 403,
                data: { error: 'Discussion non autorisée' }
            };
        }

        const [result] = await db.query(
            `INSERT INTO messages
             (sender_id, receiver_id, project_id, content)
             VALUES (?, ?, ?, ?)`,
            [
                currentUser.id,
                d.receiver_id,
                d.project_id || null,
                d.content.trim()
            ]
        );

        return {
            status: 201,
            data: { message: 'Message envoyé', id: result.insertId }
        };
    },

    'POST /ratings': async (req) => {
        const currentUser = auth.requireAuth(req);
        const d = await readBody(req);

        if (
            !Number.isInteger(d.project_id) || d.project_id <= 0 ||
            
            !Number.isInteger(d.reviewed_user_id) || d.reviewed_user_id <= 0 ||
            !Number.isInteger(d.score) || d.score < 1 || d.score > 5 ||
            (d.comment != null && (typeof d.comment !== 'string' || d.comment.length > 2000))
        ) {
            return { status: 400, data: { error: 'Évaluation invalide' } };
        }

        if (d.reviewed_user_id === currentUser.id) {
            return {
                status: 400,
                data: { error: 'Impossible de se noter soi-même' }
            };
        }

        const [permissions] = await db.query(
            `SELECT p.id
             FROM projects p
             JOIN applications a ON a.project_id = p.id
             WHERE p.id = ?
               AND p.status = 'completed'
               AND a.status = 'accepted'
               AND (
                   (p.user_id = ? AND a.applicant_id = ?)
                   OR
                   (p.user_id = ? AND a.applicant_id = ?)
               )
             LIMIT 1`,
            [
                d.project_id,
                currentUser.id,
                d.reviewed_user_id,
                d.reviewed_user_id,
                currentUser.id
            ]
        );

        if (!permissions.length) {
            return {
                status: 403,
                data: { error: 'Évaluation non autorisée' }
            };
        }

        const [result] = await db.query(
            `INSERT INTO ratings
             (project_id, reviewer_id, reviewed_user_id, score, comment)
             VALUES (?, ?, ?, ?, ?)`,
            [
                d.project_id,
                currentUser.id,
                d.reviewed_user_id,
                d.score,
                d.comment || null
            ]
        );

        return {
            status: 201,
            data: { message: 'Évaluation créée', id: result.insertId }
        };
    }
};

const server = http.createServer(async (req, res) => {
    if (req.method === 'OPTIONS') {
        return send(res, 204, {});
    }

    const origin = req.headers.origin;
    const allowedOrigins = [
        'http://localhost:5500',
        'http://localhost:3000'
    ];

    if (origin && !allowedOrigins.includes(origin)) {
        return send(res, 403, { error: 'Origine non autorisée' });
    }

    const fetchSite = req.headers['sec-fetch-site'];

    if (fetchSite === 'cross-site') {
        return send(res, 403, { error: 'Requête intersite interdite' });
    }

    const protectedMethods = ['POST', 'PATCH', 'PUT', 'DELETE'];

    if (protectedMethods.includes(req.method) && req.headers.cookie) {
        if (!origin || !allowedOrigins.includes(origin)) {
            return send(res, 403, {
                error: 'Origine obligatoire pour une requête authentifiée'
            });
        }
    }

    // Vérifie qu'un JWT valide correspond encore à un compte existant.
    const tokenUser = auth.getUser(req);

    if (tokenUser) {
        try {
            const [accounts] = await db.query(
                'SELECT id FROM users WHERE id = ?',
                [tokenUser.id]
            );

            if (!accounts.length) {
                return send(res, 401, {
                    error: 'Compte inexistant ou supprimé'
                });
            }
        } catch (error) {
            console.error('Erreur vérification compte :', error.message);
            return send(res, 500, { error: 'Erreur serveur' });
        }
    }

    const path = new URL(req.url, 'http://localhost').pathname;
    const key = `${req.method} ${path}`;
    const route = routes[key];

    if (!route) {
        try {
            const handled = await extraRoutes(req, res, send, readBody);
            if (handled !== false) return;
        } catch (error) {
            console.error(error.message);

            if (error.code === 'ER_DUP_ENTRY') {
                return send(res, 409, { error: 'Donnée déjà existante' });
            }

            return send(res, error.status || 500, {
                error: error.status ? error.message : 'Erreur serveur'
            });
        }
    }

    if (!route) {
        try {
            const result = await featuresRoutes(req, readBody);

            if (result !== null) {
                return send(res, result.status, result.data);
            }
        } catch (error) {
            console.error(error.message);

            if (error.code === 'ER_DUP_ENTRY') {
                return send(res, 409, { error: 'Donnée déjà existante' });
            }

            if (error.code === 'ER_NO_REFERENCED_ROW_2') {
                return send(res, 400, { error: 'Identifiant inexistant' });
            }

            return send(res, error.status || 500, {
                error: error.status ? error.message : 'Erreur serveur'
            });
        }

        return send(res, 404, { error: 'Route introuvable' });
    }

    try {
        const result = await route(req);
        send(res, result.status, result.data, result.headers || {});
    } catch (error) {
        console.error(error.message);

        if (error.status) {
            return send(res, error.status, { error: error.message });
        }

        if (error.code === 'ER_DUP_ENTRY') {
            return send(res, 409, { error: 'Donnée déjà existante' });
        }

        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            return send(res, 400, { error: 'Identifiant inexistant' });
        }

        send(res, 500, { error: 'Erreur serveur' });
    }
});

server.listen(PORT, () => {
    console.log(`API Démodé : http://localhost:${PORT}`);
});
