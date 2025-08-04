import { useState } from "react";
import { Menu, X } from "lucide-react";
import AuthButton from "@/components/auth-button";

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-violet-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">7V</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">7Voice</h1>
            </div>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <a 
                href="#features" 
                className="text-gray-600 hover:text-purple-600 px-3 py-2 text-sm font-medium transition-colors"
              >
                Features
              </a>
              <a 
                href="#pricing" 
                className="text-gray-600 hover:text-purple-600 px-3 py-2 text-sm font-medium transition-colors"
              >
                Pricing
              </a>
              <a 
                href="#about" 
                className="text-gray-600 hover:text-purple-600 px-3 py-2 text-sm font-medium transition-colors"
              >
                About
              </a>
              <AuthButton />
            </div>
          </div>
          
          <div className="md:hidden">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 hover:text-purple-600"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
        
        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
              <a 
                href="#features" 
                className="text-gray-600 hover:text-purple-600 block px-3 py-2 text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Features
              </a>
              <a 
                href="#pricing" 
                className="text-gray-600 hover:text-purple-600 block px-3 py-2 text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Pricing
              </a>
              <a 
                href="#about" 
                className="text-gray-600 hover:text-purple-600 block px-3 py-2 text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </a>
              <div className="mt-2">
                <AuthButton />
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
