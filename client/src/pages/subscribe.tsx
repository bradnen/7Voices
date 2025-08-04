import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Crown, Check } from "lucide-react";
import { Link } from "wouter";

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  console.warn('VITE_STRIPE_PUBLIC_KEY not found, payment will not work');
}
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY) : null;

const SubscribeForm = ({ clientSecret }: { clientSecret: string }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!stripe || !elements) {
      setIsLoading(false);
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader className="text-center">
          <Crown className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
          <CardTitle>Complete Your Subscription</CardTitle>
          <CardDescription>Enter your payment details below</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <PaymentElement />
            <Button 
              type="submit" 
              className="w-full" 
              disabled={!stripe || isLoading}
              data-testid="button-complete-payment"
            >
              {isLoading ? "Processing..." : "Complete Payment"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default function Subscribe() {
  const [clientSecret, setClientSecret] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const { toast } = useToast();

  const plans = [
    {
      id: "pro",
      name: "Pro",
      price: "$9.99",
      period: "month",
      features: [
        "50,000 characters per month",
        "10 premium voices",
        "High-quality audio",
        "Commercial usage rights",
        "Priority support"
      ],
      priceId: "price_pro_monthly" // Replace with actual Stripe price ID
    },
    {
      id: "premium",
      name: "Premium", 
      price: "$19.99",
      period: "month",
      features: [
        "Unlimited characters",
        "All premium voices",
        "Highest quality audio",
        "Commercial usage rights",
        "Priority support",
        "Advanced voice controls",
        "API access"
      ],
      priceId: "price_premium_monthly", // Replace with actual Stripe price ID
      popular: true
    }
  ];

  const handleSelectPlan = async (plan: typeof plans[0]) => {
    setSelectedPlan(plan.id);
    
    try {
      const response = await apiRequest("POST", "/api/stripe/create-subscription", { 
        priceId: plan.priceId 
      });
      const data = await response.json();
      
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
      } else {
        throw new Error("No client secret received");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create subscription",
        variant: "destructive",
      });
    }
  };

  if (clientSecret && stripePromise) {
    return (
      <div className="min-h-screen bg-white py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
              ← Back to 7Voice
            </Link>
          </div>
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <SubscribeForm clientSecret={clientSecret} />
          </Elements>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
            ← Back to 7Voice
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mt-4 mb-2">
            Choose Your Plan
          </h1>
          <p className="text-gray-600">
            Unlock premium voices and unlimited generations
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative ${plan.popular ? 'ring-2 ring-black' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-black text-white text-xs px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <div className="text-3xl font-bold text-gray-900">
                  {plan.price}
                  <span className="text-sm font-normal text-gray-600">/{plan.period}</span>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  onClick={() => handleSelectPlan(plan)}
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                  disabled={selectedPlan === plan.id}
                  data-testid={`button-select-${plan.id}`}
                >
                  {selectedPlan === plan.id ? "Processing..." : `Get ${plan.name}`}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12 text-sm text-gray-500">
          <p>All plans include a 7-day free trial. Cancel anytime.</p>
          <p className="mt-2">Payments are processed securely by Stripe.</p>
        </div>
      </div>
    </div>
  );
}