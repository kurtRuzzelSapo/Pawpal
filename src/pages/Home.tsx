import { PostList } from "../components/PostList";
import { FaPaw } from "react-icons/fa";
import { useEffect, useState } from "react";

const Home = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);

    // Add scroll animation for elements
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -100px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.reveal');
    animatedElements.forEach(el => observer.observe(el));

    return () => {
      animatedElements.forEach(el => observer.unobserve(el));
    };
  }, []);

  return (
    <div className="pt-20 min-h-screen bg-gradient-to-b from-violet-50/50 via-blue-50/30 to-white px-4">
      {/* Animated Paw Prints Background */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-5">
        {Array.from({ length: 15 }).map((_, i) => (
          <FaPaw
            key={i}
            className="absolute text-violet-600 animate-float"
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
      
      <div className={`text-center mb-10 reveal transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <span className="bg-violet-100 text-violet-800 px-4 py-1 rounded-full text-sm font-medium font-['Poppins'] mb-4 inline-block">Home Feed</span>
        <h2 className="text-4xl md:text-5xl font-bold text-violet-800 font-['Quicksand']">
          Recent Posts
        </h2>
        <div className="w-24 h-1 bg-gradient-to-r from-violet-500 to-blue-500 mx-auto mt-6"></div>
        <p className="text-gray-600 mt-4 max-w-xl mx-auto font-['Poppins']">
          Stay updated with the latest posts from our community of pet lovers
        </p>
      </div>
      <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-md p-6 reveal w-full">
        <PostList />
      </div>
    </div>
  );
};

export default Home;
