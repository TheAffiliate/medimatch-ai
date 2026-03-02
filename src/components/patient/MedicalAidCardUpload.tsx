'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { CheckCircle, Loader2, CreditCard } from "lucide-react";
import { type Models } from "appwrite"; 
import { databases, storage, ID } from "@/lib/appwrite"; 

// Updated to match your Appwrite Collection Columns
export interface MedicalAidData {
    scheme_name: string;
    scheme_number: string;
    plan_name: string;
    main_member_name: string;
    available_funds?: string; 
    verification_status?: string;
}

interface Props {
    patientEmail: string;
    onUploadComplete: (data: Models.Document) => void;
}

export default function MedicalAidCardUpload({ patientEmail, onUploadComplete }: Props) {
    const [cardFile, setCardFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [extractedData, setExtractedData] = useState<MedicalAidData | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setCardFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!cardFile) {
            alert('Please select a medical aid card image');
            return;
        }

        setIsProcessing(true);
        try {
            const BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID!; 
            const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
            const MEDICAL_AID_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_MEDICAL_AID_COLLECTION_ID!;

            // 1. Upload the image to Storage
            const uploadedFile = await storage.createFile(
                BUCKET_ID,
                ID.unique(),
                cardFile
            );

            // 2. Simulated OCR extraction 
            // Removed 'main_member_id' and 'dependent_code' as they aren't in the DB schema
            const simulatedExtractedData: MedicalAidData = {
                scheme_name: "Discovery Health",
                scheme_number: "123456789",
                plan_name: "Classic Priority",
                main_member_name: "User Name",
                available_funds: "5000",
                verification_status: 'verified'
            };

            setExtractedData(simulatedExtractedData);

            // 3. Create Record
            // Ensure all keys match your Appwrite "Column name" exactly
            const medicalAidCard = await databases.createDocument(
                DATABASE_ID,
                MEDICAL_AID_COLLECTION_ID,
                ID.unique(),
                {
                    patient_email: patientEmail,
                    card_image_id: uploadedFile.$id,
                    scheme_name: simulatedExtractedData.scheme_name,
                    scheme_number: simulatedExtractedData.scheme_number,
                    plan_name: simulatedExtractedData.plan_name,
                    main_member_name: simulatedExtractedData.main_member_name,
                    verification_status: simulatedExtractedData.verification_status,
                    available_funds: simulatedExtractedData.available_funds
                }
            );

            onUploadComplete(medicalAidCard);
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to process medical aid card. Please ensure all database columns match the code.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Card className="p-6 border-dashed border-2">
            <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Medical Aid Card</h3>
            </div>
            
            <div className="space-y-4">
                <div>
                    <Label htmlFor="card-image">Upload Card Photo (Front)</Label>
                    <div className="mt-1 flex items-center gap-3">
                        <Input
                            id="card-image"
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="cursor-pointer"
                        />
                        {cardFile && <CheckCircle className="w-5 h-5 text-green-600" />}
                    </div>
                </div>

                {extractedData && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg animate-in fade-in">
                        <p className="font-semibold text-green-800 mb-2">Extraction Successful</p>
                        <div className="text-sm text-gray-700 space-y-1">
                            <p><strong>Scheme:</strong> {extractedData.scheme_name}</p>
                            <p><strong>Member #:</strong> {extractedData.scheme_number}</p>
                            <p><strong>Plan:</strong> {extractedData.plan_name}</p>
                        </div>
                    </div>
                )}

                <Button 
                    onClick={handleUpload} 
                    disabled={isProcessing || !cardFile}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                >
                    {isProcessing ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            AI Processing & Verifying...
                        </>
                    ) : 'Upload & Verify Card'}
                </Button>
            </div>
        </Card>
    );
}