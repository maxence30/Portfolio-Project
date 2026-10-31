const API_URL = "http://localhost:3000";

const loading = document.getElementById("loading");
const errorMessage = document.getElementById("errorMessage");
const profileContent = document.getElementById("profileContent");

async function api(path) {
    const response = await fetch(`${API_URL}${path}`, {
        credentials: "include"
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.error || "Impossible de charger les informations."
        );
    }

    return data;
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove("hidden");
}

function displayUser(user) {
    const username = user.username || "Utilisateur";

    document.title = `${username} - Skillink`;

    document.getElementById("displayUsername").textContent = username;

    document.getElementById("avatarLetter").textContent =
        username.charAt(0).toUpperCase();

    document.getElementById("displayDescription").textContent =
        user.description || "Aucune présentation renseignée.";

    document.getElementById("displayExperience").textContent =
        user.experience || "Aucune expérience renseignée.";

    const portfolioContainer =
        document.getElementById("portfolioContainer");

    portfolioContainer.replaceChildren();

    if (user.portfolio) {
        try {
            const url = new URL(user.portfolio);

            if (!["https:", "http:"].includes(url.protocol)) {
                throw new Error("Protocole non autorisé");
            }

            const link = document.createElement("a");
            link.href = url.href;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.className = "link link-primary break-all";
            link.textContent = url.href;

            portfolioContainer.appendChild(link);
        } catch {
            portfolioContainer.textContent =
                "Lien de portfolio indisponible.";
        }
    } else {
        portfolioContainer.textContent =
            "Aucun portfolio renseigné.";
    }
}

function displaySkills(skills) {
    const container = document.getElementById("skillsList");
    container.replaceChildren();

    const levels = {
        beginner: "Débutant",
        intermediate: "Intermédiaire",
        advanced: "Avancé"
    };

    if (!skills.length) {
        container.textContent = "Aucune compétence renseignée.";
        return;
    }

    skills.forEach(skill => {
        const badge = document.createElement("span");
        badge.className = "badge badge-primary badge-outline p-4";

        badge.textContent =
            `${skill.name} — ${levels[skill.level] || skill.level}`;

        container.appendChild(badge);
    });
}

function displayProjects(projects) {
    const container = document.getElementById("projectsList");
    container.replaceChildren();

    if (!projects.length) {
        const empty = document.createElement("p");
        empty.className = "text-base-content/60";
        empty.textContent = "Cet utilisateur n'a publié aucun projet.";
        container.appendChild(empty);
        return;
    }

    const statuses = {
        open: "Ouvert",
        in_progress: "En cours",
        completed: "Terminé",
        cancelled: "Annulé"
    };

    projects.forEach(project => {
        const card = document.createElement("article");
        card.className = "card bg-base-100 shadow-md";

        const body = document.createElement("div");
        body.className = "card-body";

        const title = document.createElement("h3");
        title.className = "card-title";
        title.textContent = project.title;

        const description = document.createElement("p");
        description.className = "text-base-content/70";
        description.textContent = project.description || "";

        const status = document.createElement("span");
        status.className = "badge badge-outline";
        status.textContent =
            statuses[project.status] || project.status;

        const link = document.createElement("a");
        link.href =
            `project.html?id=${encodeURIComponent(project.id)}`;
        link.className = "btn btn-primary btn-sm mt-3";
        link.textContent = "Voir le projet";

        body.append(title, description, status, link);
        card.appendChild(body);
        container.appendChild(card);
    });
}

async function initialize() {
    try {
        const params = new URLSearchParams(window.location.search);
        const rawId = params.get("id");
        const userId = Number(rawId);

        if (
            !rawId ||
            !/^[0-9]+$/.test(rawId) ||
            !Number.isSafeInteger(userId) ||
            userId <= 0
        ) {
            throw new Error("Identifiant utilisateur invalide.");
        }

        const [users, skills, projects] = await Promise.all([
            api("/users"),
            api(`/users/${userId}/skills`),
            api("/projects")
        ]);

        const user = users.find(
            item => Number(item.id) === userId
        );

        if (!user) {
            throw new Error("Utilisateur introuvable.");
        }

        displayUser(user);
        displaySkills(skills);

        displayProjects(
            projects.filter(
                project => Number(project.user_id) === userId
            )
        );

        profileContent.classList.remove("hidden");
    } catch (error) {
        showError(error.message);
    } finally {
        loading.classList.add("hidden");
    }
}

initialize();
