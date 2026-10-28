
const API_URL = "http://localhost:3000";

const projectDetails = document.getElementById("projectDetails");
const applicationMessage = document.getElementById("applicationMessage");
const applicationSection = document.getElementById("applicationSection");
const applicationForm = document.getElementById("applicationForm");
const applyButton = document.getElementById("applyButton");

const params = new URLSearchParams(window.location.search);
const projectId = Number(params.get("id"));

let currentProject = null;
let currentUser = null;

function addDetail(container, label, value) {
    const row = document.createElement("div");
    row.className = "flex flex-col sm:flex-row sm:gap-3 py-3 border-b border-base-200";

    const labelElement = document.createElement("span");
    labelElement.className = "font-semibold text-base md:text-lg sm:min-w-48";
    labelElement.textContent = label;

    const valueElement = document.createElement("span");
    valueElement.className = "text-base md:text-lg text-base-content/80";
    valueElement.textContent = value == null || value === ""
        ? "Non précisé"
        : String(value);

    row.append(labelElement, valueElement);
    container.appendChild(row);
}

function showMessage(text, success = false) {
    applicationMessage.textContent = text;
    applicationMessage.className = success
        ? "mt-6 text-center text-lg font-semibold text-success"
        : "mt-6 text-center text-lg font-semibold text-error";
}

async function getCurrentUser() {
    try {
        const response = await fetch(`${API_URL}/me`, {
            credentials: "include"
        });

        if (!response.ok) return null;
        return await response.json();
    } catch {
        return null;
    }
}

async function loadProject() {
    if (!Number.isSafeInteger(projectId) || projectId <= 0) {
        projectDetails.textContent = "Identifiant de projet invalide.";
        return;
    }

    try {
        const response = await fetch(`${API_URL}/projects`, {
            credentials: "include"
        });

        if (!response.ok) {
            throw new Error("Impossible de charger les projets.");
        }

        const projects = await response.json();

        if (!Array.isArray(projects)) {
            throw new Error("Format de réponse invalide.");
        }

        currentProject = projects.find(
            project => Number(project.id) === projectId
        );

        if (!currentProject) {
            projectDetails.textContent = "Projet introuvable.";
            return;
        }

        currentUser = await getCurrentUser();

        const body = document.createElement("div");
        body.className = "card-body p-8 md:p-12 gap-6";

        const heading = document.createElement("div");
        heading.className = "space-y-4 pb-5 border-b border-base-200";

        const title = document.createElement("h1");
        title.className = "text-3xl md:text-5xl font-extrabold leading-tight";
        title.textContent = currentProject.title;

        const description = document.createElement("p");
        description.className =
            "text-lg md:text-xl leading-relaxed text-base-content/80 whitespace-pre-line";
        description.textContent = currentProject.description;

        heading.append(title, description);

        const sectionTitle = document.createElement("h2");
        sectionTitle.className = "text-2xl font-bold";
        sectionTitle.textContent = "Informations du projet";

        const information = document.createElement("div");
        information.className = "w-full";

        const workTypes = {
            remote: "À distance",
            onsite: "Sur place",
            hybrid: "Hybride"
        };

        const remunerations = {
            paid: "Rémunéré",
            unpaid: "Non rémunéré",
            volunteer: "Bénévole"
        };

        const statuses = {
            open: "Ouvert",
            in_progress: "En cours",
            completed: "Terminé",
            cancelled: "Annulé"
        };

        addDetail(information, "Catégorie", currentProject.category);
        addDetail(
            information,
            "Mode de travail",
            workTypes[currentProject.work_type] || currentProject.work_type
        );
        addDetail(information, "Ville", currentProject.city);
        addDetail(
            information,
            "Rémunération",
            remunerations[currentProject.remuneration] || currentProject.remuneration
        );

        if (currentProject.remuneration === "paid") {
            addDetail(
                information,
                "Budget",
                currentProject.salary != null
                    ? `${Number(currentProject.salary).toLocaleString("fr-FR")} €`
                    : "Non précisé"
            );
        }

        addDetail(
            information,
            "Statut",
            statuses[currentProject.status] || currentProject.status
        );

        body.append(heading, sectionTitle, information);

        if (!currentUser) {
            const link = document.createElement("a");
            link.href = "login.html";
            link.className = "btn btn-primary btn-lg mt-4";
            link.textContent = "Se connecter pour candidater";
            body.appendChild(link);
        } else if (
            Number(currentUser.id) === Number(currentProject.user_id)
        ) {
            const ownerMessage = document.createElement("div");
            ownerMessage.className = "alert alert-info mt-5 text-base md:text-lg";
            ownerMessage.textContent = "Tu es le propriétaire de ce projet.";
            body.appendChild(ownerMessage);
        } else if (currentProject.status !== "open") {
            const closedMessage = document.createElement("div");
            closedMessage.className = "alert alert-warning mt-5 text-lg";
            closedMessage.textContent = "Ce projet n'accepte plus de candidatures.";
            body.appendChild(closedMessage);
        } else {
            applicationSection.classList.remove("hidden");
        }

        projectDetails.replaceChildren(body);

    } catch (error) {
        console.error(error);
        projectDetails.textContent =
            "Erreur de chargement. Vérifie que le backend fonctionne.";
    }
}

applicationForm.addEventListener("submit", async event => {
    event.preventDefault();

    if (!currentProject || !currentUser) {
        showMessage("Connecte-toi pour candidater.");
        return;
    }

    applyButton.disabled = true;

    try {
        const response = await fetch(`${API_URL}/applications`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                project_id: projectId,
                message: document.getElementById("motivation").value.trim()
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error || data.message || "Candidature impossible."
            );
        }

        applicationSection.classList.add("hidden");
        showMessage("Ta candidature a bien été envoyée !", true);

    } catch (error) {
        showMessage(error.message);
        applyButton.disabled = false;
    }
});

loadProject();
