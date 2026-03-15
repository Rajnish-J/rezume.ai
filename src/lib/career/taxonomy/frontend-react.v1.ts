import { RoleTaxonomy } from "@/src/types/career.types";

export const frontendReactTaxonomyV1: RoleTaxonomy = {
  slug: "frontend-react",
  name: "Frontend Developer (React)",
  description:
    "Build and ship production-grade React interfaces with performance, testing, and accessibility basics.",
  version: 1,
  skills: [
    { skillKey: "html-css-js", skillName: "HTML, CSS, JavaScript", category: "core", weight: 5 },
    { skillKey: "typescript", skillName: "TypeScript", category: "core", weight: 5 },
    { skillKey: "react-fundamentals", skillName: "React Fundamentals", category: "core", weight: 5 },
    { skillKey: "state-management", skillName: "State Management", category: "core", weight: 4 },
    { skillKey: "api-integration", skillName: "API Integration", category: "core", weight: 4 },
    { skillKey: "routing", skillName: "Client-side Routing", category: "core", weight: 3 },
    { skillKey: "error-handling", skillName: "Error Handling", category: "production", weight: 4 },
    { skillKey: "performance", skillName: "Frontend Performance", category: "production", weight: 4 },
    { skillKey: "component-design", skillName: "Reusable Component Design", category: "production", weight: 3 },
    { skillKey: "testing-frontend", skillName: "Frontend Testing", category: "professional", weight: 4 },
    { skillKey: "accessibility", skillName: "Accessibility Basics", category: "professional", weight: 3 },
    { skillKey: "frontend-security", skillName: "Frontend Security Basics", category: "professional", weight: 3 },
  ],
};
