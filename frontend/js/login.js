
const form = document.getElementById("loginForm");
const message = document.getElementById("message");

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    message.textContent = "Connexion en cours...";

    try {
        const response = await fetch("http://localhost:3000/login", {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email,
                password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            message.textContent =
                data.error || data.message || "Identifiants incorrects.";
            return;
        }

        message.textContent = "Connexion réussie !";

        // Redirection vers la liste des projets
        window.location.href = "projects.html";

    } catch (error) {
        message.textContent = "Impossible de contacter le serveur.";
        console.error(error);
    }
});
