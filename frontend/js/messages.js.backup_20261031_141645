
const API_URL = "http://localhost:3000";

const loading = document.getElementById("loading");
const messagingContent = document.getElementById("messagingContent");
const errorMessage = document.getElementById("errorMessage");
const conversationList = document.getElementById("conversationList");
const noConversations = document.getElementById("noConversations");
const conversationTitle = document.getElementById("conversationTitle");
const conversationSubtitle = document.getElementById("conversationSubtitle");
const messageList = document.getElementById("messageList");
const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const sendMessageStatus = document.getElementById("sendMessageStatus");

let currentUser = null;
let conversations = [];
let messages = [];
let selectedConversation = null;

async function api(path, options = {}) {
    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    });

    let data;

    try {
        data = await response.json();
    } catch {
        data = null;
    }

    if (response.status === 401) {
        window.location.href = "login.html";
        throw new Error("Connexion nécessaire.");
    }

    if (!response.ok) {
        throw new Error(
            data?.error || data?.message || "Une erreur est survenue."
        );
    }

    return data;
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove("hidden");
}

function hideError() {
    errorMessage.textContent = "";
    errorMessage.classList.add("hidden");
}

function getConversationKey(projectId, otherUserId) {
    return `${projectId}:${otherUserId}`;
}

function getOtherUserId(message) {
    return Number(message.sender_id) === Number(currentUser.id)
        ? Number(message.receiver_id)
        : Number(message.sender_id);
}

function createConversations(applications, projects, users) {
    const accepted = applications.filter(
        application => application.status === "accepted"
    );

    const result = [];
    const seen = new Set();

    accepted.forEach(application => {
        const project = projects.find(
            item => Number(item.id) === Number(application.project_id)
        );

        if (!project) return;

        const ownerId = Number(project.user_id);
        const applicantId = Number(application.applicant_id);
        const myId = Number(currentUser.id);

        if (ownerId !== myId && applicantId !== myId) return;

        const otherUserId = ownerId === myId ? applicantId : ownerId;

        const key = getConversationKey(project.id, otherUserId);

        if (seen.has(key)) return;
        seen.add(key);

        const otherUser = users.find(
            user => Number(user.id) === otherUserId
        );

        result.push({
            key,
            projectId: Number(project.id),
            projectTitle: project.title,
            otherUserId,
            otherUsername: otherUser
                ? otherUser.username
                : `Utilisateur n°${otherUserId}`
        });
    });

    return result;
}

function renderConversations() {
    conversationList.replaceChildren();

    noConversations.classList.toggle(
        "hidden",
        conversations.length > 0
    );

    conversations.forEach(conversation => {
        const button = document.createElement("button");
        button.type = "button";

        const isSelected = selectedConversation &&
            selectedConversation.key === conversation.key;

        button.className = isSelected
            ? "w-full text-left p-3 rounded-lg bg-primary text-primary-content"
            : "w-full text-left p-3 rounded-lg bg-base-200 hover:bg-base-300";

        const name = document.createElement("p");
        name.className = "font-bold";
        name.textContent = conversation.otherUsername;

        const project = document.createElement("p");
        project.className = "text-sm opacity-75";
        project.textContent = conversation.projectTitle;

        button.append(name, project);

        button.addEventListener("click", () => {
            selectedConversation = conversation;
            renderConversations();
            renderMessages();
        });

        conversationList.appendChild(button);
    });
}

function formatDate(dateValue) {
    if (!dateValue) return "";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function renderMessages() {
    messageList.replaceChildren();

    if (!selectedConversation) {
        conversationTitle.textContent = "Sélectionne une conversation";
        conversationSubtitle.textContent = "";
        messageInput.disabled = true;
        sendButton.disabled = true;
        return;
    }

    conversationTitle.textContent = selectedConversation.otherUsername;
    conversationSubtitle.textContent =
        `Projet : ${selectedConversation.projectTitle}`;

    messageInput.disabled = false;
    sendButton.disabled = false;

    const conversationMessages = messages.filter(message => {
        const sameProject =
            Number(message.project_id) === selectedConversation.projectId;

        const sameUser =
            getOtherUserId(message) === selectedConversation.otherUserId;

        return sameProject && sameUser;
    });

    conversationMessages.sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at)
    );

    if (!conversationMessages.length) {
        const empty = document.createElement("p");
        empty.className = "text-center text-base-content/60 my-auto";
        empty.textContent =
            "Aucun message pour le moment. Commence la discussion !";
        messageList.appendChild(empty);
    }

    conversationMessages.forEach(message => {
        const isMine =
            Number(message.sender_id) === Number(currentUser.id);

        const wrapper = document.createElement("div");
        wrapper.className = isMine
            ? "chat chat-end"
            : "chat chat-start";

        const header = document.createElement("div");
        header.className = "chat-header text-xs mb-1";
        header.textContent = isMine
            ? "Moi"
            : selectedConversation.otherUsername;

        const bubble = document.createElement("div");
        bubble.className = isMine
            ? "chat-bubble chat-bubble-primary whitespace-pre-wrap"
            : "chat-bubble whitespace-pre-wrap";

        bubble.textContent = message.content;

        const footer = document.createElement("div");
        footer.className = "chat-footer text-xs opacity-60";
        footer.textContent = formatDate(message.created_at);

        wrapper.append(header, bubble, footer);
        messageList.appendChild(wrapper);
    });

    messageList.scrollTop = messageList.scrollHeight;
}

// skillinkAutoRefresh
let refreshingMessages = false;
let sendingMessage = false;

async function refreshMessages() {
    if (refreshingMessages || sendingMessage) return;

    refreshingMessages = true;

    try {
        const latest = await api("/messages");
        const unique = new Map();

        latest.forEach(message => {
            unique.set(String(message.id), message);
        });

        const updated = Array.from(unique.values());

        const oldData = JSON.stringify(messages);
        const newData = JSON.stringify(updated);

        if (oldData !== newData) {
            messages = updated;
            renderMessages();
        }
    } finally {
        refreshingMessages = false;
    }
}

async function loadMessaging() {
    hideError();

    const [user, applications, projects, users, allMessages] =
        await Promise.all([
            api("/me"),
            api("/applications"),
            api("/projects"),
            api("/users"),
            api("/messages")
        ]);

    currentUser = user;
    messages = allMessages;

    conversations = createConversations(applications, projects, users);

    const requestedProjectId = Number(
        new URLSearchParams(window.location.search).get("project")
    );

    const requestedUserId = Number(
        new URLSearchParams(window.location.search).get("user")
    );

    if (selectedConversation) {
        selectedConversation = conversations.find(
            conversation => conversation.key === selectedConversation.key
        ) || null;
    }

    if (!selectedConversation && requestedProjectId && requestedUserId) {
        selectedConversation = conversations.find(
            conversation =>
                conversation.projectId === requestedProjectId &&
                conversation.otherUserId === requestedUserId
        ) || null;
    }

    if (!selectedConversation && conversations.length) {
        selectedConversation = conversations[0];
    }

    renderConversations();
    renderMessages();
}

messageForm.addEventListener("submit", async event => {
    event.preventDefault();

    if (!selectedConversation) return;

    const content = messageInput.value.trim();

    if (!content) return;

    sendingMessage = true;
    sendButton.disabled = true;
    sendMessageStatus.textContent = "Envoi en cours...";
    sendMessageStatus.className = "text-sm text-base-content/60";

    try {
        await api("/messages", {
            method: "POST",
            body: JSON.stringify({
                receiver_id: selectedConversation.otherUserId,
                project_id: selectedConversation.projectId,
                content
            })
        });

        messageInput.value = "";
        sendMessageStatus.textContent = "Message envoyé !";
        sendMessageStatus.className = "text-sm text-success";

        await refreshMessages();

    } catch (error) {
        sendMessageStatus.textContent = error.message;
        sendMessageStatus.className = "text-sm text-error";
    } finally {
        sendingMessage = false;
        sendButton.disabled = false;
        await refreshMessages().catch(error => {
            console.error("Actualisation :", error.message);
        });
    }
});

document.getElementById("refreshButton").addEventListener(
    "click",
    async () => {
        try {
            hideError();
            await loadMessaging();
        } catch (error) {
            showError(error.message);
        }
    }
);

async function initialize() {
    try {
        await loadMessaging();
        messagingContent.classList.remove("hidden");
    } catch (error) {
        showError(error.message);
    } finally {
        loading.classList.add("hidden");
    }
}

initialize();

// Actualisation automatique toutes les 5 secondes
setInterval(async () => {
    if (document.hidden || !currentUser) return;

    try {
        await refreshMessages();
    } catch (error) {
        console.error("Actualisation automatique :", error.message);
    }
}, 5000);
