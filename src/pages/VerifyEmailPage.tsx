import { useLocation, Link } from "react-router-dom";
import { FaPaw, FaEnvelope } from "react-icons/fa";

const VerifyEmailPage = () => {
  const location = useLocation();
  const { email, message } = location.state || {
    email: "",
    message: "Please check your email to verify your account before signing in."
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
            Almost there!
          </h1>
          <p className="text-xl text-gray-600 mb-12">
            We're excited to have you join our community.
          </p>
        </div>

        {/* Info Card */}
        <div className="bg-gray-900 text-white p-8 rounded-2xl">
          <p className="text-lg mb-6">
            "Your account security is important to us. Please verify your email to ensure the safety of your account and pets."
          </p>
          <div className="flex items-center">
            <div className="w-12 h-12 bg-violet-600 rounded-full flex items-center justify-center text-xl">
              <FaPaw />
            </div>
            <div className="ml-4">
              <p className="font-semibold">Pawpal Team</p>
              <p className="text-gray-400">Security Notice</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="w-1/2 p-12 flex items-center justify-center">
        <div className="w-full max-w-md text-center">
          <div className="mb-8">
            <div className="bg-violet-100 w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-6">
              <FaEnvelope className="text-violet-600 text-3xl" />
            </div>
            <h2 className="text-3xl font-bold mb-2 text-gray-900">Check your email</h2>
            {email && (
              <p className="text-gray-600 mb-4">
                We've sent a verification link to:
                <br />
                <span className="font-medium text-gray-800">{email}</span>
              </p>
            )}
            <p className="text-gray-600 mb-8">
              {message}
            </p>
          </div>

          <div className="space-y-4">
            <p className="text-gray-600">
              Didn't receive the email? Check your spam folder or
            </p>
            <Link
              to="/signup"
              className="text-violet-600 hover:text-violet-800 font-semibold block"
            >
              Try using a different email address
            </Link>
            <Link
              to="/login"
              className="text-violet-600 hover:text-violet-800 font-semibold block"
            >
              Return to login
            </Link>
          </div>

          <div className="mt-12 p-4 bg-violet-50 rounded-lg">
            <p className="text-sm text-gray-600">
              Note: The verification link will expire in 24 hours. If you don't verify your email within this time, you'll need to sign up again.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage; 