import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { supabase } from "../supabase-client";
import { FaPaw, FaLock, FaCheck, FaExclamationTriangle } from "react-icons/fa";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [authSessionValid, setAuthSessionValid] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // Check if auth session is valid on component mount
  useEffect(() => {
    const checkAuthSession = async () => {
      setCheckingSession(true);
      try {
        // Get the access token from the URL if available
        const hashParams = new URLSearchParams(location.hash.substring(1));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const type = hashParams.get("type");
        
        if (accessToken && type === "recovery") {
          // Set the session with the recovery token
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || ""
          });
          
          // Verify the session is active
          const { data } = await supabase.auth.getSession();
          
          if (data?.session) {
            setAuthSessionValid(true);
            setError("");
          } else {
            setAuthSessionValid(false);
            setError("Your password reset link has expired. Please request a new one.");
          }
        } else {
          // Check if there's an existing valid session
          const { data } = await supabase.auth.getSession();
          if (data?.session) {
            setAuthSessionValid(true);
            setError("");
          } else {
            setAuthSessionValid(false);
            setError("No valid authentication session found. Please request a password reset link from the forgot password page.");
          }
        }
      } catch (err) {
        console.error("Error checking auth session:", err);
        setAuthSessionValid(false);
        setError("Failed to validate your session. Please try requesting a new password reset link.");
      } finally {
        setCheckingSession(false);
      }
    };

    checkAuthSession();
  }, [location]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    if (!authSessionValid) {
      setError("Your session has expired. Please request a new password reset link.");
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) {
        throw error;
      }
      
      setSuccess("Password updated successfully! Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (error: any) {
      setError(error.message || "Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestNewLink = () => {
    navigate("/forgot-password");
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
          Reset Password
        </h2>
        <p className="text-center text-gray-700 mb-8 font-['Poppins'] text-lg">Create your new password</p>

        {checkingSession ? (
          <div className="flex flex-col items-center justify-center py-6">
            <div className="w-12 h-12 border-t-4 border-violet-600 border-solid rounded-full animate-spin mb-4"></div>
            <p className="text-gray-700 font-['Poppins']">Verifying your session...</p>
          </div>
        ) : !authSessionValid ? (
          <div className="space-y-6">
            <div className="bg-red-50 p-4 rounded-xl border border-red-200 flex items-start">
              <FaExclamationTriangle className="text-red-500 mr-3 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-red-700 font-semibold font-['Poppins']">Authentication Required</h3>
                <p className="text-red-600 font-['Poppins']">{error || "Your password reset link has expired or is invalid."}</p>
              </div>
            </div>
            <button
              onClick={handleRequestNewLink}
              className="w-full bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white py-4 rounded-xl font-semibold font-['Poppins'] text-lg transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg"
            >
              Request New Reset Link
            </button>
          </div>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 font-['Poppins'] block mb-1">New Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="text-violet-500" />
                </div>
                <input
                  type="password"
                  placeholder="Enter new password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 px-4 py-4 rounded-xl border-2 border-violet-200 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent font-['Poppins'] bg-white text-gray-800 font-medium shadow-sm"
                  required
                  minLength={6}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1 font-['Poppins']">Password must be at least 6 characters long</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 font-['Poppins'] block mb-1">Confirm Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaCheck className="text-violet-500" />
                </div>
                <input
                  type="password"
                  placeholder="Confirm new password"
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
                  Updating...
                </div>
              ) : (
                "Update Password"
              )}
            </button>
          </form>
        )}
        
        <div className="flex justify-center mt-8 text-base font-['Poppins']">
          <Link 
            to="/login" 
            className="text-violet-700 hover:text-violet-800 font-semibold hover:underline transition-all duration-200"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage; 