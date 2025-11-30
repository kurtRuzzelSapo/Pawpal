import { FaTimes } from "react-icons/fa";

interface TermsOfServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsOfServiceModal = ({
  isOpen,
  onClose,
}: TermsOfServiceModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 min-h-screen">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-md"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/20 p-6 max-w-3xl w-full mx-auto my-auto transform transition-all duration-300 scale-100 max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
          aria-label="Close modal"
        >
          <FaTimes className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="pr-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 font-['Inter']">
            Terms of Service
          </h2>
          
          <div className="space-y-6 text-gray-700 text-sm leading-relaxed">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">1. Acceptance of Terms</h3>
              <p>
                By accessing and using Pawpal, you accept and agree to be bound by the terms and provision of this agreement. 
                If you do not agree to abide by the above, please do not use this service.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">2. User Accounts</h3>
              <p>
                You are responsible for maintaining the confidentiality of your account and password. You agree to accept 
                responsibility for all activities that occur under your account. You must notify us immediately of any 
                unauthorized use of your account.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">3. Pet Adoption Services</h3>
              <p>
                Pawpal facilitates connections between pet owners and potential adopters. We do not guarantee the health, 
                behavior, or suitability of any pet listed on our platform. All adoption decisions are made at your own 
                discretion and risk. We recommend consulting with veterinarians and conducting thorough assessments before 
                finalizing any adoption.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">4. User Conduct</h3>
              <p>
                You agree to use Pawpal only for lawful purposes and in a way that does not infringe the rights of, restrict 
                or inhibit anyone else's use and enjoyment of the platform. Prohibited behavior includes but is not limited to:
              </p>
              <ul className="list-disc list-inside mt-2 ml-4 space-y-1">
                <li>Posting false, misleading, or fraudulent information</li>
                <li>Harassing, threatening, or abusing other users</li>
                <li>Violating any applicable laws or regulations</li>
                <li>Attempting to gain unauthorized access to the platform</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">5. Content and Intellectual Property</h3>
              <p>
                All content on Pawpal, including text, graphics, logos, and images, is the property of Pawpal or its content 
                suppliers. You may not reproduce, distribute, or create derivative works from any content without express written 
                permission. By posting content on Pawpal, you grant us a non-exclusive, royalty-free license to use, display, 
                and distribute your content on the platform.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">6. Privacy</h3>
              <p>
                Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the platform, 
                to understand our practices regarding the collection and use of your personal information.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">7. Disclaimers</h3>
              <p>
                Pawpal is provided "as is" without warranties of any kind, either express or implied. We do not warrant that the 
                platform will be uninterrupted, secure, or error-free. We are not responsible for any damages arising from your 
                use of the platform or from any pet adoption transactions facilitated through our service.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">8. Limitation of Liability</h3>
              <p>
                To the fullest extent permitted by law, Pawpal shall not be liable for any indirect, incidental, special, 
                consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, 
                or any loss of data, use, goodwill, or other intangible losses resulting from your use of the platform.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">9. Account Termination</h3>
              <p>
                We reserve the right to suspend or terminate your account at any time, with or without notice, for any reason, 
                including but not limited to violation of these Terms of Service. Upon termination, your right to use the 
                platform will immediately cease.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">10. Changes to Terms</h3>
              <p>
                We reserve the right to modify these Terms of Service at any time. We will notify users of any material changes 
                by posting the new terms on this page. Your continued use of the platform after such changes constitutes your 
                acceptance of the new terms.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">11. Contact Information</h3>
              <p>
                If you have any questions about these Terms of Service, please contact us through our support channels or 
                contact page.
              </p>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold transition-all duration-200 font-['Inter']"
            >
              I Understand
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

