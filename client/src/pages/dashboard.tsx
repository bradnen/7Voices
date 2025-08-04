import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Github, LogOut, Crown, Zap, Settings } from "lucide-react";
import { Link, useLocation } from "wouter";
import type { TtsRequest } from "@shared/schema";
import { useEffect } from "react";

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location] = useLocation();

  // Check for payment success redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment') === 'success') {
      toast({
        title: "Payment Successful!",
        description: "Your subscription is now active. Welcome to your new plan!",
      });
      
      // Clear the URL parameter
      window.history.replaceState({}, '', '/dashboard');
      
      // Refresh subscription status
      queryClient.invalidateQueries({ queryKey: ["/api/subscription/status"] });
    }
  }, [location, toast, queryClient]);

  const { data: ttsHistory } = useQuery<TtsRequest[]>({
    queryKey: ["/api/tts/history"],
    enabled: !!user,
  });

  const { data: subscriptionStatus } = useQuery({
    queryKey: ["/api/subscription/status"],
    enabled: !!user,
  });

  const logoutMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/logout"),
    onSuccess: () => {
      queryClient.clear();
      window.location.href = "/";
    },
    onError: () => {
      toast({
        title: "Logout failed",
        description: "Please try again",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full" />
          <p className="text-gray-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardHeader className="text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
            <CardTitle className="text-2xl font-bold">Access Required</CardTitle>
            <CardDescription className="text-blue-100">Please sign in to view your dashboard</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Link href="/">
              <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Github className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case "pro":
        return <Badge className="bg-blue-500 text-white shadow-lg"><Zap className="w-3 h-3 mr-1" />Pro Plan</Badge>;
      case "premium":
        return <Badge className="bg-purple-500 text-white shadow-lg"><Crown className="w-3 h-3 mr-1" />Premium Plan</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white shadow-lg">Free Plan</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <img src="/logo.svg" alt="7Voices" className="h-10 w-auto" />
            </Link>
            <Button
              variant="outline"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              className="border-gray-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {logoutMutation.isPending ? "Signing out..." : "Sign out"}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Welcome Banner */}
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 shadow-xl">
            <CardContent className="p-8">
              <div className="flex items-center space-x-6">
                <Avatar className="w-20 h-20 border-4 border-white/20">
                  <AvatarImage src={user.avatarUrl || undefined} alt={user.displayName || "User"} />
                  <AvatarFallback className="text-2xl bg-white/20 text-white">
                    {user.displayName?.charAt(0) || user.username?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h2 className="text-3xl font-bold mb-2">
                    Welcome back, {user.displayName || user.username}!
                  </h2>
                  <p className="text-blue-100 text-lg mb-4">
                    Ready to create amazing voice content with 7Voices?
                  </p>
                  <div className="flex items-center space-x-4">
                    {getPlanBadge(user.subscriptionPlan || "free")}
                    <span className="text-blue-100">•</span>
                    <span className="text-blue-100">
                      Member since {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recently'}
                    </span>
                  </div>
                </div>
                <div className="hidden md:block">
                  <Link href="/">
                    <Button size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-blue-50">
                      Create Voice
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Quick Stats */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {ttsHistory?.length || 0}
                  </div>
                  <div className="text-gray-600 font-medium">Voice Generations</div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {(subscriptionStatus as any)?.subscriptionPlan === 'free' ? 'Free' : 
                     (subscriptionStatus as any)?.subscriptionPlan === 'pro' ? 'Pro' : 'Premium'}
                  </div>
                  <div className="text-gray-600 font-medium">Current Plan</div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {(subscriptionStatus as any)?.subscriptionStatus === 'active' ? 'Active' : 'Inactive'}
                  </div>
                  <div className="text-gray-600 font-medium">Status</div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl text-gray-800">Recent Voice Generations</CardTitle>
                <CardDescription>Your latest text-to-speech creations</CardDescription>
              </CardHeader>
              <CardContent>
                {ttsHistory && ttsHistory.length > 0 ? (
                  <div className="space-y-4">
                    {ttsHistory.slice(0, 3).map((request) => (
                      <div key={request.id} className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm text-gray-600 mb-2">
                              {request.text.length > 50 ? 
                                `${request.text.substring(0, 50)}...` : 
                                request.text}
                            </p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span>Voice: {request.voice}</span>
                              <span>•</span>
                              <span>{new Date(request.createdAt || '').toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Settings className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">No voice generations yet</p>
                    <p className="text-sm">Start creating amazing voice content with 7Voices!</p>
                    <Link href="/">
                      <Button className="mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                        Create Your First Voice
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Account Info */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-gray-800">Account Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Email</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Username</p>
                    <p className="text-sm text-gray-600">@{user.username}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Plan</p>
                    <div className="mt-1">{getPlanBadge(user.subscriptionPlan || "free")}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-gray-800">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/">
                  <Button variant="outline" className="w-full justify-start hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50">
                    <Settings className="w-4 h-4 mr-2" />
                    Generate Voice
                  </Button>
                </Link>
                {user.subscriptionPlan === 'free' && (
                  <Link href="/subscribe">
                    <Button className="w-full justify-start bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                      <Crown className="w-4 h-4 mr-2" />
                      Upgrade Plan
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}