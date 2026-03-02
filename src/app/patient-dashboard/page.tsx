"use client";

import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogTrigger 
} from "@/components/ui/dialog";
import { Calendar, FileText, Pill, Loader2, MapPin, Clock, User } from "lucide-react";
import { account, databases } from "@/lib/appwrite";
import { Query, Models } from "appwrite";
import Link from 'next/link';

// --- Types ---
interface Patient extends Models.Document {
    fullName?: string;
    userId: string;
}

interface HouseCall extends Models.Document {
    status: string;
    appointment_date: string;
    appointment_time: string;
    chief_complaint: string;
    visit_city: string;
    visit_address: string;
    symptoms_description?: string;
    urgency: string;
}

interface Consultation extends Models.Document {
    diagnosis: string;
    treatment_plan: string;
    doctor_notes?: string;
    doctor_name?: string;
    $createdAt: string;
}

interface ParsedMedication {
    medication_name: string;
    dosage: string;
    instructions: string;
}

interface Prescription extends Models.Document {
    patient_email: string;
    doctor_id: string;
    medications: string; 
    date: string;
    $createdAt: string;
}

export default function PatientDashboard() {
    const [patient, setPatient] = useState<Patient | null>(null);
    const [houseCalls, setHouseCalls] = useState<HouseCall[]>([]);
    const [consultations, setConsultations] = useState<Consultation[]>([]);
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCall, setSelectedCall] = useState<HouseCall | null>(null);

    useEffect(() => {
        const init = async () => {
            try {
                const currentUser = await account.get();

                const patientData = await databases.listDocuments(
                    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                    process.env.NEXT_PUBLIC_APPWRITE_PATIENTS_COLLECTION_ID!,
                    [Query.equal("userId", [currentUser.$id])]
                );
                
                if (patientData.documents.length > 0) {
                    const patientDoc = patientData.documents[0] as unknown as Patient;
                    setPatient(patientDoc);

                    const [houseCallsRes, consultsRes, medsRes] = await Promise.all([
                        databases.listDocuments(
                            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                            process.env.NEXT_PUBLIC_APPWRITE_HOUSE_CALL_COLLECTION_ID!,
                            [Query.equal("patient_email", [currentUser.email])]
                        ).catch(err => { console.error("House Calls Error:", err); return { documents: [] }; }),
                        
                        databases.listDocuments(
                            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                            process.env.NEXT_PUBLIC_APPWRITE_CONSULTATIONS_COLLECTION_ID!,
                            [Query.equal("patientEmail", [currentUser.email])]
                        ).catch(err => { console.error("Consultations Error:", err); return { documents: [] }; }),

                        databases.listDocuments(
                            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                            process.env.NEXT_PUBLIC_APPWRITE_PRESCRIPTIONS_COLLECTION_ID!,
                            [Query.equal("patient_email", [currentUser.email])] 
                        ).catch(err => { console.error("Prescriptions Error:", err); return { documents: [] }; })
                    ]);

                    setHouseCalls(houseCallsRes.documents as unknown as HouseCall[]);
                    setConsultations(consultsRes.documents as unknown as Consultation[]);
                    setPrescriptions(medsRes.documents as unknown as Prescription[]);
                }
            } catch (error) {
                console.error("Dashboard Load Error:", error);
            } finally {
                setLoading(false);
            }
        };

        init();
    }, []);

    const upcomingHouseCalls = houseCalls.filter(hc => 
        ['pending', 'accepted'].includes(hc.status?.toLowerCase() || '')
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-white">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!patient) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <p className="text-xl font-semibold">No patient record found.</p>
                <Link href="/register-patient">
                    <Button className="bg-blue-600">Complete Registration</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4">
                <div className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">My Healthcare</h1>
                        <p className="text-gray-600">Welcome back, {patient.fullName}</p>
                    </div>
                    {/* FIXED: Link updated from /book-doctor to /new-appointment */}
                    <Link href="/new-appointment">
                        <Button className="bg-blue-600 hover:bg-blue-700">Book House Call</Button>
                    </Link>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <Card className="p-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Upcoming House Calls</p>
                                <p className="text-3xl font-bold">{upcomingHouseCalls.length}</p>
                            </div>
                            <Calendar className="text-blue-500 opacity-20 w-10 h-10" />
                        </div>
                    </Card>
                    <Card className="p-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Past Visits</p>
                                <p className="text-3xl font-bold">{consultations.length}</p>
                            </div>
                            <FileText className="text-green-500 opacity-20 w-10 h-10" />
                        </div>
                    </Card>
                    <Card className="p-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Prescriptions</p>
                                <p className="text-3xl font-bold">{prescriptions.length}</p>
                            </div>
                            <Pill className="text-purple-500 opacity-20 w-10 h-10" />
                        </div>
                    </Card>
                </div>

                <Tabs defaultValue="appointments">
                    <TabsList className="mb-6">
                        <TabsTrigger value="appointments">Current Requests</TabsTrigger>
                        <TabsTrigger value="history">Past Visits</TabsTrigger>
                        <TabsTrigger value="prescriptions">My Meds</TabsTrigger>
                    </TabsList>

                    <TabsContent value="appointments">
                        <div className="grid gap-4">
                            {upcomingHouseCalls.length === 0 ? (
                                <Card className="p-12 text-center border-dashed text-gray-500">
                                    No active requests.
                                </Card>
                            ) : (
                                upcomingHouseCalls.map((hc) => (
                                    <Card key={hc.$id} className="p-6">
                                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                                            <div className="space-y-1">
                                                <Badge className="bg-blue-100 text-blue-800 capitalize mb-2">{hc.status}</Badge>
                                                <h3 className="text-lg font-bold">{hc.chief_complaint}</h3>
                                                <div className="flex gap-4 text-sm text-gray-500">
                                                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {hc.appointment_date}</span>
                                                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {hc.appointment_time}</span>
                                                    <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {hc.visit_city}</span>
                                                </div>
                                            </div>
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="outline" onClick={() => setSelectedCall(hc)}>View Details</Button>
                                                </DialogTrigger>
                                                <DialogContent className="sm:max-w-md">
                                                    <DialogHeader>
                                                        <DialogTitle>House Call Request Details</DialogTitle>
                                                    </DialogHeader>
                                                    {selectedCall && (
                                                        <div className="space-y-4 py-4">
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div>
                                                                    <p className="text-xs font-semibold uppercase text-gray-400">Date & Time</p>
                                                                    <p className="text-sm">{selectedCall.appointment_date} @ {selectedCall.appointment_time}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs font-semibold uppercase text-gray-400">Urgency</p>
                                                                    <Badge variant="secondary" className="mt-1">{selectedCall.urgency}</Badge>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-semibold uppercase text-gray-400">Address</p>
                                                                <p className="text-sm">{selectedCall.visit_address}, {selectedCall.visit_city}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-semibold uppercase text-gray-400">Symptoms</p>
                                                                <p className="text-sm italic text-gray-600">&quot;{selectedCall.symptoms_description || 'No description provided'}&quot;</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    </Card>
                                ))
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="history">
                        <div className="grid gap-4">
                            {consultations.length === 0 ? (
                                <Card className="p-12 text-center border-dashed text-gray-500">
                                    No past medical records found.
                                </Card>
                            ) : (
                                consultations.map((consult) => (
                                    <Card key={consult.$id} className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="font-bold text-lg text-blue-900">{consult.diagnosis}</h3>
                                                <p className="text-sm text-gray-500 flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" /> {new Date(consult.$createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <Badge variant="outline" className="flex items-center gap-1">
                                                <User className="w-3 h-3" /> Dr. {consult.doctor_name || "Assigned Provider"}
                                            </Badge>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-sm"><span className="font-semibold">Treatment Plan:</span> {consult.treatment_plan}</p>
                                            {consult.doctor_notes && (
                                                <p className="text-sm text-gray-600 italic">&quot;{consult.doctor_notes}&quot;</p>
                                            )}
                                        </div>
                                    </Card>
                                ))
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="prescriptions">
                        <div className="grid md:grid-cols-2 gap-4">
                            {prescriptions.length === 0 ? (
                                <Card className="p-12 text-center border-dashed text-gray-500 col-span-2">
                                    No active prescriptions.
                                </Card>
                            ) : (
                                prescriptions.flatMap((record) => {
                                    let parsedMeds: ParsedMedication[] = [];
                                    try {
                                        parsedMeds = JSON.parse(record.medications); 
                                    } catch (e) {
                                        console.error("Failed to parse medications JSON", e);
                                    }

                                    return parsedMeds.map((med, index) => (
                                        <Card key={`${record.$id}-${index}`} className="p-6 border-l-4 border-l-purple-500">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="p-2 bg-purple-100 rounded-full">
                                                    <Pill className="text-purple-600 w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold">{med.medication_name || "Untitled Medication"}</h3>
                                                    <p className="text-sm text-gray-500">{med.dosage || "No dosage provided"}</p>
                                                </div>
                                            </div>
                                            <p className="text-sm bg-gray-50 p-3 rounded border italic">
                                                {med.instructions || "Please follow standard directions for this medication."}
                                            </p>
                                            <p className="text-[10px] text-gray-400 mt-4">
                                                Prescribed on: {new Date(record.$createdAt).toLocaleDateString()}
                                            </p>
                                        </Card>
                                    ));
                                })
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}