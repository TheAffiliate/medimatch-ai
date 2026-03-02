'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { type Models, AppwriteException } from "appwrite"; // Added AppwriteException
import { databases, account, ID } from "@/lib/appwrite";
import MedicalAidCardUpload from "@/components/patient/MedicalAidCardUpload";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!; 
const PATIENTS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_PATIENTS_COLLECTION_ID!;

const PROVINCES = [
    "Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal", 
    "Limpopo", "Mpumalanga", "Northern Cape", "North West", "Western Cape"
];

export default function PatientRegistration() {
    const { user, loading: authLoading, refreshUser } = useAuth();
    const router = useRouter();
    
    const [profileData, setProfileData] = useState({
        phone: '',
        date_of_birth: '',
        gender: '',
        address: '',
        city: '',
        province: '',
        postal_code: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        blood_type: 'Unknown',
        allergies: [] as string[],
        chronic_conditions: [] as string[],
        current_medications: [] as string[],
        has_medical_aid: false,
        medical_aid_card_id: '' 
    });

    const [newAllergy, setNewAllergy] = useState('');
    const [newCondition, setNewCondition] = useState('');
    const [newMedication, setNewMedication] = useState('');
    const [showMedicalAidUpload, setShowMedicalAidUpload] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    const addItem = (field: 'allergies' | 'chronic_conditions' | 'current_medications', value: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
        if (value.trim()) {
            setProfileData(prev => ({
                ...prev,
                [field]: [...prev[field], value.trim()]
            }));
            setter('');
        }
    };

    const removeItem = (field: 'allergies' | 'chronic_conditions' | 'current_medications', index: number) => {
        setProfileData(prev => ({
            ...prev,
            [field]: prev[field].filter((_, i) => i !== index)
        }));
    };

    const handleMedicalAidUpload = (data: Models.Document) => {
        setProfileData(prev => ({ 
            ...prev, 
            has_medical_aid: true,
            medical_aid_card_id: data.$id 
        }));
        setShowMedicalAidUpload(false);
    };

    const handleSubmit = async () => {
        if (!user) return;

        const requiredFields = ['phone', 'date_of_birth', 'gender', 'address', 'emergency_contact_name', 'emergency_contact_phone'];
        const missing = requiredFields.filter(f => !profileData[f as keyof typeof profileData]);
        
        if (missing.length > 0) {
            alert("Please fill in all required fields marked with *");
            return;
        }

        setIsSubmitting(true);
        
        try {
            await databases.createDocument(
                DATABASE_ID,
                PATIENTS_COLLECTION_ID,
                ID.unique(),
                {
                    userId: user.$id,
                    fullName: user.name,
                    phone: profileData.phone,
                    dateOfBirth: profileData.date_of_birth,
                    gender: profileData.gender,
                    address: `${profileData.address}, ${profileData.city}, ${profileData.province} ${profileData.postal_code}`,
                    emergencyName: profileData.emergency_contact_name,
                    emergencyPhone: profileData.emergency_contact_phone,
                    bloodType: profileData.blood_type,
                    allergies: profileData.allergies,
                    conditions: profileData.chronic_conditions,
                    medications: profileData.current_medications,
                    medicalAidCardId: profileData.medical_aid_card_id
                }
            );

            await account.updatePrefs({
                role: 'patient',
                onboarding_completed: true
            });

            await refreshUser();

            alert('Registration successful!');
            router.push('/patient-dashboard');
            
        } catch (error: unknown) { // Use 'unknown' instead of 'any'
            console.error('Registration error:', error);
            
            // Type-safe error message extraction
            let message = 'Registration failed. Please check your connection.';
            if (error instanceof AppwriteException) {
                message = error.message;
            } else if (error instanceof Error) {
                message = error.message;
            }
            
            alert(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (authLoading || !user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-4 max-w-3xl">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold mb-2 text-gray-900">Patient Registration</h1>
                    <p className="text-gray-600">
                        Complete your medical profile to start booking verified doctors.
                    </p>
                </header>

                <div className="space-y-6">
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4 border-b pb-2">Personal Information</h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="phone">Phone Number *</Label>
                                <Input
                                    id="phone"
                                    value={profileData.phone}
                                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                    placeholder="+27 82 123 4567"
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label htmlFor="dob">Date of Birth *</Label>
                                <Input
                                    id="dob"
                                    type="date"
                                    value={profileData.date_of_birth}
                                    onChange={(e) => setProfileData({ ...profileData, date_of_birth: e.target.value })}
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label htmlFor="gender">Gender *</Label>
                                <Select 
                                    value={profileData.gender}
                                    onValueChange={(value) => setProfileData({ ...profileData, gender: value })}
                                >
                                    <SelectTrigger id="gender" className="mt-1">
                                        <SelectValue placeholder="Select gender" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="male">Male</SelectItem>
                                        <SelectItem value="female">Female</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="blood-type">Blood Type</Label>
                                <Select 
                                    value={profileData.blood_type}
                                    onValueChange={(value) => setProfileData({ ...profileData, blood_type: value })}
                                >
                                    <SelectTrigger id="blood-type" className="mt-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {['Unknown', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => (
                                            <SelectItem key={type} value={type}>{type}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="mt-6 space-y-4">
                            <div>
                                <Label htmlFor="address">Street Address *</Label>
                                <Input
                                    id="address"
                                    value={profileData.address}
                                    onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                                    placeholder="123 Medical Lane"
                                    className="mt-1"
                                />
                            </div>
                            <div className="grid md:grid-cols-3 gap-4">
                                <div>
                                    <Label htmlFor="city">City</Label>
                                    <Input
                                        id="city"
                                        value={profileData.city}
                                        onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                                        placeholder="Johannesburg"
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="province">Province</Label>
                                    <Select 
                                        value={profileData.province}
                                        onValueChange={(value) => setProfileData({ ...profileData, province: value })}
                                    >
                                        <SelectTrigger id="province" className="mt-1">
                                            <SelectValue placeholder="Select" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PROVINCES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="postal">Postal Code</Label>
                                    <Input
                                        id="postal"
                                        value={profileData.postal_code}
                                        onChange={(e) => setProfileData({ ...profileData, postal_code: e.target.value })}
                                        placeholder="2000"
                                        className="mt-1"
                                    />
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4 border-b pb-2">Emergency Contact</h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="emergency-name">Contact Name *</Label>
                                <Input
                                    id="emergency-name"
                                    value={profileData.emergency_contact_name}
                                    onChange={(e) => setProfileData({ ...profileData, emergency_contact_name: e.target.value })}
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label htmlFor="emergency-phone">Contact Phone *</Label>
                                <Input
                                    id="emergency-phone"
                                    value={profileData.emergency_contact_phone}
                                    onChange={(e) => setProfileData({ ...profileData, emergency_contact_phone: e.target.value })}
                                    className="mt-1"
                                />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4 border-b pb-2">Medical History</h3>
                        <div className="space-y-6">
                            <div>
                                <Label>Allergies</Label>
                                <div className="flex gap-2 mt-1">
                                    <Input
                                        value={newAllergy}
                                        onChange={(e) => setNewAllergy(e.target.value)}
                                        placeholder="e.g. Penicillin"
                                        onKeyDown={(e) => e.key === 'Enter' && addItem('allergies', newAllergy, setNewAllergy)}
                                    />
                                    <Button type="button" onClick={() => addItem('allergies', newAllergy, setNewAllergy)} size="icon">
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {profileData.allergies.map((item, i) => (
                                        <span key={i} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm flex items-center gap-2">
                                            {item} <X className="w-3 h-3 cursor-pointer" onClick={() => removeItem('allergies', i)} />
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <Label>Chronic Conditions</Label>
                                <div className="flex gap-2 mt-1">
                                    <Input
                                        value={newCondition}
                                        onChange={(e) => setNewCondition(e.target.value)}
                                        placeholder="e.g. Diabetes"
                                        onKeyDown={(e) => e.key === 'Enter' && addItem('chronic_conditions', newCondition, setNewCondition)}
                                    />
                                    <Button type="button" onClick={() => addItem('chronic_conditions', newCondition, setNewCondition)} size="icon">
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {profileData.chronic_conditions.map((item, i) => (
                                        <span key={i} className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm flex items-center gap-2">
                                            {item} <X className="w-3 h-3 cursor-pointer" onClick={() => removeItem('chronic_conditions', i)} />
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <Label>Current Medications</Label>
                                <div className="flex gap-2 mt-1">
                                    <Input
                                        value={newMedication}
                                        onChange={(e) => setNewMedication(e.target.value)}
                                        placeholder="e.g. Metformin 500mg"
                                        onKeyDown={(e) => e.key === 'Enter' && addItem('current_medications', newMedication, setNewMedication)}
                                    />
                                    <Button type="button" onClick={() => addItem('current_medications', newMedication, setNewMedication)} size="icon">
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {profileData.current_medications.map((item, i) => (
                                        <span key={i} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-2">
                                            {item} <X className="w-3 h-3 cursor-pointer" onClick={() => removeItem('current_medications', i)} />
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Card>

                    {showMedicalAidUpload ? (
                        <div className="border-2 border-dashed border-blue-200 rounded-lg p-4">
                             <MedicalAidCardUpload 
                                patientEmail={user.email}
                                onUploadComplete={handleMedicalAidUpload}
                            />
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setShowMedicalAidUpload(false)}
                                className="mt-2 text-gray-500"
                            >
                                Cancel Upload
                            </Button>
                        </div>
                    ) : (
                        !profileData.has_medical_aid && (
                            <Button onClick={() => setShowMedicalAidUpload(true)} variant="outline" className="w-full py-6 border-blue-200 text-blue-700 hover:bg-blue-50">
                                <Plus className="mr-2 h-4 w-4" /> Add Medical Aid Card (Optional)
                            </Button>
                        )
                    )}

                    {profileData.has_medical_aid && (
                        <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm font-medium">
                            ✓ Medical Aid Card Linked Successfully
                        </div>
                    )}

                    <Button 
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="w-full bg-blue-600 hover:bg-blue-700 h-14 text-lg font-bold shadow-lg"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="animate-spin mr-2" />
                                Creating Profile...
                            </>
                        ) : 'Complete Registration'}
                    </Button>
                </div>
            </div>
        </div>
    );
}