import { NextResponse } from "next/server";

import { listRolesResponseSchema } from "@/src/types/career.types";
import {
  ensureRoleTaxonomiesPersisted,
  getAllRoleTaxonomies,
} from "@/src/lib/career/taxonomy";

export async function GET() {
  try {
    await ensureRoleTaxonomiesPersisted();

    const roles = getAllRoleTaxonomies().map((taxonomy) => ({
      slug: taxonomy.slug,
      name: taxonomy.name,
      description: taxonomy.description,
      version: taxonomy.version,
    }));

    const responseBody = listRolesResponseSchema.parse({ roles });
    return NextResponse.json(responseBody, { status: 200 });
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch career roles." },
      { status: 500 },
    );
  }
}
