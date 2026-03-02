"use client";

import React from 'react';
import Image from 'next/image'; // The missing import
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Stethoscope, CheckCircle, Calendar } from "lucide-react";
import Link from 'next/link';

interface DoctorProps {
    doctor: {
        $id: string;
        full_name: string;
        specialization: string;
        profile_photo_url?: string;
        hpcsa_verified: boolean;
        average_rating?: number;
        total_consultations?: number;
        years_of_experience?: number;
        bio?: string;
        available_areas?: string[];
        consultation_fee: number;
    };
}

export default function DoctorCard({ doctor }: DoctorProps) {
    // Fix for the "Dr. Dr." duplicate title issue
    const displayName = doctor.full_name.startsWith("Dr.") 
        ? doctor.full_name 
        : `Dr. ${doctor.full_name}`;

    return (
        <Card className="overflow-hidden hover:shadow-lg transition-shadow bg-white">
            <div className="p-6">
                <div className="flex gap-4">
                    {/* Profile Photo Container */}
                    <div className="relative shrink-0">
                        <div className="relative w-20 h-20 overflow-hidden rounded-lg">
                            {doctor.profile_photo_url ? (
                                <Image 
                                    src={doctor.profile_photo_url} 
                                    alt={displayName}
                                    fill 
                                    className="object-cover"
                                    sizes="80px"
                                />
                            ) : (
                                <div className="w-full h-full bg-blue-100 flex items-center justify-center">
                                    <Stethoscope className="w-10 h-10 text-blue-600" />
                                </div>
                            )}
                        </div>
                        {doctor.hpcsa_verified && (
                            <div className="absolute -bottom-1 -right-1 bg-green-600 rounded-full p-1 border-2 border-white z-10">
                                <CheckCircle className="w-3 h-3 text-white" />
                            </div>
                        )}
                    </div>

                    {/* Doctor Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <div className="truncate">
                                <h3 className="font-bold text-lg truncate">{displayName}</h3>
                                <p className="text-sm text-gray-600">{doctor.specialization}</p>
                            </div>
                            {doctor.hpcsa_verified && (
                                <Badge className="bg-green-100 text-green-800 border-green-200 shrink-0">
                                    HPCSA Verified
                                </Badge>
                            )}
                        </div>

                        <div className="mt-2 flex items-center gap-2 text-sm">
                            <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                <span className="font-medium">{(doctor.average_rating || 0).toFixed(1)}</span>
                            </div>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-600">{doctor.total_consultations || 0} consultations</span>
                        </div>

                        {doctor.years_of_experience && (
                            <p className="text-sm text-gray-600 mt-1">
                                {doctor.years_of_experience} years experience
                            </p>
                        )}

                        {doctor.bio && (
                            <p className="text-sm text-gray-700 mt-2 line-clamp-2 italic">
                                &quot;{doctor.bio}&quot;
                            </p>
                        )}

                        {doctor.available_areas && doctor.available_areas.length > 0 && (
                            <div className="mt-2 flex items-center gap-1 text-sm text-gray-600">
                                <MapPin className="w-4 h-4 shrink-0" />
                                <span className="truncate">{doctor.available_areas.slice(0, 3).join(', ')}</span>
                            </div>
                        )}

                        <div className="mt-4 flex items-center justify-between border-t pt-4">
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-semibold">Consultation Fee</p>
                                <p className="text-xl font-bold text-blue-600">R {doctor.consultation_fee.toFixed(2)}</p>
                            </div>
                            <Link href={`/book-appointment/${doctor.$id}`}>
                                <Button className="bg-blue-600 hover:bg-blue-700">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    Book House Call
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
}