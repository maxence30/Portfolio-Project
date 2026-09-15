# Documentation technique — Projet Démodé

## 1. User Stories et maquettes

Le but du projet est de créer une plateforme où des étudiants peuvent proposer des projets et trouver d'autres étudiants pour travailler avec eux.

Il y a deux types d'utilisateurs principaux : les étudiants et l'administrateur.

Un étudiant peut aussi bien créer un projet que rejoindre le projet de quelqu'un d'autre.

### User Stories

**Étudiant**

* En tant qu'étudiant, je veux créer un compte pour pouvoir utiliser la plateforme.
* En tant qu'étudiant, je veux avoir un profil avec mes informations et mes compétences pour pouvoir me présenter aux autres.
* En tant qu'étudiant, je veux publier un projet pour trouver des personnes avec les compétences dont j'ai besoin.
* En tant que créateur, je veux préciser les compétences recherchées, si le projet est payé ou non et s'il est à distance ou en présentiel.
* En tant qu'étudiant, je veux pouvoir consulter les projets disponibles.
* En tant qu'étudiant, je veux pouvoir postuler à un projet qui m'intéresse.
* En tant que créateur, je veux voir les candidatures reçues et pouvoir les accepter ou les refuser.
* En tant qu'étudiant, je veux pouvoir discuter avec les autres personnes du projet.
* En tant qu'étudiant, je veux pouvoir donner une note à un collaborateur après le projet.

**Administrateur**

* En tant qu'administrateur, je veux gérer les utilisateurs.
* En tant qu'administrateur, je veux pouvoir modérer les annonces.
* En tant qu'administrateur, je veux voir les signalements et pouvoir supprimer un contenu problématique.

### Priorités

Pour le MVP, les fonctions principales sont :

**Must Have**

* inscription et connexion
* profil étudiant
* ajout des compétences
* création d'un projet
* recherche et consultation des projets
* candidatures
* acceptation ou refus d'une candidature
* messagerie
* administration et modération

**Should Have**

* système de notation
* commentaire sur une note
* signalement d'un utilisateur ou d'un projet

**Could Have**

* suspension d'un compte par l'administrateur

**Won't Have pour le MVP**

* paiement directement sur le site
* application mobile
* visioconférence
* système automatique qui met en relation les étudiants

### Maquettes

Les maquettes prévues sont :

* connexion / inscription
* accueil avec les projets
* détail d'un projet
* création d'un projet
* profil étudiant
* candidatures
* messagerie
* espace administrateur

Les maquettes servent surtout à avoir une idée de l'interface avant de commencer le développement.

---

## 2. Architecture du projet

Le projet est séparé en trois parties principales :

```text
Utilisateur
    |
    v
Frontend
HTML / CSS / JavaScript
Tailwind CSS / DaisyUI
    |
    | requêtes HTTP
    v
Backend
JavaScript
API
    |
    | données
    v
Base de données
```

Le frontend correspond à ce que l'utilisateur voit sur le site.

Le backend reçoit les demandes du frontend et s'occupe de la logique du site. Par exemple, lorsqu'un étudiant crée un projet, le frontend envoie les informations au backend.

Le backend vérifie les informations puis les enregistre dans la base de données.

Les réponses sont ensuite renvoyées au frontend pour être affichées.

Pour le MVP, aucune API externe n'est nécessaire.

---

## 3. Composants et base de données

### Frontend

Les principales parties de l'interface seront :

* barre de navigation
* connexion / inscription
* page d'accueil
* liste des projets
* page d'un projet
* formulaire de création de projet
* profil étudiant
* candidatures
* messagerie
* notation
* espace administrateur

Chaque partie communique avec le backend lorsque des données doivent être récupérées ou enregistrées.

### Backend

Le backend sera organisé par fonctionnalité.

On retrouvera notamment :

```text
AuthController
UserController
ProjectController
ApplicationController
MessageController
RatingController
ReportController
AdminController
```

Par exemple, `ProjectController` s'occupe des demandes liées aux projets et `ApplicationController` s'occupe des candidatures.

### Base de données

Une base relationnelle est adaptée au projet car les différentes données sont liées entre elles.

Les principales tables sont :

**users**

```text
id
username
email
password_hash
bio
city
role
status
created_at
```

**skills**

```text
id
name
```

**user_skills**

```text
user_id
skill_id
```

**projects**

```text
id
creator_id
title
description
paid
work_mode
city
created_at
```

**project_skills**

```text
project_id
skill_id
```

**applications**

```text
id
project_id
candidate_id
message
status
created_at
```

**messages**

```text
id
sender_id
receiver_id
project_id
content
created_at
```

**ratings**

```text
id
project_id
rater_id
rated_user_id
score
comment
created_at
```

**reports**

```text
id
reporter_id
reported_user_id
project_id
reason
status
created_at
```

### Relations

Un utilisateur peut créer plusieurs projets.

Un projet appartient à un utilisateur.

Un projet peut recevoir plusieurs candidatures.

Un étudiant peut avoir plusieurs compétences et une compétence peut être utilisée par plusieurs étudiants.

Un projet peut également rechercher plusieurs compétences.

Les messages sont liés à un expéditeur et un destinataire.

Les notes sont liées aux utilisateurs et au projet concerné.

---

## 4. Diagrammes de séquence

### Connexion

Le premier cas est la connexion d'un étudiant.

```text
Étudiant
   |
   v
Frontend
   |
   | POST /api/auth/login
   v
Backend
   |
   | recherche utilisateur
   v
Base de données
   |
   | résultat
   v
Backend
   |
   | réponse
   v
Frontend
   |
   v
Étudiant connecté
```

### Création d'un projet

```text
Étudiant
   |
   | remplit le formulaire
   v
Frontend
   |
   | POST /api/projects
   v
Backend
   |
   | enregistrement
   v
Base de données
   |
   | confirmation
   v
Backend
   |
   v
Frontend
```

Le projet apparaît ensuite dans la liste des projets disponibles.

### Candidature

```text
Étudiant
   |
   | clique sur "Postuler"
   v
Frontend
   |
   | POST /api/projects/:id/applications
   v
Backend
   |
   | sauvegarde la candidature
   v
Base de données
   |
   | confirmation
   v
Backend
   |
   v
Frontend
```

Le créateur peut ensuite voir la candidature et choisir de l'accepter ou de la refuser.

---

## 5. API

### API externe

Il n'y a pas d'API externe prévue pour le MVP.

Le projet n'a pas besoin d'un service extérieur pour gérer ses fonctions principales.

### API interne

Le frontend communique avec le backend grâce à une API.

Quelques routes prévues :

```text
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout

GET    /api/users/me
PUT    /api/users/me

GET    /api/projects
POST   /api/projects
GET    /api/projects/:id
PUT    /api/projects/:id
DELETE /api/projects/:id

POST   /api/projects/:id/applications
GET    /api/projects/:id/applications
PATCH  /api/applications/:id

GET    /api/messages
POST   /api/messages

POST   /api/ratings
GET    /api/users/:id/ratings

POST   /api/reports
GET    /api/admin/reports
```

Les données envoyées par le frontend seront principalement au format JSON.

Par exemple, pour créer un projet :

```json
{
  "title": "Création d'un jeu vidéo",
  "description": "Je cherche des étudiants pour travailler sur un jeu.",
  "paid": false,
  "work_mode": "remote",
  "city": null
}
```

Le backend renvoie ensuite une réponse indiquant si l'opération a réussi ou s'il y a une erreur.

---

## 6. Git et tests

Le projet sera versionné avec Git et le dépôt sera hébergé sur GitHub.

La branche `main` servira pour la version stable.

Pour les nouvelles fonctionnalités, des branches seront utilisées, par exemple :

```text
feature/auth
feature/projects
feature/applications
feature/messages
```

Une fois la fonctionnalité terminée et testée, elle pourra être fusionnée dans `main`.

Les commits resteront liés à une modification précise.

Exemples :

```text
feat: ajout de la connexion
feat: création des projets
feat: ajout des candidatures
fix: correction du formulaire
```

### Tests

Les tests seront réalisés à plusieurs niveaux.

Pour le backend, les routes de l'API seront testées pour vérifier qu'elles retournent les bonnes réponses.

Les formulaires seront aussi testés directement depuis le navigateur.

Quelques cas à tester :

* création d'un compte
* connexion avec de mauvais identifiants
* création d'un projet
* modification d'un projet
* candidature à un projet
* acceptation ou refus d'une candidature
* envoi d'un message
* ajout d'une note
* accès aux fonctions administrateur

L'objectif est surtout de vérifier que les fonctions principales fonctionnent avant de considérer une version comme stable.

---

## 7. Choix techniques

Le frontend utilise **HTML, CSS et JavaScript vanilla**. Ce choix correspond aux technologies demandées pour le projet et permet de garder une structure assez simple.

**Tailwind CSS** est utilisé pour faciliter la mise en forme et **DaisyUI** pour avoir des composants d'interface déjà préparés.

Le backend utilise **JavaScript**. Utiliser le même langage côté frontend et backend permet de ne pas multiplier les technologies dans le projet.

Une base de données relationnelle est utilisée car les utilisateurs, projets, compétences et candidatures ont beaucoup de relations entre eux.

L'API permet de séparer le frontend et le backend. Le frontend peut donc demander des données au backend sans avoir directement accès à la base de données.

Git et GitHub sont utilisés pour garder l'historique du projet et faciliter le travail sur les différentes fonctionnalités.

Pour le MVP, aucune API externe n'est ajoutée car elle n'est pas nécessaire au fonctionnement de la plateforme.
