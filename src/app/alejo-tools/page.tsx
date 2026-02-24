import Navbar from '@/app/components/Navbar/Navbar';
import HeroSection from '../components/alejo-tools/HeroSection/HeroSection';
import ImageDropzone from '../components/alejo-tools/ImageDropzone/ImageDropzone';
import ResultsSummary from '../components/alejo-tools/ResultsSummary/ResultsSummary';

export default function AlejoToolsPage() {
    return (
        <div>
            <Navbar />
            <HeroSection />
            <ImageDropzone />
            <ResultsSummary />
        </div>
    );
}