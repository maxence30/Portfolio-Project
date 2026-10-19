const db = require('./db');

async function extraRoutes(req, res, send, readBody) {
    const path = new URL(req.url, 'http://localhost').pathname;

    const project = path.match(/^\/projects\/([0-9]+)$/);

    if (project && req.method === 'PATCH') {
        const data = await readBody(req);
        const allowed = ['title', 'description', 'category', 'city', 'status', 'remuneration', 'work_type'];
        const fields = Object.keys(data);

        if (!fields.length || fields.some(field => !allowed.includes(field))) {
            return send(res, 400, { error: 'Champs invalides' });
        }

        const enums = {
            status: ['open', 'in_progress', 'completed', 'cancelled'],
            remuneration: ['paid', 'unpaid', 'volunteer'],
            work_type: ['remote', 'onsite', 'hybrid']
        };

        for (const field of fields) {
            const value = data[field];

            if (typeof value !== 'string' ||
                (enums[field] && !enums[field].includes(value)) ||
                (field === 'title' && (!value.trim() || value.length > 150)) ||
                (field === 'description' && !value.trim()) ||
                (['category', 'city'].includes(field) && value.length > 100)) {
                return send(res, 400, { error: 'Valeur invalide' });
            }
        }

        const sql = fields.map(field => `${field} = ?`).join(', ');
        const values = fields.map(field => data[field]);

        const [result] = await db.query(
            `UPDATE projects SET ${sql} WHERE id = ?`,
            [...values, Number(project[1])]
        );

        return send(res, result.affectedRows ? 200 : 404, {
            message: result.affectedRows ? 'Projet modifié' : 'Projet introuvable'
        });
    }

    if (project && req.method === 'DELETE') {
        const [result] = await db.query(
            'DELETE FROM projects WHERE id = ?',
            [Number(project[1])]
        );

        return send(res, result.affectedRows ? 200 : 404, {
            message: result.affectedRows ? 'Projet supprimé' : 'Projet introuvable'
        });
    }

    const application = path.match(/^\/applications\/([0-9]+)$/);

    if (application && req.method === 'PATCH') {
        const data = await readBody(req);

        if (!['accepted', 'rejected'].includes(data.status)) {
            return send(res, 400, { error: 'Statut invalide' });
        }

        const [result] = await db.query(
            'UPDATE applications SET status = ? WHERE id = ?',
            [data.status, Number(application[1])]
        );

        return send(res, result.affectedRows ? 200 : 404, {
            message: result.affectedRows
                ? 'Candidature mise à jour'
                : 'Candidature introuvable'
        });
    }

    return false;
}

module.exports = extraRoutes;
