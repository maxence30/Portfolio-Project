# Portfolio-Project
# Stage 1 Report — Student Collaboration Platform

## 1. Team Formation

### 1.1 Team Overview

The project is developed individually, although the original project format is designed for a team.

The project is based on the idea of creating a web platform that connects students who want to work together on projects and who have complementary skills.

Because the project is developed individually, the different responsibilities normally distributed among team members are handled by the same developer.

### 1.2 Roles and Responsibilities

| Role               | Responsibilities                                                                                |
| ------------------ | ----------------------------------------------------------------------------------------------- |
| Project Manager    | Project organization, planning, task management and progress tracking                           |
| Frontend Developer | Development of the user interface using HTML, CSS, Vanilla JavaScript, Tailwind CSS and DaisyUI |
| Backend Developer  | Development of the backend logic, APIs, authentication and business logic using JavaScript      |
| Database Developer | Design and management of the application's data structures                                      |
| QA / Documentation | Testing, validation, bug identification and technical documentation                             |

### 1.3 Technology Stack

The frontend technology stack required for the project is:

* HTML
* CSS
* Vanilla JavaScript
* Tailwind CSS
* DaisyUI

The backend will be developed using JavaScript.

The project will use a web-based architecture so that students can access the platform through a web browser.

### 1.4 Communication and Collaboration

Since the project is developed individually, communication between team members is not applicable. However, project organization will be managed through version control and documentation.

The development process will be organized around:

* clear task separation;
* regular progress reviews;
* Git for source control;
* structured project documentation;
* testing after implementing important features.

### 1.5 Stakeholders

The main stakeholders are:

**Students looking for collaborators**

They use the platform to publish their projects and find students with complementary skills.

**Students looking for projects**

They browse available projects and apply to projects where their skills are relevant.

**Project creators**

They create project announcements, define the skills they are looking for, review applications and choose collaborators.

**Platform administrator**

The administrator manages users, moderates project announcements, handles reports and can suspend problematic accounts.

**Project owner / educational context**

The project is developed as an academic portfolio project. The main objective is to demonstrate the ability to design and develop a complete web application based on a real-world use case.

---

# 2. Brainstorming and Idea Evaluation

## 2.1 Problem Identification

The initial idea comes from a common problem encountered by students working on personal or academic projects.

A student may have a good project idea and strong skills in one area but lack the skills required in other areas.

For example, a student may know how to program a video game but not know how to:

* create 3D models;
* design game mechanics;
* write a story;
* create music or sound effects.

Similarly, a rapper may have musical ideas but lack the skills required to produce an instrumental.

The brainstorming process therefore focused on finding a project that could help students collaborate and combine their skills.

## 2.2 Ideas Considered

Several possible directions were considered during the brainstorming phase.

### Idea 1 — Student Collaboration Platform

A web platform where students can publish projects and find other students with the skills they need.

Example:

A student developing a video game can search for a game designer, 3D artist, musician or writer.

**Advantages:**

* solves a concrete problem;
* useful for different types of students;
* can support many types of projects;
* provides significant technical challenges;
* can evolve with additional features.

**Challenges:**

* requires authentication;
* requires managing users and projects;
* requires a system for applications and communication;
* requires moderation.

### Idea 2 — Student Project Management Platform

A platform dedicated to helping students organize their existing projects.

Possible features would include tasks, deadlines, progress tracking and project members.

**Advantages:**

* relatively easy to understand;
* technically feasible;
* useful for student projects.

**Disadvantages:**

* many existing project-management solutions already exist;
* less focused on the problem of finding collaborators;
* less original than the selected idea.

### Idea 3 — Student Skill / Portfolio Platform

A platform where students create profiles and showcase their skills, projects and portfolios.

**Advantages:**

* useful for students;
* relatively simple to develop;
* allows students to showcase their work.

**Disadvantages:**

* similar to existing professional networking platforms;
* does not directly solve the problem of finding collaborators for a specific project.

### Idea 4 — Student Learning and Resource Platform

A platform where students can share tutorials, resources and learning material.

**Advantages:**

* useful for students;
* potentially large audience;
* relatively simple core functionality.

**Disadvantages:**

* many existing platforms already provide similar services;
* content moderation could become complex;
* less focused on collaboration.

## 2.3 Evaluation Criteria

The ideas were evaluated according to the following criteria:

* **Feasibility:** Can the project realistically be developed with the available time and technical skills?
* **Impact:** Does the project solve a meaningful problem?
* **Technical interest:** Does it allow the developer to demonstrate different technical skills?
* **Scalability:** Can the project evolve with additional features?
* **Originality:** Does the idea provide something different from common existing solutions?
* **Portfolio value:** Does the project demonstrate useful development skills?

The Student Collaboration Platform was selected because it provided the best balance between these criteria.

---

# 3. Decision and Refinement

## 3.1 Selected MVP

The selected MVP is a **web platform for connecting students who want to collaborate on projects**.

The platform allows a student to publish a project, explain the project requirements and specify the skills they are looking for.

Other students can discover these projects and apply if they have the required skills.

The project is not limited to software development.

Possible use cases include:

* video game development;
* music production;
* filmmaking;
* graphic design;
* artistic projects;
* software projects;
* audiovisual projects;
* educational projects.

## 3.2 Problem the MVP Solves

Students frequently have project ideas but cannot complete them alone because they lack certain skills.

The problem is therefore not necessarily a lack of motivation or ideas, but a lack of access to people with complementary skills.

The platform aims to make it easier for students to find these people.

## 3.3 Proposed Solution

The platform provides a centralized place where students can:

1. create a profile;
2. describe their skills;
3. publish a project;
4. specify the skills they need;
5. indicate whether the project is paid or unpaid;
6. specify whether the collaboration is remote or in person;
7. specify a location when necessary;
8. receive applications;
9. accept or reject applications;
10. communicate with other users;
11. rate collaborators after a collaboration.

## 3.4 Target Users

### Student Project Creator

A student who has a project and needs additional skills.

For example, a programmer looking for a 3D artist for a video game.

### Student Candidate

A student who wants to participate in projects and use their skills.

For example, a music producer looking for artists to collaborate with.

### Administrator

A user responsible for platform moderation and administration.

The administrator can manage users, moderate announcements and handle reports.

A user can also act as both a project creator and a candidate depending on the project.

## 3.5 Application Type

The MVP is a **web application** accessible through a web browser.

The frontend will use:

* HTML;
* CSS;
* Vanilla JavaScript;
* Tailwind CSS;
* DaisyUI.

The backend will use JavaScript.

## 3.6 Key Features

### Authentication

Users will be able to:

* register;
* log in;
* log out;
* access their profile.

### Student Profiles

Users will be able to provide information such as:

* name;
* profile picture;
* description;
* skills;
* experience;
* portfolio;
* rating.

### Project Announcements

A project can contain:

* title;
* description;
* category;
* required skills;
* remuneration information;
* remote or in-person collaboration;
* city;
* date;
* project status.

### Applications

Students can apply to project announcements.

The project creator can:

* view applications;
* accept an application;
* reject an application;
* send a response message.

### Messaging

Users will be able to communicate with each other through the platform.

This can be used to discuss project requirements and collaboration details.

### Rating System

After a collaboration, users can rate their collaborators using a rating system, potentially accompanied by a written comment.

### Administration

Administrators will be able to:

* manage users;
* moderate announcements;
* manage reports;
* remove problematic content;
* suspend accounts when necessary.

---

# 4. Project Scope

## 4.1 In-Scope

The project will include:

* student registration and login;
* user profiles;
* skills and experience;
* project creation;
* project descriptions;
* required skills;
* project categories;
* remote / in-person information;
* location information;
* remuneration information;
* project search;
* project applications;
* application acceptance and rejection;
* communication between users;
* user ratings;
* basic administration and moderation.

## 4.2 Out-of-Scope

The following features are not part of the initial scope:

* integrated payment processing;
* native mobile applications;
* video conferencing;
* complex contract management;
* advanced financial management;
* automated legal agreements;
* a complete recruitment system for professional companies.

These features could potentially be considered in future versions.

---

# 5. Objectives

### Objective 1 — Facilitate Student Collaboration

The platform should provide students with a simple way to find collaborators with complementary skills.

### Objective 2 — Centralize Project Opportunities

The platform should allow students to publish and discover project opportunities in one place.

### Objective 3 — Create a Complete Collaboration Workflow

The MVP should allow the main collaboration process to take place through the platform:

**Profile → Project → Application → Acceptance/Rejection → Communication → Collaboration → Rating**

These objectives provide a clear foundation for evaluating whether the MVP successfully solves its initial problem.

---

# 6. Risks and Challenges

### Risk 1 — Project Scope Becoming Too Large

The platform contains several systems such as authentication, profiles, projects, applications, messaging, ratings and administration.

**Mitigation:**

Prioritize the core collaboration workflow and develop additional functionality progressively.

### Risk 2 — Authentication and User Security

User accounts and private information require secure authentication and data management.

**Mitigation:**

Follow established authentication and security practices and avoid storing sensitive information insecurely.

### Risk 3 — Moderation

Users may publish inappropriate or misleading content.

**Mitigation:**

Implement reporting and moderation functionality and provide administrators with tools to manage problematic content.

### Risk 4 — Messaging Complexity

A real-time or advanced messaging system could significantly increase development complexity.

**Mitigation:**

Start with a simple messaging system and consider more advanced communication features as future improvements.

### Risk 5 — Difficulty Finding Enough Users

A collaboration platform becomes more useful when it has enough active users and projects.

**Mitigation:**

Focus the initial version on students and common project categories such as software, games, music, art and audiovisual projects.

---

# 7. Summary

The selected MVP is a web platform designed to connect students who want to collaborate on projects.

The main problem identified is that students may have the skills to create part of a project but lack other necessary skills. Finding suitable collaborators can be difficult, especially when the required skills are specialized.

The platform addresses this problem by allowing students to create profiles, describe their skills, publish project announcements and specify the skills they are looking for. Other students can discover projects, apply to them and communicate with project creators.

The platform can support many types of projects, including video games, music, software, film, design and artistic projects.

The main value of the platform is therefore based on **complementary skills and student collaboration** rather than limiting the service to a single field.

The project was selected because it combines a concrete user problem with a technically interesting solution. It also provides opportunities to demonstrate frontend and backend development, authentication, data management, APIs, user interaction, moderation and software testing.

The long-term vision is to create a complete student collaboration ecosystem, while the initial MVP will focus on the essential workflow:

**Create a profile → publish or discover a project → find complementary skills → apply → accept or reject → communicate → collaborate → rate.**

This approach provides a realistic starting point while leaving room for future improvements such as advanced matching, notifications, portfolios, recommendations and additional collaboration tools.
