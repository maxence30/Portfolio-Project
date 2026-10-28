
document.addEventListener("DOMContentLoaded", () => {
    const navbar = document.querySelector(".navbar");

    if (!navbar) return;

    const menu = navbar.querySelector(".navbar-end");

    if (!menu) return;

    const links = [
        {
            href: "applications.html",
            label: "Candidatures"
        },
        {
            href: "messages.html",
            label: "Messagerie"
        }
    ];

    const currentPage = window.location.pathname.split("/").pop();

    links.forEach(link => {
        const alreadyExists = navbar.querySelector(
            `a[href="${link.href}"]`
        );

        if (alreadyExists) return;

        const anchor = document.createElement("a");

        anchor.href = link.href;
        anchor.textContent = link.label;
        anchor.className = "btn btn-ghost btn-sm";

        if (currentPage === link.href) {
            anchor.classList.add("btn-active");
            anchor.setAttribute("aria-current", "page");
        }

        menu.appendChild(anchor);
    });
});


// Skillink : lien vers les évaluations
document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".navbar .navbar-end").forEach(nav => {
        if (nav.querySelector('a[href="evaluations.html"]')) return;

        const link = document.createElement("a");
        link.href = "evaluations.html";
        link.textContent = "Évaluations";
        link.className = "btn btn-ghost";

        nav.appendChild(link);
    });
});
