import { cache } from "react";
import NextAuth, { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { MongoClient } from "mongodb";
import connectDB from "./db";
import User from "./models/User";

/** Avatar shown in the UI: pending profile photo (if any) else approved `User.image`. */
function sessionAvatarUrl(dbUser: {
  image?: string | null;
  profileUpdateRequest?: { status?: string; data?: unknown } | null;
}): string {
  if (dbUser.profileUpdateRequest?.status === "pending" && dbUser.profileUpdateRequest.data != null) {
    const data = dbUser.profileUpdateRequest.data as { image?: unknown };
    if (typeof data.image === "string" && data.image.length > 0) return data.image;
  }
  return (typeof dbUser.image === "string" && dbUser.image) || "";
}

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

function getClientPromise(): Promise<MongoClient> {
  if (!clientPromise) {
    client = new MongoClient(process.env.MONGODB_URI!);
    clientPromise = client.connect();
  }
  return clientPromise;
}

export const authConfig: NextAuthConfig = {
  // In production (`npm run start`), NextAuth blocks requests for "untrusted" hosts
  // unless `trustHost` is enabled. During local testing we want to allow localhost.
  trustHost:
    process.env.NODE_ENV !== "production" ||
    (process.env.NEXTAUTH_URL ?? "").includes("localhost") ||
    (process.env.NEXTAUTH_URL ?? "").includes("127.0.0.1"),
  adapter: MongoDBAdapter(getClientPromise()),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  session: { strategy: "jwt", maxAge: 24 * 60 * 60 },
  pages: { signIn: "/login", error: "/login" },
  callbacks: {
    async signIn({ user }) {
      try {
        const email = user.email?.trim().toLowerCase();
        if (!email) return false;

        await connectDB();

        // Use upsert to avoid race conditions/duplicate key errors during first OAuth login.
        await User.updateOne(
          { email },
          {
            $setOnInsert: {
              email,
              role: "user",
              status: "pending",
              sessionVersion: 0,
            },
            $set: {
              name: user.name ?? "Unknown",
              image: user.image ?? "",
              lastLogin: new Date(),
            },
          },
          { upsert: true }
        );

        return true;
      } catch (err) {
        console.error("[auth.signIn] failed:", err);
        return false;
      }
    },
    async jwt({ token, user, trigger }) {
      await connectDB();
      if (user || trigger === "update") {
        const dbUser = await User.findOne({ email: token.email })
          .select("name role status sessionVersion image profileUpdateRequest")
          .lean();
        if (dbUser) {
          token.id = String(dbUser._id);
          token.name = dbUser.name;
          token.image = sessionAvatarUrl(dbUser);
          token.role = dbUser.role;
          token.status = dbUser.status;
          token.sessionVersion = dbUser.sessionVersion;
        }
        return token;
      }
      const dbUser = await User.findOne({ email: token.email })
        .select("sessionVersion role status name image profileUpdateRequest")
        .lean();
      if (!dbUser) return null;
      if (dbUser.sessionVersion !== token.sessionVersion) return null;
      token.role = dbUser.role;
      token.status = dbUser.status;
      token.name = dbUser.name;
      token.image = sessionAvatarUrl(dbUser);
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        if (token.name) session.user.name = token.name as string;
        session.user.image = (token.image as string | undefined) ?? session.user.image;
        session.user.role = token.role as string;
        session.user.status = token.status as string;
      }
      return session;
    },
  },
};

const nextAuth = NextAuth(authConfig);

export const { handlers, signIn, signOut } = nextAuth;

/** Raw NextAuth `auth` — use in Edge middleware / proxy only (not wrapped with React `cache`). */
export const uncachedAuth = nextAuth.auth;

/**
 * Per-request deduped session for Server Components, route handlers, and server actions.
 * Prefer this over `uncachedAuth` everywhere except middleware.
 */
export const auth = cache(nextAuth.auth);
