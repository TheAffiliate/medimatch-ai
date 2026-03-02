"use client";

import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Loader2 } from "lucide-react";
import { databases } from "@/lib/appwrite"; 
import { Query, Models } from "appwrite";
import { useQuery } from "@tanstack/react-query";
import DoctorCard from "@/components/doctor/DoctorCard";

// Define the interface to fix the TypeScript 'DefaultDocument' error
interface DoctorDocument extends Models.Document {
    full_name: string;
    specialization: string;
    hpcsa_verified: boolean;
    consultation_fee: number;
    profile_photo_url?: string;
    average_rating?: number;
    total_consultations?: number;
    years_of_experience?: number;
    bio?: string;
    available_areas?: string[];
}

export default function FindDoctors() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSpecialization, setSelectedSpecialization] = useState('all');
    const [selectedArea, setSelectedArea] = useState('all');

    const { data: doctors = [], isLoading } = useQuery({
        queryKey: ['doctors'],
        queryFn: async () => {
            const result = await databases.listDocuments(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                process.env.NEXT_PUBLIC_APPWRITE_DOCTORS_COLLECTION_ID!,
                [
                    Query.equal('status', 'active'),
                    Query.equal('hpcsa_verified', true)
                ]
            );
            // Explicitly cast the documents to our DoctorDocument interface
            return result.documents as unknown as DoctorDocument[];
        }
    });

    const filteredDoctors = doctors.filter(doctor => {
        const fullName = doctor.full_name.toLowerCase();
        const specialization = doctor.specialization.toLowerCase();
        const search = searchTerm.toLowerCase();

        const matchesSearch = searchTerm === '' || 
            fullName.includes(search) ||
            specialization.includes(search);
        
        const matchesSpecialization = selectedSpecialization === 'all' || 
            doctor.specialization === selectedSpecialization;
        
        const matchesArea = selectedArea === 'all' || 
            (doctor.available_areas && doctor.available_areas.includes(selectedArea));
        
        return matchesSearch && matchesSpecialization && matchesArea;
    });

    // Helper to get unique filter values
    const specializations = Array.from(new Set(doctors.map(d => d.specialization)));
    const areas = Array.from(new Set(doctors.flatMap(d => d.available_areas || [])));

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-4">
                <header className="mb-8">
                    <h1 className="text-4xl font-bold mb-2">Find a Doctor</h1>
                    <p className="text-gray-600">Browse HPCSA-verified doctors for house calls</p>
                </header>

                {/* Search and Filters */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-100">
                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                            <Input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by name or specialization"
                                className="pl-10"
                            />
                        </div>
                        
                        <Select value={selectedSpecialization} onValueChange={setSelectedSpecialization}>
                            <SelectTrigger>
                                <SelectValue placeholder="All Specializations" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Specializations</SelectItem>
                                {specializations.map(spec => (
                                    <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={selectedArea} onValueChange={setSelectedArea}>
                            <SelectTrigger>
                                <SelectValue placeholder="All Areas" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Areas</SelectItem>
                                {areas.map(area => (
                                    <SelectItem key={area} value={area}>{area}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Results Section */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
                        <p className="text-gray-500 font-medium">Loading doctors...</p>
                    </div>
                ) : filteredDoctors.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                        <p className="text-gray-600">No doctors found matching your criteria.</p>
                        <button 
                            onClick={() => {setSearchTerm(''); setSelectedSpecialization('all'); setSelectedArea('all');}}
                            className="text-blue-600 hover:underline mt-2"
                        >
                            Reset filters
                        </button>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6">
                        {filteredDoctors.map(doctor => (
                            <DoctorCard key={doctor.$id} doctor={doctor} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}