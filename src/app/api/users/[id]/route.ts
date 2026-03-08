import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { pgdb } from "@/src/lib/db/pg/db";
import { usersTable } from "@/src/lib/db/schema";
import {
  getZodErrorMessage,
  validateUpdatePayload,
  validateUserId,
} from "@/src/utils/user/user.util";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, { params }: RouteParams) {
  const { id } = await params;
  const parsedUserId = validateUserId(id);

  if (!parsedUserId.success) {
    return NextResponse.json(
      { message: getZodErrorMessage(parsedUserId.error) },
      { status: 400 },
    );
  }

  try {
    const [user] = await pgdb
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, parsedUserId.data));

    if (!user) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch user." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const parsedUserId = validateUserId(id);

  if (!parsedUserId.success) {
    return NextResponse.json(
      { message: getZodErrorMessage(parsedUserId.error) },
      { status: 400 },
    );
  }

  try {
    const body = (await request.json()) as unknown;
    const parsedPayload = validateUpdatePayload(body);

    if (!parsedPayload.success) {
      return NextResponse.json(
        { message: getZodErrorMessage(parsedPayload.error) },
        { status: 400 },
      );
    }

    const [updatedUser] = await pgdb
      .update(usersTable)
      .set(parsedPayload.data)
      .where(eq(usersTable.id, parsedUserId.data))
      .returning();

    if (!updatedUser) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    return NextResponse.json(updatedUser, { status: 200 });
  } catch {
    return NextResponse.json(
      { message: "Failed to update user." },
      { status: 500 },
    );
  }
}

export async function DELETE(_: Request, { params }: RouteParams) {
  const { id } = await params;
  const parsedUserId = validateUserId(id);

  if (!parsedUserId.success) {
    return NextResponse.json(
      { message: getZodErrorMessage(parsedUserId.error) },
      { status: 400 },
    );
  }

  try {
    const [deletedUser] = await pgdb
      .delete(usersTable)
      .where(eq(usersTable.id, parsedUserId.data))
      .returning();

    if (!deletedUser) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    return NextResponse.json(
      { message: "User deleted successfully." },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { message: "Failed to delete user." },
      { status: 500 },
    );
  }
}
