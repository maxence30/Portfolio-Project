# Démodé

Démodé est une plateforme permettant aux étudiants de trouver
des collaborateurs pour réaliser des projets ensemble.

## Objectif

Mettre en relation des étudiants ayant des compétences
complémentaires : développement, design, communication,
montage vidéo et gestion de projet.

## Technologies

Backend :
- Node.js
- JavaScript
- MySQL
- JWT (jsonwebtoken)
- bcryptjs
- mysql2
- dotenv

Frontend prévu :
- HTML
- CSS
- JavaScript
- Tailwind CSS
- DaisyUI

## Fonctionnalités du backend

- Inscription et connexion
- Authentification JWT avec cookies HttpOnly
- Gestion des profils utilisateurs
- Gestion des compétences
- Création, modification et suppression de projets
- Recherche et filtrage des projets
- Candidatures aux projets
- Acceptation et refus des candidatures
- Messages entre collaborateurs acceptés
- Évaluations après la fin d'un projet
- Signalements
- Permissions utilisateurs et administrateurs

## Base de données

MySQL avec 9 tables :
- users
- skills
- user_skills
- projects
- project_skills
- applications
- messages
- ratings
- reports

Le schéma SQL se trouve dans database/schema.sql.

## Installation

Prérequis :
- Node.js et npm
- MySQL
- Une base de données nommée demode

Installer les dépendances :

    npm install

Créer un fichier .env :

    DB_HOST=localhost
    DB_USER=utilisateur_mysql
    DB_PASSWORD=mot_de_passe_mysql
    DB_NAME=demode
    DB_PORT=3306
    JWT_SECRET=cle_aleatoire_longue_et_secrete

Importer le schéma SQL dans MySQL avant de démarrer.

Démarrer le backend :

    node server.js

API locale :

    http://localhost:3000

## Tests

Lancer :

    npm test

Cette commande vérifie la syntaxe JavaScript
et exécute les tests automatisés des permissions,
de la sécurité et des fonctionnalités.

## Sécurité

- Mots de passe hachés avec bcrypt
- Authentification JWT
- Cookies HttpOnly et SameSite Strict
- Vérification des permissions
- Validation des données
- Limitation des tentatives de connexion
- Requêtes SQL paramétrées

## État du projet

Backend MVP fonctionnel en environnement local.

Le frontend reste à développer.

Avant un déploiement public, il faudra notamment
mettre à jour Node.js, configurer HTTPS,
renforcer les protections de sécurité et
effectuer des tests supplémentaires.
