'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { account, ID } from "@/lib/appwrite";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft } from "lucide-react";
import { useAuth } from '@/context/AuthContext';

export default function CustomSignupPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const { refreshUser } = useAuth(); // Add this hook at the top of your component

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) return alert("Passwords do not match");

        setIsLoading(true);
        try {
            // 1. Create User Account
            await account.create(ID.unique(), email, password);
            
            // 2. Log them in (Required to create a verification link)
            await account.createEmailPasswordSession(email, password);
            
            // 3. Update AuthContext so the app knows who is logged in
            await refreshUser();

            // 4. Send the Verification Email
            // This URL is where the user will be sent when they click the email link
            await account.createVerification('http://localhost:3000/verify');
            
            // 5. Redirect to a "Check your email" notice or the home page
            alert("Verification email sent! Please check your inbox.");
            router.push('/'); 
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Signup failed";
            alert(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <Card className="w-full max-w-md shadow-2xl border-none">
                <CardHeader className="pt-8">
                    <button onClick={() => router.push('/login')} className="flex items-center text-sm text-slate-500 hover:text-slate-800 mb-4 transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-1" /> Back to sign in
                    </button>
                    <CardTitle className="text-2xl font-bold tracking-tight text-slate-900 text-center">
                        Create your account
                    </CardTitle>
                </CardHeader>
                <CardContent className="pb-8">
                    <form onSubmit={handleSignup} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase text-slate-400 ml-1">Email</label>
                            <Input 
                                type="email" 
                                placeholder="you@example.com" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="h-12 border-slate-200"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                             <label className="text-xs font-semibold uppercase text-slate-400 ml-1">Password</label>
                            <Input 
                                type="password" 
                                placeholder="Min. 8 characters" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="h-12 border-slate-200"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                             <label className="text-xs font-semibold uppercase text-slate-400 ml-1">Confirm Password</label>
                            <Input 
                                type="password" 
                                placeholder="Re-enter password" 
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="h-12 border-slate-200"
                                required
                            />
                        </div>
                        <Button className="w-full h-12 bg-[#1a2333] hover:bg-[#253041] mt-4" disabled={isLoading}>
                            {isLoading ? <Loader2 className="animate-spin" /> : 'Create account'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}