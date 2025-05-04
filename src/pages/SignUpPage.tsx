import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../supabase-client";
import { FaPaw, FaLock, FaEnvelope, FaCheck } from "react-icons/fa";

const SignUpPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSuccess("Check your email to confirm your account.");
      setTimeout(() => navigate("/login"), 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-100 via-blue-50 to-green-100 p-4 relative overflow-hidden">
      {/* Animated footprints background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {Array.from({ length: 30 }).map((_, i) => (
          <FaPaw
            key={i}
            className="absolute text-violet-600 animate-float opacity-10"
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
      
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-violet-600/10 to-transparent"></div>
      <div className="absolute bottom-0 right-0 w-full h-64 bg-gradient-to-t from-blue-600/10 to-transparent"></div>
      
      <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl p-8 md:p-12 w-full max-w-md relative transform transition-all duration-300 hover:shadow-3xl z-10 border border-violet-200">
        <div className="flex justify-center mb-8">
          <div className="bg-gradient-to-br from-violet-600 to-blue-600 p-4 rounded-2xl shadow-lg">
            <FaPaw className="text-white text-4xl animate-pulse" />
          </div>
        </div>
        
        <h2 className="text-4xl font-bold mb-3 text-center text-violet-800 font-['Quicksand']">
          Create Account
        </h2>
        <p className="text-center text-gray-700 mb-8 font-['Poppins'] text-lg">Join the SmartPet community today</p>

        <form onSubmit={handleSignUp} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 font-['Poppins'] block mb-1">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaEnvelope className="text-violet-500" />
              </div>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-10 px-4 py-4 rounded-xl border-2 border-violet-200 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent font-['Poppins'] bg-white text-gray-800 font-medium shadow-sm"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 font-['Poppins'] block mb-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className="text-violet-500" />
              </div>
              <input
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 px-4 py-4 rounded-xl border-2 border-violet-200 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent font-['Poppins'] bg-white text-gray-800 font-medium shadow-sm"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 font-['Poppins'] block mb-1">Confirm Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaCheck className="text-violet-500" />
              </div>
              <input
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full pl-10 px-4 py-4 rounded-xl border-2 border-violet-200 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent font-['Poppins'] bg-white text-gray-800 font-medium shadow-sm"
                required
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center p-3 bg-red-50 rounded-lg font-['Poppins'] font-medium border border-red-200">
              {error}
            </div>
          )}
          {success && (
            <div className="text-green-600 text-sm text-center p-3 bg-green-50 rounded-lg font-['Poppins'] font-medium border border-green-200">
              {success}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white py-4 rounded-xl font-semibold font-['Poppins'] text-lg transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
                Creating account...
              </div>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <div className="flex justify-center mt-8 text-base font-['Poppins']">
          <p className="text-gray-700">Already have an account?{" "}
            <Link 
              to="/login" 
              className="text-violet-700 hover:text-violet-800 font-semibold hover:underline transition-all duration-200"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage; 