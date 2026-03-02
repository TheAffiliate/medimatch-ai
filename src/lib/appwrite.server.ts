// src/lib/appwrite.server.ts
import * as sdk from "node-appwrite";
import { cookies } from "next/headers";

export async function createSessionClient() {
  const client = new sdk.Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

  const session = (await cookies()).get("appwrite-session");

  if (!session || !session.value) {
    return null;
  }

  client.setSession(session.value);

  return {
    get account() {
      return new sdk.Account(client);
    },
    get databases() {
      return new sdk.Databases(client);
    },
  };
}