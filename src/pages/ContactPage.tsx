import { useState } from "react";
import { FaPaw, FaMapMarkerAlt, FaPhoneAlt, FaEnvelope, FaTwitter, FaFacebook, FaInstagram } from "react-icons/fa";
import { Link } from "react-router-dom";

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<null | { success: boolean; message: string }>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitStatus({
        success: true,
        message: "Thank you for your message! We'll get back to you soon."
      });
      setFormData({ name: "", email: "", subject: "", message: "" });
      
      // Clear success message after 5 seconds
      setTimeout(() => setSubmitStatus(null), 5000);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-100 via-blue-50 to-green-100 relative overflow-hidden">
      {/* Animated footprints background */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-10">
        {Array.from({ length: 30 }).map((_, i) => (
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
              <Link to="/about" className="px-3 py-2 rounded-md text-sm font-medium text-violet-700 hover:text-violet-900 hover:bg-violet-100 transition-all duration-200 font-['Poppins']">About</Link>
              <Link to="/contact" className="px-3 py-2 rounded-md text-sm font-medium text-white bg-violet-600 transition-all duration-200 font-['Poppins']">Contact</Link>
              <Link to="/login" className="ml-4 px-4 py-2 rounded-full text-sm font-medium text-white bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg font-['Poppins']">Login</Link>
            </div>
          </div>
        </div>
      </nav>
      
      <div className="max-w-6xl mx-auto px-4 py-16 sm:px-6 lg:px-8 relative z-10">
        <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-8 md:p-12">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-violet-700 to-blue-700 font-['Quicksand']">
            Contact Us
          </h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <p className="text-lg text-gray-700 mb-8 font-['Poppins']">
                Have questions, suggestions, or just want to say hello? We'd love to hear from you! Fill out the form and our team will get back to you as soon as possible.
              </p>
              
              <div className="space-y-6 mb-8">
                <div className="flex items-start">
                  <div className="bg-violet-100 p-3 rounded-full mr-4">
                    <FaMapMarkerAlt className="text-violet-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-violet-800 font-['Quicksand']">Our Location</h3>
                    <p className="text-gray-600 font-['Poppins']">123 Pet Avenue, Animal Kingdom, 12345</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-violet-100 p-3 rounded-full mr-4">
                    <FaPhoneAlt className="text-violet-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-violet-800 font-['Quicksand']">Phone</h3>
                    <p className="text-gray-600 font-['Poppins']">(123) 456-7890</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-violet-100 p-3 rounded-full mr-4">
                    <FaEnvelope className="text-violet-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-violet-800 font-['Quicksand']">Email</h3>
                    <p className="text-gray-600 font-['Poppins']">hello@Pawpal.com</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-10">
                <h3 className="text-xl font-semibold text-violet-800 mb-4 font-['Quicksand']">Follow Us</h3>
                <div className="flex space-x-4">
                  <a href="#" className="bg-violet-100 hover:bg-violet-200 p-3 rounded-full text-violet-600 transition-all duration-200">
                    <FaTwitter />
                  </a>
                  <a href="#" className="bg-violet-100 hover:bg-violet-200 p-3 rounded-full text-violet-600 transition-all duration-200">
                    <FaFacebook />
                  </a>
                  <a href="#" className="bg-violet-100 hover:bg-violet-200 p-3 rounded-full text-violet-600 transition-all duration-200">
                    <FaInstagram />
                  </a>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-violet-50 to-blue-50 rounded-3xl p-8 shadow-inner">
              {submitStatus && (
                <div className={`mb-6 p-4 rounded-lg text-center ${submitStatus.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {submitStatus.message}
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1 font-['Poppins']">Your Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-violet-200 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200 font-['Poppins']"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1 font-['Poppins']">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-violet-200 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200 font-['Poppins']"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1 font-['Poppins']">Subject</label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-violet-200 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200 font-['Poppins']"
                    required
                  >
                    <option value="">Select a subject</option>
                    <option value="general">General Inquiry</option>
                    <option value="support">Customer Support</option>
                    <option value="partnership">Partnership Opportunities</option>
                    <option value="feedback">Feedback</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1 font-['Poppins']">Your Message</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={5}
                    className="w-full px-4 py-3 rounded-xl border border-violet-200 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200 font-['Poppins'] resize-none"
                    required
                  ></textarea>
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-['Poppins']"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
                      Sending...
                    </div>
                  ) : (
                    "Send Message"
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-gradient-to-br from-violet-900 via-blue-900 to-green-900 text-white py-8 mt-16">
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

export default ContactPage; 