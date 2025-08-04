import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface EmailLoginProps {
  onLoginSuccess?: () => void;
}

export function EmailLogin({ onLoginSuccess }: EmailLoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await apiRequest("POST", "/api/auth/login", { email, password });
      
      // Invalidate user query to refresh auth state
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      // Refetch user data to ensure it's updated
      await queryClient.refetchQueries({ queryKey: ["/api/auth/user"] });
      
      toast({
        title: "Welcome!",
        description: "You've been logged in successfully",
      });

      if (onLoginSuccess) {
        onLoginSuccess();
      }

      // Redirect to dashboard after successful login
      setTimeout(() => {
        setLocation("/dashboard");
      }, 1000); // Increased delay to ensure query completion
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Failed to log in",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Mail className="h-5 w-5" />
          Sign In
        </CardTitle>
        <CardDescription>
          Enter your email and password to access 7Voices
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              data-testid="input-email"
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              data-testid="input-password"
              className="w-full"
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={isLoading || !email || !password}
            data-testid="button-login"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}