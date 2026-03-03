"use client";

import { useState } from "react";
import Navbar from '@/app/components/Navbar/Navbar';
import HeroSection from '../components/alejo-tools/HeroSection/HeroSection';
import ImageDropzone from '../components/alejo-tools/ImageDropzone/ImageDropzone';
import ResultsSummary from '../components/alejo-tools/ResultsSummary/ResultsSummary';
import SupportCard from '../components/alejo-tools/SupportCard/SupportCard';
import { DetectorResult } from '../components/alejo-tools/types';
import styles from './page.module.scss';

export default function AlejoToolsPage() {
    const [result, setResult] = useState<DetectorResult | null>(null);

    return (
        <div className={styles.pageShell}>
            <Navbar />
            <main className={styles.pageContent}>
                <section className={styles.contentColumn}>
                    <HeroSection />
                    <ImageDropzone onResult={setResult} />
                    <ResultsSummary result={result} />
                </section>
                <aside className={styles.supportColumn}>
                    <SupportCard />
                </aside>
            </main>
        </div>
    );
}