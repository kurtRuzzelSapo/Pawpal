import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { FaPaw, FaHome, FaUserFriends, FaHandHoldingHeart, FaArrowRight, FaDog, FaCat, FaDove, FaChevronDown } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

const LandingPage = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const { user } = useAuth();
  const featuresRef = useRef<HTMLDivElement>(null);

  // Animation effect
  useEffect(() => {
    setIsVisible(true);

    // Add scroll animation for elements
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -100px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.reveal');
    animatedElements.forEach(el => observer.observe(el));

    return () => {
      animatedElements.forEach(el => observer.unobserve(el));
    };
  }, []);

  // If user is already logged in and tries to access landing page, redirect to home
  useEffect(() => {
    if (user) {
      navigate('/home');
    }
  }, [user, navigate]);

  const handleGetStarted = () => {
    navigate("/login");
  };

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-violet-50 to-green-50">
      {/* Animated Paw Prints Background */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-10">
        {Array.from({ length: 20 }).map((_, i) => (
          <FaPaw
              key={i} 
            className="absolute text-violet-600 animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              fontSize: `${Math.random() * 2 + 1}rem`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${Math.random() * 10 + 15}s`,
              transform: `rotate(${Math.random() * 360}deg)`,
            }}
          />
        ))}
      </div>
      
      {/* Navigation Bar */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm fixed w-full z-50">
        <div className="w-full px-2 sm:px-4 md:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <FaPaw className="text-violet-600 text-3xl mr-2" />
              <span className="font-bold text-2xl text-violet-900 font-['Quicksand']">SmartPet</span>
            </div>
            <div className="flex items-center">
              <Link to="/about" className="px-3 py-2 rounded-md text-sm font-medium text-violet-700 hover:text-violet-900 hover:bg-violet-100 transition-all duration-200 font-['Poppins']">About</Link>
              <Link to="/contact" className="px-3 py-2 rounded-md text-sm font-medium text-violet-700 hover:text-violet-900 hover:bg-violet-100 transition-all duration-200 font-['Poppins']">Contact</Link>
              <button
                onClick={handleGetStarted}
                className="ml-4 px-4 py-2 rounded-full text-sm font-medium text-white bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg font-['Poppins']"
              >
                Login / Sign Up
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1450778869180-41d0601e046e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80" 
            alt="Background" 
            className="w-full h-full object-cover filter brightness-50"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-violet-900/60 via-blue-900/40 to-green-900/20"></div>
        </div>
        <div className={`relative z-10 text-center px-4 max-w-4xl mx-auto transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="bg-gradient-to-br from-violet-600 to-blue-600 p-4 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-8 shadow-lg shadow-violet-500/20">
            <FaPaw className="text-white text-5xl animate-pulse" />
          </div>
          <h1 className="text-6xl md:text-8xl font-bold mb-8 text-white font-['Quicksand'] tracking-wide drop-shadow-lg">
            Welcome to SmartPet
          </h1>
          <p className="text-2xl md:text-3xl mb-12 text-blue-50 font-light leading-relaxed font-['Poppins'] drop-shadow-md">
            A loving community where pets and their humans come together
          </p>
          <button
            onClick={handleGetStarted}
            className="bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 text-white px-12 py-5 rounded-full text-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl font-['Poppins'] flex items-center justify-center mx-auto group"
          >
            Join Our Family
            <FaArrowRight className="ml-2 transform group-hover:translate-x-1 transition-transform duration-300" />
          </button>
          
          <button onClick={scrollToFeatures} className="absolute bottom-10 left-1/2 transform -translate-x-1/2 text-white flex flex-col items-center animate-bounce">
            <span className="text-sm mb-2 font-['Poppins']">Learn More</span>
            <FaChevronDown />
          </button>
        </div>
      </div>

      {/* Features Section */}
      <div ref={featuresRef} className="py-24 px-4 bg-gradient-to-b from-white via-blue-50/30 to-violet-50/30 relative overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20 reveal">
            <span className="bg-violet-100 text-violet-800 px-4 py-1 rounded-full text-sm font-medium font-['Poppins'] mb-4 inline-block">Why Choose Us</span>
            <h2 className="text-5xl font-['Quicksand'] font-bold text-violet-900">
              Why Choose SmartPet?
          </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-violet-500 to-blue-500 mx-auto mt-6"></div>
            </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center p-8 rounded-3xl bg-white hover:bg-gradient-to-b hover:from-white hover:via-blue-50 hover:to-violet-50 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-violet-100 group reveal">
              <div className="bg-violet-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-gradient-to-br group-hover:from-violet-500 group-hover:to-blue-500 transition-all duration-500">
                <FaHome className="text-4xl text-violet-600 group-hover:text-white transition-all duration-500" />
              </div>
              <h3 className="text-2xl font-['Quicksand'] font-semibold mb-4 text-blue-900">Find a Forever Home</h3>
              <p className="text-violet-700 leading-relaxed font-['Poppins']">Connect with loving families looking to adopt and give pets their forever homes. Our matching system helps find the perfect fit.</p>
            </div>

            <div className="text-center p-8 rounded-3xl bg-white hover:bg-gradient-to-b hover:from-white hover:via-blue-50 hover:to-violet-50 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-violet-100 group reveal">
              <div className="bg-violet-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-gradient-to-br group-hover:from-violet-500 group-hover:to-blue-500 transition-all duration-500">
                <FaUserFriends className="text-4xl text-violet-600 group-hover:text-white transition-all duration-500" />
              </div>
              <h3 className="text-2xl font-['Quicksand'] font-semibold mb-4 text-blue-900">Join Communities</h3>
              <p className="text-violet-700 leading-relaxed font-['Poppins']">Connect with fellow pet lovers and share your experiences in our caring communities. Discuss, learn, and grow together.</p>
            </div>

            <div className="text-center p-8 rounded-3xl bg-white hover:bg-gradient-to-b hover:from-white hover:via-blue-50 hover:to-violet-50 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-violet-100 group reveal">
              <div className="bg-violet-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-gradient-to-br group-hover:from-violet-500 group-hover:to-blue-500 transition-all duration-500">
                <FaHandHoldingHeart className="text-4xl text-violet-600 group-hover:text-white transition-all duration-500" />
              </div>
              <h3 className="text-2xl font-['Quicksand'] font-semibold mb-4 text-blue-900">Expert Care Tips</h3>
              <p className="text-violet-700 leading-relaxed font-['Poppins']">Access valuable pet care advice from experienced pet owners and professionals. Learn the best practices for your furry friends.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pet Categories */}
      <div className="py-24 px-4 bg-gradient-to-b from-violet-50/50 via-blue-50/50 to-green-50/50 backdrop-blur-sm relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20 reveal">
            <span className="bg-green-100 text-green-800 px-4 py-1 rounded-full text-sm font-medium font-['Poppins'] mb-4 inline-block">Meet Them</span>
            <h2 className="text-5xl font-['Quicksand'] font-bold text-violet-900">
              Our Furry Friends
          </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-violet-500 to-blue-500 mx-auto mt-6"></div>
      </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Dogs */}
            <div className="rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 group reveal">
              <div className="relative h-80">
                <img 
                  src="https://images.unsplash.com/photo-1450778869180-41d0601e046e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
                  alt="Dogs" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-violet-900/80 via-violet-900/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-8">
                  <div>
                    <div className="flex items-center mb-2">
                      <FaDog className="text-white mr-2" />
                      <h3 className="text-3xl font-['Quicksand'] font-bold text-white drop-shadow-lg">Dogs</h3>
              </div>
                    <p className="text-white text-sm font-['Poppins'] opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">Find loyal companions that will fill your home with love and joy</p>
                </div>
                </div>
              </div>
            </div>
            
            {/* Cats */}
            <div className="rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 group reveal">
              <div className="relative h-80">
                <img 
                  src="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
                  alt="Cats" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-violet-900/80 via-violet-900/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-8">
                  <div>
                    <div className="flex items-center mb-2">
                      <FaCat className="text-white mr-2" />
                      <h3 className="text-3xl font-['Quicksand'] font-bold text-white drop-shadow-lg">Cats</h3>
                    </div>
                    <p className="text-white text-sm font-['Poppins'] opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">Discover charming and independent feline friends for your home</p>
                </div>
                </div>
              </div>
            </div>
            
            {/* Other Pets */}
            <div className="rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 group reveal">
              <div className="relative h-80">
                <img 
                  src="https://images.unsplash.com/photo-1425082661705-1834bfd09dca?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
                  alt="Other Pets" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-violet-900/80 via-violet-900/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-8">
                  <div>
                    <div className="flex items-center mb-2">
                      <FaDove className="text-white mr-2" />
                      <h3 className="text-3xl font-['Quicksand'] font-bold text-white drop-shadow-lg">Other Pets</h3>
                    </div>
                    <p className="text-white text-sm font-['Poppins'] opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">Explore our variety of unique pets waiting for their forever homes</p>
                </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="py-24 px-4 bg-gradient-to-b from-white via-violet-50/30 to-blue-50/30 relative">
        <div className="max-w-4xl mx-auto text-center reveal">
          <div className="bg-white rounded-3xl p-12 md:p-16 shadow-2xl border border-violet-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 via-blue-500 to-green-400"></div>
            <div className="absolute top-0 right-0 -mt-10 -mr-10">
              <FaPaw className="text-violet-100 text-9xl transform rotate-12" />
            </div>
            
            <h2 className="text-4xl md:text-5xl font-['Quicksand'] font-bold mb-8 text-violet-900 relative z-10">Ready to Join Our Pet-Loving Family?</h2>
            <p className="text-xl md:text-2xl mb-12 text-blue-800 leading-relaxed font-['Poppins'] relative z-10">
              Start your journey with us and become part of a caring community that loves pets as much as you do.
            </p>
            <button
              onClick={handleGetStarted}
              className="bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 text-white px-12 py-6 rounded-full text-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl font-['Poppins'] flex items-center mx-auto justify-center group relative z-10"
            >
              Get Started Today
              <FaArrowRight className="ml-2 transform group-hover:translate-x-1 transition-transform duration-300" />
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-12 px-4 bg-gradient-to-br from-violet-900 via-blue-900 to-green-900 text-white relative">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-8 md:mb-0">
              <div className="bg-white/10 rounded-full p-3 mr-3">
                <FaPaw className="text-violet-300 text-3xl" />
              </div>
              <span className="text-3xl font-['Quicksand'] font-bold">SmartPet</span>
            </div>
            <div className="flex flex-wrap justify-center gap-6 md:gap-8">
              <Link to="/home" className="text-lg hover:text-violet-300 transition-colors font-['Poppins'] flex items-center">
                <span className="bg-white/10 w-1 h-1 rounded-full mr-2"></span>
                Home
              </Link>
              <Link to="/about" className="text-lg hover:text-violet-300 transition-colors font-['Poppins'] flex items-center">
                <span className="bg-white/10 w-1 h-1 rounded-full mr-2"></span>
                About
              </Link>
              <Link to="/contact" className="text-lg hover:text-violet-300 transition-colors font-['Poppins'] flex items-center">
                <span className="bg-white/10 w-1 h-1 rounded-full mr-2"></span>
                Contact
              </Link>
            </div>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-10"></div>
          <div className="text-center text-violet-200">
            <p className="text-lg font-['Poppins']">© 2025 SmartPet. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage; 