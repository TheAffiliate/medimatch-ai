'use client';

import React from 'react';
import { Client, Databases } from 'appwrite';
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Users, 
  UserRound, 
  DollarSign, 
  AlertTriangle, 
  LogOut, 
  Loader2,
  Activity
} from "lucide-react";
import AdminGuard from "@/app/admin/AdminGuard";

// --- Type Interfaces ---
interface AppwriteDoc {
    $id: string;
    $createdAt: string;
}

interface Doctor extends AppwriteDoc {
    full_name: string;
    status: 'pending' | 'active' | 'rejected';
    hpcsa_verified: boolean;
    specialization: string;
}

interface Patient extends AppwriteDoc {
    email: string;
    name: string;
}

interface Consultation extends AppwriteDoc {
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    fee: number;
}

// --- Appwrite Configuration (Syncing with your .env.local) ---
const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!) 
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

const databases = new Databases(client);

// Pulling IDs directly from your env configuration
const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const COLL_DOCTORS = process.env.NEXT_PUBLIC_APPWRITE_DOCTORS_COLLECTION_ID!;
const COLL_PATIENTS = process.env.NEXT_PUBLIC_APPWRITE_PATIENTS_COLLECTION_ID!;
const COLL_CONSULTATIONS = process.env.NEXT_PUBLIC_APPWRITE_CONSULTATIONS_COLLECTION_ID!;

export default function AdminDashboard() {
    // --- Data Fetching ---
    const { data: doctors = [], isLoading: loadingDocs } = useQuery<Doctor[]>({
        queryKey: ['admin', 'doctors'],
        queryFn: async () => {
            const res = await databases.listDocuments(DB_ID, COLL_DOCTORS);
            return res.documents as unknown as Doctor[];
        }
    });

    const { data: patients = [] } = useQuery<Patient[]>({
        queryKey: ['admin', 'patients'],
        queryFn: async () => {
            const res = await databases.listDocuments(DB_ID, COLL_PATIENTS);
            return res.documents as unknown as Patient[];
        }
    });

    const { data: consultations = [] } = useQuery<Consultation[]>({
        queryKey: ['admin', 'consultations'],
        queryFn: async () => {
            const res = await databases.listDocuments(DB_ID, COLL_CONSULTATIONS);
            return res.documents as unknown as Consultation[];
        }
    });

    // --- Stats Calculations ---
    const activeDocsCount = doctors.filter(d => d.status === 'active').length;
    const pendingDocsCount = doctors.filter(d => d.status === 'pending').length;
    const verifiedDocsCount = doctors.filter(d => d.hpcsa_verified).length;
    
    // --- Advanced Revenue Calculations ---
    const PLATFORM_FEE_PERCENTAGE = 0.15; // 15%

    // Helper to get current month/year for filtering
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const completedConsultations = consultations.filter(c => c.status === 'completed');

    // All-Time Financials
    const allTimeGross = completedConsultations.reduce((acc, curr) => acc + (curr.fee || 0), 0);
    const allTimePlatformRevenue = allTimeGross * PLATFORM_FEE_PERCENTAGE;
    const allTimeDoctorPayouts = allTimeGross - allTimePlatformRevenue; 

    // This Month's Financials
    const thisMonthConsultations = completedConsultations.filter(c => {
        const consultDate = new Date(c.$createdAt);
        return consultDate.getMonth() === currentMonth && consultDate.getFullYear() === currentYear;
    });

    const thisMonthGross = thisMonthConsultations.reduce((acc, curr) => acc + (curr.fee || 0), 0);
    const thisMonthPlatformRevenue = thisMonthGross * PLATFORM_FEE_PERCENTAGE;

    if (loadingDocs) return (
        <div className="h-screen flex items-center justify-center bg-slate-50">
            <Loader2 className="animate-spin text-blue-600 h-10 w-10" />
        </div>
    );

    return (
        <AdminGuard>
            <div className="min-h-screen bg-slate-50/50">
                {/* Header Navigation */}
                <nav className="flex items-center justify-between px-8 py-4 bg-white border-b">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-600 p-1.5 rounded-lg">
                            <Activity className="text-white w-5 h-5" />
                        </div>
                        <span className="font-bold text-xl text-slate-800">MediMatch AI</span>
                    </div>
                    
                    <div className="flex items-center gap-6">
                        <span className="text-sm font-medium text-slate-600">Dashboard</span>
                        <span className="text-sm text-slate-400">admin@medimatch.ai</span>
                        <button className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-red-500 transition-colors">
                            <LogOut className="w-4 h-4" /> Logout
                        </button>
                    </div>
                </nav>

                <main className="p-8 max-w-7xl mx-auto space-y-8">
                    <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>

                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <KpiCard title="Total Doctors" value={doctors.length.toString()} icon={<Users className="text-blue-200" />} />
                        <KpiCard title="Total Patients" value={patients.length.toString()} icon={<UserRound className="text-green-200" />} />
                        <KpiCard title="Platform Revenue" value={`R ${allTimePlatformRevenue.toFixed(2)}`} icon={<DollarSign className="text-emerald-200" />} />
                        <KpiCard title="Flagged Reviews" value="0" icon={<AlertTriangle className="text-red-200" />} />
                    </div>

                    <Tabs defaultValue="analytics" className="w-full">
                        <TabsList className="bg-transparent border-b rounded-none w-full justify-start h-auto p-0 gap-8 mb-6">
                            <TabsTrigger value="doctors" className="tab-style">Doctors</TabsTrigger>
                            <TabsTrigger value="flagged" className="tab-style">Flagged Reviews (0)</TabsTrigger>
                            <TabsTrigger value="payouts" className="tab-style">Payouts (0)</TabsTrigger>
                            <TabsTrigger value="analytics" className="tab-style">Analytics</TabsTrigger>
                        </TabsList>

                        <TabsContent value="analytics" className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <AnalyticsSection title="Consultations by Status">
                                <StatRow label="Pending" value={consultations.filter(c => c.status === 'pending').length.toString()} />
                                <StatRow label="Confirmed" value={consultations.filter(c => c.status === 'confirmed').length.toString()} />
                                <StatRow label="Completed" value={completedConsultations.length.toString()} />
                            </AnalyticsSection>

                            <AnalyticsSection title="Payment Methods">
                                <StatRow label="Card Payments" value="0" />
                                <StatRow label="Medical Aid" value="0" />
                            </AnalyticsSection>

                            <AnalyticsSection title="Doctor Statistics">
                                <StatRow label="Active Doctors" value={activeDocsCount.toString()} />
                                <StatRow label="Pending Approval" value={pendingDocsCount.toString()} />
                                <StatRow label="HPCSA Verified" value={verifiedDocsCount.toString()} />
                            </AnalyticsSection>

                            {/* Upgraded Revenue Breakdown */}
                            <AnalyticsSection title="Revenue Breakdown">
                                {/* This Month */}
                                <div className="bg-slate-100/50 px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    This Month
                                </div>
                                <StatRow label="Monthly Gross Volume" value={`R ${thisMonthGross.toFixed(2)}`} />
                                <StatRow label="Platform Revenue (15%)" value={`R ${thisMonthPlatformRevenue.toFixed(2)}`} color="text-emerald-600" />
                                
                                {/* All Time */}
                                <div className="bg-slate-100/50 px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mt-4 border-t">
                                    All-Time
                                </div>
                                <StatRow label="Total Gross Volume" value={`R ${allTimeGross.toFixed(2)}`} />
                                <StatRow label="All-Time Platform Revenue" value={`R ${allTimePlatformRevenue.toFixed(2)}`} color="text-emerald-600" />
                                <StatRow label="Total Doctor Payouts (85%)" value={`R ${allTimeDoctorPayouts.toFixed(2)}`} />
                            </AnalyticsSection>
                        </TabsContent>
                    </Tabs>
                </main>
            </div>

            <style jsx>{`
                :global(.tab-style) { 
                    background: transparent !important;
                    border-bottom: 2px solid transparent !important;
                    border-radius: 0 !important;
                    padding: 0 0 8px 0 !important;
                    color: #64748b !important;
                    box-shadow: none !important;
                }
                :global(.tab-style[data-state="active"]) {
                    border-color: #2563eb !important;
                    color: #2563eb !important;
                }
            `}</style>
        </AdminGuard>
    );
}

function KpiCard({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) {
    return (
        <Card className="shadow-sm border-slate-100">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-slate-500">{title}</CardTitle>
                <div className="scale-125">{icon}</div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-slate-900">{value}</div>
            </CardContent>
        </Card>
    );
}

function AnalyticsSection({ title, children }: { title: string, children: React.ReactNode }) {
    return (
        <Card className="shadow-sm border-slate-100">
            <CardHeader className="border-b bg-slate-50/50 py-3">
                <CardTitle className="text-base font-semibold text-slate-800">{title}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="flex flex-col">{children}</div>
            </CardContent>
        </Card>
    );
}

function StatRow({ label, value, color = "text-slate-900" }: { label: string, value: string, color?: string }) {
    return (
        <div className="flex justify-between items-center p-4 border-b last:border-0 border-slate-50">
            <span className="text-sm text-slate-600 font-medium">{label}</span>
            <span className={`text-sm font-bold ${color}`}>{value}</span>
        </div>
    );
}