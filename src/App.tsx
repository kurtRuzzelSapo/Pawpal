import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Navbar from "./components/Navbar";
import { UserProfile } from "./components/UserProfile";
import { Messages } from "./components/Messages";
import CreatePostPage from "./pages/CreatePostPage";
import { PetProfile } from "./components/PetProfile";
import { PostPage } from "./pages/PostPage";
import { CreateCommunityPage } from "./pages/CreateCommunityPage";
import { CommunitiesPage } from "./pages/CommunitiesPage";
import { CommunityPage } from "./pages/CommunityPage";
import { PetSearch } from "./components/PetSearch";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import ChatPage from "./pages/ChatPage";
import { useParams } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import VerifyEmailPage from "./pages/VerifyEmailPage";

const PetProfileWrapper = () => {
  const { id } = useParams<{ id: string }>();
  return <PetProfile petId={Number(id)} />;
};

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 via-blue-50/30 to-white transition-opacity duration-700 text-violet-900 font-['Poppins']">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 5000,
          style: {
            background: 'white',
            color: '#4B5563',
            fontFamily: 'Poppins, sans-serif',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            borderRadius: '0.75rem',
          },
          success: {
            iconTheme: {
              primary: '#8B5CF6',
              secondary: 'white',
            },
            style: {
              border: '1px solid #8B5CF6',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: 'white',
            },
            style: {
              border: '1px solid #EF4444',
            },
          },
        }}
      />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/signupvet" element={<SignUpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="verify-email" element={<VerifyEmailPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="chat/:conversationId" element={<ChatPage />} />

        <Route
          path="*"
          element={
            <div className="pt-20">
              <Navbar />
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <Routes>
                  <Route path="home" element={<Home />} />
                  <Route path="search" element={<PetSearch />} />
                  <Route path="profile" element={<UserProfile />} />
                  <Route path="messages" element={<Messages />} />
                  <Route path="create" element={<CreatePostPage />} />
                  <Route path="pet/:id" element={<PetProfileWrapper />} />
                  <Route path="post/:id" element={<PostPage />} />
                  <Route path="community/create" element={<CreateCommunityPage />} />
                  <Route path="communities" element={<CommunitiesPage />} />
                  <Route path="community/:id" element={<CommunityPage />} />
                </Routes>
              </div>
            </div>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
// DB SUPABASE PASSWORD
// petLuna_523;