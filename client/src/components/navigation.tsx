import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, X, Mail, User, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmailLogin } from "./email-login";
import { EmailSignup } from "./email-signup";

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();

  const logoutMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/logout"),
    onSuccess: () => {
      queryClient.clear();
      window.location.href = "/";
    },
  });

  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [showEmailSignup, setShowEmailSignup] = useState(false);

  return (
    <nav className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center gap-2">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">7V</span>
              </div>
              <h1 className="text-2xl font-bold text-black">7Voice</h1>
            </div>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <Link href="/" className="text-gray-600 hover:text-black px-3 py-2 text-sm font-medium transition-colors">
                Text to Speech
              </Link>
              <button 
                className="text-gray-400 px-3 py-2 text-sm font-medium cursor-not-allowed"
                disabled
                title="Coming Soon"
              >
                Speech to Text
              </button>
              <button 
                className="text-gray-400 px-3 py-2 text-sm font-medium cursor-not-allowed"
                disabled
                title="Coming Soon"
              >
                Voice Cloning
              </button>
              <Link href="/subscribe" className="text-gray-600 hover:text-black px-3 py-2 text-sm font-medium transition-colors">
                Pricing
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2">
              {isLoading ? (
                <div className="w-8 h-8 animate-spin border-2 border-gray-300 border-t-black rounded-full" />
              ) : isAuthenticated && user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 p-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={user.avatarUrl || undefined} alt={user.displayName || "User"} />
                        <AvatarFallback>
                          {user.displayName?.charAt(0) || user.username?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{user.displayName || user.username}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <Link href="/dashboard">
                      <DropdownMenuItem className="cursor-pointer">
                        <User className="w-4 h-4 mr-2" />
                        Dashboard
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuItem 
                      onClick={() => logoutMutation.mutate()}
                      disabled={logoutMutation.isPending}
                      className="cursor-pointer text-red-600"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      {logoutMutation.isPending ? "Signing out..." : "Sign out"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-gray-300 text-gray-700 hover:text-black hover:border-black"
                    onClick={() => setShowEmailLogin(true)}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Log in
                  </Button>
                  <Button 
                    size="sm"
                    className="bg-black text-white hover:bg-gray-800 rounded-lg"
                    onClick={() => setShowEmailSignup(true)}
                  >
                    Sign up
                  </Button>
                  <Link href="/subscribe">
                    <Button 
                      size="sm"
                      className="bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 rounded-lg"
                    >
                      Upgrade Pro
                    </Button>
                  </Link>
                </>
              )}
            </div>
            
            <div className="md:hidden">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-600 hover:text-black"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
              <Link 
                href="/" 
                className="text-gray-600 hover:text-black block px-3 py-2 text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Text to Speech
              </Link>
              <button 
                className="text-gray-400 block px-3 py-2 text-base font-medium cursor-not-allowed w-full text-left"
                disabled
                title="Coming Soon"
              >
                Speech to Text
              </button>
              <button 
                className="text-gray-400 block px-3 py-2 text-base font-medium cursor-not-allowed w-full text-left"
                disabled
                title="Coming Soon"
              >
                Voice Cloning
              </button>
              <Link 
                href="/subscribe" 
                className="text-gray-600 hover:text-black block px-3 py-2 text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Pricing
              </Link>
              <div className="mt-2 flex flex-col space-y-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-gray-300 text-gray-700 hover:text-black hover:border-black"
                  onClick={() => setShowEmailLogin(true)}
                >
                  Log in
                </Button>
                <Button 
                  size="sm"
                  className="bg-black text-white hover:bg-gray-800 rounded-lg"
                  onClick={() => setShowEmailSignup(true)}
                >
                  Sign up
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Email Login Dialog */}
      <Dialog open={showEmailLogin} onOpenChange={setShowEmailLogin}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Welcome Back</DialogTitle>
            <DialogDescription>
              Sign in with your email to access your account and premium features.
            </DialogDescription>
          </DialogHeader>
          <EmailLogin onLoginSuccess={() => setShowEmailLogin(false)} />
        </DialogContent>
      </Dialog>

      {/* Email Signup Dialog */}
      <Dialog open={showEmailSignup} onOpenChange={setShowEmailSignup}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Join 7Voice</DialogTitle>
            <DialogDescription>
              Create your account to unlock premium text-to-speech features and save your generation history.
            </DialogDescription>
          </DialogHeader>
          <EmailSignup onSignupSuccess={() => setShowEmailSignup(false)} />
        </DialogContent>
      </Dialog>
    </nav>
  );
}