"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  DollarSign, 
  Loader2, 
  CheckCircle 
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { account, databases } from "@/lib/appwrite";
import { Query, Models } from "appwrite";

// --- Types ---
interface Doctor extends Models.Document {
    full_name: string;
    user_email: string;
    specialization: string;
    total_consultations?: number;
    total_earnings?: number;
}

interface HouseCallRequest extends Models.Document {
    patient_email: string;
    chief_complaint: string;
    appointment_date: string;
    appointment_time: string;
    visit_city: string;
    visit_address: string;
    status: 'pending' | 'accepted' | 'completed' | 'cancelled'; 
    consultation_fee: number;
    doctor_id: string;
}

export default function DoctorDashboard() {
    const router = useRouter();
    const [doctor, setDoctor] = useState<Doctor | null>(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    useEffect(() => {
        const loadDoctorProfile = async () => {
            try {
                const currentUser = await account.get();
                const response = await databases.listDocuments(
                    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                    process.env.NEXT_PUBLIC_APPWRITE_DOCTORS_COLLECTION_ID!,
                    // MATCHED: Now using user_email to match your indexed schema
                    [Query.equal("user_email", [currentUser.email])] 
                );

                if (response.documents.length > 0) {
                    setDoctor(response.documents[0] as unknown as Doctor);
                }
            } catch (error) {
                console.error("Auth error:", error);
            } finally {
                setIsInitialLoading(false);
            }
        };
        loadDoctorProfile();
    }, []);

    const { data: requests = [], isLoading: loadingRequests, refetch } = useQuery({
        queryKey: ['doctor-requests', doctor?.$id],
        queryFn: async () => {
            if (!doctor) return [];
            const response = await databases.listDocuments(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                process.env.NEXT_PUBLIC_APPWRITE_HOUSE_CALL_COLLECTION_ID!,
                [Query.equal("doctor_id", [doctor.$id])]
            );
            return response.documents as unknown as HouseCallRequest[];
        },
        enabled: !!doctor
    });

    // --- Derived Data for UI ---
    const pendingRequests = requests.filter(r => r.status === 'pending');
    const upcomingAppointments = requests.filter(r => r.status === 'accepted');
    const completedHistory = requests.filter(r => r.status === 'completed');

    // DYNAMIC CALCULATION: Sums fees from completed history to ensure Earnings card isn't 0
    const dynamicEarnings = completedHistory.reduce((acc, curr) => acc + (curr.consultation_fee || 0), 0);

    const handleAcceptRequest = async (requestId: string) => {
        try {
            await databases.updateDocument(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                process.env.NEXT_PUBLIC_APPWRITE_HOUSE_CALL_COLLECTION_ID!,
                requestId,
                { status: 'accepted' } 
            );
            refetch();
        } catch (error) {
            console.error("Update failed:", error);
            alert("Failed to accept request.");
        }
    };

    const startConsultation = (request: HouseCallRequest) => {
        router.push(`/consultation?request_id=${request.$id}`);
    };

    if (isInitialLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!doctor) return <div className="p-10 text-center font-medium">Doctor profile not found.</div>;

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                        Welcome back, {doctor.full_name.startsWith("Dr.") ? doctor.full_name : `Dr. ${doctor.full_name}`}
                    </h1>
                    <p className="text-gray-600">Manage your house call appointments and track revenue.</p>
                </div>

                {/* --- STAT CARDS --- */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard title="Requests" value={pendingRequests.length} icon={<Calendar className="text-blue-600 w-full h-full" />} />
                    <StatCard title="Confirmed" value={upcomingAppointments.length} icon={<Clock className="text-orange-600 w-full h-full" />} />
                    <StatCard title="Visits" value={completedHistory.length} icon={<CheckCircle className="text-purple-600 w-full h-full" />} />
                    <StatCard title="Earnings" value={`R ${dynamicEarnings.toFixed(2)}`} icon={<DollarSign className="text-green-600 w-full h-full" />} />
                </div>

                <Tabs defaultValue="pending" className="w-full">
                    <TabsList className="mb-6">
                        <TabsTrigger value="pending">Pending ({pendingRequests.length})</TabsTrigger>
                        <TabsTrigger value="upcoming">Upcoming ({upcomingAppointments.length})</TabsTrigger>
                        <TabsTrigger value="completed">History</TabsTrigger>
                    </TabsList>

                    <TabsContent value="pending" className="space-y-4">
                        {loadingRequests ? <Loader2 className="animate-spin mx-auto text-blue-600" /> : (
                            pendingRequests.length === 0 ? <EmptyState message="No pending requests." /> : 
                            pendingRequests.map(request => (
                                <RequestCard key={request.$id} request={request} onAccept={handleAcceptRequest} />
                            ))
                        )}
                    </TabsContent>

                    <TabsContent value="upcoming" className="space-y-4">
                        {upcomingAppointments.length === 0 ? <EmptyState message="No confirmed appointments." /> :
                            upcomingAppointments.map(request => (
                                <UpcomingCard 
                                    key={request.$id} 
                                    request={request} 
                                    onStart={() => startConsultation(request)} 
                                />
                            ))
                        }
                    </TabsContent>

                    <TabsContent value="completed" className="space-y-4">
                        {completedHistory.length === 0 ? <EmptyState message="No past visits." /> :
                            completedHistory.map(request => (
                                <HistoryCard key={request.$id} request={request} />
                            ))
                        }
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

// --- Helper Components ---
function StatCard({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) {
    return (
        <Card className="p-6 border-none shadow-sm flex items-center justify-between bg-white">
            <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{title}</p>
                <p className="text-2xl font-bold mt-1">{value}</p>
            </div>
            <div className="w-10 h-10 p-2 bg-gray-50 rounded-lg">{icon}</div>
        </Card>
    );
}

function RequestCard({ request, onAccept }: { request: HouseCallRequest; onAccept: (id: string) => void }) {
    return (
        <Card className="p-6 border-none shadow-sm bg-white">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="bg-blue-100 p-2 rounded-full"><User className="w-4 h-4 text-blue-700" /></div>
                        <div>
                            <p className="font-bold text-gray-900">{request.patient_email}</p>
                            <p className="text-sm text-blue-600 font-medium">{request.chief_complaint}</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs font-medium text-gray-500">
                        <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {request.appointment_date}</span>
                        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {request.appointment_time}</span>
                        <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {request.visit_city}</span>
                    </div>
                </div>
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-4">
                    <p className="text-xl font-bold text-gray-900">R {(request.consultation_fee || 0).toFixed(2)}</p>
                    <Button onClick={() => onAccept(request.$id)} className="bg-blue-600 hover:bg-blue-700 px-8">Accept</Button>
                </div>
            </div>
        </Card>
    );
}

function UpcomingCard({ request, onStart }: { request: HouseCallRequest; onStart: () => void }) {
    return (
        <Card className="p-6 border-l-4 border-l-orange-500 border-none shadow-sm bg-white">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <p className="font-bold text-gray-900">{request.patient_email}</p>
                    <p className="text-sm text-gray-500 mt-1">{request.visit_address}, {request.visit_city}</p>
                    <div className="mt-2">
                        <Badge variant="outline" className="text-[10px] font-bold">
                            {request.appointment_date} @ {request.appointment_time}
                        </Badge>
                    </div>
                </div>
                <Button onClick={onStart} className="bg-green-600 hover:bg-green-700">
                    Start Consultation
                </Button>
            </div>
        </Card>
    );
}

function HistoryCard({ request }: { request: HouseCallRequest }) {
    return (
        <Card className="p-4 border-none shadow-sm flex justify-between items-center bg-white">
            <div className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <div>
                    <p className="text-sm font-bold">{request.patient_email}</p>
                    <p className="text-[10px] text-gray-400 uppercase">{request.appointment_date}</p>
                </div>
            </div>
            <p className="font-bold text-sm">R {(request.consultation_fee || 0).toFixed(2)}</p>
        </Card>
    );
}

function EmptyState({ message }: { message: string }) {
    return <Card className="p-16 text-center text-gray-400 border-dashed border-2 bg-transparent shadow-none italic">{message}</Card>;
}