import { FaTimes, FaExclamationTriangle } from "react-icons/fa";

interface LoginErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  errorMessage?: string;
  declinedReason?: string | null;
}

export const LoginErrorModal = ({
  isOpen,
  onClose,
  errorMessage,
  declinedReason,
}: LoginErrorModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 min-h-screen">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-md"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/20 p-6 max-w-md w-full mx-auto my-auto transform transition-all duration-300 scale-100">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
          aria-label="Close modal"
        >
          <FaTimes className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
            <FaExclamationTriangle className="text-white text-2xl" />
          </div>
        </div>

        {/* Content */}
        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2 font-['Inter']">
            Login Failed
          </h3>
          <p className="text-gray-600 mb-6 font-['Inter']">
            {errorMessage || "Invalid email or password"}
          </p>
          {declinedReason && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-1">Reason:</p>
              <p className="text-sm text-gray-600">{declinedReason}</p>
            </div>
          )}
          <p className="text-sm text-gray-500 mb-6">
            Please check your credentials and try again.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white rounded-xl font-semibold transition-all duration-200 shadow-sm hover:shadow-md font-['Inter']"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

