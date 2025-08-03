import { Brain, Sliders, Users, Download, Smartphone, Shield } from "lucide-react";

export default function FeaturesSection() {
  const features = [
    {
      icon: Brain,
      title: "Neural Voice Synthesis",
      description: "Advanced neural networks create incredibly lifelike speech patterns with natural intonation and emotion.",
    },
    {
      icon: Sliders,
      title: "Full Customization",
      description: "Fine-tune speed, pitch, tone, and emotional expression to match your exact requirements.",
    },
    {
      icon: Users,
      title: "Multiple Voices",
      description: "Choose from a diverse range of professional voices, each with unique characteristics and personalities.",
    },
    {
      icon: Download,
      title: "Instant Download",
      description: "Generate and download high-quality MP3 files instantly for use in any project or application.",
    },
    {
      icon: Smartphone,
      title: "Mobile Optimized",
      description: "Perfect experience across all devices with responsive design and mobile-first approach.",
    },
    {
      icon: Shield,
      title: "Enterprise Ready",
      description: "Secure, scalable, and reliable infrastructure built for businesses of all sizes.",
    },
  ];

  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-navy-900 mb-4">
            Powered by Advanced AI Technology
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            7Voice leverages cutting-edge artificial intelligence to deliver the most natural and expressive text-to-speech experience available.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div key={index} className="bg-gray-50 rounded-2xl p-8 text-center hover:shadow-lg transition-shadow">
                <div className="bg-turquoise-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <IconComponent className="text-white w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-navy-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
