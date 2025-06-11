Cursor AI Rules Document: Work Order Management System (On-Premise)
Document Version: 1.0
Date: June 9, 2025

1. Project Context & Goal
This document outlines the guidelines and best practices for Cursor AI when generating code, refactoring, or providing assistance for the Work Order Management System (WOMS) project. The primary goal of the WOMS is to efficiently manage, track, and execute work orders for an organization, with a strong emphasis on user experience, real-time updates, and robust data integrity, deployed on-premise.

2. Core Tech Stack (On-Premise Focus)
Cursor AI should adhere to the following defined tech stack and prioritize solutions within these technologies:

2.1. Frontend (Web Application)

Framework: React (preferably with Next.js for server-side rendering/static generation benefits, or Vite for fast development).
UI Components: MUI (Material-UI). Prioritize standard MUI components and follow their styling conventions.
State Management: React Query for data fetching and caching; Zustand for global client-side state where useContext is insufficient. Avoid Redux unless specifically requested for complex, large-scale state needs.
Authentication: MSAL.js for integration with Microsoft Entra ID.
2.2. Backend (API & Business Logic)

Language & Framework: Node.js with NestJS. Prioritize TypeScript for all backend code, ensuring strong typing and adherence to NestJS module/controller/service patterns.
Database: PostgreSQL.
ORM/Query Builder: TypeORM or Prisma (prefer Prisma if schema management and migrations are a focus).
Schema: Adhere to a relational model with appropriate indexing for performance.
Caching: Redis for volatile data, session management, and rate limiting.
Real-time: WebSockets (Socket.IO for NestJS) for live updates.
User Authentication (Microsoft Entra ID Integration):
Utilize passport-azure-ad or msal-node for token validation.
Implement Role-Based Access Control (RBAC). Roles (e.g., Technician, Administrator, Requester, Manager) should be determined from Microsoft Entra ID claims/groups and stored/mapped in PostgreSQL.
PDF Report Generation:
Primary Library: pdf-lib for programmatic PDF creation and manipulation.
Signature Handling: Focus on embedding captured signature images within the PDF. If digital signing (cryptographic verification) is mentioned, flag as a complex feature requiring further discussion, as pdf-lib offers basic capabilities but full digital signing often involves external services or more specialized libraries.
Complex Layouts: If complex HTML/CSS rendering is needed for reports, consider generating HTML and using puppeteer to render to PDF, then using pdf-lib for final touches like signature placement.
2.3. Mobile Development (Cross-Platform)

Framework: React Native.
Authentication: MSAL.js for React Native (or appropriate wrappers for native MSAL SDKs if required).
2.4. DevOps & On-Premise Deployment

Containerization: Docker (Dockerfile generation, Docker Compose for multi-service setup).
Orchestration: Kubernetes (K8s) manifests (Deployment, Service, Ingress, PersistentVolumeClaim, etc.) for scalable, highly available deployments.
CI/CD: Focus on generating configurations for Jenkinsfiles or GitLab CI/CD pipelines, assuming an on-premise runner setup.
3. General Coding Standards & Best Practices
Language: Strict TypeScript for backend (NestJS) and Frontend (React/Next.js).
Code Style: Adhere to common ESLint/Prettier defaults. Prioritize readability and maintainability.
Modularity: Emphasize component-based architecture for Frontend, and modular design (modules, services, controllers) for Backend.
Backend Modularity (NestJS): Organize code into distinct NestJS modules (e.g., WorkOrdersModule, UsersModule, AssetsModule), each encapsulating its own controllers, services, and repository logic. Favor dependency injection for clear service separation.
Frontend Modularity (React/Vue): Break down UIs into small, reusable, and self-contained components. Use a clear folder structure (e.g., components, pages, hooks, utils).
Separation of Concerns: Ensure each module, component, or function has a single, well-defined responsibility. Avoid monolithic files or components.
Error Handling: Implement robust try-catch blocks and provide meaningful error messages for both client and server.
Logging: Use a structured logging approach (e.g., Winston for Node.js).
Configuration: Externalize configuration (environment variables, config files) for different environments.
Testing: Prioritize unit tests and integration tests. Generate basic test stubs where applicable (e.g., Jest for React/NestJS).
API Design: RESTful API principles for standard CRUD operations. Use descriptive endpoints and appropriate HTTP verbs.
Comments: Provide clear and concise comments for complex logic, but avoid excessive comments for self-explanatory code.
4. Security Considerations
Input Validation: Always validate all user inputs on both frontend and backend.
Authentication: Strictly adhere to OAuth 2.0 / OpenID Connect flows via MSAL.js and backend validation. Never store user passwords directly.
Authorization: Implement robust RBAC checks on every backend API endpoint.
Data Protection: Use parameterized queries for database interactions to prevent SQL injection.
Sensitive Data: Never hardcode sensitive credentials. Use environment variables or secure secrets management.
CORS: Properly configure Cross-Origin Resource Sharing for your API.
HTTPS: Assume HTTPS will be used in production for all communication.
Error Messages: Avoid verbose error messages that leak sensitive information.
5. Specific Goals for Cursor AI Assistance
Cursor AI is expected to:

Generate boilerplate code for new components, services, controllers, or database models based on defined entities.
Help implement API endpoints for CRUD operations on Work Orders, Assets, Users, etc.
Assist in setting up Microsoft Entra ID authentication flows on both frontend and backend.
Develop logic for real-time updates (WebSockets) for work order status changes.
Generate code for PDF report templates and logic for embedding data and signatures.
Provide Dockerfiles and Kubernetes manifests for specified services.
Suggest best practices for refactoring existing code to improve performance, readability, or security.
Debug errors by suggesting potential fixes and explanations.
Generate unit and integration test stubs.