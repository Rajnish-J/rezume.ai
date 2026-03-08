"use client";

import { useState } from "react";
import { ChromeIcon, LockIcon, MailIcon, UserIcon } from "lucide-react";

import * as UI from "@/src/imports/UI.imports";
import * as r from "@/src/imports/auth.imports";

export default function SignInContainer() {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  async function onCredentialsSubmit() {
    try {
      setIsSubmitting(true);

      if (isRegisterMode) {
        const response = await r.registerWithCredentials({
          name,
          email,
          username,
          password,
        });

        setStatusMessage(response.message);

        if (response.success) {
          setIsRegisterMode(false);
        }

        return;
      }

      const response = await r.signInWithCredentials({ username, password });
      setStatusMessage(response.message);
    } catch (error) {
      setStatusMessage(r.parseAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onGoogleSignIn() {
    try {
      await r.signInWithGoogle();
    } catch (error) {
      setStatusMessage(r.parseAuthErrorMessage(error));
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.25),_transparent_45%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.2),_transparent_35%),linear-gradient(135deg,#0f172a,#111827,#0b1220)] p-6">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-sm md:grid-cols-2">
        <div className="hidden flex-col justify-between bg-white/10 p-10 text-white md:flex">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/70">rezume.ai</p>
            <h1 className="mt-4 text-4xl font-bold leading-tight">
              Build your career story with confidence.
            </h1>
            <p className="mt-4 text-sm text-white/80">
              Sign in with your account or continue with Google to access resume tools,
              AI suggestions, and personalized insights.
            </p>
          </div>
          <p className="text-xs text-white/70">
            Secure login powered by credentials and OAuth.
          </p>
        </div>

        <div className="bg-white p-8 sm:p-10">
          <h2 className="text-2xl font-semibold text-slate-900">
            {isRegisterMode ? "Create Account" : "Welcome Back"}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {isRegisterMode
              ? "Register with username/password, then sign in."
              : "Sign in using username/password or Google."}
          </p>

          <div className="mt-6 space-y-4">
            {isRegisterMode ? (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Full Name</label>
                <div className="relative">
                  <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <UI.Input
                    className="pl-9"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="John Doe"
                  />
                </div>
              </div>
            ) : null}

            {isRegisterMode ? (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Email</label>
                <div className="relative">
                  <MailIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <UI.Input
                    className="pl-9"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    type="email"
                  />
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Username</label>
              <div className="relative">
                <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <UI.Input
                  className="pl-9"
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
                  className="pl-9"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="********"
                  type="password"
                />
              </div>
            </div>

            <UI.Button className="w-full" disabled={isSubmitting} onClick={onCredentialsSubmit}>
              {isRegisterMode ? "Create Account" : "Sign In"}
            </UI.Button>

            <UI.Button variant="outline" className="w-full" onClick={onGoogleSignIn}>
              <ChromeIcon className="mr-2 h-4 w-4" />
              Continue with Google
            </UI.Button>

            <button
              className="w-full text-sm text-slate-600 underline-offset-4 hover:underline"
              onClick={() => setIsRegisterMode((prev) => !prev)}
              type="button"
            >
              {isRegisterMode
                ? "Already have an account? Sign in"
                : "Need an account? Create one"}
            </button>

            {statusMessage ? (
              <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                {statusMessage}
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
