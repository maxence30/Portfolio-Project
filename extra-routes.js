const db = require('./db');
const auth = require('./auth');

async function extraRoutes(req, res, send, readBody) {
    const path = new URL(req.url, 'http://localhost').pathname;


    // Messagerie collective par projet
    const groupParts = path.split("/");
    const groupId = Number(groupParts[2]);

    const isGroupRoute =
        groupParts.length === 3 &&
        groupParts[1] === "group-messages" &&
        /^[0-9]+$/.test(groupParts[2]) &&
        Number.isSafeInteger(groupId) &&
        groupId > 0;

    if (isGroupRoute && ["GET", "POST"].includes(req.method)) {
        const user = auth.requireAuth(req);
        const projectId = groupId;

        const [projects] = await db.query(
            "SELECT user_id FROM projects WHERE id = ?",
            [projectId]
        );

        if (!projects.length) {
            return send(res, 404, { error: "Projet introuvable" });
        }

        const isOwner = Number(projects[0].user_id) === Number(user.id);

        const [members] = await db.query(
            `SELECT id FROM applications
             WHERE project_id = ?
               AND applicant_id = ?
               AND status = 'accepted'
             LIMIT 1`,
            [projectId, user.id]
        );

        if (!isOwner && !members.length) {
            return send(res, 403, {
                error: "Accès au groupe non autorisé"
            });
        }

        if (req.method === "GET") {
            const [messages] = await db.query(
                `SELECT gm.id, gm.project_id, gm.sender_id,
                        gm.content, gm.created_at,
                        u.username AS sender_username
                 FROM group_messages gm
                 JOIN users u ON u.id = gm.sender_id
                 WHERE gm.project_id = ?
                 ORDER BY gm.created_at ASC, gm.id ASC`,
                [projectId]
            );

            return send(res, 200, messages);
        }

        const data = await readBody(req);

        if (
            !data ||
            Object.keys(data).length !== 1 ||
            typeof data.content !== "string" ||
            !data.content.trim() ||
            data.content.length > 5000
        ) {
            return send(res, 400, { error: "Message invalide" });
        }

        const [result] = await db.query(
            `INSERT INTO group_messages
             (project_id, sender_id, content)
             VALUES (?, ?, ?)`,
            [projectId, user.id, data.content.trim()]
        );

        return send(res, 201, {
            message: "Message envoyé au groupe",
            id: result.insertId
        });
    }

    const project = path.match(/^\/projects\/([0-9]+)$/);

    if (project && ['PATCH', 'DELETE'].includes(req.method)) {
        const user = auth.requireAuth(req);
        const projectId = Number(project[1]);

        const [projects] = await db.query(
            'SELECT user_id FROM projects WHERE id = ?',
            [projectId]
        );

        if (!projects.length) {
            return send(res, 404, { error: 'Projet introuvable' });
        }

        if (projects[0].user_id !== user.id) {
            return send(res, 403, { error: 'Accès interdit' });
        }

        if (req.method === 'DELETE') {
            const [result] = await db.query(
                'DELETE FROM projects WHERE id = ? AND user_id = ?',
                [projectId, user.id]
            );

            return send(res, result.affectedRows ? 200 : 404, {
                message: result.affectedRows
                    ? 'Projet supprimé'
                    : 'Projet introuvable'
            });
        }

        const data = await readBody(req);
        const allowed = [
            'title', 'description', 'category', 'city',
            'status', 'remuneration', 'work_type'
        ];

        if (!data || typeof data !== 'object' || Array.isArray(data)) {
            return send(res, 400, { error: 'Données invalides' });
        }

        const fields = Object.keys(data);

        if (!fields.length || fields.some(f => !allowed.includes(f))) {
            return send(res, 400, { error: 'Champs invalides' });
        }

        const enums = {
            status: ['open', 'in_progress', 'completed', 'cancelled'],
            remuneration: ['paid', 'unpaid', 'volunteer'],
            work_type: ['remote', 'onsite', 'hybrid']
        };

        for (const field of fields) {
            const value = data[field];

            if (
                typeof value !== 'string' ||
                (enums[field] && !enums[field].includes(value)) ||
                (field === 'title' && (!value.trim() || value.length > 150)) ||
                (field === 'description' && (!value.trim() || value.length > 5000)) ||
                (['category', 'city'].includes(field) && value.length > 100)
            ) {
                return send(res, 400, { error: 'Valeur invalide' });
            }
        }

        const sql = fields.map(f => `${f} = ?`).join(', ');
        const values = fields.map(f => data[f]);

        const [result] = await db.query(
            `UPDATE projects SET ${sql} WHERE id = ? AND user_id = ?`,
            [...values, projectId, user.id]
        );

        return send(res, result.affectedRows ? 200 : 404, {
            message: result.affectedRows
                ? 'Projet modifié'
                : 'Projet introuvable'
        });
    }

    const application = path.match(/^\/applications\/([0-9]+)$/);

    if (application && req.method === 'PATCH') {
        const user = auth.requireAuth(req);
        const applicationId = Number(application[1]);

        const data = await readBody(req);

        if (
            !data ||
            typeof data !== 'object' ||
            Array.isArray(data) ||
            Object.keys(data).length !== 1 ||
            !['accepted', 'rejected'].includes(data.status)
        ) {
            return send(res, 400, { error: 'Statut invalide' });
        }

        const [applications] = await db.query(
            `SELECT a.status, p.user_id
             FROM applications a
             JOIN projects p ON p.id = a.project_id
             WHERE a.id = ?`,
            [applicationId]
        );

        if (!applications.length) {
            return send(res, 404, { error: 'Candidature introuvable' });
        }

        if (applications[0].user_id !== user.id) {
            return send(res, 403, { error: 'Accès interdit' });
        }

        if (applications[0].status !== 'pending') {
            return send(res, 409, {
                error: 'Cette candidature a déjà été traitée'
            });
        }

        const [result] = await db.query(
            `UPDATE applications
             SET status = ?
             WHERE id = ? AND status = 'pending'`,
            [data.status, applicationId]
        );

        return send(res, result.affectedRows ? 200 : 409, {
            message: result.affectedRows
                ? 'Candidature mise à jour'
                : 'Cette candidature a déjà été traitée'
        });
    }

    return false;
}

module.exports = extraRoutes;
