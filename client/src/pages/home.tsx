import Navigation from "@/components/navigation";
import TtsInterface from "@/components/tts-interface";
import FeaturesSection from "@/components/features-section";
import TestimonialsSection from "@/components/testimonials-section";
import PricingSection from "@/components/pricing-section";
import TechnologySection from "@/components/technology-section";
import Footer from "@/components/footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Hero Section */}
      <div className="gradient-navy text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Transform Text to{" "}
              <span className="text-turquoise-400">Natural Speech</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Experience the most advanced AI-powered text-to-speech technology with lifelike voices and complete customization control.
            </p>
          </div>

          <TtsInterface />
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
