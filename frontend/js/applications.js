
const API_URL = "http://localhost:3000";

const loading = document.getElementById("loading");
const content = document.getElementById("content");
const errorMessage = document.getElementById("errorMessage");

const sentContainer = document.getElementById("sentApplications");
const receivedContainer = document.getElementById("receivedApplications");

let currentUser = null;
let projects = [];
let publicUsers = [];

async function api(path, options = {}) {
    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    });

    const data = await response.json();

    if (response.status === 401) {
        window.location.href = "login.html";
        throw new Error("Connexion nécessaire.");
    }

    if (!response.ok) {
        throw new Error(data.error || "Une erreur est survenue.");
    }

    return data;
}


// skillinkClickableProfiles
function createProfileLink(userId, username) {
    const link = document.createElement("a");
    link.href = `user.html?id=${encodeURIComponent(userId)}`;
    link.className = "link link-primary font-semibold";
    link.textContent = username || `Utilisateur n°${userId}`;
    link.title = "Consulter le profil public";
    return link;
}

function getProject(projectId) {
    return projects.find(
        project => Number(project.id) === Number(projectId)
    );
}

function getStatusLabel(status) {
    const labels = {
        pending: "En attente",
        accepted: "Acceptée",
        rejected: "Refusée"
    };

    return labels[status] || status;
}

function createCard(application, received) {
    const project = getProject(application.project_id);

    const card = document.createElement("div");
    card.className = "card bg-base-100 shadow-md";

    const body = document.createElement("div");
    body.className = "card-body";

    const title = document.createElement("h3");
    title.className = "card-title";
    title.textContent = project
        ? project.title
        : `Projet n°${application.project_id}`;

    const status = document.createElement("span");
    status.className = "badge badge-outline";
    status.textContent = getStatusLabel(application.status);

    const message = document.createElement("p");
    message.className = "text-base-content/70 whitespace-pre-line";
    message.textContent =
        application.message || "Aucun message de motivation.";

    body.append(title, status, message);

    if (received) {
        const applicant = document.createElement("p");
        applicant.className = "font-medium";

        const applicantUser = publicUsers.find(
            user => Number(user.id) === Number(application.applicant_id)
        );

        applicant.append("Candidat : ");
        applicant.appendChild(
            createProfileLink(
                application.applicant_id,
                applicantUser?.username
            )
        );

        body.appendChild(applicant);

        if (application.status === "pending") {
            const actions = document.createElement("div");
            actions.className = "flex gap-2 mt-3";

            const accept = document.createElement("button");
            accept.className = "btn btn-success btn-sm";
            accept.textContent = "Accepter";

            const reject = document.createElement("button");
            reject.className = "btn btn-error btn-outline btn-sm";
            reject.textContent = "Refuser";

            accept.addEventListener("click", () => {
                updateApplication(application.id, "accepted", accept, reject);
            });

            reject.addEventListener("click", () => {
                updateApplication(application.id, "rejected", accept, reject);
            });

            actions.append(accept, reject);
            body.appendChild(actions);
        }
    }

    if (!received && project) {
        const creator = publicUsers.find(
            user => Number(user.id) === Number(project.user_id)
        );

        const creatorRow = document.createElement("p");
        creatorRow.className = "font-medium";
        creatorRow.append("Créateur : ");
        creatorRow.appendChild(
            createProfileLink(project.user_id, creator?.username)
        );
        body.appendChild(creatorRow);
    }

    if (project) {
        const link = document.createElement("a");
        link.href = `project.html?id=${encodeURIComponent(project.id)}`;
        link.className = "btn btn-primary btn-sm mt-3";
        link.textContent = "Voir le projet";
        body.appendChild(link);
    }

    card.appendChild(body);
    return card;
}

async function updateApplication(id, status, accept, reject) {
    accept.disabled = true;
    reject.disabled = true;

    try {
        await api(`/applications/${id}`, {
            method: "PATCH",
            body: JSON.stringify({ status })
        });

        await loadApplications();
    } catch (error) {
        errorMessage.textContent = error.message;
        errorMessage.classList.remove("hidden");

        accept.disabled = false;
        reject.disabled = false;
    }
}

async function loadApplications() {
    const applications = await api("/applications");

    sentContainer.replaceChildren();
    receivedContainer.replaceChildren();

    const sent = applications.filter(
        application =>
            Number(application.applicant_id) === Number(currentUser.id)
    );

    const received = applications.filter(application => {
        const project = getProject(application.project_id);

        return project &&
            Number(project.user_id) === Number(currentUser.id);
    });

    sent.forEach(application => {
        sentContainer.appendChild(createCard(application, false));
    });

    received.forEach(application => {
        receivedContainer.appendChild(createCard(application, true));
    });

    document.getElementById("noSent").classList.toggle(
        "hidden",
        sent.length > 0
    );

    document.getElementById("noReceived").classList.toggle(
        "hidden",
        received.length > 0
    );
}

async function initialize() {
    try {
        currentUser = await api("/me");
        projects = await api("/projects");
        publicUsers = await api("/users");

        await loadApplications();
        content.classList.remove("hidden");
    } catch (error) {
        errorMessage.textContent = error.message;
        errorMessage.classList.remove("hidden");
    } finally {
        loading.classList.add("hidden");
    }
}

initialize();
