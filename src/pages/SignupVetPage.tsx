import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaPaw, FaLock, FaEnvelope } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

const SignupVetPage = () => {
  const navigate = useNavigate();
  const { signUpWithEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    // Validate password strength
    if (password.length < 6) {
      setError("Password must be at least 8 characters long");
      setLoading(false);
      return;
    }

    try {
      const { success, error } = await signUpWithEmail(email, password, "vet");

      if (
        success ||
        (error && error.toLowerCase().includes("verify your email")) ||
        (error && error.toLowerCase().includes("email not confirmed"))
      ) {
        navigate("/verify-email", {
          state: {
            email,
            message: "Please check your email to verify your account. After verification, we'll review your credentials and activate your veterinarian account."
          }
        });
      } else if (error && (error.includes("already exists") || error.includes("already registered"))) {
        setError(error);
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } else {
        setError(error || "Sign up failed. Try again.");
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left Section */}
      <div className="w-1/2 p-12 flex flex-col justify-between bg-white">
        <div>
          <div className="mb-8">
            <FaPaw className="text-violet-600 text-4xl" />
          </div>
          <h1 className="text-5xl font-bold mb-6 text-gray-900">
            Join our network of veterinary professionals.
          </h1>
          <p className="text-xl text-gray-600 mb-12">
            Help pet owners provide the best care for their beloved companions.
          </p>
        </div>

        {/* Testimonial Card */}
        <div className="bg-gray-900 text-white p-8 rounded-2xl">
          <p className="text-lg mb-6">
            "Being part of this platform has allowed me to help more pets and connect with their owners effectively."
          </p>
          <div className="flex items-center">
            <div className="w-12 h-12 bg-violet-600 rounded-full flex items-center justify-center text-xl font-bold">
              DR
            </div>
            <div className="ml-4">
              <p className="font-semibold">Dr. Rachel Smith</p>
              <p className="text-gray-400">Veterinarian</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="w-1/2 p-12 flex items-center justify-center">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold mb-2 text-gray-900">Create your account</h2>
          <p className="text-gray-600 mb-8">Join as a veterinarian and start helping pets today</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  placeholder="Enter your professional email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="text-gray-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  placeholder="Create a password (min. 8 characters)"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="text-gray-400" />
                </div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  placeholder="Confirm your password"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm p-3 bg-red-50 rounded-lg border border-red-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-violet-600 text-white py-3 rounded-lg font-semibold hover:bg-violet-700 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </div>
              ) : (
                "Create Account"
              )}
            </button>

            <div className="text-center">
              <p className="text-gray-600">
                Already have an account?{" "}
                <Link to="/login" className="text-violet-600 hover:text-violet-800 font-semibold">
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignupVetPage; 