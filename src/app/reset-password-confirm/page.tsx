'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { account } from "@/lib/appwrite";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, Eye, EyeOff } from "lucide-react";

export default function ResetPasswordConfirmPage() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    
    const router = useRouter();
    const searchParams = useSearchParams();

    const userId = searchParams.get('userId');
    const secret = searchParams.get('secret');

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            return alert("Passwords do not match");
        }

        if (!userId || !secret) {
            return alert("Invalid reset link. Please request a new one.");
        }

        setIsLoading(true);
        try {
            // FIX: Pass only 3 arguments: userId, secret, and the new password
            await account.updateRecovery(userId, secret, password);
            setIsSuccess(true);
            
            setTimeout(() => {
                router.push('/login');
            }, 2000);
        } catch (error: unknown) {
            const errMsg = error instanceof Error ? error.message : "Reset failed";
            alert(errMsg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
            <Card className="w-full max-w-110 shadow-2xl border-none overflow-hidden rounded-xl bg-white">
                <CardHeader className="pt-10 pb-6 px-10">
                    <CardTitle className="text-[28px] font-bold tracking-tight text-[#1a2333] text-center">
                        {isSuccess ? "Password Updated" : "Set new password"}
                    </CardTitle>
                    {!isSuccess && (
                        <p className="text-sm text-slate-500 mt-3 text-center">
                            Please enter and confirm your new password below.
                        </p>
                    )}
                </CardHeader>

                <CardContent className="pb-12 px-10">
                    {!isSuccess ? (
                        <form onSubmit={handleReset} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">New Password</label>
                                <div className="relative">
                                    <Input 
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Min. 8 characters" 
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="h-13 border-slate-200 focus:ring-blue-500 pr-10"
                                        required
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Confirm Password</label>
                                <Input 
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Repeat password" 
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="h-13 border-slate-200 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            
                            <Button 
                                type="submit"
                                className="w-full h-13 bg-[#1a2333] hover:bg-[#253041] text-white font-bold rounded-lg transition-all" 
                                disabled={isLoading}
                            >
                                {isLoading ? <Loader2 className="animate-spin" /> : 'Update password'}
                            </Button>
                        </form>
                    ) : (
                        <div className="text-center py-4 animate-in fade-in zoom-in duration-300">
                            <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 className="text-green-600 w-8 h-8" />
                            </div>
                            <h3 className="font-bold text-[#1a2333] text-lg">Success!</h3>
                            <p className="text-sm text-slate-500 mt-2">
                                Your password has been changed. Redirecting you to login...
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}