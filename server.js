const extraRoutes = require('./extra-routes');
require('dotenv').config();

const http = require('http');
const bcrypt = require('bcryptjs');
const db = require('./db');

const PORT = 3000;

function send(res, status, data) {
    res.writeHead(status, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': 'http://localhost:5500',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
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
        return JSON.parse(body);
    } catch {
        const error = new Error('JSON invalide');
        error.status = 400;
        throw error;
    }
}

const routes = {
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

    'GET /applications': async () => {
        const [rows] = await db.query(
            'SELECT * FROM applications ORDER BY created_at DESC'
        );
        return { status: 200, data: rows };
    },

    'GET /messages': async () => {
        const [rows] = await db.query(
            'SELECT * FROM messages ORDER BY created_at DESC'
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
            return { status: 401, data: { error: 'Identifiants incorrects' } };
        }

        return {
            status: 200,
            data: {
                message: 'Identifiants vérifiés',
                user: {
                    id: users[0].id,
                    username: users[0].username
                }
            }
        };
    },

    'POST /projects': async (req) => {
        const d = await readBody(req);

        if (
            !Number.isInteger(d.user_id) || d.user_id <= 0 ||
            typeof d.title !== 'string' ||
            !d.title.trim() || d.title.length > 150 ||
            typeof d.description !== 'string' ||
            !d.description.trim() ||
            (d.category != null &&
                (typeof d.category !== 'string' || d.category.length > 100)) ||
            (d.city != null &&
                (typeof d.city !== 'string' || d.city.length > 100)) ||
            (d.remuneration != null &&
                !['paid', 'unpaid', 'volunteer'].includes(d.remuneration)) ||
            (d.work_type != null &&
                !['remote', 'onsite', 'hybrid'].includes(d.work_type))
        ) {
            return { status: 400, data: { error: 'Projet invalide' } };
        }

        const [result] = await db.query(
            `INSERT INTO projects
             (user_id, title, description, category, remuneration, work_type, city)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                d.user_id,
                d.title.trim(),
                d.description.trim(),
                d.category || null,
                d.remuneration || 'unpaid',
                d.work_type || 'remote',
                d.city || null
            ]
        );

        return {
            status: 201,
            data: { message: 'Projet créé', project_id: result.insertId }
        };
    },

    'POST /applications': async (req) => {
        const d = await readBody(req);

        if (
            !Number.isInteger(d.project_id) || d.project_id <= 0 ||
            !Number.isInteger(d.applicant_id) || d.applicant_id <= 0 ||
            (d.message != null && typeof d.message !== 'string')
        ) {
            return { status: 400, data: { error: 'Candidature invalide' } };
        }

        const [result] = await db.query(
            `INSERT INTO applications (project_id, applicant_id, message)
             VALUES (?, ?, ?)`,
            [d.project_id, d.applicant_id, d.message || null]
        );

        return {
            status: 201,
            data: { message: 'Candidature envoyée', id: result.insertId }
        };
    },

    'POST /messages': async (req) => {
        const d = await readBody(req);

        if (
            !Number.isInteger(d.sender_id) || d.sender_id <= 0 ||
            !Number.isInteger(d.receiver_id) || d.receiver_id <= 0 ||
            typeof d.content !== 'string' || !d.content.trim() ||
            (d.project_id != null &&
                (!Number.isInteger(d.project_id) || d.project_id <= 0))
        ) {
            return { status: 400, data: { error: 'Message invalide' } };
        }

        const [result] = await db.query(
            `INSERT INTO messages
             (sender_id, receiver_id, project_id, content)
             VALUES (?, ?, ?, ?)`,
            [
                d.sender_id,
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
        const d = await readBody(req);

        if (
            !Number.isInteger(d.project_id) || d.project_id <= 0 ||
            !Number.isInteger(d.reviewer_id) || d.reviewer_id <= 0 ||
            !Number.isInteger(d.reviewed_user_id) || d.reviewed_user_id <= 0 ||
            !Number.isInteger(d.score) || d.score < 1 || d.score > 5 ||
            (d.comment != null && typeof d.comment !== 'string')
        ) {
            return { status: 400, data: { error: 'Évaluation invalide' } };
        }

        const [result] = await db.query(
            `INSERT INTO ratings
             (project_id, reviewer_id, reviewed_user_id, score, comment)
             VALUES (?, ?, ?, ?, ?)`,
            [
                d.project_id,
                d.reviewer_id,
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

    const path = new URL(req.url, 'http://localhost').pathname;
    const key = `${req.method} ${path}`;
    const route = routes[key];

    if (!route) {
        try {
            const handled = await extraRoutes(req, res, send, readBody);
            if (handled !== false) return;
        } catch (error) {
            console.error(error);
            return send(res, error.status || 500, {
                error: error.status ? error.message : 'Erreur serveur'
            });
        }
    }

    if (!route) {
        return send(res, 404, { error: 'Route introuvable' });
    }

    try {
        const result = await route(req);
        send(res, result.status, result.data);
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
