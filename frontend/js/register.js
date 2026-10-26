
const form = document.getElementById("registerForm");
const message = document.getElementById("message");

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    message.textContent = "Inscription en cours...";

    try {
        const response = await fetch("http://localhost:3000/users", {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username,
                email,
                password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            message.textContent =
                data.error || data.message || "Erreur lors de l'inscription.";
            return;
        }

        message.textContent = "Compte créé avec succès !";

        setTimeout(() => {
            window.location.href = "login.html";
        }, 1200);

    } catch (error) {
        message.textContent =
            "Impossible de contacter le serveur.";
        console.error(error);
    }
});
