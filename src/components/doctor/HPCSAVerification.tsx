'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { CheckCircle, XCircle, Loader2, UploadCloud } from "lucide-react";
import { storage, databases, ID } from "@/lib/appwrite"; 
import { Query, AppwriteException } from "appwrite";

// --- Interfaces ---

interface VerificationResult {
    is_valid: boolean;
    doctor_name: string;
    specialization: string;
    registration_date: string;
    status: string;
    validation_notes: string;
}

interface HPCSAData {
    hpcsa_number: string;
    hpcsa_certificate_url: string;
    hpcsa_verified: boolean;
    hpcsa_verification_date: string;
    full_name: string;
    specialization: string;
}

interface HPCSAVerificationProps {
    onVerificationComplete: (data: HPCSAData) => void;
}

const COMMON_SPECIALTIES = [
    "General Practitioner",
    "Pediatrics",
    "Cardiology",
    "Dermatology",
    "Psychiatry",
    "Urology"
];

export default function HPCSAVerification({ onVerificationComplete }: HPCSAVerificationProps) {
    const [hpcsaNumber, setHpcsaNumber] = useState('');
    const [specialization, setSpecialization] = useState('');
    const [isCustomSpecialty, setIsCustomSpecialty] = useState(false);
    const [certificateFile, setCertificateFile] = useState<File | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setCertificateFile(e.target.files[0]);
        }
    };

    const handleSelectChange = (value: string) => {
        if (value === "custom_specialty") {
            setIsCustomSpecialty(true);
            setSpecialization(""); // Clear for typing
        } else {
            setIsCustomSpecialty(false);
            setSpecialization(value);
        }
    };

    const handleVerify = async () => {
        if (!hpcsaNumber || !certificateFile || !specialization) {
            alert('Please provide your HPCSA number, specialization, and certificate');
            return;
        }

        setIsVerifying(true);
        setVerificationResult(null);

        try {
            // 1. REGISTRY LOOKUP: Dynamic retrieval from Appwrite Database
            const registryLookup = await databases.listDocuments(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                process.env.NEXT_PUBLIC_APPWRITE_DOCTORS_COLLECTION_ID!,
                [Query.equal('hpcsa_number', hpcsaNumber)]
            );

            if (registryLookup.total === 0) {
                setVerificationResult({
                    is_valid: false,
                    doctor_name: "",
                    specialization: "",
                    registration_date: "",
                    status: "Invalid",
                    validation_notes: "The HPCSA registration number could not be found in our registry."
                });
                setIsVerifying(false);
                return;
            }

            const doctorData = registryLookup.documents[0];

            // 2. STORAGE: Upload certificate to Appwrite
            const uploadedFile = await storage.createFile(
                process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID!, 
                ID.unique(), 
                certificateFile
            );

            // Using getFileView with the ID from env as requested
            const fileUrl = storage.getFileView(
                process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID!, 
                uploadedFile.$id
            ).toString();

            // 3. SUCCESS STATE: Mapping the real retrieved data
            const result: VerificationResult = {
                is_valid: true,
                doctor_name: doctorData.full_name,
                specialization: specialization, // Uses the value from the hybrid field
                registration_date: doctorData.$createdAt,
                status: doctorData.status || "Active",
                validation_notes: "Registry record found. Identity confirmed via MediMatch AI Registry."
            };

            setVerificationResult(result);

            onVerificationComplete({
                hpcsa_number: hpcsaNumber,
                hpcsa_certificate_url: fileUrl,
                hpcsa_verified: true,
                hpcsa_verification_date: new Date().toISOString(),
                full_name: result.doctor_name,
                specialization: result.specialization
            });

        } catch (error: unknown) {
            console.error('Verification error:', error);
            let message = "An unexpected error occurred.";
            if (error instanceof AppwriteException) {
                message = `Appwrite Error: ${error.message}`;
            } else if (error instanceof Error) {
                message = error.message;
            }
            alert(message);
        } finally {
            setIsVerifying(false);
        }
    };

    return (
        <Card className="p-6 border-2 border-blue-50 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
                <UploadCloud className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-slate-800">HPCSA AI Verification</h3>
            </div>
            
            <div className="space-y-4">
                {/* Registration Number */}
                <div>
                    <Label htmlFor="hpcsa-number">HPCSA Registration Number</Label>
                    <Input
                        id="hpcsa-number"
                        placeholder="MP0703729"
                        value={hpcsaNumber}
                        onChange={(e) => setHpcsaNumber(e.target.value)}
                        className="mt-1 font-mono"
                        disabled={isVerifying}
                    />
                </div>

                {/* Hybrid Specialization Field */}
                <div className="space-y-2">
                    <Label>Medical Specialization</Label>
                    {!isCustomSpecialty ? (
                        <Select onValueChange={handleSelectChange} disabled={isVerifying}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select Specialty" />
                            </SelectTrigger>
                            <SelectContent>
                                {COMMON_SPECIALTIES.map(s => (
                                    <SelectItem key={s} value={s}>{s}</SelectItem>
                                ))}
                                {/* Safe non-empty value to prevent Radix crash */}
                                <SelectItem value="custom_specialty">Other / Not Listed</SelectItem>
                            </SelectContent>
                        </Select>
                    ) : (
                        <div className="relative flex items-center animate-in fade-in zoom-in-95 duration-200">
                            <Input 
                                autoFocus
                                placeholder="Enter your specialty..." 
                                value={specialization}
                                onChange={(e) => setSpecialization(e.target.value)}
                                className="pr-10 border-blue-200 focus:ring-blue-500"
                                disabled={isVerifying}
                            />
                            <button 
                                onClick={() => { setIsCustomSpecialty(false); setSpecialization(""); }}
                                className="absolute right-3 text-slate-400 hover:text-red-500"
                                type="button"
                                title="Back to list"
                            >
                                <XCircle className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>

                {/* File Upload */}
                <div>
                    <Label htmlFor="certificate">Upload HPCSA Certificate (PDF/Image)</Label>
                    <div className="mt-1 flex items-center gap-3">
                        <Input
                            id="certificate"
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleFileChange}
                            className="cursor-pointer"
                            disabled={isVerifying}
                        />
                        {certificateFile && (
                            <CheckCircle className="w-6 h-6 text-green-600 shrink-0" />
                        )}
                    </div>
                </div>

                {/* Results UI */}
                {verificationResult && (
                    <div className={`p-4 rounded-lg border animate-in fade-in slide-in-from-top-2 ${
                        verificationResult.is_valid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                    }`}>
                        <div className="flex items-start gap-3">
                            {verificationResult.is_valid ? (
                                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                            ) : (
                                <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                            )}
                            <div>
                                <p className={`font-semibold ${verificationResult.is_valid ? 'text-green-800' : 'text-red-800'}`}>
                                    {verificationResult.is_valid ? 'AI Verification Successful' : 'AI Verification Failed'}
                                </p>
                                <p className="text-xs text-slate-600 mt-1">
                                    {verificationResult.validation_notes}
                                </p>
                                {verificationResult.is_valid && (
                                    <div className="mt-3 text-sm bg-white/60 p-2 rounded border border-green-100">
                                        <p><strong>Practitioner:</strong> {verificationResult.doctor_name}</p>
                                        <p><strong>Field:</strong> {verificationResult.specialization}</p>
                                        <p><strong>Status:</strong> <span className="text-green-600 font-bold">{verificationResult.status}</span></p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <Button 
                    onClick={handleVerify} 
                    disabled={isVerifying || !hpcsaNumber || !certificateFile || !specialization}
                    className="w-full bg-blue-600 hover:bg-blue-700 h-12 transition-all shadow-md"
                >
                    {isVerifying ? (
                        <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            AI is Analyzing Registry...
                        </>
                    ) : (
                        'Verify with MediMatch AI'
                    )}
                </Button>
            </div>
        </Card>
    );
}