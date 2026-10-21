const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const db = require('./db');

const API = 'http://localhost:3000';
const suffix = crypto.randomBytes(6).toString('hex');
const origin = 'http://localhost:5500';

const createdUsers = [];

async function request(path, method = 'GET', body, cookie = '') {
    const response = await fetch(API + path, {
        method,
        headers: {
            Origin: origin,
            'Content-Type': 'application/json',
            ...(cookie ? { Cookie: cookie } : {})
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) })
    });

    return {
        status: response.status,
        data: await response.json(),
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

    const login = await request('/login', 'POST', { email, password });
    assert.equal(login.status, 200, JSON.stringify(login.data));

    return {
        id: register.data.user_id,
        cookie: login.cookie.split(';')[0]
    };
}

async function main() {
    const alice = await createUser('alice');
    const bob = await createUser('bob');

    const project = await request('/projects', 'POST', {
        title: `Projet sécurité ${suffix}`,
        description: 'Tests automatiques'
    }, alice.cookie);

    assert.equal(project.status, 201, JSON.stringify(project.data));

    const projectId = project.data.project_id;

    const ownApplication = await request('/applications', 'POST', {
        project_id: projectId
    }, alice.cookie);

    assert.equal(ownApplication.status, 403);
    console.log('OK : candidature à son propre projet interdite');

    const forbiddenMessage = await request('/messages', 'POST', {
        receiver_id: alice.id,
        project_id: projectId,
        content: 'Bonjour'
    }, bob.cookie);

    assert.equal(forbiddenMessage.status, 403);
    console.log('OK : message sans candidature acceptée interdit');

    const ownRating = await request('/ratings', 'POST', {
        project_id: projectId,
        reviewed_user_id: alice.id,
        score: 5
    }, alice.cookie);

    assert.equal(ownRating.status, 400);
    console.log('OK : auto-évaluation interdite');

    const application = await request('/applications', 'POST', {
        project_id: projectId,
        message: 'Je souhaite participer'
    }, bob.cookie);

    assert.equal(application.status, 201, JSON.stringify(application.data));

    const accept = await request(
        `/applications/${application.data.id}`,
        'PATCH',
        { status: 'accepted' },
        alice.cookie
    );

    assert.equal(accept.status, 200);

    const earlyRating = await request('/ratings', 'POST', {
        project_id: projectId,
        reviewed_user_id: alice.id,
        score: 5
    }, bob.cookie);

    assert.equal(earlyRating.status, 403);
    console.log('OK : évaluation avant fin du projet interdite');

    const allowedMessage = await request('/messages', 'POST', {
        receiver_id: alice.id,
        project_id: projectId,
        content: 'Bonjour Alice'
    }, bob.cookie);

    assert.equal(allowedMessage.status, 201);
    console.log('OK : message après acceptation autorisé');

    const complete = await request(
        `/projects/${projectId}`,
        'PATCH',
        { status: 'completed' },
        alice.cookie
    );

    assert.equal(complete.status, 200);

    const allowedRating = await request('/ratings', 'POST', {
        project_id: projectId,
        reviewed_user_id: alice.id,
        score: 5
    }, bob.cookie);

    assert.equal(allowedRating.status, 201);
    console.log('OK : évaluation après fin du projet autorisée');

    console.log('\nTOUS LES TESTS DE SÉCURITÉ ONT RÉUSSI');
}

main()
    .catch(error => {
        console.error('ÉCHEC :', error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        try {
            if (createdUsers.length) {
                const placeholders = createdUsers.map(() => '?').join(',');
                await db.query(
                    `DELETE FROM users WHERE id IN (${placeholders})`,
                    createdUsers
                );
                console.log('Comptes de test nettoyés');
            }
        } catch (error) {
            console.error('Nettoyage impossible :', error.message);
            process.exitCode = 1;
        }

        await db.end();
    });
