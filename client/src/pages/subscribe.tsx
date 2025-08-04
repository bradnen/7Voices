import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

// Initialize Stripe
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

const PRICING_PLANS = {
  pro: {
    name: "Pro",
    price: "$9.99",
    priceId: "price_pro_monthly", // Replace with actual Stripe price ID
    features: [
      "1,000 characters per generation",
      "All 6 premium voices",
      "Advanced audio controls",
      "MP3 downloads",
      "Priority processing"
    ]
  },
  premium: {
    name: "Premium", 
    price: "$19.99",
    priceId: "price_premium_monthly", // Replace with actual Stripe price ID
    features: [
      "Unlimited characters",
      "All premium voices",
      "Advanced audio controls", 
      "Multiple format downloads",
      "Priority processing",
      "API access",
      "Commercial usage rights"
    ]
  }
};

interface CheckoutFormProps {
  plan: 'pro' | 'premium';
}

function CheckoutForm({ plan }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/?payment=success`,
        },
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Payment Failed",
        description: err.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe || isLoading} 
        className="w-full bg-turquoise-500 hover:bg-turquoise-400"
        data-testid="submit-payment"
      >
        {isLoading ? "Processing..." : `Subscribe to ${PRICING_PLANS[plan].name} ${PRICING_PLANS[plan].price}/month`}
      </Button>
    </form>
  );
}

interface SubscriptionPageProps {
  plan: 'pro' | 'premium';
}

function SubscriptionPage({ plan }: SubscriptionPageProps) {
  const [clientSecret, setClientSecret] = useState("");
  const { toast } = useToast();
  const planDetails = PRICING_PLANS[plan];

  useEffect(() => {
    // Create subscription with Stripe
    apiRequest("POST", "/api/stripe/create-subscription", { 
      priceId: planDetails.priceId 
    })
      .then((data) => {
        setClientSecret(data.clientSecret);
      })
      .catch((error) => {
        toast({
          title: "Setup Failed",
          description: error.message || "Failed to setup payment. Please try again.",
          variant: "destructive",
        });
      });
  }, [planDetails.priceId, toast]);

  if (!stripePromise) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Payment Not Available</CardTitle>
            <CardDescription className="text-center">
              Stripe is not configured for this environment.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-turquoise-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-navy-900">Subscribe to 7Voice {planDetails.name}</h1>
          <p className="text-gray-600 mt-2">Get unlimited access to premium text-to-speech features</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Plan Details */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{planDetails.name} Plan</CardTitle>
                <Badge variant="secondary" className="bg-turquoise-100 text-turquoise-700">
                  {planDetails.price}/month
                </Badge>
              </div>
              <CardDescription>Everything you need for professional text-to-speech</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {planDetails.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-turquoise-500 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
              <CardDescription>Complete your subscription to get started</CardDescription>
            </CardHeader>
            <CardContent>
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <CheckoutForm plan={plan} />
              </Elements>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function Subscribe() {
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'premium'>('pro');

  // Get plan from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const plan = params.get('plan');
    if (plan === 'pro' || plan === 'premium') {
      setSelectedPlan(plan);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-turquoise-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Sign In Required</CardTitle>
            <CardDescription className="text-center">
              Please sign in to subscribe to a premium plan.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button 
              onClick={() => window.location.href = "/api/auth/google"}
              className="bg-turquoise-500 hover:bg-turquoise-400"
            >
              Sign In with Google
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <SubscriptionPage plan={selectedPlan} />;
}