import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { pgdb } from "@/src/lib/db/pg/db";
import { usersTable, userRoleTargetsTable } from "@/src/lib/db/schema";
import {
  getRoleTaxonomyBySlug,
  ensureRoleTaxonomiesPersisted,
} from "@/src/lib/career/taxonomy";
import {
  selectTargetRoleBodySchema,
  targetRoleResponseSchema,
  userIdQuerySchema,
} from "@/src/types/career.types";
import { getZodErrorMessage } from "@/src/utils/user/user.util";

function toIsoDateString(value: Date | string): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return new Date(value).toISOString();
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const parsedQuery = userIdQuerySchema.safeParse({
    userId: requestUrl.searchParams.get("userId"),
  });

  if (!parsedQuery.success) {
    return NextResponse.json(
      { message: getZodErrorMessage(parsedQuery.error) },
      { status: 400 },
    );
  }

  try {
    const [targetRole] = await pgdb
      .select()
      .from(userRoleTargetsTable)
      .where(eq(userRoleTargetsTable.userId, parsedQuery.data.userId))
      .limit(1);

    if (!targetRole) {
      return NextResponse.json({ targetRole: null }, { status: 200 });
    }

    const responseBody = targetRoleResponseSchema.parse({
      targetRole: {
        userId: targetRole.userId,
        roleSlug: targetRole.roleSlug,
        taxonomyVersion: targetRole.taxonomyVersion,
        updatedAt: toIsoDateString(targetRole.updatedAt),
      },
    });

    return NextResponse.json(responseBody, { status: 200 });
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch target role." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const parsedBody = selectTargetRoleBodySchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        { message: getZodErrorMessage(parsedBody.error) },
        { status: 400 },
      );
    }

    const [user] = await pgdb
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.id, parsedBody.data.userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    await ensureRoleTaxonomiesPersisted();

    const taxonomy = getRoleTaxonomyBySlug(parsedBody.data.roleSlug);

    if (!taxonomy) {
      return NextResponse.json(
        { message: "Selected role is not supported." },
        { status: 400 },
      );
    }

    const [savedTargetRole] = await pgdb
      .insert(userRoleTargetsTable)
      .values({
        userId: parsedBody.data.userId,
        roleSlug: parsedBody.data.roleSlug,
        taxonomyVersion: taxonomy.version,
      })
      .onConflictDoUpdate({
        target: userRoleTargetsTable.userId,
        set: {
          roleSlug: parsedBody.data.roleSlug,
          taxonomyVersion: taxonomy.version,
          updatedAt: new Date(),
        },
      })
      .returning();

    const responseBody = targetRoleResponseSchema.parse({
      targetRole: {
        userId: savedTargetRole.userId,
        roleSlug: savedTargetRole.roleSlug,
        taxonomyVersion: savedTargetRole.taxonomyVersion,
        updatedAt: toIsoDateString(savedTargetRole.updatedAt),
      },
    });

    return NextResponse.json(responseBody, { status: 200 });
  } catch {
    return NextResponse.json(
      { message: "Failed to save target role." },
      { status: 500 },
    );
  }
}
