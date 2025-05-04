import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../supabase-client";
import { FaPaw, FaLock, FaEnvelope } from "react-icons/fa";

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      navigate("/home");
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google" });
    setLoading(false);
    if (error) setError(error.message);
    // Supabase will redirect automatically on success
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
          Welcome Back
        </h2>
        <p className="text-center text-gray-700 mb-8 font-['Poppins'] text-lg">Sign in to continue to SmartPet</p>

        <form onSubmit={handleLogin} className="space-y-6">
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
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
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

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white py-4 rounded-xl font-semibold font-['Poppins'] text-lg transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
                Signing in...
              </div>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-600 font-['Poppins'] font-medium">Or continue with</span>
          </div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          className="w-full bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300 py-4 rounded-xl font-semibold font-['Poppins'] flex items-center justify-center gap-3 transition-all duration-200 hover:shadow-md shadow-sm"
          disabled={loading}
        >
          <svg width="20" height="20" viewBox="0 0 48 48"><g><path fill="#4285F4" d="M24 9.5c3.54 0 6.7 1.22 9.19 3.23l6.85-6.85C36.68 2.7 30.77 0 24 0 14.82 0 6.71 5.82 2.69 14.09l7.98 6.2C12.36 13.13 17.68 9.5 24 9.5z"/><path fill="#34A853" d="M46.1 24.55c0-1.64-.15-3.22-.42-4.74H24v9.01h12.42c-.54 2.9-2.18 5.36-4.65 7.03l7.19 5.6C43.98 37.13 46.1 31.3 46.1 24.55z"/><path fill="#FBBC05" d="M10.67 28.29a14.5 14.5 0 0 1 0-8.58l-7.98-6.2A23.94 23.94 0 0 0 0 24c0 3.77.9 7.34 2.69 10.49l7.98-6.2z"/><path fill="#EA4335" d="M24 48c6.48 0 11.93-2.15 15.9-5.85l-7.19-5.6c-2.01 1.35-4.6 2.15-8.71 2.15-6.32 0-11.64-3.63-13.33-8.79l-7.98 6.2C6.71 42.18 14.82 48 24 48z"/></g></svg>
          Sign in with Google
        </button>

        <div className="flex flex-col sm:flex-row justify-between items-center mt-8 space-y-4 sm:space-y-0 text-base font-['Poppins']">
          <Link 
            to="/signup" 
            className="text-violet-700 hover:text-violet-800 font-semibold hover:underline transition-all duration-200"
          >
            Create an account
          </Link>
          <Link 
            to="/forgot-password" 
            className="text-violet-700 hover:text-violet-800 font-semibold hover:underline transition-all duration-200"
          >
            Forgot Password?
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 