import { RoleTaxonomy } from "@/src/types/career.types";

export const backendJavaTaxonomyV1: RoleTaxonomy = {
  slug: "backend-java",
  name: "Backend Developer (Java)",
  description:
    "Build maintainable Java backend services with robust APIs, persistence, testing, and secure deployment practices.",
  version: 1,
  skills: [
    { skillKey: "java-core", skillName: "Core Java", category: "core", weight: 5 },
    { skillKey: "spring-boot", skillName: "Spring Boot", category: "core", weight: 5 },
    { skillKey: "rest-api-java", skillName: "REST API Design", category: "core", weight: 5 },
    { skillKey: "database-design", skillName: "Database Schema Design", category: "core", weight: 4 },
    { skillKey: "jpa-sql", skillName: "JPA/Hibernate and SQL", category: "core", weight: 4 },
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
