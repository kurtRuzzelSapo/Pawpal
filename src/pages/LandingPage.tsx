import { useNavigate, Link } from "react-router-dom";
import { useEffect, useRef, RefObject } from "react";
import { FaPaw, FaHeart, FaHandHoldingHeart, FaUserFriends, FaUserMd } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const aboutRef = useRef<HTMLDivElement>(null);
  const servicesRef = useRef<HTMLDivElement>(null);
  const adoptionRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      navigate('/home');
    }
  }, [user, navigate]);

  const handleGetStarted = () => {
    navigate("/login");
  };

  const scrollToSection = (elementRef: RefObject<HTMLDivElement | null>) => {
    elementRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm fixed w-full z-50">
        <div className="w-full px-2 sm:px-4 md:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <FaPaw className="text-indigo-600 text-3xl mr-2" />
              <span className="font-bold text-2xl text-gray-800 font-['Quicksand']">Pawpal</span>
            </div>
            <div className="flex items-center space-x-4">
              <button onClick={() => scrollToSection(aboutRef)} className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-indigo-600 transition-all duration-200 font-['Poppins']">About</button>
              <button onClick={() => scrollToSection(servicesRef)} className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-indigo-600 transition-all duration-200 font-['Poppins']">Services</button>
              <button onClick={() => scrollToSection(adoptionRef)} className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-indigo-600 transition-all duration-200 font-['Poppins']">Adoption</button>
              <button onClick={() => scrollToSection(contactRef)} className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-indigo-600 transition-all duration-200 font-['Poppins']">Contact</button>
              
              <div className="h-6 w-px bg-gray-200"></div>
              
              <Link 
                to="/login"
                className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-all duration-200 font-['Poppins']"
              >
                Login
              </Link>
              
              <div className="flex items-center space-x-2">
                <Link 
                  to="/signup"
                  className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md font-['Poppins']"
                >
                  Register as User
                </Link>
                <Link 
                  to="/signupvet"
                  className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-all duration-200 shadow-sm hover:shadow-md font-['Poppins']"
                >
                  <FaUserMd className="mr-2" />
                  Register as Vet
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center pt-16 bg-gradient-to-br from-indigo-600 to-indigo-800">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/60 via-indigo-800/40 to-indigo-700/20"></div>
        </div>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <div className="flex flex-col items-center">
            <div className="text-center mb-8">
              <h1 className="text-8xl font-bold text-white font-['Quicksand'] tracking-wide mb-4">
                Adopt l<span className="inline-flex items-center justify-center rounded-full bg-emerald-400 w-24 h-24 text-4xl">5k+</span>ve,
              </h1>
              <h1 className="text-8xl font-bold text-white font-['Quicksand'] tracking-wide">
                F<span className="inline-flex items-center justify-center rounded-full bg-rose-400 w-16 h-16 text-3xl">2k+</span>ster Happiness
              </h1>
            </div>
            <p className="text-xl text-white/90 mb-8 max-w-2xl">
              We Are well-equipped and well-prepared to protect your heath and hygiene while serve you. Our preparations include-
            </p>
            <button
              onClick={handleGetStarted}
              className="bg-emerald-500 text-white px-8 py-3 rounded-md text-lg font-medium hover:bg-emerald-600 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Get Started
            </button>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div ref={aboutRef} className="py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 font-['Quicksand'] mb-4">About Us</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">We're dedicated to connecting loving homes with pets in need. Our mission is to make pet adoption simple, enjoyable, and rewarding.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaHeart className="text-2xl text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Loving Care</h3>
              <p className="text-gray-600">Every pet in our network receives the highest standard of care and attention.</p>
            </div>
            <div className="text-center">
              <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaHandHoldingHeart className="text-2xl text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Expert Support</h3>
              <p className="text-gray-600">Our team of experts is here to guide you through the adoption process.</p>
            </div>
            <div className="text-center">
              <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaUserFriends className="text-2xl text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Community</h3>
              <p className="text-gray-600">Join our community of pet lovers and share your adoption journey.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Services Section */}
      <div ref={servicesRef} className="py-24 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 font-['Quicksand'] mb-4">Our Services</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">We provide comprehensive services to ensure successful pet adoptions and happy families.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <h3 className="text-2xl font-semibold mb-4">Pet Matching</h3>
              <p className="text-gray-600 mb-4">Our intelligent matching system helps you find the perfect pet based on your lifestyle and preferences.</p>
              <ul className="space-y-2 text-gray-600">
                <li>• Personality matching</li>
                <li>• Lifestyle compatibility</li>
                <li>• Living space considerations</li>
              </ul>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <h3 className="text-2xl font-semibold mb-4">Adoption Support</h3>
              <p className="text-gray-600 mb-4">We're here to support you throughout your adoption journey.</p>
              <ul className="space-y-2 text-gray-600">
                <li>• Pre-adoption counseling</li>
                <li>• Post-adoption support</li>
                <li>• Pet care resources</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Adoption Section */}
      <div ref={adoptionRef} className="py-24 px-4 bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 font-['Quicksand'] mb-4">Available for Adoption</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Meet our wonderful pets waiting for their forever homes.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Dogs */}
            <div className="rounded-2xl overflow-hidden bg-white p-4 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="relative h-64 rounded-xl overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1450778869180-41d0601e046e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
                  alt="Dogs" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="mt-4">
                <h3 className="text-xl font-semibold mb-2">Dogs</h3>
                <p className="text-gray-600">Find your loyal companion</p>
              </div>
            </div>
            
            {/* Cats */}
            <div className="rounded-2xl overflow-hidden bg-white p-4 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="relative h-64 rounded-xl overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
                  alt="Cats" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="mt-4">
                <h3 className="text-xl font-semibold mb-2">Cats</h3>
                <p className="text-gray-600">Meet your perfect feline friend</p>
              </div>
            </div>
            
            {/* Other Pets */}
            <div className="rounded-2xl overflow-hidden bg-white p-4 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="relative h-64 rounded-xl overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1425082661705-1834bfd09dca?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
                  alt="Other Pets" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="mt-4">
                <h3 className="text-xl font-semibold mb-2">Other Pets</h3>
                <p className="text-gray-600">Discover unique companions</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div ref={contactRef} className="py-24 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 font-['Quicksand'] mb-4">Contact Us</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Have questions about adoption? We're here to help!</p>
          </div>
          <div className="bg-gray-50 p-8 rounded-2xl shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-2xl font-semibold mb-4">Get in Touch</h3>
                <p className="text-gray-600 mb-4">We'd love to hear from you. Please fill out the form below and we'll get back to you as soon as possible.</p>
                <div className="space-y-4">
                  <p className="flex items-center text-gray-600">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    contact@petgon.com
                  </p>
                  <p className="flex items-center text-gray-600">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    (123) 456-7890
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <input type="text" placeholder="Your Name" className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                <input type="email" placeholder="Your Email" className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                <textarea placeholder="Your Message" rows={4} className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"></textarea>
                <button className="w-full bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 transition-colors duration-300">
                  Send Message
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage; 