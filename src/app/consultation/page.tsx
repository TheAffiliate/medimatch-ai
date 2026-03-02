"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle, Calendar, MapPin, ClipboardList } from "lucide-react";
import { databases } from "@/lib/appwrite";
import { Query, ID, Models, AppwriteException } from "appwrite";
import ConsultationForm from "@/components/consultation/ConsultationForm";

// --- Type Definitions ---
interface HouseCallRequest extends Models.Document {
    patient_email: string;
    doctor_id: string;
    appointment_date: string;
    visit_address: string;
    visit_city: string;
    status: string;
    reason?: string;
}

interface Patient extends Models.Document {
    fullName: string; 
    bloodType?: string;
    dateOfBirth?: string;
    allergies?: string[];
    email: string;
}

interface Doctor extends Models.Document {
    fullName: string;
}

interface Medication {
    medication_name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
}

interface ConsultationData {
    chiefComplaint: string;
    history: string;
    physicalExam: string;
    vitals: {
        bp: string;
        hr: string;
        temp: string;
        rr: string;
        o2: string;
    };
    diagnosis: string;
    treatmentPlan: string;
    additionalNotes: string; 
}

function ConsultationContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const requestId = searchParams.get('request_id');

    const [request, setRequest] = useState<HouseCallRequest | null>(null);
    const [patient, setPatient] = useState<Patient | null>(null);
    const [doctor, setDoctor] = useState<Doctor | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
    
    const [consultationData, setConsultationData] = useState<ConsultationData>({
        chiefComplaint: '',
        history: '',
        physicalExam: '',
        vitals: { bp: '120/80', hr: '72', temp: '37.0', rr: '16', o2: '98' },
        diagnosis: '',
        treatmentPlan: '',
        additionalNotes: ''
    });

    const [prescriptionData, setPrescriptionData] = useState({
        medications: [{ medication_name: '', dosage: '', frequency: '', duration: '', instructions: '' }] as Medication[]
    });

    useEffect(() => {
        const loadData = async () => {
            if (!requestId) {
                setError("Missing request ID in URL.");
                setLoading(false);
                return;
            }

            try {
                const requestDoc = await databases.getDocument(
                    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                    process.env.NEXT_PUBLIC_APPWRITE_HOUSE_CALL_COLLECTION_ID!,
                    requestId
                ) as HouseCallRequest;
                setRequest(requestDoc);

                const searchEmail = requestDoc.patient_email.toLowerCase();
                const patientDocs = await databases.listDocuments(
                    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                    process.env.NEXT_PUBLIC_APPWRITE_PATIENTS_COLLECTION_ID || 'patients', 
                    [Query.equal('email', searchEmail)]
                );
                
                if (patientDocs.documents.length > 0) {
                    setPatient(patientDocs.documents[0] as unknown as Patient);
                }

                const doctorDoc = await databases.getDocument(
                    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                    process.env.NEXT_PUBLIC_APPWRITE_DOCTORS_COLLECTION_ID!,
                    requestDoc.doctor_id
                ) as Doctor;
                setDoctor(doctorDoc);

                if (requestDoc.status === 'pending') {
                    await databases.updateDocument(
                        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                        process.env.NEXT_PUBLIC_APPWRITE_HOUSE_CALL_COLLECTION_ID!,
                        requestId,
                        { status: 'accepted' }
                    );
                }

            } catch (err) {
                console.error("Error loading consultation data:", err);
                setError(err instanceof AppwriteException ? err.message : "An unexpected error occurred.");
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [requestId]);

    const handleConsultationComplete = () => {
        setShowPrescriptionForm(true);
    };

    const addMedication = () => {
        setPrescriptionData({
            ...prescriptionData,
            medications: [...prescriptionData.medications, { medication_name: '', dosage: '', frequency: '', duration: '', instructions: '' }]
        });
    };

    const updateMedication = (index: number, field: keyof Medication, value: string) => {
        const newMedications = [...prescriptionData.medications];
        newMedications[index][field] = value;
        setPrescriptionData({ ...prescriptionData, medications: newMedications });
    };

    const handlePrescriptionSubmit = async () => {
        if (!request || !doctor) return;
        
        try {
            // Fix: Use env variables with explicit string fallbacks to prevent "Missing collectionId" errors
            const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
            const consultationColId = process.env.NEXT_PUBLIC_APPWRITE_CONSULTATIONS_ID || 'consultations';
            const prescriptionColId = process.env.NEXT_PUBLIC_APPWRITE_PRESCRIPTIONS_ID || 'prescriptions';

            // 1. Save Clinical Consultation Record
            await databases.createDocument(
                databaseId,
                consultationColId,
                ID.unique(),
                {
                    requestId: request.$id,
                    patientEmail: request.patient_email,
                    doctorId: doctor.$id,
                    diagnosis: consultationData.diagnosis,
                    treatmentPlan: consultationData.treatmentPlan,
                    additionalNotes: consultationData.additionalNotes, 
                    vitals: JSON.stringify(consultationData.vitals),
                    chiefComplaint: consultationData.chiefComplaint,
                    clinicalHistory: consultationData.history,
                    date: new Date().toISOString()
                }
            );

            // 2. Save prescription
            await databases.createDocument(
                databaseId,
                prescriptionColId,
                ID.unique(),
                {
                    house_call_request_id: request.$id,
                    patient_email: request.patient_email,
                    doctor_id: doctor.$id,
                    medications: JSON.stringify(prescriptionData.medications.filter(m => m.medication_name)),
                    date: new Date().toISOString()
                }
            );

            // 3. Mark request as completed
            await databases.updateDocument(
                databaseId,
                process.env.NEXT_PUBLIC_APPWRITE_HOUSE_CALL_COLLECTION_ID!,
                request.$id,
                { status: 'completed' }
            );

            alert('Consultation and Prescription finalized successfully!');
            router.push('/doctor-dashboard');
        } catch (err) {
            console.error(err);
            alert('Failed to finalize session. Check console for details.');
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
                <p className="text-gray-500 font-medium">Initializing Consultation...</p>
            </div>
        );
    }

    if (error || !request || !doctor) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900">Unable to load session</h2>
                <p className="text-gray-600 mt-2 mb-6 max-w-md">{error || "Critical data missing."}</p>
                <Button onClick={() => router.push('/doctor-dashboard')}>Return to Dashboard</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Active Consultation</h1>
                    <div className="px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-semibold flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        In-Session
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        {!showPrescriptionForm ? (
                            <ConsultationForm
                                houseCallRequestId={request.$id}
                                patientEmail={request.patient_email}
                                doctorId={doctor.$id}
                                data={consultationData} 
                                setData={setConsultationData} 
                                onComplete={handleConsultationComplete}
                            />
                        ) : (
                            <Card className="p-6 border-none shadow-md bg-white">
                                <h3 className="text-xl font-bold mb-6 text-blue-900 border-b pb-4">Issue Prescription</h3>
                                <div className="space-y-4">
                                    {prescriptionData.medications.map((med, index) => (
                                        <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-100 grid md:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <Label>Medication Name</Label>
                                                <Input 
                                                    value={med.medication_name} 
                                                    onChange={(e) => updateMedication(index, 'medication_name', e.target.value)} 
                                                    placeholder="Amoxicillin" 
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label>Dosage</Label>
                                                <Input 
                                                    value={med.dosage} 
                                                    onChange={(e) => updateMedication(index, 'dosage', e.target.value)} 
                                                    placeholder="500mg" 
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    <Button variant="outline" onClick={addMedication} className="w-full">+ Add Medication</Button>
                                    <Button onClick={handlePrescriptionSubmit} className="w-full bg-blue-600 hover:bg-blue-700 mt-4">
                                        Finalize Session
                                    </Button>
                                </div>
                            </Card>
                        )}
                    </div>

                    <div className="space-y-6">
                        <Card className="p-6 border-none shadow-md bg-white">
                            <h3 className="font-bold text-gray-900 mb-4 border-b pb-2">Patient File</h3>
                            <div className="space-y-4 text-sm">
                                <div>
                                    <p className="text-gray-500">Full Name</p>
                                    <p className="font-semibold text-gray-900">{patient?.fullName || "Not Specified"}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Date of Birth</p>
                                    <p className="font-semibold text-gray-900">{patient?.dateOfBirth || "N/A"}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Blood Group</p>
                                    <p className="font-semibold text-blue-600">{patient?.bloodType || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Allergies</p>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {patient?.allergies && patient.allergies.length > 0 ? (
                                            patient.allergies.map((allergy, i) => (
                                                <span key={i} className="px-2 py-1 bg-red-100 text-red-700 rounded-md text-xs font-medium">{allergy}</span>
                                            ))
                                        ) : <span className="text-gray-400">None reported</span>}
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6 border-none shadow-md bg-white">
                            <h3 className="font-bold text-gray-900 mb-4 border-b pb-2">Appointment Details</h3>
                            <div className="space-y-4 text-sm">
                                <div className="flex items-start gap-3">
                                    <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-gray-500">Date</p>
                                        <p className="font-semibold text-gray-900">{request.appointment_date}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-gray-500">Location</p>
                                        <p className="font-semibold text-gray-900">{request.visit_address}, {request.visit_city}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <ClipboardList className="w-4 h-4 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-gray-500">Chief Complaint</p>
                                        <p className="font-semibold text-gray-900">{request.reason || "Not specified"}</p>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ConsultationPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>}>
            <ConsultationContent />
        </Suspense>
    );
}