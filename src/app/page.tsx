'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  ShieldCheck, 
  Sparkles, 
  Heart, 
  ArrowRight,
  Loader2,
  Stethoscope,
  User as UserIcon
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

// Define the custom preferences structure
interface UserPrefs {
    role?: 'doctor' | 'patient';
    onboarding_completed?: boolean;
}

export default function Home() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user) {
            // Cast preferences to our custom interface to satisfy TypeScript
            const prefs = user.prefs as UserPrefs;
            const role = prefs?.role;
            const onboardingComplete = prefs?.onboarding_completed;

            if (role && onboardingComplete) {
                router.push(role === 'doctor' ? '/doctor-dashboard' : '/patient-dashboard');
            }
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
                <p className="text-slate-500 font-medium animate-pulse">Establishing secure connection...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="container mx-auto px-4 py-16">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6">
                        <Sparkles className="w-4 h-4" />
                        AI-Powered Healthcare Platform
                    </div>
                    
                    <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
                        {user ? `Welcome, ${user.name.split(' ')[0]}` : 'Trusted Doctors,'}
                        <br />
                        <span className="text-blue-600">
                            {user ? 'How can we help today?' : 'At Your Doorstep'}
                        </span>
                    </h1>
                    
                    <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
                        Connect with HPCSA-verified doctors for on-demand house calls. 
                        Smart matching, flexible payments, and AI-assisted care.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-6 justify-center mt-10">
                        {!user ? (
                            <>
                                <Link href="/login" className="w-full sm:w-auto">
                                    <Button size="lg" className="bg-blue-600 hover:bg-blue-700 w-full px-8 py-7 text-lg shadow-lg shadow-blue-200">
                                        Get Started
                                        <ArrowRight className="w-5 h-5 ml-2" />
                                    </Button>
                                </Link>
                                <Link href="/register-doctor" className="w-full sm:w-auto">
                                    <Button size="lg" variant="outline" className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 w-full px-8 py-7 text-lg">
                                        Join as a Doctor
                                    </Button>
                                </Link>
                            </>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
                                <Card 
                                    className="p-8 cursor-pointer border-2 border-transparent hover:border-blue-500 transition-all group hover:shadow-xl bg-white"
                                    onClick={() => router.push('/register-patient')}
                                >
                                    <UserIcon className="w-12 h-12 text-blue-600 mb-4 group-hover:scale-110 transition-transform" />
                                    <h3 className="text-xl font-bold mb-2">I am a Patient</h3>
                                    <p className="text-sm text-gray-500">I want to find a doctor and book a house call.</p>
                                </Card>

                                <Card 
                                    className="p-8 cursor-pointer border-2 border-transparent hover:border-blue-500 transition-all group hover:shadow-xl bg-white"
                                    onClick={() => router.push('/register-doctor')}
                                >
                                    <Stethoscope className="w-12 h-12 text-blue-600 mb-4 group-hover:scale-110 transition-transform" />
                                    <h3 className="text-xl font-bold mb-2">I am a Doctor</h3>
                                    <p className="text-sm text-gray-500">I want to verify my HPCSA and see patients.</p>
                                </Card>
                            </div>
                        )}
                    </div>
                </div>

                {!user && (
                    <div className="grid md:grid-cols-3 gap-8 mt-24 max-w-5xl mx-auto">
                        <Card className="p-8 border-none shadow-sm bg-white/80 backdrop-blur-sm">
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                                <ShieldCheck className="w-6 h-6 text-green-600" />
                            </div>
                            <h3 className="text-lg font-bold mb-3">HPCSA Verified</h3>
                            <p className="text-gray-600 text-sm leading-relaxed">Automated credential checks against the South African national registry.</p>
                        </Card>

                        <Card className="p-8 border-none shadow-sm bg-white/80 backdrop-blur-sm">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                                <Sparkles className="w-6 h-6 text-blue-600" />
                            </div>
                            <h3 className="text-lg font-bold mb-3">Smart Matching</h3>
                            <p className="text-gray-600 text-sm leading-relaxed">AI algorithms that connect you to the nearest available specialist in seconds.</p>
                        </Card>

                        <Card className="p-8 border-none shadow-sm bg-white/80 backdrop-blur-sm">
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                                <Heart className="w-6 h-6 text-purple-600" />
                            </div>
                            <h3 className="text-lg font-bold mb-3">In-Home Care</h3>
                            <p className="text-gray-600 text-sm leading-relaxed">Quality medical attention in the safety and comfort of your own space.</p>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}