
const projectsList = document.getElementById("projectsList");

async function loadProjects() {
    try {
        const response = await fetch("http://localhost:3000/projects", {
            credentials: "include"
        });

        if (!response.ok) {
            throw new Error("Erreur lors du chargement des projets.");
        }

        const projects = await response.json();

        if (!Array.isArray(projects)) {
            throw new Error("Format de réponse inattendu.");
        }

        projectsList.replaceChildren();

        if (projects.length === 0) {
            projectsList.textContent = "Aucun projet disponible.";
            return;
        }

        projects.forEach((project) => {
            const card = document.createElement("article");
            card.className = "card bg-base-100 shadow-md";
            card.dataset.category = project.category || "";
            card.dataset.city = project.city || "";
            card.dataset.workType = project.work_type || "";

            const body = document.createElement("div");
            body.className = "card-body";

            const title = document.createElement("h2");
            title.className = "card-title";
            title.textContent = project.title;

            const description = document.createElement("p");
            description.className = "text-base-content/70";
            description.textContent = project.description;

            const category = document.createElement("span");
            category.className = "badge badge-outline";
            category.textContent = project.category || "Autre";

            const link = document.createElement("a");
            link.className = "btn btn-primary mt-4";
            link.href = `project.html?id=${encodeURIComponent(project.id)}`;
            link.textContent = "Voir le projet";

            body.append(title, category, description, link);
            card.appendChild(body);
            projectsList.appendChild(card);
        });

    } catch (error) {
        console.error(error);
        projectsList.textContent =
            "Impossible de charger les projets. Vérifie le backend.";
    }
}

loadProjects();
