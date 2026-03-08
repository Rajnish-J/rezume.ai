"use client";

import Link from "next/link";
import { useState } from "react";
import { LockIcon, MailIcon, SparklesIcon, UserIcon } from "lucide-react";

import * as UI from "@/src/imports/UI.imports";
import * as r from "@/src/imports/auth.imports";

export default function SignUpContainer() {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  async function onSignUpSubmit() {
    try {
      setIsSubmitting(true);
      const response = await r.registerWithCredentials({
        name,
        email,
        username,
        password,
      });
      setStatusMessage(response.message);
    } catch (error) {
      setStatusMessage(r.parseAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[linear-gradient(130deg,#bde7eb_0%,#a9ceda_42%,#f5c8a7_100%)] p-5 sm:p-8">
      <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-cyan-300/45 blur-3xl" />
      <div className="pointer-events-none absolute bottom-8 right-10 h-80 w-80 rounded-full bg-orange-300/45 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/30 blur-3xl" />

      <section className="relative z-10 w-full max-w-xl rounded-[2rem] border border-white/50 bg-white/30 p-6 shadow-[0_20px_90px_rgba(15,23,42,0.18)] backdrop-blur-2xl sm:p-9">
        <div className="rounded-3xl border border-white/60 bg-white/72 p-6 shadow-[0_12px_45px_rgba(15,23,42,0.14)] backdrop-blur-xl sm:p-8">
          <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/55 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-700">
            <SparklesIcon className="h-3.5 w-3.5" />
            Create account
          </div>

          <h2 className="text-center text-2xl font-semibold text-slate-900">Join Rezume.ai</h2>
          <p className="mt-2 text-center text-sm text-slate-600">
            Set up your account to start resume analysis and AI guidance.
          </p>

          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Full name</label>
              <div className="relative">
                <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <UI.Input
                  className="h-11 border-white/65 bg-white/75 pl-9"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Email</label>
              <div className="relative">
                <MailIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <UI.Input
                  className="h-11 border-white/65 bg-white/75 pl-9"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  type="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Username</label>
              <div className="relative">
                <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <UI.Input
                  className="h-11 border-white/65 bg-white/75 pl-9"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Password</label>
              <div className="relative">
                <LockIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <UI.Input
                  className="h-11 border-white/65 bg-white/75 pl-9"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="********"
                  type="password"
                />
              </div>
            </div>

            <UI.Button
              className="h-11 w-full cursor-pointer bg-slate-900 text-white hover:bg-slate-800"
              disabled={isSubmitting}
              onClick={onSignUpSubmit}
            >
              Create Account
            </UI.Button>

            <p className="text-center text-sm text-slate-700">
              Already have an account?{" "}
              <Link className="font-medium underline underline-offset-4" href="/auth/sign-in">
                Sign in
              </Link>
            </p>

            {statusMessage ? (
              <p className="rounded-lg border border-white/70 bg-white/70 p-3 text-sm text-slate-700">
                {statusMessage}
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}

