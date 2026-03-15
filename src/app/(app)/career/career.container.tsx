"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Target } from "lucide-react";

import * as UI from "@/src/imports/UI.imports";
import * as c from "@/src/imports/career.imports";

export default function CareerContainer({ userId }: { userId: number }) {
  const [roles, setRoles] = useState<c.ListRolesResponse["roles"]>([]);
  const [targetRole, setTargetRole] = useState<c.TargetRoleResponse["targetRole"]>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [isLoadingRoles, setIsLoadingRoles] = useState<boolean>(true);
  const [isFetchingTarget, setIsFetchingTarget] = useState<boolean>(false);
  const [isSavingTarget, setIsSavingTarget] = useState<boolean>(false);

  const roleMap = useMemo(() => {
    return new Map(roles.map((role) => [role.slug, role]));
  }, [roles]);

  useEffect(() => {
    async function loadRoles() {
      try {
        setIsLoadingRoles(true);
        const response = await c.fetchCareerRoles();
        setRoles(response.roles);
      } catch (error) {
        setStatusMessage(
          c.parseCareerApiErrorMessage(error, "Could not load role taxonomy."),
        );
      } finally {
        setIsLoadingRoles(false);
      }
    }

    void loadRoles();
  }, []);

  async function onSetTargetRole(roleSlug: c.RoleSlug) {
    try {
      setIsSavingTarget(true);
      const response = await c.setUserTargetRole({
        userId,
        roleSlug,
      });
      setTargetRole(response.targetRole);
      setStatusMessage("Target role saved.");
    } catch (error) {
      setStatusMessage(
        c.parseCareerApiErrorMessage(error, "Could not save target role."),
      );
    } finally {
      setIsSavingTarget(false);
    }
  }

  useEffect(() => {
    if (!Number.isInteger(userId) || userId <= 0) {
      setStatusMessage("Could not resolve signed-in user.");
      return;
    }

    async function loadTargetRole() {
      try {
        setIsFetchingTarget(true);
        const response = await c.fetchUserTargetRole(userId);
        setTargetRole(response.targetRole);
        setStatusMessage(
          response.targetRole
            ? "Target role loaded."
            : "No target role selected for this user yet.",
        );
      } catch (error) {
        setStatusMessage(
          c.parseCareerApiErrorMessage(error, "Could not load target role."),
        );
      } finally {
        setIsFetchingTarget(false);
      }
    }

    void loadTargetRole();
  }, [userId]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      <div className="rounded-xl border bg-background p-6">
        <h1 className="text-2xl font-semibold">Career Targeting</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Select one target role. Resume analysis and gap scoring use this role
          taxonomy and version.
        </p>
      </div>

      <div className="rounded-xl border bg-background p-6">
        <h2 className="text-lg font-medium">User Target Role</h2>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <Target className="h-4 w-4" />
          Signed in user id: {userId}
          {isFetchingTarget ? (
            <span className="inline-flex items-center">
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              Loading target role...
            </span>
          ) : null}
        </div>

        <div className="mt-4 rounded-lg border bg-muted/30 p-4 text-sm">
          {targetRole ? (
            <p>
              Current target:{" "}
              <span className="font-medium">
                {roleMap.get(targetRole.roleSlug)?.name ?? targetRole.roleSlug}
              </span>{" "}
              (taxonomy v{targetRole.taxonomyVersion})
            </p>
          ) : (
            <p className="text-muted-foreground">
              No role selected yet. Choose one from the list below.
            </p>
          )}
        </div>
      </div>

      <div className="rounded-xl border bg-background p-6">
        <h2 className="text-lg font-medium">Curated Roles</h2>
        {isLoadingRoles ? (
          <div className="mt-4 flex items-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading role taxonomy...
          </div>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {roles.map((role) => {
              const isSelected = targetRole?.roleSlug === role.slug;

              return (
                <div key={role.slug} className="rounded-lg border p-4">
                  <p className="text-base font-medium">{role.name}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {role.description}
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">
                    {role.slug} | v{role.version}
                  </p>
                  <UI.Button
                    className="mt-4"
                    onClick={() => onSetTargetRole(role.slug)}
                    disabled={isSavingTarget || isLoadingRoles || isFetchingTarget}
                    variant={isSelected ? "secondary" : "default"}
                  >
                    {isSelected ? "Selected" : "Set as target role"}
                  </UI.Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {statusMessage ? (
        <div className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
          {statusMessage}
        </div>
      ) : null}
    </div>
  );
}
