'use client';
import { useEffect, useState } from 'react';
import { Account, Client } from 'appwrite';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!) 
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);
    
const account = new Account(client);

export default function AdminGuard({ children }: { children: React.ReactNode }) {
    const [isAdmin, setIsAdmin] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const checkAdmin = async () => {
            try {
                const user = await account.get();
                // ONLY allow users with the 'admin' label
                if (user.labels?.includes('admin')) {
                    setIsAdmin(true);
                } else {
                    router.push('/'); 
                }
            } catch {
                // Removed (error) here to satisfy ESLint since we just want to redirect
                router.push('/login');
            }
        };
        checkAdmin();
    }, [router]);

    if (!isAdmin) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-blue-600 h-10 w-10" />
                    <p className="text-slate-500 font-medium">Verifying Credentials...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}