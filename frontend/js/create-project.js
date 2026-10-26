
const form = document.getElementById("createProjectForm");
const message = document.getElementById("message");
const submitButton = document.getElementById("submitButton");

const categorySelect = document.getElementById("category");
const customCategoryContainer = document.getElementById(
    "customCategoryContainer"
);
const customCategoryInput = document.getElementById("customCategory");

const remunerationSelect = document.getElementById("remuneration");
const salaryContainer = document.getElementById("salaryContainer");
const salaryInput = document.getElementById("salary");

// Afficher ou masquer la catégorie personnalisée
function updateCategory() {
    const isOther = categorySelect.value === "Autre";

    customCategoryContainer.classList.toggle("hidden", !isOther);
    customCategoryInput.required = isOther;

    if (!isOther) {
        customCategoryInput.value = "";
    }
}

// Afficher ou masquer le budget
function updateRemuneration() {
    const isPaid = remunerationSelect.value === "paid";

    salaryContainer.classList.toggle("hidden", !isPaid);

    if (!isPaid) {
        salaryInput.value = "";
    }
}

categorySelect.addEventListener("change", updateCategory);
remunerationSelect.addEventListener("change", updateRemuneration);

updateCategory();
updateRemuneration();

// Création du projet
form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const category = categorySelect.value === "Autre"
        ? customCategoryInput.value.trim()
        : categorySelect.value;

    const isPaid = remunerationSelect.value === "paid";

    const project = {
        title: document.getElementById("title").value.trim(),
        description: document.getElementById("description").value.trim(),
        category: category,
        remuneration: remunerationSelect.value,
        work_type: document.getElementById("work_type").value,
        city: document.getElementById("city").value.trim() || null,
        salary: isPaid && salaryInput.value !== ""
            ? Number(salaryInput.value)
            : null
    };

    if (!project.title || !project.description || !project.category) {
        message.textContent = "Merci de remplir les champs obligatoires.";
        message.className = "text-error text-center";
        return;
    }

    if (
        project.salary !== null &&
        (!Number.isFinite(project.salary) ||
         project.salary < 0 ||
         project.salary > 99999999.99)
    ) {
        message.textContent = "Le budget indiqué est invalide.";
        message.className = "text-error text-center";
        return;
    }

    submitButton.disabled = true;
    message.textContent = "Publication en cours...";
    message.className = "text-center";

    try {
        const response = await fetch("http://localhost:3000/projects", {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(project)
        });

        const data = await response.json();

        if (!response.ok) {
            message.textContent =
                data.error || data.message || "Erreur lors de la publication.";
            message.className = "text-error text-center";
            return;
        }

        message.textContent = "Projet publié avec succès !";
        message.className = "text-success text-center";

        window.location.href = "projects.html";

    } catch (error) {
        console.error(error);
        message.textContent =
            "Impossible de contacter le serveur. Vérifie ton backend.";
        message.className = "text-error text-center";

    } finally {
        submitButton.disabled = false;
    }
});
