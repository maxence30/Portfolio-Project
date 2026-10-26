
const http = require('http');
const db = require('./db');

const server = http.createServer(async (req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    // GET /users : récupérer les utilisateurs
    if (req.method === 'GET' && req.url === '/users') {
        try {
            const [users] = await db.query(
                'SELECT id, username, description, experience FROM users'
            );

            res.writeHead(200);
            res.end(JSON.stringify(users));

        } catch (error) {
            console.error(error);
            res.writeHead(500);
            res.end(JSON.stringify({ error: 'Erreur serveur' }));
        }

    // GET /projects : récupérer les projets
    } else if (req.method === 'GET' && req.url === '/projects') {
        try {
            const [projects] = await db.query(
                `SELECT id, user_id, title, description, category,
                remuneration, work_type, city, status, created_at
                FROM projects`
            );

            res.writeHead(200);
            res.end(JSON.stringify(projects));

        } catch (error) {
            console.error(error);
            res.writeHead(500);
            res.end(JSON.stringify({ error: 'Erreur serveur' }));
        }

    // POST /projects : créer un projet
    } else if (req.method === 'POST' && req.url === '/projects') {
        let body = '';

        try {
            for await (const chunk of req) {
                body += chunk;

                if (Buffer.byteLength(body, 'utf8') > 10000) {
                    res.writeHead(413);
                    res.end(JSON.stringify({
                        error: 'Données trop volumineuses'
                    }));
                    return;
                }
            }

            const data = JSON.parse(body);

            const {
                user_id,
                title,
                description,
                category,
                remuneration,
                work_type,
                city
            } = data;

            // Vérification des données
            if (
                !Number.isInteger(user_id) ||
                user_id <= 0 ||
                typeof title !== 'string' ||
                !title.trim() ||
                title.length > 150 ||
                typeof description !== 'string' ||
                !description.trim() ||
                (category != null &&
                    (typeof category !== 'string' || category.length > 100)) ||
                (city != null &&
                    (typeof city !== 'string' || city.length > 100)) ||
                (remuneration != null &&
                    !['paid', 'unpaid', 'volunteer'].includes(remuneration)) ||
                (work_type != null &&
                    !['remote', 'onsite', 'hybrid'].includes(work_type))
            ) {
                res.writeHead(400);
                res.end(JSON.stringify({
                    error: 'Données invalides'
                }));
                return;
            }

            // Enregistrement dans MySQL
            const [result] = await db.query(
                `INSERT INTO projects
                (user_id, title, description, category,
                remuneration, work_type, city)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    user_id,
                    title.trim(),
                    description.trim(),
                    category || null,
                    remuneration || 'unpaid',
                    work_type || 'remote',
                    city || null
                ]
            );

            res.writeHead(201);
            res.end(JSON.stringify({
                message: 'Projet créé avec succès',
                project_id: result.insertId
            }));

        } catch (error) {
            if (error instanceof SyntaxError) {
                res.writeHead(400);
                res.end(JSON.stringify({
                    error: 'JSON invalide'
                }));

            } else if (error.code === 'ER_NO_REFERENCED_ROW_2') {
                res.writeHead(400);
                res.end(JSON.stringify({
                    error: 'Utilisateur inexistant'
                }));

            } else {
                console.error(error);
                res.writeHead(500);
                res.end(JSON.stringify({
                    error: 'Erreur serveur'
                }));
            }
        }

    // Route inexistante
    } else {
        res.writeHead(404);
        res.end(JSON.stringify({
            error: 'Route introuvable'
        }));
    }
});

// Démarrage du serveur
server.listen(3000, () => {
    console.log('Serveur lancé sur http://localhost:3000');
});
