import { and, eq } from "drizzle-orm";

import { pgdb } from "@/src/lib/db/pg/db";
import { roleSkillsTable, roleTaxonomiesTable } from "@/src/lib/db/schema";
import { RoleSlug, RoleTaxonomy } from "@/src/types/career.types";

import { backendJavaTaxonomyV1 } from "./backend-java.v1";
import { backendNodeTaxonomyV1 } from "./backend-node.v1";
import { frontendReactTaxonomyV1 } from "./frontend-react.v1";

const taxonomyRegistry: RoleTaxonomy[] = [
  frontendReactTaxonomyV1,
  backendNodeTaxonomyV1,
  backendJavaTaxonomyV1,
];

export function getAllRoleTaxonomies(): RoleTaxonomy[] {
  return taxonomyRegistry;
}

export function getRoleTaxonomyBySlug(roleSlug: RoleSlug): RoleTaxonomy | null {
  return taxonomyRegistry.find((taxonomy) => taxonomy.slug === roleSlug) ?? null;
}

export async function ensureRoleTaxonomiesPersisted() {
  for (const taxonomy of taxonomyRegistry) {
    const [createdTaxonomy] = await pgdb
      .insert(roleTaxonomiesTable)
      .values({
        slug: taxonomy.slug,
        name: taxonomy.name,
        description: taxonomy.description,
        version: taxonomy.version,
        isActive: true,
      })
      .onConflictDoNothing()
      .returning();

    const persistedTaxonomy =
      createdTaxonomy ??
      (
        await pgdb
          .select()
          .from(roleTaxonomiesTable)
          .where(
            and(
              eq(roleTaxonomiesTable.slug, taxonomy.slug),
              eq(roleTaxonomiesTable.version, taxonomy.version),
            ),
          )
          .limit(1)
      )[0];

    if (!persistedTaxonomy) {
      continue;
    }

    const existingSkills = await pgdb
      .select({ id: roleSkillsTable.id })
      .from(roleSkillsTable)
      .where(eq(roleSkillsTable.taxonomyId, persistedTaxonomy.id))
      .limit(1);

    if (existingSkills.length > 0) {
      continue;
    }

    await pgdb.insert(roleSkillsTable).values(
      taxonomy.skills.map((skill) => ({
        taxonomyId: persistedTaxonomy.id,
        skillKey: skill.skillKey,
        skillName: skill.skillName,
        category: skill.category,
        weight: skill.weight,
      })),
    ).onConflictDoNothing();
  }
}
