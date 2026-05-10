declare module "*.css" {
  const content: { [className: string]: string };
  export default content;
}

// Extend NextAuth session types
import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
  }
}
