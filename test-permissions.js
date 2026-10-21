const assert = require('node:assert/strict');
const crypto = require('node:crypto');

const API = 'http://localhost:3000';
const suffix = crypto.randomBytes(6).toString('hex');
const createdUsers = [];

async function request(path, method = 'GET', body, cookie = '') {
    const response = await fetch(API + path, {
        method,
        headers: {
            Origin: 'http://localhost:5500',
            'Content-Type': 'application/json',
            ...(cookie ? { Cookie: cookie } : {})
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) })
    });

    const data = await response.json();

    return {
        status: response.status,
        data,
        cookie: response.headers.get('set-cookie')
    };
}

async function createUser(name) {
    const email = `${name}_${suffix}@example.com`;
    const password = `Test-${crypto.randomBytes(12).toString('hex')}`;

    const register = await request('/users', 'POST', {
        username: `${name}_${suffix}`,
        email,
        password
    });

    assert.equal(register.status, 201, JSON.stringify(register.data));
    createdUsers.push(register.data.user_id);

    const login = await request('/login', 'POST', {
        email,
        password
    });

    assert.equal(login.status, 200, JSON.stringify(login.data));

    return {
        id: register.data.user_id,
        cookie: login.cookie.split(';')[0]
    };
}

async function main() {
    const alice = await createUser('alice');
    const bob = await createUser('bob');

    console.log('Deux utilisateurs créés et connectés');

    const project = await request('/projects', 'POST', {
        title: `Projet sécurité ${suffix}`,
        description: 'Test des permissions',
        user_id: bob.id
    }, alice.cookie);

    assert.equal(project.status, 201, JSON.stringify(project.data));

    const projectId = project.data.project_id;

    console.log('Projet créé :', projectId);

    // Vérifie qu'une description trop longue est refusée
    const tooLong = await request(
        '/projects',
        'POST',
        {
            title: 'Projet invalide',
            description: 'A'.repeat(5001)
        },
        alice.cookie
    );

    assert.equal(tooLong.status, 400);
    console.log('OK : description trop longue refusée');


    const [rows] = await require('./db').query(
        'SELECT user_id FROM projects WHERE id = ?',
        [projectId]
    );

    assert.equal(rows[0].user_id, alice.id);
    console.log('OK : impossible de créer au nom de Bob');

    const forbiddenPatch = await request(
        `/projects/${projectId}`,
        'PATCH',
        { title: 'Modification interdite' },
        bob.cookie
    );

    assert.equal(forbiddenPatch.status, 403);
    console.log('OK : Bob ne peut pas modifier le projet');

    const forbiddenDelete = await request(
        `/projects/${projectId}`,
        'DELETE',
        undefined,
        bob.cookie
    );

    assert.equal(forbiddenDelete.status, 403);
    console.log('OK : Bob ne peut pas supprimer le projet');

    const allowedPatch = await request(
        `/projects/${projectId}`,
        'PATCH',
        { title: 'Projet modifié par Alice' },
        alice.cookie
    );

    assert.equal(allowedPatch.status, 200);
    console.log('OK : Alice peut modifier son projet');

    const application = await request('/applications', 'POST', {
        project_id: projectId,
        applicant_id: alice.id,
        message: 'Je souhaite participer'
    }, bob.cookie);

    assert.equal(application.status, 201, JSON.stringify(application.data));

    const forbiddenApplication = await request(
        `/applications/${application.data.id}`,
        'PATCH',
        { status: 'accepted' },
        bob.cookie
    );

    assert.equal(forbiddenApplication.status, 403);
    console.log('OK : Bob ne peut pas accepter sa candidature');

    const allowedApplication = await request(
        `/applications/${application.data.id}`,
        'PATCH',
        { status: 'accepted' },
        alice.cookie
    );

    assert.equal(allowedApplication.status, 200);
    console.log('OK : Alice peut accepter la candidature');

    const deleteProject = await request(
        `/projects/${projectId}`,
        'DELETE',
        undefined,
        alice.cookie
    );

    assert.equal(deleteProject.status, 200);
    console.log('OK : Alice peut supprimer son projet');

    console.log('\nTOUS LES TESTS DE PERMISSIONS ONT RÉUSSI');
}

main()
    .catch(error => {
        console.error('ÉCHEC :', error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        const db = require('./db');

        try {
            if (createdUsers.length) {
                const placeholders = createdUsers.map(() => '?').join(',');

                await db.query(
                    `DELETE FROM reports
                     WHERE reporter_id IN (${placeholders})`,
                    createdUsers
                );

                await db.query(
                    `DELETE FROM users
                     WHERE id IN (${placeholders})`,
                    createdUsers
                );

                console.log('Comptes de test nettoyés');
            }
        } catch (error) {
            console.error('Erreur de nettoyage :', error.message);
            process.exitCode = 1;
        }

        await db.end();
    });
