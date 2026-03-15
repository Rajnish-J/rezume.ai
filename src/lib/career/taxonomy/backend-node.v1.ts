import { RoleTaxonomy } from "@/src/types/career.types";

export const backendNodeTaxonomyV1: RoleTaxonomy = {
  slug: "backend-node",
  name: "Backend Developer (Node.js)",
  description:
    "Design and deliver secure, testable Node.js services with reliable persistence and deployment workflows.",
  version: 1,
  skills: [
    { skillKey: "js-ts-node", skillName: "Node.js with JavaScript/TypeScript", category: "core", weight: 5 },
    { skillKey: "rest-api", skillName: "REST API Design", category: "core", weight: 5 },
    { skillKey: "database-design", skillName: "Database Schema Design", category: "core", weight: 4 },
    { skillKey: "orm-querying", skillName: "ORM/SQL Querying", category: "core", weight: 4 },
    { skillKey: "auth-patterns", skillName: "Authentication Patterns", category: "production", weight: 5 },
    { skillKey: "authorization-rbac", skillName: "Authorization / RBAC", category: "production", weight: 4 },
    { skillKey: "logging-monitoring", skillName: "Logging and Monitoring Basics", category: "production", weight: 3 },
    { skillKey: "deployment", skillName: "Deployment Basics", category: "production", weight: 4 },
    { skillKey: "docker", skillName: "Docker", category: "production", weight: 4 },
    { skillKey: "backend-testing", skillName: "Backend Testing", category: "professional", weight: 5 },
    { skillKey: "security-basics", skillName: "Backend Security Basics", category: "professional", weight: 4 },
    { skillKey: "system-design-basics", skillName: "System Design Basics", category: "professional", weight: 3 },
  ],
};
