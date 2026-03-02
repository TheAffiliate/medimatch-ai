import { Client, Account, Databases, Storage } from 'appwrite';

const client = new Client();

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;

// Only set if they exist to prevent build-time crashes
if (endpoint && projectId) {
    client
        .setEndpoint(endpoint)
        .setProject(projectId);
} else {
    console.warn("Appwrite environment variables are missing!");
}

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export { ID, Query } from 'appwrite';