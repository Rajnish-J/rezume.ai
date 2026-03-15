import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { and, eq } from "drizzle-orm";

import * as a from "@/src/imports/auth.imports";
import { pgdb } from "@/src/lib/db/pg/db";
import { usersTable } from "@/src/lib/db/schema";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsedCredentials =
          a.credentialsSignInSchema.safeParse(credentials);

        if (!parsedCredentials.success) {
          return null;
        }

        const [user] = await pgdb
          .select()
          .from(usersTable)
          .where(
            and(
              eq(usersTable.username, parsedCredentials.data.username),
              eq(usersTable.authProvider, "credentials"),
            ),
          )
          .limit(1);

        if (!user || !user.passwordHash) {
          return null;
        }

        const isPasswordValid = await a.verifyPassword(
          parsedCredentials.data.password,
          user.passwordHash,
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google") {
        return true;
      }

      if (!user.email) {
        return false;
      }

      const [existingUser] = await pgdb
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, user.email))
        .limit(1);

      if (!existingUser) {
        const [createdUser] = await pgdb
          .insert(usersTable)
          .values({
            name: user.name ?? "Google User",
            age: 18,
            email: user.email,
            username: null,
            passwordHash: null,
            authProvider: "google",
          })
          .returning();

        user.id = String(createdUser.id);
        return true;
      }

      user.id = String(existingUser.id);
      return true;
    },
    async jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
      }

      const numericSub = Number(token.sub);

      if ((!Number.isInteger(numericSub) || numericSub <= 0) && token.email) {
        const [dbUser] = await pgdb
          .select({ id: usersTable.id })
          .from(usersTable)
          .where(eq(usersTable.email, token.email))
          .limit(1);

        if (dbUser) {
          token.sub = String(dbUser.id);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
      }

      return session;
    },
  },
  pages: {
    signIn: "/auth/sign-in",
  },
});
