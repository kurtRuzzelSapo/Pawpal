import { FaPaw, FaHeart } from "react-icons/fa";
import { Link } from "react-router-dom";

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-100 via-blue-50 to-green-100 relative overflow-hidden">
      {/* Animated footprints background */}
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
      
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md shadow-md">
        <div className="w-full px-2 sm:px-4 md:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <FaPaw className="text-violet-600 text-2xl mr-2" />
                <span className="font-bold text-xl text-violet-900 font-['Quicksand']">Pawpal</span>
              </Link>
            </div>
            <div className="flex items-center">
              <Link to="/" className="px-3 py-2 rounded-md text-sm font-medium text-violet-700 hover:text-violet-900 hover:bg-violet-100 transition-all duration-200 font-['Poppins']">Home</Link>
              <Link to="/about" className="px-3 py-2 rounded-md text-sm font-medium text-white bg-violet-600 transition-all duration-200 font-['Poppins']">About</Link>
              <Link to="/contact" className="px-3 py-2 rounded-md text-sm font-medium text-violet-700 hover:text-violet-900 hover:bg-violet-100 transition-all duration-200 font-['Poppins']">Contact</Link>
              <Link to="/login" className="ml-4 px-4 py-2 rounded-full text-sm font-medium text-white bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg font-['Poppins']">Login</Link>
            </div>
          </div>
        </div>
      </nav>
      
      <div className="max-w-5xl mx-auto px-4 py-16 sm:px-6 lg:px-8 relative z-10">
        <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-8 md:p-12">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-violet-700 to-blue-700 font-['Quicksand']">
            About Pawpal
          </h1>
          
          <div className="prose prose-violet max-w-none font-['Poppins']">
            <p className="text-lg text-gray-700 mb-6">
              Welcome to Pawpal, where our passion for pets drives everything we do. Founded in 2023, Pawpal was born from a simple idea: to create a loving community where pet owners, animal lovers, and furry friends can connect, share, and grow together.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              <div className="bg-gradient-to-br from-violet-50 to-blue-50 rounded-2xl p-6 shadow-md">
                <h2 className="text-2xl font-bold text-violet-800 mb-4 font-['Quicksand']">Our Mission</h2>
                <p className="text-gray-700">
                  To create a supportive, knowledge-rich platform that enhances the lives of pets and strengthens the bond between pets and their humans through community, resources, and cutting-edge technology.
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-violet-50 to-blue-50 rounded-2xl p-6 shadow-md">
                <h2 className="text-2xl font-bold text-violet-800 mb-4 font-['Quicksand']">Our Vision</h2>
                <p className="text-gray-700">
                  A world where every pet receives the love, care, and understanding they deserve, and where pet parents have access to the knowledge and support they need to provide the best possible lives for their animal companions.
                </p>
              </div>
            </div>
            
            <h2 className="text-3xl font-bold text-violet-800 mb-6 text-center font-['Quicksand']">What Makes Us Different</h2>
            
            <div className="space-y-6 mb-10">
              <div className="flex items-start">
                <FaHeart className="text-violet-600 text-xl mt-1 mr-4" />
                <div>
                  <h3 className="text-xl font-semibold text-violet-800 font-['Quicksand']">Community-Centered Approach</h3>
                  <p className="text-gray-700">We believe in the power of community. Pawpal connects you with fellow pet lovers who share your passion, challenges, and joys of pet parenthood.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <FaHeart className="text-violet-600 text-xl mt-1 mr-4" />
                <div>
                  <h3 className="text-xl font-semibold text-violet-800 font-['Quicksand']">Expert-Backed Resources</h3>
                  <p className="text-gray-700">Our content and resources are developed in collaboration with veterinarians, animal behaviorists, and pet care specialists to ensure you get reliable information.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <FaHeart className="text-violet-600 text-xl mt-1 mr-4" />
                <div>
                  <h3 className="text-xl font-semibold text-violet-800 font-['Quicksand']">Adoption Support</h3>
                  <p className="text-gray-700">We partner with shelters and rescue organizations to help pets find their forever homes, providing resources for both adopters and organizations.</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-violet-100 to-blue-100 rounded-2xl p-8 shadow-inner text-center mb-8">
              <h2 className="text-2xl font-bold text-violet-800 mb-4 font-['Quicksand']">Join Our Community</h2>
              <p className="text-gray-700 mb-6">
                Whether you're a new pet parent or a seasoned animal lover, there's a place for you in our community. Together, we can make the world a better place for our beloved companions.
              </p>
              <Link 
                to="/signup" 
                className="inline-block px-6 py-3 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white rounded-full shadow-md hover:shadow-lg transition-all duration-200 font-medium font-['Poppins']"
              >
                Sign Up Today
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-gradient-to-br from-violet-900 via-blue-900 to-green-900 text-white py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <FaPaw className="text-violet-300 text-2xl mr-2" />
              <span className="text-xl font-bold font-['Quicksand']">Pawpal</span>
            </div>
            <div className="flex space-x-6">
              <Link to="/" className="hover:text-violet-300 transition-colors font-['Poppins']">Home</Link>
              <Link to="/about" className="hover:text-violet-300 transition-colors font-['Poppins']">About</Link>
              <Link to="/contact" className="hover:text-violet-300 transition-colors font-['Poppins']">Contact</Link>
            </div>
          </div>
          <div className="mt-8 text-center text-violet-200">
            <p className="font-['Poppins']">© 2024 Pawpal. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AboutPage; 