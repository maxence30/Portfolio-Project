const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const db = require('./db');

const API = 'http://localhost:3000';
const origin = 'http://localhost:5500';
const suffix = crypto.randomBytes(6).toString('hex');
const users = [];

async function request(path, method = 'GET', body, cookie = '') {
    const res = await fetch(API + path, {
        method,
        headers: {
            Origin: origin,
            'Content-Type': 'application/json',
            ...(cookie ? { Cookie: cookie } : {})
        },
        ...(body === undefined ? {} : {
            body: JSON.stringify(body)
        })
    });

    return {
        status: res.status,
        data: await res.json(),
        cookie: res.headers.get('set-cookie')
    };
}

async function createUser(name) {
    const email = `${name}_${suffix}@example.com`;
    const password = 'Test-' + crypto.randomBytes(12).toString('hex');

    const register = await request('/users', 'POST', {
        username: `${name}_${suffix}`,
        email,
        password
    });

    assert.equal(register.status, 201, JSON.stringify(register.data));

    const id = register.data.user_id;
    users.push(id);

    const login = await request('/login', 'POST', {
        email,
        password
    });

    assert.equal(login.status, 200, JSON.stringify(login.data));

    return {
        id,
        cookie: login.cookie.split(';')[0]
    };
}

async function main() {
    const alice = await createUser('alice');
    const bob = await createUser('bob');

    const profile = await request('/me', 'PATCH', {
        description: 'Développeuse JavaScript'
    }, alice.cookie);

    assert.equal(profile.status, 200);
    console.log('OK : modification du profil');

    const addSkill = await request('/me/skills', 'POST', {
        skill_id: 3,
        level: 'advanced'
    }, alice.cookie);

    assert.equal(addSkill.status, 200);
    console.log('OK : ajout de compétence');

    const skills = await request(`/users/${alice.id}/skills`);
    assert.equal(skills.status, 200);
    assert.ok(skills.data.some(s => s.id === 3));
    console.log('OK : lecture des compétences');

    const removeSkill = await request('/me/skills/3', 'DELETE',
        undefined, alice.cookie);

    assert.equal(removeSkill.status, 200);
    console.log('OK : suppression de compétence');

    const project = await request('/projects', 'POST', {
        title: 'Projet test ' + suffix,
        description: 'Test des compétences'
    }, alice.cookie);

    assert.equal(project.status, 201);
    const projectId = project.data.project_id;

    const forbidden = await request(
        `/projects/${projectId}/skills`,
        'POST',
        { skill_id: 3 },
        bob.cookie
    );

    assert.equal(forbidden.status, 403);
    console.log('OK : Bob ne peut pas modifier le projet d’Alice');

    const allowed = await request(
        `/projects/${projectId}/skills`,
        'POST',
        { skill_id: 3 },
        alice.cookie
    );

    assert.equal(allowed.status, 200);
    console.log('OK : Alice peut ajouter une compétence au projet');

    const report = await request('/reports', 'POST', {
        reported_user_id: bob.id,
        reason: 'Comportement inapproprié',
        description: 'Signalement de test'
    }, alice.cookie);

    assert.equal(report.status, 201);
    console.log('OK : création de signalement');

    const privateReports = await request(
        '/reports', 'GET', undefined, bob.cookie
    );

    assert.equal(privateReports.status, 403);
    console.log('OK : signalements interdits aux non-admins');

    console.log('\nTOUS LES TESTS DES FONCTIONNALITÉS ONT RÉUSSI');
}

main()
    .catch(error => {
        console.error('ÉCHEC :', error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        try {
            if (users.length) {
                const placeholders = users.map(() => '?').join(',');

                // Supprimer les signalements créés par les comptes de test.
                await db.query(
                    `DELETE FROM reports
                     WHERE reporter_id IN (${placeholders})`,
                    users
                );

                // Supprimer uniquement les comptes de test.
                await db.query(
                    `DELETE FROM users WHERE id IN (${placeholders})`,
                    users
                );

                console.log('Données de test nettoyées');
            }
        } catch (error) {
            console.error('Erreur de nettoyage :', error.message);
            process.exitCode = 1;
        }

        await db.end();
    });
