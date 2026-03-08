"use client";

import { signIn } from "next-auth/react";

import * as t from "@/src/types/auth.types";
import * as u from "@/src/utils/auth/sign-in.util";

export async function signInWithCredentials(
  payload: t.CredentialsSignInInput,
): Promise<t.AuthApiResponse> {
  const parsedPayload = t.credentialsSignInSchema.safeParse(payload);

  if (!parsedPayload.success) {
    return {
      success: false,
      message: "Enter valid username and password.",
    };
  }

  const response = await signIn("credentials", {
    username: parsedPayload.data.username,
    password: parsedPayload.data.password,
    redirect: false,
    callbackUrl: "/dashboard",
  });

  if (!response || response.error) {
    return {
      success: false,
      message: "Invalid credentials.",
    };
  }

  if (response.url) {
    window.location.href = response.url;
  }

  return {
    success: true,
    message: "Signed in successfully.",
  };
}

export async function registerWithCredentials(
  payload: t.CredentialsRegisterInput,
): Promise<t.AuthApiResponse> {
  const parsedPayload = t.credentialsRegisterSchema.safeParse(payload);

  if (!parsedPayload.success) {
    return {
      success: false,
      message: "Enter valid registration details.",
    };
  }

  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(parsedPayload.data),
  });

  const responseBody = await response.json();
  return u.parseAuthApiResponse(responseBody);
}

export async function signInWithGoogle(): Promise<void> {
  await signIn("google", { callbackUrl: "/dashboard" });
}
