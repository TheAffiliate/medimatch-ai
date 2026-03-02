'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { account } from "@/lib/appwrite";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const router = useRouter();

    const handleResetRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Appwrite: Sends a recovery link to the user's email
            // Note: Update the URL to your actual production domain when you deploy
            await account.createRecovery(
                email, 
                `${window.location.origin}/reset-password-confirm`
            );
            setIsSent(true);
        } catch (error: unknown) {
            const errMsg = error instanceof Error ? error.message : "An unknown error occurred";
            alert(errMsg || "Failed to send reset link. Please check the email address.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
            <Card className="w-full max-w-110 shadow-2xl border-none overflow-hidden rounded-xl bg-white">
                <CardHeader className="pt-10 pb-6 px-10">
                    <button 
                        onClick={() => router.push('/login')} 
                        className="flex items-center text-[13px] text-slate-500 hover:text-slate-800 mb-6 transition-colors font-semibold"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to sign in
                    </button>
                    
                    <CardTitle className="text-[28px] font-bold tracking-tight text-[#1a2333] text-center">
                        Reset your password
                    </CardTitle>
                    <p className="text-sm text-slate-500 mt-3 text-center leading-relaxed px-2">
                        Enter your email and we&apos;ll send you a link to reset your password
                    </p>
                </CardHeader>

                <CardContent className="pb-12 px-10">
                    {!isSent ? (
                        <form onSubmit={handleResetRequest} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 ml-1">
                                    Email
                                </label>
                                <div className="relative">
                                    <Input 
                                        type="email" 
                                        placeholder="you@example.com" 
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="h-13 border-slate-200 focus:ring-blue-500 rounded-lg pl-4"
                                        required
                                    />
                                </div>
                            </div>
                            
                            <Button 
                                type="submit"
                                className="w-full h-13 bg-[#1a2333] hover:bg-[#253041] text-white font-bold text-base rounded-lg transition-all shadow-md" 
                                disabled={isLoading}
                            >
                                {isLoading ? <Loader2 className="animate-spin" /> : 'Send reset link'}
                            </Button>
                        </form>
                    ) : (
                        <div className="text-center py-4 animate-in fade-in zoom-in duration-300">
                            <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Mail className="text-green-600 w-8 h-8" />
                            </div>
                            <h3 className="font-bold text-[#1a2333] text-lg">Check your inbox</h3>
                            <p className="text-sm text-slate-500 mt-2">
                                We&apos;ve sent a password reset link to <br/>
                                <span className="font-semibold text-slate-700">{email}</span>
                            </p>
                            <Button 
                                variant="outline" 
                                className="mt-8 border-slate-200 text-slate-600 font-bold"
                                onClick={() => setIsSent(false)}
                            >
                                Try another email
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}