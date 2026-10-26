
const projectDetails = document.getElementById("projectDetails");
const applicationMessage = document.getElementById("applicationMessage");

const params = new URLSearchParams(window.location.search);
const projectId = Number(params.get("id"));

function addDetail(container, label, value) {
    const paragraph = document.createElement("p");

    const strong = document.createElement("strong");
    strong.textContent = `${label} : `;

    paragraph.append(strong, document.createTextNode(value || "Non précisé"));
    container.appendChild(paragraph);
}

async function loadProject() {
    if (!Number.isInteger(projectId) || projectId <= 0) {
        projectDetails.textContent = "Identifiant de projet invalide.";
        return;
    }

    try {
        const response = await fetch("http://localhost:3000/projects", {
            credentials: "include"
        });

        if (!response.ok) {
            throw new Error("Impossible de récupérer les projets.");
        }

        const projects = await response.json();

        if (!Array.isArray(projects)) {
            throw new Error("Format de réponse inattendu.");
        }

        const project = projects.find((item) => Number(item.id) === projectId);

        if (!project) {
            projectDetails.textContent = "Projet introuvable.";
            return;
        }

        const body = document.createElement("div");
        body.className = "card-body gap-4";

        const title = document.createElement("h1");
        title.className = "text-3xl font-bold";
        title.textContent = project.title;

        const description = document.createElement("p");
        description.className = "text-base-content/80 whitespace-pre-line";
        description.textContent = project.description;

        const information = document.createElement("div");
        information.className = "space-y-2 mt-4";

        addDetail(information, "Catégorie", project.category);
        addDetail(information, "Mode de travail", project.work_type);
        addDetail(information, "Ville", project.city);
        addDetail(information, "Rémunération", project.remuneration);
        addDetail(information, "Statut", project.status);

        const button = document.createElement("button");
        button.className = "btn btn-primary mt-6";
        button.textContent = "Candidater au projet";
        button.type = "button";

        button.addEventListener("click", () => {
            applicationMessage.textContent =
                "Le formulaire de candidature sera ajouté prochainement.";
        });

        body.append(title, description, information, button);
        projectDetails.replaceChildren(body);

    } catch (error) {
        console.error(error);
        projectDetails.textContent =
            "Erreur de chargement. Vérifie que le backend fonctionne.";
    }
}

loadProject();
