import { Check, X, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PricingSection() {
  const freeTierFeatures = [
    { text: "1,000 characters per month", included: true },
    { text: "3 AI voices available", included: true },
    { text: "MP3 downloads", included: true },
    { text: "Basic customization", included: true },
    { text: "No commercial use", included: false },
  ];

  const premiumTierFeatures = [
    { text: "100,000 characters per month", included: true },
    { text: "All 20+ premium AI voices", included: true },
    { text: "High-quality MP3 downloads", included: true },
    { text: "Advanced customization", included: true },
    { text: "Commercial license included", included: true },
    { text: "Priority support", included: true },
  ];

  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-navy-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600">
            Choose the plan that fits your needs
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Tier */}
          <div className="bg-gray-50 rounded-2xl p-8 border-2 border-gray-200">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-navy-900 mb-2">Free</h3>
              <div className="text-4xl font-bold text-navy-900 mb-2">
                $0<span className="text-lg font-normal text-gray-600">/month</span>
              </div>
              <p className="text-gray-600">Perfect for trying out 7Voice</p>
            </div>
            <ul className="space-y-4 mb-8">
              {freeTierFeatures.map((feature, index) => (
                <li key={index} className="flex items-center">
                  {feature.included ? (
                    <Check className="text-turquoise-500 w-5 h-5 mr-3" />
                  ) : (
                    <X className="text-gray-400 w-5 h-5 mr-3" />
                  )}
                  <span className={feature.included ? "" : "text-gray-400"}>
                    {feature.text}
                  </span>
                </li>
              ))}
            </ul>
            <Button 
              variant="secondary" 
              className="w-full py-3 font-semibold"
            >
              Get Started Free
            </Button>
          </div>

          {/* Premium Tier */}
          <div className="gradient-turquoise rounded-2xl p-8 text-white relative">
            <div className="absolute top-4 right-4 bg-white text-turquoise-500 px-3 py-1 rounded-full text-sm font-semibold">
              Most Popular
            </div>
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-2">Premium</h3>
              <div className="text-4xl font-bold mb-2">
                $19<span className="text-lg font-normal opacity-80">/month</span>
              </div>
              <p className="opacity-90">For professionals and businesses</p>
            </div>
            <ul className="space-y-4 mb-8">
              {premiumTierFeatures.map((feature, index) => (
                <li key={index} className="flex items-center">
                  <Check className="w-5 h-5 mr-3" />
                  <span>{feature.text}</span>
                </li>
              ))}
            </ul>
            <Button 
              variant="secondary"
              className="w-full bg-white text-turquoise-500 py-3 font-semibold hover:bg-gray-100"
            >
              Start Premium Trial
            </Button>
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">
            Need more?{" "}
            <a href="#" className="text-turquoise-500 hover:text-turquoise-400">
              Contact us
            </a>{" "}
            for enterprise solutions.
          </p>
          <div className="flex justify-center items-center space-x-8 text-sm text-gray-500">
            <div className="flex items-center">
              <Shield className="w-4 h-4 mr-2" />
              <span>30-day money back</span>
            </div>
            <div className="flex items-center">
              <Check className="w-4 h-4 mr-2" />
              <span>No setup fees</span>
            </div>
            <div className="flex items-center">
              <X className="w-4 h-4 mr-2" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
