'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Stethoscope, LogOut, Loader2 } from "lucide-react";
import { useRouter } from 'next/navigation';
import { account } from "@/lib/appwrite";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
    const { user, loading, refreshUser } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await account.deleteSession('current');
            await refreshUser(); // Update the global state immediately
            router.push('/login');
        } catch (error: unknown) {
            console.error("Logout failed", error);
        }
    };

    return (
        <nav className="border-b bg-white sticky top-0 z-50">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 font-bold text-xl">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Stethoscope className="w-6 h-6 text-white" />
                    </div>
                    <span>MediMatch AI</span>
                </Link>

                <div className="flex items-center gap-4">
                    {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    ) : user ? (
                        <>
                            <span className="text-sm text-gray-600 hidden md:inline">
                                {user.email}
                            </span>
                            <Button onClick={handleLogout} variant="outline" size="sm">
                                <LogOut className="w-4 h-4 mr-2" /> Logout
                            </Button>
                        </>
                    ) : (
                        <div className="flex gap-2">
                            <Link href="/login">
                                <Button variant="ghost" size="sm">Sign In</Button>
                            </Link>
                            <Link href="/signup">
                                <Button size="sm">Get Started</Button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}