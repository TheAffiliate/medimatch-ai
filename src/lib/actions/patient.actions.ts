"use server";

import { createSessionClient } from "../appwrite.server";

// GET LOGGED IN USER
export const getLoggedInUser = async () => {
  try {
    // 1. Initialize the session client
    const sessionClient = await createSessionClient();

    // 2. If there's no session cookie, return null immediately
    if (!sessionClient) {
      return null;
    }

    // 3. Fetch the account details from Appwrite
    const user = await sessionClient.account.get();

    /**
     * 4. Next.js Server Actions can only return "Plain Objects".
     * Appwrite returns complex class instances, so we stringify and 
     * parse to convert it into a simple data object.
     */
    return JSON.parse(JSON.stringify(user));
  } catch (error) {
    console.error("Error fetching logged in user:", error);
    return null;
  }
};