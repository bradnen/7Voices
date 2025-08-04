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
import { Link } from "wouter";
import type { TtsRequest } from "@shared/schema";

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: ttsHistory } = useQuery<TtsRequest[]>({
    queryKey: ["/api/tts/history"],
    enabled: !!user,
  });

  const { data: subscriptionStatus } = useQuery({
    queryKey: ["/api/stripe/subscription-status"],
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-black border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Access Required</CardTitle>
            <CardDescription>Please sign in to view your dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button className="w-full">
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
        return <Badge className="bg-blue-100 text-blue-800"><Zap className="w-3 h-3 mr-1" />Pro</Badge>;
      case "premium":
        return <Badge className="bg-purple-100 text-purple-800"><Crown className="w-3 h-3 mr-1" />Premium</Badge>;
      default:
        return <Badge variant="secondary">Free</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <h1 className="text-2xl font-bold text-black">7Voice</h1>
            </Link>
            <Button
              variant="outline"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="w-4 h-4 mr-2" />
              {logoutMutation.isPending ? "Signing out..." : "Sign out"}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Profile Section */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader className="text-center">
                <Avatar className="w-20 h-20 mx-auto mb-4">
                  <AvatarImage src={user.avatarUrl || undefined} alt={user.displayName || "User"} />
                  <AvatarFallback className="text-lg">
                    {user.displayName?.charAt(0) || user.username?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="text-xl">{user.displayName || user.username}</CardTitle>
                <CardDescription>@{user.username}</CardDescription>
                <div className="flex justify-center mt-2">
                  {getPlanBadge(user.subscriptionPlan || "free")}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Github className="w-4 h-4 mr-2" />
                  GitHub Account
                </div>
                {user.email && (
                  <div className="text-sm text-gray-600">
                    {user.email}
                  </div>
                )}
                <Separator />
                <div className="text-xs text-gray-500">
                  Member since {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recently'}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/">
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="w-4 h-4 mr-2" />
                    Generate Speech
                  </Button>
                </Link>
                <Link href="/subscribe">
                  <Button variant="outline" className="w-full justify-start">
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade Plan
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Generations</CardDescription>
                  <CardTitle className="text-2xl">{ttsHistory?.length || 0}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Current Plan</CardDescription>
                  <CardTitle className="text-lg">{user.subscriptionPlan || "Free"}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Account Status</CardDescription>
                  <CardTitle className="text-lg">
                    {(subscriptionStatus as any)?.active ? "Active" : "Free"}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Generations</CardTitle>
                <CardDescription>Your latest text-to-speech requests</CardDescription>
              </CardHeader>
              <CardContent>
                {ttsHistory && ttsHistory.length > 0 ? (
                  <div className="space-y-4">
                    {ttsHistory.slice(0, 5).map((request) => (
                      <div key={request.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium mb-1">
                              {request.text.substring(0, 100)}
                              {request.text.length > 100 ? "..." : ""}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <span>Voice: {request.voice}</span>
                              <span>Speed: {request.speed}x</span>
                              {request.tone && <span>Tone: {request.tone}</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No generations yet</p>
                    <p className="text-sm mt-1">Start creating speech from text!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}