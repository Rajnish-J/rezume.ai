import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import * as a from "@/src/imports/auth.imports";
import { pgdb } from "@/src/lib/db/pg/db";
import { usersTable } from "@/src/lib/db/schema";

export async function POST(request: Request) {
  const payload = await request.json();
  const parsedPayload = a.credentialsRegisterSchema.safeParse(payload);

  if (!parsedPayload.success) {
    return NextResponse.json(
      { success: false, message: "Invalid registration payload." },
      { status: 400 },
    );
  }

  const [existingEmailUser] = await pgdb
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, parsedPayload.data.email))
    .limit(1);

  if (existingEmailUser) {
    return NextResponse.json(
      { success: false, message: "Email already exists." },
      { status: 409 },
    );
  }

  const [existingUsernameUser] = await pgdb
    .select()
    .from(usersTable)
    .where(
      and(
        eq(usersTable.username, parsedPayload.data.username),
        eq(usersTable.authProvider, "credentials"),
      ),
    )
    .limit(1);

  if (existingUsernameUser) {
    return NextResponse.json(
      { success: false, message: "Username already exists." },
      { status: 409 },
    );
  }

  const passwordHash = await a.hashPassword(parsedPayload.data.password);

  await pgdb.insert(usersTable).values({
    name: parsedPayload.data.name,
    age: 18,
    email: parsedPayload.data.email,
    username: parsedPayload.data.username,
    passwordHash,
    authProvider: "credentials",
  });

  return NextResponse.json(
    { success: true, message: "Account created successfully." },
    { status: 201 },
  );
}
