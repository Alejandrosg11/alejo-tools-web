"use client";

import { useState } from "react";
import Navbar from '@/app/components/Navbar/Navbar';
import HeroSection from '../components/alejo-tools/HeroSection/HeroSection';
import ImageDropzone from '../components/alejo-tools/ImageDropzone/ImageDropzone';
import ResultsSummary from '../components/alejo-tools/ResultsSummary/ResultsSummary';
import { DetectorResult } from '../components/alejo-tools/types';

export default function AlejoToolsPage() {
    const [result, setResult] = useState<DetectorResult | null>(null);

    return (
        <div>
            <Navbar />
            <HeroSection />
            <ImageDropzone onResult={setResult} />
            <ResultsSummary result={result} />
        </div>
    );
}