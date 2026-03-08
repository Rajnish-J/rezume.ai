import { NextResponse } from "next/server";

import { pgdb } from "@/src/lib/db/pg/db";
import { usersTable } from "@/src/lib/db/schema";
import {
  getZodErrorMessage,
  validateCreatePayload,
} from "@/src/utils/user/user.util";

export async function GET() {
  try {
    const users = await pgdb.select().from(usersTable);
    return NextResponse.json(users, { status: 200 });
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch users." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const parsedPayload = validateCreatePayload(body);

    if (!parsedPayload.success) {
      return NextResponse.json(
        { message: getZodErrorMessage(parsedPayload.error) },
        { status: 400 },
      );
    }

    const [createdUser] = await pgdb
      .insert(usersTable)
      .values(parsedPayload.data)
      .returning();

    return NextResponse.json(createdUser, { status: 201 });
  } catch {
    return NextResponse.json(
      { message: "Failed to create user." },
      { status: 500 },
    );
  }
}
