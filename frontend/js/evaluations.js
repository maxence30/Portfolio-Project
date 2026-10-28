const API = "http://localhost:3000";

async function request(path, options = {}) {
    const response = await fetch(API + path, {
        ...options,
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Erreur serveur");
    }

    return data;
}

let currentUser;
let projects = [];
let applications = [];
let users = [];

function fillSelect(select, items, placeholder) {
    select.replaceChildren();

    const first = document.createElement("option");
    first.value = "";
    first.textContent = placeholder;
    select.appendChild(first);

    items.forEach(item => {
        const option = document.createElement("option");
        option.value = item.id;
        option.textContent = item.label;
        select.appendChild(option);
    });
}

function eligibleCollaborators(projectId) {
    const project = projects.find(p => Number(p.id) === Number(projectId));

    if (!project || project.status !== "completed") return [];

    const accepted = applications.filter(a =>
        Number(a.project_id) === Number(projectId) &&
        a.status === "accepted"
    );

    const ids = new Set();

    accepted.forEach(a => {
        if (Number(project.user_id) === Number(currentUser.id)) {
            ids.add(Number(a.applicant_id));
        } else if (Number(a.applicant_id) === Number(currentUser.id)) {
            ids.add(Number(project.user_id));
        }
    });

    ids.delete(Number(currentUser.id));

    return users
        .filter(u => ids.has(Number(u.id)))
        .map(u => ({ id: u.id, label: u.username }));
}

function updateCollaborators() {
    const id = document.getElementById("ratingProject").value;
    fillSelect(
        document.getElementById("ratingUser"),
        eligibleCollaborators(id),
        "Choisir un collaborateur"
    );
}

async function loadRatings() {
    const ratings = await request("/ratings");
    const container = document.getElementById("ratingsList");
    container.replaceChildren();

    if (!ratings.length) {
        container.textContent = "Aucun avis pour le moment.";
        return;
    }

    ratings.forEach(rating => {
        const card = document.createElement("article");
        card.className = "bg-base-200 p-4 rounded-xl";

        const reviewed = users.find(
            u => Number(u.id) === Number(rating.reviewed_user_id)
        );

        const reviewer = users.find(
            u => Number(u.id) === Number(rating.reviewer_id)
        );

        const title = document.createElement("h3");
        title.className = "font-bold text-lg";
        title.textContent =
            `${reviewer?.username || "Utilisateur"} → ${reviewed?.username || "Utilisateur"}`;

        const stars = document.createElement("p");
        stars.className = "text-warning text-xl";
        stars.textContent =
            "★".repeat(rating.score) + "☆".repeat(5 - rating.score);

        const comment = document.createElement("p");
        comment.className = "mt-2";
        comment.textContent = rating.comment || "Aucun commentaire.";

        card.append(title, stars, comment);
        container.appendChild(card);
    });
}

async function init() {
    const message = document.getElementById("ratingMessage");

    try {
        currentUser = await request("/me");

        [projects, applications, users] = await Promise.all([
            request("/projects"),
            request("/applications"),
            request("/users")
        ]);

        const eligibleProjects = projects.filter(p =>
            p.status === "completed" &&
            eligibleCollaborators(p.id).length > 0
        );

        fillSelect(
            document.getElementById("ratingProject"),
            eligibleProjects.map(p => ({
                id: p.id,
                label: p.title
            })),
            "Choisir un projet terminé"
        );

        document.getElementById("ratingProject")
            .addEventListener("change", updateCollaborators);

        await loadRatings();
    } catch (error) {
        message.textContent = error.message;
        message.className = "text-error";
    }
}

document.getElementById("ratingForm").addEventListener("submit", async event => {
    event.preventDefault();

    const message = document.getElementById("ratingMessage");
    const button = event.target.querySelector('button[type="submit"]');

    button.disabled = true;

    try {
        await request("/ratings", {
            method: "POST",
            body: JSON.stringify({
                project_id: Number(document.getElementById("ratingProject").value),
                reviewed_user_id: Number(document.getElementById("ratingUser").value),
                score: Number(document.getElementById("ratingScore").value),
                comment: document.getElementById("ratingComment").value.trim()
            })
        });

        message.textContent = "Évaluation publiée avec succès !";
        message.className = "text-success";

        document.getElementById("ratingComment").value = "";
        await loadRatings();
    } catch (error) {
        message.textContent = error.message;
        message.className = "text-error";
    } finally {
        button.disabled = false;
    }
});

init();
