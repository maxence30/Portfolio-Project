const db = require('./db');
const auth = require('./auth');

function response(status, data) {
    return { status, data };
}

function validId(value) {
    return Number.isSafeInteger(value) && value > 0;
}

function validText(value, max, required = false) {
    return typeof value === 'string' &&
        value.length <= max &&
        (!required || value.trim().length > 0);
}

function validBody(data) {
    return data && typeof data === 'object' && !Array.isArray(data);
}

async function featuresRoutes(req, readBody) {
    const url = new URL(req.url, 'http://localhost');
    const path = url.pathname;
    const method = req.method;

    // Modifier son profil
    if (method === 'PATCH' && path === '/me') {
        const user = auth.requireAuth(req);
        const data = await readBody(req);

        const limits = {
            username: 50,
            description: 5000,
            photo: 255,
            experience: 5000,
            portfolio: 255
        };

        if (!validBody(data)) {
            return response(400, { error: 'Données invalides' });
        }

        const fields = Object.keys(data);

        if (!fields.length || fields.some(f => !(f in limits))) {
            return response(400, { error: 'Champs invalides' });
        }

        for (const field of fields) {
            if (!validText(data[field], limits[field],
                field === 'username')) {
                return response(400, { error: 'Valeur invalide' });
            }
        }

        const sql = fields.map(f => `${f} = ?`).join(', ');
        const values = fields.map(f => data[f].trim());

        await db.query(
            `UPDATE users SET ${sql} WHERE id = ?`,
            [...values, user.id]
        );

        return response(200, { message: 'Profil modifié' });
    }

    // Voir les compétences d'un utilisateur
    const userSkills = path.match(/^\/users\/([0-9]+)\/skills$/);

    if (userSkills && method === 'GET') {
        const [rows] = await db.query(
            `SELECT s.id, s.name, us.level
             FROM user_skills us
             JOIN skills s ON s.id = us.skill_id
             WHERE us.user_id = ?
             ORDER BY s.name`,
            [Number(userSkills[1])]
        );

        return response(200, rows);
    }

    // Ajouter ou modifier une compétence personnelle
    if (path === '/me/skills' && method === 'POST') {
        const user = auth.requireAuth(req);
        const data = await readBody(req);

        if (!validBody(data) ||
            !validId(data.skill_id) ||
            !['beginner', 'intermediate', 'advanced']
                .includes(data.level)) {
            return response(400, { error: 'Compétence invalide' });
        }

        const [skills] = await db.query(
            'SELECT id FROM skills WHERE id = ?',
            [data.skill_id]
        );

        if (!skills.length) {
            return response(404, { error: 'Compétence introuvable' });
        }

        await db.query(
            `INSERT INTO user_skills (user_id, skill_id, level)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE level = ?`,
            [user.id, data.skill_id, data.level, data.level]
        );

        return response(200, { message: 'Compétence enregistrée' });
    }

    const removeSkill = path.match(/^\/me\/skills\/([0-9]+)$/);

    if (removeSkill && method === 'DELETE') {
        const user = auth.requireAuth(req);

        const [result] = await db.query(
            'DELETE FROM user_skills WHERE user_id = ? AND skill_id = ?',
            [user.id, Number(removeSkill[1])]
        );

        return response(result.affectedRows ? 200 : 404, {
            message: result.affectedRows
                ? 'Compétence supprimée'
                : 'Compétence introuvable'
        });
    }

    // Compétences recherchées pour un projet
    const projectSkills = path.match(/^\/projects\/([0-9]+)\/skills$/);

    if (projectSkills && method === 'GET') {
        const [rows] = await db.query(
            `SELECT s.id, s.name
             FROM project_skills ps
             JOIN skills s ON s.id = ps.skill_id
             WHERE ps.project_id = ?
             ORDER BY s.name`,
            [Number(projectSkills[1])]
        );

        return response(200, rows);
    }

    if (projectSkills && ['POST', 'DELETE'].includes(method)) {
        const user = auth.requireAuth(req);
        const projectId = Number(projectSkills[1]);
        const data = await readBody(req);

        if (!validBody(data) || !validId(data.skill_id)) {
            return response(400, { error: 'Compétence invalide' });
        }

        const [projects] = await db.query(
            'SELECT user_id FROM projects WHERE id = ?',
            [projectId]
        );

        if (!projects.length) {
            return response(404, { error: 'Projet introuvable' });
        }

        if (projects[0].user_id !== user.id) {
            return response(403, { error: 'Accès interdit' });
        }

        if (method === 'POST') {
            const [skills] = await db.query(
                'SELECT id FROM skills WHERE id = ?',
                [data.skill_id]
            );

            if (!skills.length) {
                return response(404, { error: 'Compétence introuvable' });
            }

            await db.query(
                `INSERT IGNORE INTO project_skills
                 (project_id, skill_id) VALUES (?, ?)`,
                [projectId, data.skill_id]
            );

            return response(200, { message: 'Compétence ajoutée' });
        }

        const [result] = await db.query(
            `DELETE FROM project_skills
             WHERE project_id = ? AND skill_id = ?`,
            [projectId, data.skill_id]
        );

        return response(result.affectedRows ? 200 : 404, {
            message: result.affectedRows
                ? 'Compétence retirée'
                : 'Compétence introuvable'
        });
    }

    // Recherche de projets avec filtres
    if (method === 'GET' && path === '/search/projects') {
        const allowed = ['q', 'city', 'category', 'work_type', 'status'];
        const filters = Object.fromEntries(url.searchParams);

        if ([...url.searchParams.keys()].some(k => !allowed.includes(k)) ||
            Object.values(filters).some(v => v.length > 100)) {
            return response(400, { error: 'Filtres invalides' });
        }

        const conditions = [];
        const params = [];

        if (filters.q) {
            conditions.push('(title LIKE ? OR description LIKE ?)');
            const term = `%${filters.q}%`;
            params.push(term, term);
        }

        for (const field of ['city', 'category', 'work_type', 'status']) {
            if (filters[field]) {
                conditions.push(`${field} = ?`);
                params.push(filters[field]);
            }
        }

        const where = conditions.length
            ? `WHERE ${conditions.join(' AND ')}`
            : '';

        const [rows] = await db.query(
            `SELECT * FROM projects ${where}
             ORDER BY created_at DESC LIMIT 50`,
            params
        );

        return response(200, rows);
    }

    // Envoyer un signalement
    if (method === 'POST' && path === '/reports') {
        const user = auth.requireAuth(req);
        const data = await readBody(req);

        if (!validBody(data) ||
            !validText(data.reason, 100, true) ||
            (data.description != null &&
                !validText(data.description, 5000)) ||
            (data.reported_user_id != null &&
                !validId(data.reported_user_id)) ||
            (data.project_id != null &&
                !validId(data.project_id)) ||
            (!data.reported_user_id && !data.project_id)) {
            return response(400, { error: 'Signalement invalide' });
        }

        if (data.reported_user_id === user.id) {
            return response(400, {
                error: 'Impossible de se signaler soi-même'
            });
        }

        const [result] = await db.query(
            `INSERT INTO reports
             (reporter_id, reported_user_id, project_id, reason, description)
             VALUES (?, ?, ?, ?, ?)`,
            [
                user.id,
                data.reported_user_id || null,
                data.project_id || null,
                data.reason.trim(),
                data.description || null
            ]
        );

        return response(201, {
            message: 'Signalement envoyé',
            id: result.insertId
        });
    }

    // Consultation des signalements : administrateurs uniquement
    if (method === 'GET' && path === '/reports') {
        const user = auth.requireAuth(req);

        const [users] = await db.query(
            'SELECT role FROM users WHERE id = ?',
            [user.id]
        );

        if (!users.length || users[0].role !== 'admin') {
            return response(403, { error: 'Accès administrateur requis' });
        }

        const [rows] = await db.query(
            'SELECT * FROM reports ORDER BY created_at DESC LIMIT 100'
        );

        return response(200, rows);
    }

    return null;
}

module.exports = featuresRoutes;
