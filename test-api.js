const baseURL = 'http://localhost:3000';

async function request(method, route, data) {
    const response = await fetch(baseURL + route, {
        method,
        headers: { 'Content-Type': 'application/json' },
        ...(data ? { body: JSON.stringify(data) } : {})
    });

    const result = await response.json();
    console.log(method, route, response.status, result);

    if (!response.ok) {
        throw new Error(`Échec de ${method} ${route}`);
    }

    return result;
}

async function main() {
    const suffix = Date.now();

    console.log('\n=== INSCRIPTION ===');

    const alice = await request('POST', '/users', {
        username: 'alice_test',
        email: `alice_${suffix}@example.com`,
        password: 'TestPassword123!'
    });

    const bob = await request('POST', '/users', {
        username: 'bob_test',
        email: `bob_${suffix}@example.com`,
        password: 'TestPassword123!'
    });

    console.log('\n=== CONNEXION ===');

    await request('POST', '/login', {
        email: `alice_${suffix}@example.com`,
        password: 'TestPassword123!'
    });

    console.log('\n=== CREATION PROJET ===');

    const project = await request('POST', '/projects', {
        user_id: alice.user_id,
        title: 'Projet de collaboration test',
        description: 'Recherche un developpeur JavaScript',
        category: 'Informatique',
        remuneration: 'volunteer',
        work_type: 'remote'
    });

    console.log('\n=== CANDIDATURE ===');

    await request('POST', '/applications', {
        project_id: project.project_id,
        applicant_id: bob.user_id,
        message: 'Je souhaite participer au projet.'
    });

    console.log('\n=== MESSAGE ===');

    await request('POST', '/messages', {
        sender_id: bob.user_id,
        receiver_id: alice.user_id,
        project_id: project.project_id,
        content: 'Bonjour, je suis interesse par ton projet.'
    });

    console.log('\n=== EVALUATION ===');

    await request('POST', '/ratings', {
        project_id: project.project_id,
        reviewer_id: alice.user_id,
        reviewed_user_id: bob.user_id,
        score: 5,
        comment: 'Tres bonne collaboration.'
    });

    console.log('\n=== VERIFICATION ===');

    await request('GET', '/projects');
    await request('GET', '/applications');
    await request('GET', '/messages');
    await request('GET', '/ratings');

    console.log('\nTOUS LES TESTS ONT REUSSI !');
}

main().catch(error => {
    console.error('\nERREUR :', error.message);
    process.exitCode = 1;
});
