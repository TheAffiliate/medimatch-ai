"use client";

import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Define the structure to match page.tsx
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
    additionalNotes: string; // The missing field
}

interface ConsultationFormProps {
    houseCallRequestId: string;
    patientEmail: string;
    doctorId: string;
    data: ConsultationData; // Required to fix TS error
    setData: React.Dispatch<React.SetStateAction<ConsultationData>>; // Required to fix TS error
    onComplete: () => void;
}

export default function ConsultationForm({ data, setData, onComplete }: ConsultationFormProps) {
    
    // Helper to update vitals nested state
    const updateVitals = (field: keyof ConsultationData['vitals'], value: string) => {
        setData(prev => ({
            ...prev,
            vitals: { ...prev.vitals, [field]: value }
        }));
    };

    return (
        <div className="space-y-6">
            {/* Patient History & Examination */}
            <Card className="p-6 border-none shadow-md bg-white">
                <h3 className="text-lg font-bold mb-4 text-gray-900">Patient History & Examination</h3>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Chief Complaint</Label>
                        <Textarea 
                            placeholder="Primary reason for visit" 
                            value={data.chiefComplaint}
                            onChange={(e) => setData({...data, chiefComplaint: e.target.value})}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>History of Present Illness</Label>
                        <Textarea 
                            placeholder="Detailed patient history" 
                            value={data.history}
                            onChange={(e) => setData({...data, history: e.target.value})}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Physical Examination</Label>
                        <Textarea 
                            placeholder="Physical exam findings" 
                            value={data.physicalExam}
                            onChange={(e) => setData({...data, physicalExam: e.target.value})}
                        />
                    </div>
                </div>
            </Card>

            {/* Vital Signs */}
            <Card className="p-6 border-none shadow-md bg-white">
                <h3 className="text-lg font-bold mb-4 text-gray-900">Vital Signs</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label>Blood Pressure</Label>
                        <Input value={data.vitals.bp} onChange={(e) => updateVitals('bp', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Heart Rate (bpm)</Label>
                        <Input value={data.vitals.hr} onChange={(e) => updateVitals('hr', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Temperature (°C)</Label>
                        <Input value={data.vitals.temp} onChange={(e) => updateVitals('temp', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Respiratory Rate</Label>
                        <Input value={data.vitals.rr} onChange={(e) => updateVitals('rr', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>O2 Saturation (%)</Label>
                        <Input value={data.vitals.o2} onChange={(e) => updateVitals('o2', e.target.value)} />
                    </div>
                </div>
            </Card>

            {/* Diagnosis & Treatment - Including Additional Notes */}
            <Card className="p-6 border-none shadow-md bg-white">
                <h3 className="text-lg font-bold mb-4 text-gray-900">Diagnosis & Treatment</h3>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Diagnosis</Label>
                        <Textarea 
                            placeholder="Medical diagnosis" 
                            value={data.diagnosis}
                            onChange={(e) => setData({...data, diagnosis: e.target.value})}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Treatment Plan</Label>
                        <Textarea 
                            placeholder="Recommended treatment and interventions" 
                            value={data.treatmentPlan}
                            onChange={(e) => setData({...data, treatmentPlan: e.target.value})}
                        />
                    </div>
                    {/* NEW: Additional Doctor Notes section */}
                    <div className="space-y-2">
                        <Label>Additional Doctor Notes</Label>
                        <Textarea 
                            placeholder="Any additional observations or notes" 
                            value={data.additionalNotes}
                            onChange={(e) => setData({...data, additionalNotes: e.target.value})}
                        />
                    </div>
                </div>
            </Card>

            <Button onClick={onComplete} className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg">
                Complete Consultation
            </Button>
        </div>
    );
}