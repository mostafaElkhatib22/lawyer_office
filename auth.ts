import { MongoDBAdapter } from '@auth/mongodb-adapter';
import Credentials from "next-auth/providers/credentials";
import NextAuth from "next-auth";
import client from './lib/db';

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: MongoDBAdapter(client),
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const response = await fetch('/api/user', { // تأكد من صحة عنوان URL
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(credentials)
        });
        if (!response.ok) return null;
        return (await response.json()) ?? null;
      },
    }),
  ],
});
