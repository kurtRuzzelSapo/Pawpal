import { useState, useEffect } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FaPaw, FaHome, FaSearch, FaPlusCircle, FaUsers, FaUserPlus, } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { NotificationBadge } from "./NotificationBadge";
import { ChatBadge } from "./ChatBadge";
import type { CSSProperties } from 'react';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
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

  // Define navigation items based on authentication status
  const getNavItems = () => {
    const baseItems = [
      {
        path: "/home",
        label: "Home",
        icon: <FaHome className="text-xl" />,
      },
      {
        path: "/search",
        label: "Search Pet",
        icon: <FaSearch className="text-xl" />,
      },
    ];

    const authenticatedItems = [
      {
        path: "/create",
        label: "Create Post",
        icon: <FaPlusCircle className="text-xl" />,
      },
      {
        path: "/communities",
        label: "Communities",
        icon: <FaUsers className="text-xl" />,
      },
      {
        path: "/community/create",
        label: "Create Community",
        icon: <FaUserPlus className="text-xl" />,
      },
    ];

    return user ? [...baseItems, ...authenticatedItems] : baseItems;
  };

  // Helper: get dropdown style for right alignment
  const getDropdownStyle = (): CSSProperties => ({
    right: 0,
    position: 'fixed',
    top: '4.5rem', // adjust as needed for navbar height
    marginRight: '2rem', // adjust to match navbar padding
    zIndex: 1000,
  });

  return (
    <nav className={`fixed top-0 w-full z-40 transition-all duration-300 ${
      scrolled 
        ? "bg-white/90 backdrop-blur-lg shadow-md" 
        : "bg-white/80 backdrop-blur-md"
    }`}>
      <div className="w-full px-2 sm:px-4 md:px-8">
        <div className="flex justify-between items-center h-16">
          <NavLink 
            to="/" 
            className="font-['Quicksand'] text-xl font-bold text-violet-800 flex items-center gap-2 hover:text-violet-600 transition-colors"
          >
            <div className="bg-gradient-to-br from-violet-500 to-blue-500 text-white p-2 rounded-full">
              <FaPaw />
            </div>
            <span className="bg-gradient-to-r from-violet-700 to-blue-600 text-transparent bg-clip-text">
              SmartPet
            </span>
          </NavLink>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center space-x-3">
            {getNavItems().map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                  isActive(item.path)
                    ? "bg-gradient-to-r from-violet-500 to-blue-500 text-white shadow-md"
                    : "text-violet-700 hover:bg-violet-50 hover:text-violet-800"
                }`}
              >
                <span className={`transition-transform duration-200 ${isActive(item.path) ? "scale-110" : ""}`}>
                  {item.icon}
                </span>
                <span className="ml-2 font-['Poppins']">{item.label}</span>
              </Link>
            ))}
          </div>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center">
            {user ? (
              <div className="flex items-center space-x-4">
                {/* Notifications */}
                <NotificationBadge />
                
                {/* Chat */}
                <ChatBadge />

                {/* Avatar and Name Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen((open) => !open)}
                    className="flex items-center space-x-2 focus:outline-none group hover:bg-violet-50 px-3 py-2 rounded-xl transition-colors"
                  >
                    <span className="text-violet-800 font-medium font-['Poppins']">
                      {user.user_metadata.full_name || user.email}
                    </span>
                    <svg
                      className={`w-4 h-4 text-violet-600 transition-transform duration-200 ${
                        menuOpen ? 'rotate-180' : ''
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
                    <div
                      className="w-40 bg-white border border-violet-100 rounded-xl shadow-lg py-2"
                      style={getDropdownStyle()}
                      tabIndex={-1}
                    >
                      <button
                        className="w-full text-left px-4 py-2 hover:bg-violet-50 text-violet-700 font-['Poppins'] rounded-t-xl"
                        onClick={() => {
                          setMenuOpen(false);
                          navigate("/profile");
                        }}
                      >
                        Profile
                      </button>
                      <button
                        className="w-full text-left px-4 py-2 hover:bg-violet-50 text-red-600 font-['Poppins'] rounded-b-xl"
                        onClick={() => {
                          setMenuOpen(false);
                          signOut();
                          navigate("/");
                        }}
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 text-white px-5 py-2 rounded-xl font-medium transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2 font-['Poppins']"
              >
                <FaPaw />
                Sign In
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-violet-700 hover:bg-violet-50 transition-colors p-2 rounded-lg"
              aria-label="Toggle mobile menu"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {menuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div 
          className={`md:hidden transition-all duration-300 ease-in-out ${
            menuOpen 
              ? "max-h-screen opacity-100 py-4" 
              : "max-h-0 opacity-0 overflow-hidden"
          }`}
        >
          <div className="flex flex-col space-y-2 bg-white/90 backdrop-blur-md rounded-2xl p-2 shadow-md">
            {getNavItems().map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive(item.path)
                    ? "bg-gradient-to-r from-violet-500 to-blue-500 text-white shadow-md"
                    : "text-violet-700 hover:bg-violet-50 hover:text-violet-800"
                }`}
                onClick={() => setMenuOpen(false)}
              >
                {item.icon}
                <span className="ml-2 font-['Poppins']">{item.label}</span>
              </Link>
            ))}
            
            <div className="h-px bg-violet-100 my-2"></div>
            
            {user ? (
              <>
                <div className="flex items-center gap-3 px-4 py-3">
                {user.user_metadata?.avatar_url && (
                  <NavLink to="/profile" onClick={() => setMenuOpen(false)}>
                      <div className="relative">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500 to-blue-500 rounded-full opacity-75 transition duration-200 blur"></div>
                      <img
                        src={user.user_metadata.avatar_url}
                        alt="User Avatar"
                          className="relative w-10 h-10 rounded-full object-cover border-2 border-white"
                      />
                    </div>
                  </NavLink>
                )}
                  <span className="text-violet-800 font-medium font-['Poppins']">{user.user_metadata.full_name || user.email}</span>
                  <div className="ml-auto flex items-center gap-2">
                    <ChatBadge />
                    <NotificationBadge />
                  </div>
                </div>
                  <button
                    onClick={() => {
                      signOut();
                      setMenuOpen(false);
                    }}
                  className="mx-4 my-2 bg-white border border-violet-200 text-violet-700 hover:bg-violet-50 px-4 py-3 rounded-xl font-medium transition-all duration-200 shadow-sm hover:shadow-md font-['Poppins'] flex items-center justify-center"
                  >
                    Sign Out
                  </button>
              </>
            ) : (
              <button
                onClick={() => {
                  navigate("/login");
                  setMenuOpen(false);
                }}
                className="mx-4 my-2 bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 text-white px-4 py-3 rounded-xl font-medium transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 font-['Poppins']"
              >
                <FaPaw />
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
