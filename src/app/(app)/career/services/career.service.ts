import {
  type ListRolesResponse,
  listRolesResponseSchema,
  type SelectTargetRoleBody,
  type TargetRoleResponse,
  targetRoleResponseSchema,
} from "@/src/types/career.types";
import { toCareerErrorMessage } from "@/src/utils/career/career-client.util";

export async function fetchCareerRoles(): Promise<ListRolesResponse> {
  const response = await fetch("/api/career/roles", {
    method: "GET",
    cache: "no-store",
  });
  const responseBody = await response.json();

  if (!response.ok) {
    throw new Error(toCareerErrorMessage(responseBody));
  }

  return listRolesResponseSchema.parse(responseBody);
}

export async function fetchUserTargetRole(
  userId: number,
): Promise<TargetRoleResponse> {
  const response = await fetch(`/api/career/target-role?userId=${userId}`, {
    method: "GET",
    cache: "no-store",
  });
  const responseBody = await response.json();

  if (!response.ok) {
    throw new Error(toCareerErrorMessage(responseBody));
  }

  return targetRoleResponseSchema.parse(responseBody);
}

export async function setUserTargetRole(
  payload: SelectTargetRoleBody,
): Promise<TargetRoleResponse> {
  const response = await fetch("/api/career/target-role", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const responseBody = await response.json();

  if (!response.ok) {
    throw new Error(toCareerErrorMessage(responseBody));
  }

  return targetRoleResponseSchema.parse(responseBody);
}
