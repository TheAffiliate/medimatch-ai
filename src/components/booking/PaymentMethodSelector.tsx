"use client";

import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { CreditCard, Heart, AlertCircle, Loader2 } from "lucide-react";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";

interface MedicalAidCard {
    $id: string;
    scheme_name: string;
    plan_name: string;
    scheme_number: string;
    available_funds: number;
}

interface PaymentMethodSelectorProps {
    patientEmail: string;
    consultationFee: number;
    onMethodSelect: (data: { payment_method: string; medical_aid_card_id: string | null } | null) => void;
}

export default function PaymentMethodSelector({ 
    patientEmail, 
    consultationFee, 
    onMethodSelect 
}: PaymentMethodSelectorProps) {
    const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
    const [medicalAidCards, setMedicalAidCards] = useState<MedicalAidCard[]>([]);
    const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [insufficientFunds, setInsufficientFunds] = useState(false);

    useEffect(() => {
        const loadMedicalAidCards = async () => {
            setLoading(true);
            try {
                const response = await databases.listDocuments(
                    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                    process.env.NEXT_PUBLIC_APPWRITE_MEDICAL_AID_COLLECTION_ID!,
                    [
                        Query.equal('patient_email', patientEmail),
                        Query.equal('verification_status', 'verified')
                    ]
                );
                setMedicalAidCards(response.documents as unknown as MedicalAidCard[]);
            } catch (error) {
                console.error("Error loading medical aid:", error);
            } finally {
                setLoading(false);
            }
        };

        if (patientEmail) loadMedicalAidCards();
    }, [patientEmail]);

    const handleMethodSelect = (method: string) => {
        setSelectedMethod(method);
        setInsufficientFunds(false);
        setSelectedCardId(null);

        if (method === 'card') {
            onMethodSelect({
                payment_method: 'card',
                medical_aid_card_id: null
            });
        } else {
            onMethodSelect(null);
        }
    };

    const handleCardSelect = (card: MedicalAidCard) => {
        setSelectedCardId(card.$id);
        
        if (card.available_funds < consultationFee) {
            setInsufficientFunds(true);
            onMethodSelect(null);
        } else {
            setInsufficientFunds(false);
            onMethodSelect({
                payment_method: 'medical_aid',
                medical_aid_card_id: card.$id
            });
        }
    };

    return (
        <div className="space-y-4">
            <Label className="text-gray-700 font-bold">Select Payment Method</Label>

            {/* Card Payment */}
            <Card 
                className={`p-4 cursor-pointer transition-all border-2 ${selectedMethod === 'card' ? 'border-blue-600 bg-blue-50' : 'border-gray-100'}`}
                onClick={() => handleMethodSelect('card')}
            >
                <div className="flex items-center gap-3">
                    <CreditCard className="w-6 h-6 text-blue-600" />
                    <div className="flex-1">
                        <p className="font-semibold">Pay with Card</p>
                        <p className="text-xs text-gray-500">Secure via Paystack</p>
                    </div>
                    {selectedMethod === 'card' && <div className="w-3 h-3 rounded-full bg-blue-600" />}
                </div>
            </Card>

            {/* Medical Aid */}
            <Card 
                className={`p-4 cursor-pointer transition-all border-2 ${selectedMethod === 'medical_aid' ? 'border-green-600 bg-green-50' : 'border-gray-100'}`}
                onClick={() => handleMethodSelect('medical_aid')}
            >
                <div className="flex items-center gap-3">
                    <Heart className="w-6 h-6 text-green-600" />
                    <div className="flex-1">
                        <p className="font-semibold">Medical Aid Claim</p>
                        <p className="text-xs text-gray-500">Use scheme benefits</p>
                    </div>
                    {selectedMethod === 'medical_aid' && <div className="w-3 h-3 rounded-full bg-green-600" />}
                </div>
            </Card>

            {/* Medical Aid List */}
            {selectedMethod === 'medical_aid' && (
                <div className="pl-4 space-y-2 border-l-2 border-green-100 ml-2">
                    {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                    ) : medicalAidCards.length === 0 ? (
                        <p className="text-xs text-gray-500">No verified cards found.</p>
                    ) : (
                        medicalAidCards.map((card) => (
                            <Card 
                                key={card.$id}
                                className={`p-3 cursor-pointer border-2 transition-all ${selectedCardId === card.$id ? 'border-green-500 shadow-sm' : 'border-gray-100'}`}
                                onClick={() => handleCardSelect(card)}
                            >
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-sm font-bold">{card.scheme_name}</p>
                                        <p className="text-xs text-gray-500">Available: R {card.available_funds.toFixed(2)}</p>
                                    </div>
                                    {selectedCardId === card.$id && <div className="w-2 h-2 rounded-full bg-green-500" />}
                                </div>
                            </Card>
                        ))
                    )}
                    {insufficientFunds && (
                        <p className="text-xs text-red-600 flex items-center gap-1 mt-2">
                            <AlertCircle className="w-3 h-3" /> Insufficient funds for this fee.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}