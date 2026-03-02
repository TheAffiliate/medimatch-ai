'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { account } from "@/lib/appwrite";
import { OAuthProvider } from "appwrite";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useAuth } from '@/context/AuthContext'; 

export default function CustomLoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { refreshUser } = useAuth(); 

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await account.createEmailPasswordSession(email, password);
            
            // 1. Sync the session into your global AuthContext
            await refreshUser(); 

            // 2. Redirect to the Home Page (/) 
            // This lets your page.tsx logic decide where the user goes next
            router.push('/');

        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
            alert(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        account.createOAuth2Session(
            OAuthProvider.Google, 
            `${window.location.origin}/`, 
            `${window.location.origin}/login`
        );
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
            <Card className="w-full max-w-110 shadow-2xl border-none overflow-hidden rounded-xl bg-white">
                <CardHeader className="text-center pt-12 pb-6 px-8">
                    <div className="flex justify-center mb-6">
                        <Image 
                            src="/medimatch-logo.png" 
                            alt="MediMatch AI Logo" 
                            width={96} 
                            height={96} 
                            priority 
                            className="object-contain rounded-lg"
                        />
                    </div>
                    <CardTitle className="text-[28px] font-bold tracking-tight text-[#1a2333]">
                        Welcome to MediMatch AI
                    </CardTitle>
                    <p className="text-sm text-slate-500 mt-1 font-medium">Sign in to continue</p>
                </CardHeader>

                <CardContent className="pb-10 px-10">
                    <Button 
                        onClick={handleGoogleLogin}
                        variant="outline" 
                        className="w-full h-13 border-slate-200 flex items-center justify-center gap-3 hover:bg-slate-50 transition-all font-semibold text-[#1a2333] rounded-lg"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Continue with Google
                    </Button>

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-slate-100"></span>
                        </div>
                        <div className="relative flex justify-center text-[11px] uppercase tracking-widest font-bold">
                            <span className="bg-white px-4 text-slate-400">Or Email</span>
                        </div>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <Input 
                            type="email" 
                            placeholder="you@example.com" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="h-13 border-slate-200 focus:ring-blue-500 rounded-lg placeholder:text-slate-400"
                            required
                        />
                        <Input 
                            type="password" 
                            placeholder="Password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="h-13 border-slate-200 focus:ring-blue-500 rounded-lg placeholder:text-slate-400"
                            required
                        />
                        
                        <Button className="w-full h-13 bg-[#1a2333] hover:bg-[#253041] text-white font-bold text-base rounded-lg transition-all" disabled={isLoading}>
                            {isLoading ? <Loader2 className="animate-spin" /> : 'Sign in'}
                        </Button>

                        <div className="flex justify-between items-center mt-6 px-1">
                            <button 
                                type="button"
                                onClick={() => router.push('/forgot-password')}
                                className="text-[13px] text-slate-500 hover:text-slate-800 transition-colors font-medium"
                            >
                                Forgot password?
                            </button>
                            <p className="text-[13px] text-slate-500 font-medium">
                                Need an account? <span 
                                    className="text-[#1a2333] font-bold cursor-pointer hover:underline" 
                                    onClick={() => router.push('/signup')}
                                >
                                    Sign up
                                </span>
                            </p>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}