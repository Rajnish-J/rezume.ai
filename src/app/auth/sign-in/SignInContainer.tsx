"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { LockIcon, ScanSearchIcon, SparklesIcon, UserIcon } from "lucide-react";

import * as UI from "@/src/imports/UI.imports";
import * as r from "@/src/imports/auth.imports";

export default function SignInContainer() {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  async function onCredentialsSubmit() {
    try {
      setIsSubmitting(true);
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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[linear-gradient(130deg,#bde7eb_0%,#a9ceda_42%,#f5c8a7_100%)] p-5 sm:p-8">
      <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-cyan-300/45 blur-3xl" />
      <div className="pointer-events-none absolute bottom-8 right-10 h-80 w-80 rounded-full bg-orange-300/45 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/30 blur-3xl" />

      <section className="relative z-10 grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/50 bg-white/26 shadow-[0_20px_90px_rgba(15,23,42,0.18)] backdrop-blur-2xl lg:grid-cols-[1.08fr_0.92fr]">
        <div className="relative hidden p-10 lg:block xl:p-14">
          <div className="absolute -right-40 -top-20 h-105 w-105 rounded-full border border-sky-500/25 bg-linear-to-br from-white/60 via-sky-100/35 to-orange-200/30" />
          <div className="absolute right-9 top-30 h-72.5 w-107.5 -rotate-12 rounded-[48px] border border-white/60 bg-linear-to-r from-sky-300/30 via-cyan-200/20 to-orange-200/30 shadow-[0_20px_60px_rgba(14,116,144,0.2)] backdrop-blur-2xl" />

          <div className="relative z-20 max-w-xl rounded-[28px] border border-white/60 bg-white/32 p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] backdrop-blur-2xl xl:p-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/45 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-700">
              <SparklesIcon className="h-3.5 w-3.5" />
              Rezume.ai Workspace
            </div>
            <h1 className="mt-7 text-4xl font-semibold leading-tight text-slate-900 xl:text-5xl">
              Design your career.
              <br />
              Analyze your resume.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-700/90">
              Sign in to get AI-driven resume insights, role matching, and personalized recommendations.
            </p>
            <div className="mt-8 rounded-2xl border border-white/70 bg-white/55 p-5 shadow-[0_8px_30px_rgba(15,23,42,0.12)] backdrop-blur-xl">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Resume Analyzer</p>
                  <p className="text-xs text-slate-600">Profile scan in progress</p>
                </div>
                <ScanSearchIcon className="h-5 w-5 text-cyan-700" />
              </div>
              <div className="space-y-3">
                <div className="h-2 rounded-full bg-slate-200/80"><div className="h-2 w-[84%] rounded-full bg-linear-to-r from-cyan-500 to-sky-600" /></div>
                <div className="h-2 rounded-full bg-slate-200/80"><div className="h-2 w-[67%] rounded-full bg-linear-to-r from-cyan-500 to-sky-600" /></div>
                <div className="h-2 rounded-full bg-slate-200/80"><div className="h-2 w-[92%] rounded-full bg-linear-to-r from-cyan-500 to-sky-600" /></div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center p-6 sm:p-9 lg:p-12">
          <div className="mx-auto w-full max-w-md rounded-3xl border border-white/60 bg-white/72 p-6 shadow-[0_12px_45px_rgba(15,23,42,0.14)] backdrop-blur-xl sm:p-8">
            <h2 className="text-center text-2xl font-semibold text-slate-900">Welcome back</h2>
            <p className="mt-2 text-center text-sm text-slate-600">
              Sign in with username/password or continue with Google.
            </p>

            <div className="mt-6 space-y-4">
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
                onClick={onCredentialsSubmit}
              >
                Sign In
              </UI.Button>

              <UI.Button
                variant="outline"
                className="h-11 w-full cursor-pointer border-white/70 bg-white/70 text-slate-800 hover:bg-white"
                onClick={onGoogleSignIn}
              >
                <Image src="/google.png" alt="Google" width={16} height={16} className="mr-2 h-4 w-4" />
                <span className="text-background">
                  Continue with Google
                </span>
              </UI.Button>

              <p className="text-center text-sm text-slate-700">
                New user?{" "}
                <Link className="font-medium underline underline-offset-4" href="/auth/sign-up">
                  Create an account
                </Link>
              </p>

              {statusMessage ? (
                <p className="rounded-lg border border-white/70 bg-white/70 p-3 text-sm text-slate-700">
                  {statusMessage}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}



