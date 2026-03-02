'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { account } from '@/lib/appwrite';
import { useAuth } from '@/context/AuthContext';
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function VerifyPage() {
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const searchParams = useSearchParams();
    const router = useRouter();
    const { refreshUser } = useAuth();
    const hasCalledRef = useRef(false); 

    useEffect(() => {
        // If we've already started the process, don't run again
        if (hasCalledRef.current) return;

        const userId = searchParams.get('userId');
        const secret = searchParams.get('secret');

        // Check if params are missing
        if (!userId || !secret) {
            // Use a micro-task or timeout to move the state update out of the sync render cycle
            const timeout = setTimeout(() => setStatus('error'), 0);
            return () => clearTimeout(timeout);
        }

        // If params exist, start the Appwrite verification
        hasCalledRef.current = true;
        
        async function completeVerification() {
            try {
                // The actual Appwrite verification call
                await account.updateVerification(userId!, secret!);
                setStatus('success');
                
                // Refresh the AuthContext so the app knows the user is now "Verified"
                await refreshUser();
                
                // Redirect to home page after a brief delay
                setTimeout(() => router.push('/'), 3000);
            } catch (error) {
                console.error("Verification failed:", error);
                setStatus('error');
            }
        }

        completeVerification();
    }, [searchParams, router, refreshUser]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <Card className="w-full max-w-md text-center shadow-lg border-none">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-slate-800">Account Verification</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center space-y-4 py-8">
                    {status === 'loading' && (
                        <>
                            <Loader2 className="w-12 h-12 animate-spin text-[#1a2333]" />
                            <p className="text-slate-600 font-medium">Authenticating your credentials...</p>
                        </>
                    )}
                    {status === 'success' && (
                        <>
                            <CheckCircle className="w-12 h-12 text-green-500" />
                            <p className="text-slate-600 font-medium">Account verified! Heading home...</p>
                        </>
                    )}
                    {status === 'error' && (
                        <>
                            <XCircle className="w-12 h-12 text-red-500" />
                            <p className="text-slate-600 font-medium">Verification failed. The link may be expired or invalid.</p>
                            <button 
                                onClick={() => router.push('/signup')} 
                                className="text-[#1a2333] font-bold hover:underline mt-2"
                            >
                                Try signing up again
                            </button>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}