"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Calendar } from "lucide-react";
import { databases, account } from "@/lib/appwrite"; // Verified path
import { ID, Query, Models } from "appwrite";
import PaymentMethodSelector from "@/components/booking/PaymentMethodSelector";

// Interfaces to fix @typescript-eslint/no-explicit-any
interface Doctor extends Models.Document {
    full_name: string;
    specialization: string;
    consultation_fee: number;
}

interface PaymentInfo {
    payment_method: 'card' | 'medical_aid';
    medical_aid_card_id: string | null;
}

export default function BookDoctor() {
    const router = useRouter();
    const params = useParams();
    const doctorId = params.doctorId as string;

    const [doctor, setDoctor] = useState<Doctor | null>(null);
    const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
    const [bookingData, setBookingData] = useState({
        appointment_date: '',
        appointment_time: '',
        visit_address: '',
        visit_city: '',
        chief_complaint: '',
        symptoms_description: '',
        urgency: 'routine'
    });
    const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // useCallback handles the "exhaustive-deps" error by memoizing the function
    const loadData = useCallback(async () => {
        try {
            // 1. Get current logged-in user
            const currentUser = await account.get();
            setUser(currentUser);

            // 2. Get Doctor details
            const doctorData = await databases.getDocument(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                process.env.NEXT_PUBLIC_APPWRITE_DOCTORS_COLLECTION_ID!,
                doctorId
            );
            setDoctor(doctorData as unknown as Doctor);

            // 3. Get Patient profile to pre-fill address
            const patientResponse = await databases.listDocuments(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                process.env.NEXT_PUBLIC_APPWRITE_PATIENTS_COLLECTION_ID!,
                [Query.equal('email', currentUser.email)]
            );

            if (patientResponse.documents.length > 0) {
                const patient = patientResponse.documents[0];
                setBookingData(prev => ({
                    ...prev,
                    visit_address: patient.address || '',
                    visit_city: patient.city || ''
                }));
            }
        } catch (error) {
            console.error('Error loading data:', error);
            router.push('/new-appointment');
        }
    }, [doctorId, router]);

    useEffect(() => {
        if (doctorId) {
            loadData();
        }
    }, [doctorId, loadData]);

    const handleSubmit = async () => {
        if (!paymentInfo || !doctor || !user) {
            alert('Please select a payment method and ensure all data is loaded.');
            return;
        }

        setIsSubmitting(true);
        try {
            const paystackReference = paymentInfo.payment_method === 'card' 
                ? `PAY_${Date.now()}_${Math.random().toString(36).substring(7)}` 
                : null;

            // 1. Create house call request in Appwrite
            await databases.createDocument(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                process.env.NEXT_PUBLIC_APPWRITE_HOUSE_CALL_COLLECTION_ID!,
                ID.unique(),
                {
                    patient_email: user.email,
                    doctor_id: doctor.$id,
                    consultation_fee: doctor.consultation_fee,
                    paystack_reference: paystackReference,
                    payment_status: paymentInfo.payment_method === 'card' ? 'held' : 'pending',
                    status: 'pending',
                    ...bookingData,
                    ...paymentInfo,
                }
            );

            // 2. Logic for Medical Aid Funds deduction
            if (paymentInfo.payment_method === 'medical_aid' && paymentInfo.medical_aid_card_id) {
                const card = await databases.getDocument(
                    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                    process.env.NEXT_PUBLIC_APPWRITE_MEDICAL_AID_COLLECTION_ID!,
                    paymentInfo.medical_aid_card_id
                );
                
                await databases.updateDocument(
                    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                    process.env.NEXT_PUBLIC_APPWRITE_MEDICAL_AID_COLLECTION_ID!,
                    paymentInfo.medical_aid_card_id,
                    {
                        available_funds: card.available_funds - doctor.consultation_fee
                    }
                );
            }

            router.push('/patient-dashboard');
        } catch (error) {
            console.error('Booking error:', error);
            alert('Booking failed. Please check your connection.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!doctor || !user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
                <p className="text-gray-500">Preparing your booking...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-4 max-w-4xl">
                <h1 className="text-3xl font-bold mb-8">Book House Call</h1>

                <div className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-6">
                        <Card className="p-6">
                            <h3 className="text-lg font-semibold mb-4 text-blue-900">Appointment Details</h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="date">Preferred Date *</Label>
                                    <Input
                                        id="date"
                                        type="date"
                                        value={bookingData.appointment_date}
                                        onChange={(e) => setBookingData({ ...bookingData, appointment_date: e.target.value })}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="time">Preferred Time *</Label>
                                    <Input
                                        id="time"
                                        type="time"
                                        value={bookingData.appointment_time}
                                        onChange={(e) => setBookingData({ ...bookingData, appointment_time: e.target.value })}
                                        className="mt-1"
                                    />
                                </div>
                            </div>

                            <div className="mt-4">
                                <Label htmlFor="urgency">Urgency Level</Label>
                                <Select 
                                    value={bookingData.urgency}
                                    onValueChange={(value) => setBookingData({ ...bookingData, urgency: value })}
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="routine">Routine</SelectItem>
                                        <SelectItem value="urgent">Urgent</SelectItem>
                                        <SelectItem value="emergency">Emergency</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </Card>

                        <Card className="p-6">
                            <h3 className="text-lg font-semibold mb-4 text-blue-900">Visit Location</h3>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="address">Address *</Label>
                                    <Input
                                        id="address"
                                        value={bookingData.visit_address}
                                        onChange={(e) => setBookingData({ ...bookingData, visit_address: e.target.value })}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="city">City *</Label>
                                    <Input
                                        id="city"
                                        value={bookingData.visit_city}
                                        onChange={(e) => setBookingData({ ...bookingData, visit_city: e.target.value })}
                                        className="mt-1"
                                    />
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6">
                            <h3 className="text-lg font-semibold mb-4 text-blue-900">Medical Information</h3>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="complaint">Chief Complaint *</Label>
                                    <Input
                                        id="complaint"
                                        value={bookingData.chief_complaint}
                                        onChange={(e) => setBookingData({ ...bookingData, chief_complaint: e.target.value })}
                                        placeholder="Main reason for consultation"
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="symptoms">Symptoms Description</Label>
                                    <Textarea
                                        id="symptoms"
                                        value={bookingData.symptoms_description}
                                        onChange={(e) => setBookingData({ ...bookingData, symptoms_description: e.target.value })}
                                        placeholder="Describe your symptoms in detail"
                                        rows={4}
                                        className="mt-1"
                                    />
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6">
                            <h3 className="text-lg font-semibold mb-4 text-blue-900">Payment Method</h3>
                            <PaymentMethodSelector
                                patientEmail={user.email}
                                consultationFee={doctor.consultation_fee}
                                onMethodSelect={(data) => setPaymentInfo(data as PaymentInfo)}
                            />
                        </Card>
                    </div>

                    <div>
                        <Card className="p-6 sticky top-6">
                            <h3 className="text-lg font-semibold mb-4">Booking Summary</h3>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-gray-600">Doctor</p>
                                    <p className="font-semibold text-blue-800">{doctor.full_name}</p>
                                    <p className="text-sm text-gray-600">{doctor.specialization}</p>
                                </div>

                                <div className="border-t pt-4">
                                    <div className="flex justify-between mb-2">
                                        <span className="text-gray-600">Consultation Fee</span>
                                        <span className="font-bold text-blue-600">R {doctor.consultation_fee.toFixed(2)}</span>
                                    </div>
                                    <p className="text-[10px] text-gray-400 italic">
                                        Note: Final fee may vary based on duration.
                                    </p>
                                </div>

                                <Button 
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || !paymentInfo}
                                    className="w-full bg-blue-600 hover:bg-blue-700 h-12"
                                >
                                    {isSubmitting ? (
                                        <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...</>
                                    ) : (
                                        <><Calendar className="w-5 h-5 mr-2" /> Confirm Booking</>
                                    )}
                                </Button>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}