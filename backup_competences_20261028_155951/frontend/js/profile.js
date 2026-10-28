
const API_URL = "http://localhost:3000";

let currentUser = null;

const loading = document.getElementById("loading");
const profileContent = document.getElementById("profileContent");
const errorMessage = document.getElementById("errorMessage");
const myProjects = document.getElementById("myProjects");

async function api(path, options = {}) {
    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    });

    let data = null;

    try {
        data = await response.json();
    } catch {
        data = null;
    }

    if (response.status === 401) {
        window.location.href = "login.html";
        throw new Error("Connexion nécessaire");
    }

    if (!response.ok) {
        throw new Error(
            data?.error || data?.message || "Une erreur est survenue."
        );
    }

    return data;
}

function showMessage(elementId, text, success = true) {
    const element = document.getElementById(elementId);
    element.textContent = text;
    element.className = success
        ? "text-success font-medium"
        : "text-error font-medium";
}

function displayProfile(user) {
    document.getElementById("displayUsername").textContent = user.username;
    document.getElementById("displayEmail").textContent = user.email;
    document.getElementById("avatarLetter").textContent =
        user.username.charAt(0).toUpperCase();

    document.getElementById("username").value = user.username || "";
    document.getElementById("description").value = user.description || "";
    document.getElementById("experience").value = user.experience || "";
    document.getElementById("portfolio").value = user.portfolio || "";
}

async function loadSkills() {
    const [availableSkills, userSkills] = await Promise.all([
        api("/skills"),
        api(`/users/${currentUser.id}/skills`)
    ]);

    const select = document.getElementById("skillSelect");
    select.replaceChildren();

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Choisir une compétence";
    select.appendChild(placeholder);

    availableSkills.forEach(skill => {
        const option = document.createElement("option");
        option.value = skill.id;
        option.textContent = skill.name;
        select.appendChild(option);
    });

    const container = document.getElementById("skillsList");
    container.replaceChildren();

    document.getElementById("noSkills").classList.toggle(
        "hidden",
        userSkills.length > 0
    );

    const levelLabels = {
        beginner: "Débutant",
        intermediate: "Intermédiaire",
        advanced: "Avancé"
    };

    userSkills.forEach(skill => {
        const item = document.createElement("div");
        item.className =
            "flex items-center gap-2 bg-base-200 rounded-lg px-3 py-2";

        const name = document.createElement("span");
        name.textContent =
            `${skill.name} — ${levelLabels[skill.level] || skill.level}`;

        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "btn btn-error btn-xs btn-outline";
        remove.textContent = "Supprimer";

        remove.addEventListener("click", async () => {
            remove.disabled = true;

            try {
                await api(`/me/skills/${skill.id}`, {
                    method: "DELETE"
                });

                await loadSkills();
                showMessage(
                    "skillMessage",
                    "Compétence supprimée avec succès."
                );
            } catch (error) {
                showMessage("skillMessage", error.message, false);
                remove.disabled = false;
            }
        });

        item.append(name, remove);
        container.appendChild(item);
    });
}

function displayProjects(projects) {
    myProjects.replaceChildren();

    const owned = projects.filter(
        project => Number(project.user_id) === Number(currentUser.id)
    );

    document.getElementById("noProjects").classList.toggle(
        "hidden",
        owned.length > 0
    );

    owned.forEach(project => {
        const card = document.createElement("div");
        card.className = "card bg-base-100 shadow-md";

        const body = document.createElement("div");
        body.className = "card-body";

        const title = document.createElement("h3");
        title.className = "card-title";
        title.textContent = project.title;

        const description = document.createElement("p");
        description.className = "text-base-content/70";
        description.textContent = project.description;

        const status = document.createElement("span");
        status.className = "badge badge-outline";
        status.textContent = project.status;

        const link = document.createElement("a");
        link.href = `project.html?id=${encodeURIComponent(project.id)}`;
        link.className = "btn btn-primary btn-sm mt-3";
        link.textContent = "Voir le projet";

        body.append(title, description, status);

        if (project.remuneration === "paid") {
            const salary = document.createElement("span");
            salary.className = "badge badge-success mt-2";
            salary.textContent = project.salary != null
                ? `${Number(project.salary).toLocaleString("fr-FR")} €`
                : "Rémunéré";

            body.appendChild(salary);
        }

        body.appendChild(link);
        card.appendChild(body);
        myProjects.appendChild(card);
    });
}

document.getElementById("profileForm").addEventListener(
    "submit",
    async event => {
        event.preventDefault();

        const button = document.getElementById("saveProfileButton");
        button.disabled = true;

        const data = {
            username: document.getElementById("username").value.trim(),
            description: document.getElementById("description").value.trim(),
            experience: document.getElementById("experience").value.trim(),
            portfolio: document.getElementById("portfolio").value.trim()
        };

        try {
            await api("/me", {
                method: "PATCH",
                body: JSON.stringify(data)
            });

            currentUser = await api("/me");
            displayProfile(currentUser);

            showMessage(
                "profileMessage",
                "Profil modifié avec succès !"
            );
        } catch (error) {
            showMessage("profileMessage", error.message, false);
        } finally {
            button.disabled = false;
        }
    }
);

document.getElementById("skillForm").addEventListener(
    "submit",
    async event => {
        event.preventDefault();

        const button = document.getElementById("addSkillButton");
        button.disabled = true;

        const data = {
            skill_id: Number(document.getElementById("skillSelect").value),
            level: document.getElementById("skillLevel").value
        };

        try {
            await api("/me/skills", {
                method: "POST",
                body: JSON.stringify(data)
            });

            await loadSkills();
            showMessage(
                "skillMessage",
                "Compétence enregistrée avec succès !"
            );
        } catch (error) {
            showMessage("skillMessage", error.message, false);
        } finally {
            button.disabled = false;
        }
    }
);

document.getElementById("logoutButton").addEventListener(
    "click",
    async () => {
        try {
            await api("/logout", { method: "POST" });
            window.location.href = "login.html";
        } catch (error) {
            errorMessage.textContent = error.message;
            errorMessage.classList.remove("hidden");
        }
    }
);

async function loadProfile() {
    try {
        currentUser = await api("/me");
        displayProfile(currentUser);

        const projects = await api("/projects");
        displayProjects(projects);

        profileContent.classList.remove("hidden");

        try {
            await loadSkills();
        } catch (error) {
            showMessage("skillMessage", error.message, false);
        }
    } catch (error) {
        errorMessage.textContent = error.message;
        errorMessage.classList.remove("hidden");
    } finally {
        loading.classList.add("hidden");
    }
}

loadProfile();
