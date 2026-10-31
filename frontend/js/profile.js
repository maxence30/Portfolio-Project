
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

    const other = document.createElement("option");
    other.value = "other";
    other.textContent = "Autre (personnalisée)";
    select.appendChild(other);

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
        const statusLabels = {
            open: "Ouvert",
            in_progress: "En cours - candidatures closes",
            completed: "Terminé",
            cancelled: "Annulé"
        };

        status.className = "badge badge-outline";
        status.textContent = statusLabels[project.status] || project.status;

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

        const actions = document.createElement("div");
        actions.className = "flex flex-wrap gap-2 mt-3";

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "btn btn-warning btn-sm";
        editButton.textContent = "Modifier";

        editButton.addEventListener("click", () => {
            if (body.querySelector(".project-edit-form")) return;

            const form = document.createElement("form");
            form.className =
                "project-edit-form bg-base-200 p-5 rounded-xl mt-4 space-y-3";

            const fields = [
                ["title", "Titre", "text"],
                ["description", "Description", "textarea"],
                ["category", "Catégorie", "text"],
                ["city", "Ville", "text"]
            ];

            const inputs = {};

            fields.forEach(([key, label, type]) => {
                const wrapper = document.createElement("label");
                wrapper.className = "form-control w-full";

                const text = document.createElement("span");
                text.className = "label-text font-semibold";
                text.textContent = label;

                const input = document.createElement(
                    type === "textarea" ? "textarea" : "input"
                );

                if (type !== "textarea") input.type = "text";

                input.className = type === "textarea"
                    ? "textarea textarea-bordered w-full"
                    : "input input-bordered w-full";

                input.value = project[key] || "";
                input.required = key === "title" || key === "description";

                wrapper.append(text, input);
                form.appendChild(wrapper);
                inputs[key] = input;
            });

            const selects = {
                work_type: {
                    label: "Type de travail",
                    values: {
                        remote: "À distance",
                        onsite: "Sur place",
                        hybrid: "Hybride"
                    }
                },
                remuneration: {
                    label: "Rémunération",
                    values: {
                        paid: "Rémunéré",
                        unpaid: "Non rémunéré",
                        volunteer: "Bénévolat"
                    }
                },
                status: {
                    label: "Statut",
                    values: {
                        open: "Ouvert",
                        in_progress: "En cours",
                        completed: "Terminé",
                        cancelled: "Annulé"
                    }
                }
            };

            Object.entries(selects).forEach(([key, config]) => {
                const wrapper = document.createElement("label");
                wrapper.className = "form-control w-full";

                const label = document.createElement("span");
                label.className = "label-text font-semibold";
                label.textContent = config.label;

                const select = document.createElement("select");
                select.className = "select select-bordered w-full";

                Object.entries(config.values).forEach(([value, text]) => {
                    const option = document.createElement("option");
                    option.value = value;
                    option.textContent = text;
                    select.appendChild(option);
                });

                select.value = project[key];
                wrapper.append(label, select);
                form.appendChild(wrapper);
                inputs[key] = select;
            });

            const buttons = document.createElement("div");
            buttons.className = "flex gap-2 pt-3";

            const save = document.createElement("button");
            save.type = "submit";
            save.className = "btn btn-primary";
            save.textContent = "Enregistrer";

            const cancel = document.createElement("button");
            cancel.type = "button";
            cancel.className = "btn btn-ghost";
            cancel.textContent = "Annuler";
            cancel.addEventListener("click", () => form.remove());

            buttons.append(save, cancel);
            form.appendChild(buttons);

            form.addEventListener("submit", async event => {
                event.preventDefault();
                save.disabled = true;

                const data = {};

                Object.entries(inputs).forEach(([key, input]) => {
                    data[key] = input.value.trim();
                });

                try {
                    await api(`/projects/${project.id}`, {
                        method: "PATCH",
                        body: JSON.stringify(data)
                    });

                    const projects = await api("/projects");
                    displayProjects(projects);
                    showMessage(
                        "profileMessage",
                        "Projet modifié avec succès !"
                    );
                } catch (error) {
                    alert(error.message);
                    save.disabled = false;
                }
            });

            body.appendChild(form);
        });

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "btn btn-error btn-sm";
        deleteButton.textContent = "Supprimer";

        deleteButton.addEventListener("click", async () => {
            const confirmed = await new Promise(resolve => {
                const dialog = document.createElement("dialog");
                dialog.className = "modal";

                const box = document.createElement("div");
                box.className = "modal-box";

                const title = document.createElement("h3");
                title.className = "font-bold text-xl text-error";
                title.textContent = "Supprimer ce projet ?";

                const description = document.createElement("p");
                description.className = "py-4";
                description.textContent =
                    `Le projet "${project.title}" sera supprimé définitivement.`;

                const actions = document.createElement("div");
                actions.className = "modal-action";

                const cancel = document.createElement("button");
                cancel.className = "btn btn-outline";
                cancel.textContent = "Annuler";

                const confirmDelete = document.createElement("button");
                confirmDelete.className = "btn btn-error";
                confirmDelete.textContent = "Supprimer définitivement";

                let settled = false;

                function finish(value) {
                    if (settled) return;
                    settled = true;
                    dialog.close();
                    dialog.remove();
                    resolve(value);
                }

                cancel.addEventListener("click", () => finish(false));
                confirmDelete.addEventListener("click", () => finish(true));
                dialog.addEventListener("cancel", event => {
                    event.preventDefault();
                    finish(false);
                });

                actions.append(cancel, confirmDelete);
                box.append(title, description, actions);
                dialog.appendChild(box);
                document.body.appendChild(dialog);
                dialog.showModal();
            });

            if (!confirmed) return;

            try {
                deleteButton.disabled = true;

                await api(`/projects/${project.id}`, {
                    method: "DELETE"
                });

                const projects = await api("/projects");
                displayProjects(projects);

                alert("Projet supprimé avec succès !");
            } catch (error) {
                alert(error.message);
                deleteButton.disabled = false;
            }
        });

        async function changeProjectStatus(newStatus) {
            const buttons = actions.querySelectorAll("button");
            buttons.forEach(button => button.disabled = true);

            try {
                await api(`/projects/${project.id}`, {
                    method: "PATCH",
                    body: JSON.stringify({ status: newStatus })
                });

                const updatedProjects = await api("/projects");
                displayProjects(updatedProjects);

                showMessage(
                    "profileMessage",
                    "Statut du projet mis à jour !"
                );
            } catch (error) {
                alert(error.message);
                buttons.forEach(button => button.disabled = false);
            }
        }

        function addStatusButton(label, newStatus, className) {
            const button = document.createElement("button");
            button.type = "button";
            button.className = className;
            button.textContent = label;

            button.addEventListener("click", () => {
                changeProjectStatus(newStatus);
            });

            actions.appendChild(button);
        }

        actions.append(editButton, deleteButton);

        if (project.status === "open") {
            addStatusButton(
                "Clore les candidatures",
                "in_progress",
                "btn btn-info btn-sm"
            );

            addStatusButton(
                "Marquer comme terminé",
                "completed",
                "btn btn-success btn-sm"
            );
        } else if (project.status === "in_progress") {
            addStatusButton(
                "Rouvrir les candidatures",
                "open",
                "btn btn-info btn-sm"
            );

            addStatusButton(
                "Marquer comme terminé",
                "completed",
                "btn btn-success btn-sm"
            );
        }

        body.appendChild(actions);

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

        const selected = document.getElementById("skillSelect").value;
        const custom = document.getElementById("customSkill").value.trim();

        const data = {
            level: document.getElementById("skillLevel").value
        };

        if (selected === "other") {
            if (!custom) {
                showMessage("skillMessage", "Entre une compétence.", false);
                button.disabled = false;
                return;
            }
            data.skill_name = custom;
        } else {
            data.skill_id = Number(selected);
        }

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


document.getElementById("skillSelect").addEventListener("change", event => {
    document.getElementById("customSkill").classList.toggle(
        "hidden",
        event.target.value !== "other"
    );
});
