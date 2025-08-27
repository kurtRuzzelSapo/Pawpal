import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaPaw, FaLock, FaEnvelope, FaUser } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

const SignUpPage = () => {
  const navigate = useNavigate();
  const { signUpWithEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!firstName.trim() || !lastName.trim()) {
      setError("First name and last name are required");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (!passwordRegex.test(password)) {
      setError(
        "Password must be at least 8 characters and include lowercase, uppercase, number, and special character."
      );
      setLoading(false);
      return;
    }

    try {
      // Pass firstName and lastName to your signUpWithEmail function if supported
      const { success, error } = await signUpWithEmail(email, password, { firstName, lastName });

      if (success) {
        navigate("/verify-email", {
          state: {
            email,
            message: "Please check your email to verify your account before signing in."
          }
        });
      } else {
        if (error === 'Email not confirmed' || error === 'email_not_confirmed') {
          navigate("/verify-email", {
            state: {
              email,
              message: "Please check your email to verify your account before signing in."
            }
          });
        } else {
          setError(error || "An unexpected error occurred. Please try again.");
        }
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
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Left Section */}
      <div className="hidden md:flex w-full md:w-1/2 p-6 sm:p-12 flex-col justify-between bg-white">
        <div>
          <div className="mb-8">
            <FaPaw className="text-violet-600 text-3xl sm:text-4xl" />
          </div>
          <h1 className="text-2xl sm:text-5xl font-bold mb-6 text-gray-900">
            Find the perfect companion for your family.
          </h1>
          <p className="text-base sm:text-xl text-gray-600 mb-8 sm:mb-12">
            Join our community of pet lovers and find your next furry friend.
          </p>
        </div>

        {/* Testimonial Card */}
        <div className="bg-gray-900 text-white p-4 sm:p-8 rounded-2xl mt-8 md:mt-0">
          <p className="text-base sm:text-lg mb-4 sm:mb-6">
            "Thanks to this platform, I found my perfect companion. The process was smooth and the community is amazing!"
          </p>
          <div className="flex items-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-violet-600 rounded-full flex items-center justify-center text-lg sm:text-xl font-bold">
              JD
            </div>
            <div className="ml-4">
              <p className="font-semibold">John Doe</p>
              <p className="text-gray-400">Pet Owner</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center justify-center w-full md:w-1/2 p-6 md:p-12 min-h-screen">
        <div className="w-full max-w-md">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-gray-900">Create your account</h2>
          <p className="text-gray-600 mb-4 sm:mb-8">Join as a pet owner and find your perfect companion</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex gap-4">
              <div className="w-1/2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaUser className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full pl-10 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    placeholder="First name"
                    required
                  />
                </div>
              </div>
              <div className="w-1/2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaUser className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full pl-10 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    placeholder="Last name"
                    required
                  />
                </div>
              </div>
            </div>

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
                  placeholder="Enter your email"
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

export default SignUpPage;