import { useState, useEffect } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FaPaw,
  FaHome,
  FaPlusCircle,
  FaComments,
  FaHeart,
  FaUser,
  FaSignOutAlt,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { NotificationBadge } from "./NotificationBadge";
import { ChatBadge } from "./ChatBadge";
import { SignOutConfirmationModal } from "./SignOutConfirmationModal";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const { signOut, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      setScrolled(isScrolled);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleSignOutClick = () => {
    setShowSignOutModal(true);
    setMenuOpen(false);
  };

  const handleSignOutConfirm = () => {
    signOut();
    navigate("/");
  };

  // Define navigation items based on authentication status
  const getNavItems = () => {
    const baseItems = [
      {
        path: "/home",
        label: "Home",
        icon: <FaHome className="text-lg" />,
      },
    ];

    const authenticatedItems = [
      {
        path: "/create",
        label: "Create Post",
        icon: <FaPlusCircle className="text-lg" />,
      },
      {
        path: "/chat",
        label: "Chats",
        icon: <FaComments className="text-lg" />,
      },
     
    ];

    return user ? [...baseItems, ...authenticatedItems] : baseItems;
  };

  // Professional Logo Component
  const PawLogo = () => (
    <div className="flex items-center gap-3">
      <div className="relative">
        <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
          <FaPaw className="text-white text-xl" />
        </div>
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full shadow-sm"></div>
      </div>
      <div className="flex flex-col">
        <span className="text-2xl font-bold bg-gradient-to-r from-violet-700 to-purple-700 text-transparent bg-clip-text font-['Inter'] tracking-tight">
          PawPal
        </span>
        <span className="text-xs text-gray-500 font-['Inter'] font-medium -mt-1">
          Find your perfect companion
        </span>
      </div>
    </div>
  );

  return (
    <nav
      className={`fixed top-0 w-full z-40 transition-all duration-300 ${
        scrolled
          ? "bg-white/98 backdrop-blur-xl shadow-lg border-b border-gray-100"
          : "bg-white/95 backdrop-blur-lg"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 lg:h-20">
          {/* Logo Section */}
          <NavLink to="/" className="flex items-center group">
            <PawLogo />
          </NavLink>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {getNavItems().map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`relative flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                  isActive(item.path)
                    ? "bg-violet-50 text-violet-700 border border-violet-200"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <span className="mr-2.5 transition-transform duration-200 group-hover:scale-105">
                  {/* Render the ChatBadge for the Chats (chat) nav item, icon for others */}
                  {item.path === "/chat" ? <ChatBadge /> : item.icon}
                </span>
                <span className="font-['Inter'] font-medium">{item.label}</span>
                {isActive(item.path) && (
                  <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-violet-600 rounded-full"></div>
                )}
              </Link>
            ))}
          </div>

          {/* Desktop Auth Section */}
          <div className="hidden lg:flex items-center space-x-4">
            {user ? (
              <>
                {/* Notifications */}
                <div className="relative">
                  <NotificationBadge />
                </div>

                {/* Chat */}
                {/* <div className="relative">
                  <ChatBadge />
                </div> */}

                {/* User Profile */}
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen((open) => !open)}
                    className="flex items-center space-x-3 focus:outline-none group hover:bg-gray-50 px-3 py-2 rounded-lg transition-all duration-200 border border-transparent hover:border-gray-200"
                  >
                    <div className="relative">
                      <div className="w-9 h-9 bg-gradient-to-br from-violet-600 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
                        <FaUser className="text-white text-sm" />
                      </div>
                      <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border border-white rounded-full"></div>
                    </div>
                    <div className="text-left">
                      <p className="text-gray-900 font-medium font-['Inter'] text-sm">
                        {user.user_metadata.full_name ||
                          user.email?.split("@")[0]}
                      </p>
                      <p className="text-gray-500 text-xs">Online</p>
                    </div>
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                        menuOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 py-2 overflow-hidden z-50">
                      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                        <p className="text-sm font-semibold text-gray-900 font-['Inter']">
                          {user.user_metadata.full_name || user.email}
                        </p>
                        <p className="text-xs text-gray-500">
                          Member since {new Date(user.created_at).getFullYear()}
                        </p>
                      </div>
                      <button
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 text-gray-700 font-['Inter'] flex items-center space-x-3 transition-colors duration-200"
                        onClick={() => {
                          setMenuOpen(false);
                          navigate("/profile");
                        }}
                      >
                        <FaUser className="text-gray-500" />
                        <span>My Profile</span>
                      </button>
                      <button
                        className="w-full text-left px-4 py-3 hover:bg-red-50 text-red-600 font-['Inter'] flex items-center space-x-3 transition-colors duration-200"
                        onClick={handleSignOutClick}
                      >
                        <FaSignOutAlt className="text-red-500" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white px-6 py-2.5 rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2.5 font-['Inter'] group"
              >
                <FaHeart className="text-pink-200 group-hover:scale-110 transition-transform duration-200" />
                Get Started
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="relative p-2 text-gray-700 hover:bg-gray-100 transition-all duration-200 rounded-lg"
              aria-label="Toggle mobile menu"
            >
              <div className="w-6 h-6 flex flex-col justify-center items-center">
                <span
                  className={`block w-5 h-0.5 bg-current transform transition-all duration-200 ${
                    menuOpen ? "rotate-45 translate-y-1" : "-translate-y-1"
                  }`}
                ></span>
                <span
                  className={`block w-5 h-0.5 bg-current transition-all duration-200 ${
                    menuOpen ? "opacity-0" : "opacity-100"
                  }`}
                ></span>
                <span
                  className={`block w-5 h-0.5 bg-current transform transition-all duration-200 ${
                    menuOpen ? "-rotate-45 -translate-y-1" : "translate-y-1"
                  }`}
                ></span>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`lg:hidden transition-all duration-300 ease-in-out overflow-hidden ${
            menuOpen ? "max-h-screen opacity-100 py-4" : "max-h-0 opacity-0"
          }`}
        >
          <div className="bg-white rounded-xl p-4 shadow-xl border border-gray-200">
            <div className="space-y-1">
              {getNavItems().map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive(item.path)
                      ? "bg-violet-50 text-violet-700 border border-violet-200"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                  onClick={() => setMenuOpen(false)}
                >
                  <span className="mr-3 transition-transform duration-200">
                    {item.icon}
                  </span>
                  <span className="font-['Inter'] font-medium">
                    {item.label}
                  </span>
                </Link>
              ))}
            </div>

            <div className="h-px bg-gray-200 my-4"></div>

            {user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-4 px-4 py-3 bg-gray-50 rounded-lg">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
                      <FaUser className="text-white text-lg" />
                    </div>
                    <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 border border-white rounded-full"></div>
                  </div>
                  <div className="flex-1">
                    <Link to="/profile">
                      <p className="text-gray-900 font-semibold font-['Inter']">
                        {user.user_metadata.full_name ||
                          user.email?.split("@")[0]}
                      </p>
                    </Link>
                    <p className="text-gray-500 text-sm">Online</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <ChatBadge />
                    </div>
                    <div className="relative">
                      <NotificationBadge />
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleSignOutClick}
                  className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-4 py-3 rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-3 font-['Inter']"
                >
                  <FaSignOutAlt />
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  navigate("/login");
                  setMenuOpen(false);
                }}
                className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white px-4 py-3 rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-3 font-['Inter']"
              >
                <FaHeart className="text-pink-200" />
                Get Started
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sign Out Confirmation Modal */}
      <SignOutConfirmationModal
        isOpen={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
        onConfirm={handleSignOutConfirm}
        userName={user?.user_metadata?.full_name || user?.email?.split("@")[0]}
      />
    </nav>
  );
};

export default Navbar;
