import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TranslatedText from '../Components/TranslatedText';

const Home = () => {
  const navigate = useNavigate();
  const [showBranding, setShowBranding] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowBranding(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const features = [
    {
      id: 'search',
      title: 'Search',
      image: 'https://cdn-icons-png.flaticon.com/128/954/954591.png', // Replace with actual image path
      action: () => navigate('/search'),
    },
    {
      id: 'lists',
      title: 'Lists',
      image: 'https://cdn-icons-png.flaticon.com/128/3082/3082854.png', // Replace with actual image path
      action: () => navigate('/lists'),
    },
    {
      id: 'survey',
      title: 'Survey',
      image: 'https://cdn-icons-png.flaticon.com/128/6728/6728433.png', // Replace with actual image path
      action: () => navigate('/survey'),
    },
    {
      id: 'booth-management',
      title: 'Booths',
      image: 'https://cdn-icons-png.flaticon.com/128/3069/3069040.png', // Replace with actual image path
      action: () => navigate('/booths'),
    },
  ];

  const bottomFeatures = [
    {
      id: 'settings',
      title: 'Settings',
      image: 'https://cdn-icons-png.flaticon.com/128/3953/3953226.png', // Replace with actual image path
      action: () => navigate('/settings'),
    },
    {
      id: 'contact',
      title: 'Contact',
      image: 'https://cdn-icons-png.flaticon.com/128/4370/4370113.png', // Replace with actual image path
      action: () => navigate('/contact'),
    },
  ];

  if (showBranding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-white">
        <div className="w-full h-screen overflow-hidden">
          <img
            src="/frontstaringbanner.jpeg"
            alt="Campaign banner"
            loading="eager"
            className="absolute inset-0 w-full h-full object-center"
          />
        </div>
      </div>
    );
  }

  return (
    // Use a positioned full-bleed image so it's always visible at 100% opacity
    <div className="relative min-h-screen pb-8">
      {/* Full-bleed background image (opacity 100%) - replace URL with preferred image or local asset */}
      {/* <img
        src="/backpng.jpg"
        alt="Background"
        className="absolute inset-0 w-full h-full object-cover opacity-100 z-0"
      /> */}

      {/* Content container sits above the image */}
      <div className="relative z-10 min-h-screen pb-8">
        {/* Main Content */}
        <div className="pt-12 px-4">

          {/* Combined Features Grid (merged top + bottom) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8 max-w-3xl mx-auto px-4">
            {([...features, ...bottomFeatures]).map((feature) => (
              <div
                key={feature.id}
                onClick={feature.action}
                className="group cursor-pointer transform transition-all duration-250 hover:scale-102 active:scale-98"
              >
                <div className="relative bg-white/90 rounded-2xl shadow-lg border border-orange-200 p-4 pb-8 text-center hover:shadow-xl transition-all duration-200 hover:border-orange-300 h-full flex flex-col items-center justify-center backdrop-blur-sm overflow-hidden">
                  <div className="flex justify-center mb-3">
                    <div className="p-2 bg-orange-100 rounded-xl group-hover:bg-orange-200 transition-colors duration-300 border border-orange-300">
                      <img
                        src={feature.image}
                        alt={feature.title}
                        className="w-20 h-20 object-contain"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          // show fallback as flex so it centers its content
                          if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      {/* Fallback if image doesn't load */}
                      <div className="w-10 h-10 items-center justify-center text-orange-600 font-bold text-base hidden">
                        {feature.title.charAt(0)}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-gray-800 group-hover:text-gray-900 font-sans">
                    <TranslatedText>{feature.title}</TranslatedText>
                  </div>

                  {/* Decorative bottom wave (matches brand) */}
                  <svg
                    className="absolute left-0 bottom-0 w-full h-8"
                    viewBox="0 0 1200 120"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <defs>
                      <linearGradient id={`grad-${feature.id}`} x1="0%" x2="100%" y1="0%" y2="0%">
                        <stop offset="0%" stopColor="#ff8a00" stopOpacity="0.95" />
                        <stop offset="100%" stopColor="#ff5e00" stopOpacity="0.95" />
                      </linearGradient>
                    </defs>
                    <path d="M0,0 C150,100 350,0 600,50 C850,100 1050,10 1200,80 L1200,120 L0,120 Z" fill={`url(#grad-${feature.id})`} />
                  </svg>
                </div>
              </div>

            ))}
          </div>

        </div>

        {/* Political Image Banner */}
        <div className="max-w-md mx-auto mb-8 mt-8 px-4">
          <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-white/80">
            <img
              src="/frontbanner.jpeg"
              alt="Political campaign"
              className="w-full h-auto object-cover"
            />
          </div>
        </div>

      </div>
    </div>
  );
};

export default Home;