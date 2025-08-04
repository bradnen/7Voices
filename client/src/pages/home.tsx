import Navigation from "@/components/navigation";
import TTSInterfaceElevenLabs from "@/components/tts-interface-elevenlabs";
import FeaturesSection from "@/components/features-section";
import TestimonialsSection from "@/components/testimonials-section";
import PricingSection from "@/components/pricing-section";
import TechnologySection from "@/components/technology-section";
import Footer from "@/components/footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Hero Section - ElevenLabs Style */}
      <div className="bg-gradient-to-br from-purple-50 via-white to-violet-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-violet-600 to-purple-700 bg-clip-text text-transparent">
              Transform Text into{" "}
              <span className="block">Lifelike Speech</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Generate natural, human-like speech from text using advanced AI. Perfect for content creation, accessibility, and professional applications.
            </p>
          </div>

          <TTSInterfaceElevenLabs />
        </div>
      </div>

      <FeaturesSection />
      <TestimonialsSection />
      <PricingSection />
      <TechnologySection />
      <Footer />
    </div>
  );
}
