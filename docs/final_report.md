# Skillink — Stage 5: Project Closure Report

**Project:** Skillink — Student Collaboration Platform  
**Developer:** Solo project  
**Repository:** https://github.com/maxence30/Portfolio-Project  
**Date:** November 2026  
**Status:** Closure documentation; final live validation pending

## 1. Executive Summary
Skillink is a web platform designed to help students find collaborators for projects based on skills, interests, and project requirements. The project was undertaken by one developer, covering product ideation, planning, technical documentation, database design, implementation, and testing. This report records the known project outcomes and identifies the checks needed before presenting the final MVP.

## 2. Original Objectives and Outcomes
| Initial objective | Outcome / evidence | Status |
|---|---|---|
| Provide a place to publish collaboration projects | Projects data model and `/projects` API have been exercised with sample records | Demonstrated at API level |
| Let students identify required skills | `skills`, `user_skills`, and `project_skills` tables exist in the schema | Data model completed; UI validation needed |
| Support applications to projects | `applications` table supports pending, accepted, rejected states | Data model completed; end-to-end validation needed |
| Enable communication | `messages` table and messaging-related application files exist | End-to-end validation needed |
| Provide feedback and moderation | `ratings` and `reports` tables exist | End-to-end validation needed |
| Deliver an understandable MVP | HTML/CSS/JavaScript frontend, Node.js backend, and MySQL schema | Final demonstration pending |

**Important:** Database tables and code files do not, on their own, prove that each user-facing feature works. Confirm every feature in the live application before describing it as completed during the presentation.

## 3. Project Lifecycle
### Stage 1 — Ideation
Identified a collaboration problem: students may have ideas but lack partners with complementary skills. Proposed a platform connecting project creators and potential contributors.

### Stage 2 — Planning
Defined MVP priorities, user journeys, and development milestones. Working alone meant balancing implementation, documentation, and quality assurance.

### Stage 3 — Technical Documentation
Documented the architecture, user stories, data model, and planned API flows. A relational database schema was created and exported into `database/schema.sql`.

### Stage 4 — Development
Built a web application using HTML, CSS, vanilla JavaScript, Tailwind CSS, and DaisyUI for the frontend; Node.js and Express for the backend; and MySQL for persistent storage. API checks returned project records from the backend. Additional features require a final verification pass.

### Stage 5 — Closure
Consolidated results, technical decisions, lessons learned, retrospective, and a live demonstration plan.

## 4. Technical Overview
**Frontend:** HTML structures pages; CSS and Tailwind style layouts; DaisyUI provides reusable UI components; vanilla JavaScript handles interactions and API requests.

**Backend:** Node.js executes server-side JavaScript. Express exposes HTTP routes and middleware, validates requests, and coordinates application logic.

**Database:** MySQL stores relational data. The known schema contains nine tables: `users`, `skills`, `user_skills`, `projects`, `project_skills`, `applications`, `messages`, `ratings`, and `reports`.

**Typical data flow:** Browser action → JavaScript `fetch()` → Express API endpoint → MySQL query → JSON response → DOM update.

**Security considerations:** Credentials belong in environment variables rather than Git; passwords must be hashed; API inputs and permissions require validation. These are design and review criteria, not claims of a completed security audit.

## 5. Results and Evidence
- A MySQL schema containing **9 tables** was created and exported.
- The backend `/projects` endpoint was observed returning JSON project records in local testing.
- The project was developed and documented in a GitHub repository.
- The developer gained practical experience integrating frontend, backend, API routes, and relational data.

**Metrics not yet established:** number of end-to-end features passing tests, user feedback, response-time benchmarks, test coverage, and production deployment status. Do not present percentages or satisfaction scores without evidence.

## 6. Challenges and Solutions
| Challenge | Response | Learning |
|---|---|---|
| Connecting browser, API, and database | Tested endpoints separately and traced JSON requests and responses | Debug each layer independently |
| Designing relationships among users, projects, and applications | Used foreign keys and junction tables | Data modeling prevents inconsistent records |
| Managing a full project alone | Broke work into stages and maintained technical documentation | Scope control is essential |
| Environment and command-line setup | Used local development tools and repeated startup tests | Reproducible setup saves time |
| Keeping quality visible near delivery | Prepared a final demo checklist and documented unverified areas | Testing must be scheduled, not left to the end |

## 7. Solo-Developer Retrospective
**What went well:** A coherent product idea; an implemented relational schema; experience with the full stack; iterative API checks; willingness to revisit technical concepts until understood.

**What could improve:** Earlier end-to-end testing, more systematic issue tracking, smaller feature increments, automated tests, and earlier presentation rehearsals.

**Team perspective:** This was a solo project. There was no team meeting or distribution of responsibilities. The retrospective is therefore a self-assessment of planning, implementation, communication through documentation, and delivery.

**Actions for the next project:** Define acceptance criteria per feature; maintain a simple task board; add automated API tests; record test evidence; reserve a dedicated stabilization period; and rehearse the live demo before submission.

## 8. Future Improvements
- Complete and verify every key user journey, especially applications, messaging, and moderation.
- Improve accessibility, responsive layouts, and clear error messages.
- Strengthen authorization, input validation, and security testing.
- Add automated tests and continuous integration.
- Gather user feedback and prioritize improvements based on actual use.

## 9. Conclusion
Skillink demonstrates the design and implementation of a student collaboration platform across frontend, backend, and database layers. The strongest verified outcomes are the relational database schema and successful API-level project retrieval. Final evaluation should be based on the live MVP demonstration and a documented acceptance checklist, rather than unsupported completion percentages.

## 10. Final Acceptance Checklist
- [ ] Start MySQL and the Node.js backend successfully.
- [ ] Serve the frontend and confirm API connectivity.
- [ ] Create or sign in to a test account (if currently implemented).
- [ ] List projects and open a project detail.
- [ ] Create a project and verify persistence (if currently implemented).
- [ ] Apply to a project and inspect the resulting status (if currently implemented).
- [ ] Send a message and verify receipt (if currently implemented).
- [ ] Confirm responsive layout and error handling.
- [ ] Record screenshots or a backup video for the demo.
- [ ] Update the results table with pass/fail evidence before submission.
