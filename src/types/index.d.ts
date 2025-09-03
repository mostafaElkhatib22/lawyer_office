/* eslint-disable @typescript-eslint/no-unused-vars */
    // types/next-auth.d.ts
    import NextAuth, { DefaultSession, DefaultJWT } from "next-auth";

    declare module "next-auth" {
      /**
       * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
       */
      interface Session {
        user: {
          id: string;
          role: string;
        } & DefaultSession["user"];
      }

      /**
       * The shape of the user object that is returned from the `authorize` callback.
       * Can also be used with a custom `jwt` callback to extend the `token` properties.
       */
      interface User {
        id: string;
        role: string;
      }
    }

    declare module "next-auth/jwt" {
      /**
       * Returned by the `jwt` callback and `getToken`, when using JWT sessions
       */
      interface JWT extends DefaultJWT {
        id: string;
        role: string;
      }
    }
    