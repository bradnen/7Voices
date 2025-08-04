import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
              <a 
                href="#features" 
                className="text-gray-600 hover:text-black px-3 py-2 text-sm font-medium transition-colors"
              >
                Text to Speech
              </a>
              <a 
                href="#pricing" 
                className="text-gray-600 hover:text-black px-3 py-2 text-sm font-medium transition-colors"
              >
                Speech to Text
              </a>
              <a 
                href="#about" 
                className="text-gray-600 hover:text-black px-3 py-2 text-sm font-medium transition-colors"
              >
                Voice Cloning
              </a>
              <a 
                href="#pricing" 
                className="text-gray-600 hover:text-black px-3 py-2 text-sm font-medium transition-colors"
              >
                Pricing
              </a>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                className="border-gray-300 text-gray-700 hover:text-black hover:border-black"
              >
                Log in
              </Button>
              <Button 
                size="sm"
                className="bg-black text-white hover:bg-gray-800 rounded-lg"
              >
                Sign up
              </Button>
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
              <a 
                href="#features" 
                className="text-gray-600 hover:text-black block px-3 py-2 text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Text to Speech
              </a>
              <a 
                href="#pricing" 
                className="text-gray-600 hover:text-black block px-3 py-2 text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Speech to Text
              </a>
              <a 
                href="#about" 
                className="text-gray-600 hover:text-black block px-3 py-2 text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Voice Cloning
              </a>
              <a 
                href="#pricing" 
                className="text-gray-600 hover:text-black block px-3 py-2 text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Pricing
              </a>
              <div className="mt-2 flex flex-col space-y-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-gray-300 text-gray-700 hover:text-black hover:border-black"
                >
                  Log in
                </Button>
                <Button 
                  size="sm"
                  className="bg-black text-white hover:bg-gray-800 rounded-lg"
                >
                  Sign up
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}