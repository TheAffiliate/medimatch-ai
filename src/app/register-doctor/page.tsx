'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { account, databases, storage, ID } from "@/lib/appwrite";
import HPCSAVerification from "@/components/doctor/HPCSAVerification";
import { useAuth } from "@/context/AuthContext"; // Use the new context

// --- Types ---
interface HPCSAData {
    full_name: string;
    hpcsa_number: string;
    specialization: string;
    hpcsa_verified: boolean;
    hpcsa_certificate_url?: string;
}

export default function DoctorRegistration() {
    const router = useRouter();
    const { user, loading, refreshUser } = useAuth(); // Hook into global auth
    const [currentStep, setCurrentStep] = useState(1);
    const [hpcsaData, setHpcsaData] = useState<HPCSAData | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);

    const [profileData, setProfileData] = useState({
        phone: '',
        bio: '',
        years_of_experience: '',
        consultation_fee: '',
        available_areas: '',
        bank_account_name: '',
        bank_account_number: '',
        bank_name: '',
        specialization: ''
    });

    const handleHPCSAVerification = (data: HPCSAData) => {
        setHpcsaData(data);
        setCurrentStep(2);
    };

    const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setProfilePhotoFile(e.target.files[0]);
        }
    };

    const handleSubmit = async () => {
        if (!user || !hpcsaData) return;
        setIsSubmitting(true);
        
        try {
            let photoId = '';
            
            if (profilePhotoFile) {
                const uploadedFile = await storage.createFile(
                    process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID!, 
                    ID.unique(),
                    profilePhotoFile
                );
                photoId = uploadedFile.$id; 
            }

            // Create the Doctor Profile Document
            await databases.createDocument(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                process.env.NEXT_PUBLIC_APPWRITE_DOCTORS_COLLECTION_ID!,
                ID.unique(),
                {
                    user_email: user.email,           // Matches DB column "user_email"
                    full_name: hpcsaData.full_name || user.name, // NEW: Add this to DB
                    phone: profileData.phone,         // Matches DB column "phone"
                    profile_photo_id: photoId,        // Matches DB column "profile_photo_id"
                    hpcsa_number: hpcsaData.hpcsa_number, // Matches DB column "hpcsa_number"
                    hpcsa_verified: true,             // Matches DB column "hpcsa_verified"
                    specialization: profileData.specialization || hpcsaData.specialization, // Matches DB
                    bio: profileData.bio,             // Matches DB column "bio"
                    years_of_experience: parseInt(profileData.years_of_experience) || 0, // Matches DB
                    consultation_fee: parseFloat(profileData.consultation_fee) || 0,     // Matches DB
                    available_areas: profileData.available_areas.split(',').map(a => a.trim()), // Matches DB
                    status: 'active',                 // Matches DB column "status"
                    
                    // Ensure these three are created as columns in Appwrite first!
                    bank_account_name: profileData.bank_account_name,
                    bank_account_number: profileData.bank_account_number,
                    bank_name: profileData.bank_name
                }
            );

            // Update user preferences to lock in the role
            await account.updatePrefs({ 
                role: 'doctor', 
                onboarding_completed: true 
            });

            // IMPORTANT: Refresh the global auth state so the whole app knows we are now a doctor
            await refreshUser();

            router.push('/doctor-dashboard');
        } catch (error) {
            const message = error instanceof Error ? error.message : "Registration failed";
            alert(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // 1. Loading state (Context is checking session)
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
                <p className="text-slate-500 font-medium">Verifying authorization...</p>
            </div>
        );
    }

    // 2. Unauthenticated state (No user found by Context)
    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <h2 className="text-xl font-bold">Authentication Required</h2>
                <p className="text-gray-500 mb-4">Please sign in to access doctor registration.</p>
                <Button onClick={() => router.push('/login')}>Go to Login</Button>
            </div>
        );
    }

    // 3. Main Registration Form
    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-4 max-w-3xl">
                {/* Progress Tracker */}
                <div className="flex items-center justify-center mb-10">
                    <div className="flex items-center gap-4">
                        <div className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep >= 1 ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'}`}>
                                {currentStep > 1 ? <CheckCircle className="w-5 h-5" /> : '1'}
                            </div>
                            <span className="font-semibold text-sm">Verification</span>
                        </div>
                        <div className={`w-16 h-0.5 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
                        <div className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep >= 2 ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'}`}>
                                2
                            </div>
                            <span className="font-semibold text-sm">Profile</span>
                        </div>
                    </div>
                </div>

                {currentStep === 1 ? (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h1 className="text-3xl font-bold text-slate-900">Doctor Registration</h1>
                            <p className="text-gray-500">Securely verify your HPCSA credentials.</p>
                        </div>
                        <HPCSAVerification onVerificationComplete={handleHPCSAVerification} />
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Card className="p-8 space-y-6 shadow-xl border-none ring-1 ring-gray-200">
                            <div>
                                <h1 className="text-2xl font-bold">Professional Details</h1>
                                <p className="text-sm text-slate-500">Logged in as {user.email}</p>
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="photo">Profile Photo</Label>
                                <Input id="photo" type="file" accept="image/*" onChange={handleProfilePhotoChange} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number *</Label>
                                    <Input id="phone" placeholder="+27..." value={profileData.phone} onChange={(e) => setProfileData({...profileData, phone: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="experience">Years of Experience *</Label>
                                    <Input id="experience" type="number" value={profileData.years_of_experience} onChange={(e) => setProfileData({...profileData, years_of_experience: e.target.value})} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="specialization">Specialization *</Label>
                                <Select onValueChange={(v) => setProfileData({...profileData, specialization: v})}>
                                    <SelectTrigger><SelectValue placeholder="Select Specialization" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="GP">General Practitioner</SelectItem>
                                        <SelectItem value="Pediatrics">Pediatrics</SelectItem>
                                        <SelectItem value="Cardiology">Cardiology</SelectItem>
                                        <SelectItem value="Dermatology">Dermatology</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bio">Professional Bio</Label>
                                <Textarea id="bio" placeholder="Tell patients about your medical background..." value={profileData.bio} onChange={(e) => setProfileData({...profileData, bio: e.target.value})} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="fee">Consultation Fee (ZAR) *</Label>
                                    <Input id="fee" type="number" value={profileData.consultation_fee} onChange={(e) => setProfileData({...profileData, consultation_fee: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="areas">Service Areas (Comma separated) *</Label>
                                    <Input id="areas" placeholder="Sandton, Randburg, Soweto" value={profileData.available_areas} onChange={(e) => setProfileData({...profileData, available_areas: e.target.value})} />
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50 rounded-lg space-y-4 border border-slate-200">
                                <h3 className="font-bold text-slate-700">Banking Details (For Payouts)</h3>
                                <Input placeholder="Bank Name" value={profileData.bank_name} onChange={(e) => setProfileData({...profileData, bank_name: e.target.value})} />
                                <Input placeholder="Account Holder Name" value={profileData.bank_account_name} onChange={(e) => setProfileData({...profileData, bank_account_name: e.target.value})} />
                                <Input placeholder="Account Number" value={profileData.bank_account_number} onChange={(e) => setProfileData({...profileData, bank_account_number: e.target.value})} />
                            </div>

                            <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg">
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="animate-spin mr-2 h-5 w-5" />
                                        Finalizing Profile...
                                    </>
                                ) : "Complete Registration"}
                            </Button>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}