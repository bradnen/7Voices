import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-navy-900">7Voice</h1>
            </div>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <a 
                href="#features" 
                className="text-navy-700 hover:text-turquoise-500 px-3 py-2 text-sm font-medium transition-colors"
              >
                Features
              </a>
              <a 
                href="#pricing" 
                className="text-navy-700 hover:text-turquoise-500 px-3 py-2 text-sm font-medium transition-colors"
              >
                Pricing
              </a>
              <a 
                href="#about" 
                className="text-navy-700 hover:text-turquoise-500 px-3 py-2 text-sm font-medium transition-colors"
              >
                About
              </a>
              <button className="bg-turquoise-500 hover:bg-turquoise-400 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors">
                Get Started
              </button>
            </div>
          </div>
          
          <div className="md:hidden">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-navy-700 hover:text-turquoise-500"
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
                className="text-navy-700 hover:text-turquoise-500 block px-3 py-2 text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Features
              </a>
              <a 
                href="#pricing" 
                className="text-navy-700 hover:text-turquoise-500 block px-3 py-2 text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Pricing
              </a>
              <a 
                href="#about" 
                className="text-navy-700 hover:text-turquoise-500 block px-3 py-2 text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </a>
              <button className="w-full text-left bg-turquoise-500 hover:bg-turquoise-400 text-white px-3 py-2 rounded-lg text-base font-medium transition-colors mt-2">
                Get Started
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
