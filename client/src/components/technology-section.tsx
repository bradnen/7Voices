import { Settings, Radio, Cloud } from "lucide-react";

export default function TechnologySection() {
  const technologies = [
    {
      icon: Settings,
      title: "Advanced Neural Processing",
      description: "Deep learning models trained on millions of hours of human speech patterns.",
    },
    {
      icon: Radio,
      title: "Real-time Audio Generation",
      description: "Instant processing and generation of high-quality audio files.",
    },
    {
      icon: Cloud,
      title: "Cloud-Based Infrastructure",
      description: "Scalable, reliable, and secure processing in the cloud.",
    },
  ];

  return (
    <section id="about" className="py-20 bg-navy-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              The Technology Behind <span className="text-turquoise-400">7Voice</span>
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Our platform leverages OpenAI's cutting-edge text-to-speech API combined with advanced neural networks to deliver unparalleled voice synthesis quality.
            </p>
            
            <div className="space-y-6">
              {technologies.map((tech, index) => {
                const IconComponent = tech.icon;
                return (
                  <div key={index} className="flex items-start">
                    <div className="bg-turquoise-500 w-8 h-8 rounded-full flex items-center justify-center mr-4 mt-1">
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">{tech.title}</h3>
                      <p className="text-gray-300">{tech.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="gradient-turquoise rounded-3xl p-8">
            <img 
              src="https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
              alt="AI technology visualization with neural networks and sound waves"
              className="rounded-2xl shadow-2xl w-full h-auto"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
