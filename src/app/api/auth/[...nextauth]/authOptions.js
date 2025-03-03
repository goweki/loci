import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma/prisma";
import { compareHash } from "@/helpers/bycryptHandlers";

export const authOptions = {
  // Configure one or more authentication providers
  providers: [
    CredentialsProvider({
      // The name to display on the sign in form (e.g. 'Sign in with...')
      name: "Credentials",
      // The credentials is used to generate a suitable form on the sign in page.
      // You can specify whatever fields you are expecting to be submitted.
      // e.g. domain, username, password, 2FA token, etc.
      // You can pass any HTML attribute to the <input> tag through the object.
      credentials: {
        email: { label: "Email", type: "email" },
        password: {
          label: "Password",
          type: "password",
        },
      },
      async authorize(credentials, req) {
        // You need to provide your own logic here that takes the credentials
        // submitted and returns either a object representing a user or value
        // that is false/null if the credentials are invalid.
        // e.g. return { id: 1, name: 'J Smith', email: 'jsmith@example.com' }
        // You can also use the `req` object to obtain additional parameters
        // (i.e., the request IP address)
        if (!credentials) return null;
        //       /* AUTH LOGIC
        //        * logic that takes the credentials
        //        * submitted and returns either a object representing a user or value
        //        * that is false/null if the credentials are invalid.
        //        * e.g. return { id: 1, name: 'Defi Motors', email: 'contact@defioffroads.com' }
        //        * You can also use the `req` object to obtain additional parameters
        //        * (i.e., the request IP address)
        //        * check if user exists in db
        //        */

        // check if user exists
        let user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });
        // ifCredentialsValid
        if (user && (await compareHash(credentials.password, user.password))) {
          delete user.password;
          // valid credentials
          console.log(
            `SUCCESS: User authenticated\n > ${JSON.stringify(user)}\n.`
          );
          return user;
        } else {
          // invalid credentials
          console.error(
            `FAILED: Invalid credentials\n > by ${JSON.stringify(
              credentials
            )}\n`
          );
          return "";
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt(params) {
      if (params.user) {
        // Persist role when `user` exists (initial login)
        params.token.role = params.user.role || ""; // Default to "" if role is missing
      }
      return params.token;
    },
    async session({ session, token }) {
      if (session.user && token.role) {
        // Append role only if `token.role` exists
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/signIn",
    //signOut: "/auth/signout",
    //error: "/auth/error", // Error code passed in query string as ?error=
    //verifyRequest: "/auth/verify-request", // (used for check email message)
    //newUser: "/auth/new-user", // New users will be directed here on first sign in (leave the property out if not of interest)
  },
};
