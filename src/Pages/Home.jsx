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
      id: 'contactus',
      title: 'Contact',
      image: 'https://cdn-icons-png.flaticon.com/128/4370/4370113.png', // Replace with actual image path
      action: () => navigate('/contactus'),
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
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat pb-8"
      style={{ backgroundImage: "url('/images/app-background.jpg')" }} // Replace with actual background image
    >
      {/* Overlay for better readability */}
      <div className="min-h-screen pb-8">
        
        {/* Main Content */}
        <div className="pt-12 px-4">

          {/* Top 2x2 Grid */}
          <div className="grid grid-cols-2 gap-6 mb-8 max-w-md mx-auto">
            {features.map((feature) => (
              <div
                key={feature.id}
                onClick={feature.action}
                className="group cursor-pointer transform transition-all duration-300 hover:scale-105 active:scale-95"
              >
                <div className="bg-white/95 rounded-3xl shadow-2xl border-2 border-orange-200 p-6 text-center hover:shadow-2xl transition-all duration-300 hover:border-orange-400 group-active:bg-orange-50/80 h-full flex flex-col items-center justify-center backdrop-blur-sm">
                  <div className="flex justify-center mb-4">
                    <div className="p-2 bg-orange-100 rounded-2xl group-hover:bg-orange-200 transition-colors duration-300 border border-orange-300">
                      <img 
                        src={feature.image} 
                        alt={feature.title}
                        className="w-12 h-12 object-contain"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                      />
                      {/* Fallback if image doesn't load */}
                      <div className="w-12 h-12 items-center justify-center text-orange-600 font-bold text-lg hidden">
                        {feature.title.charAt(0)}
                      </div>
                    </div>
                  </div>
                  <div className="text-base font-bold text-gray-800 group-hover:text-gray-900 font-sans">
                    <TranslatedText>{feature.title}</TranslatedText>
                  </div>
                </div>
              </div>
            ))}
          </div>

         

          {/* Bottom 2x2 Grid */}
          <div className="grid grid-cols-2 gap-6 max-w-md mx-auto">
            {bottomFeatures.map((feature) => (
              <div
                key={feature.id}
                onClick={feature.action}
                className="group cursor-pointer transform transition-all duration-300 hover:scale-105 active:scale-95"
              >
                <div className="bg-white/95 rounded-3xl shadow-2xl border-2 border-orange-200 p-6 text-center hover:shadow-2xl transition-all duration-300 hover:border-orange-400 group-active:bg-orange-50/80 h-full flex flex-col items-center justify-center backdrop-blur-sm">
                  <div className="flex justify-center mb-4">
                    <div className="p-2 bg-orange-100 rounded-2xl group-hover:bg-orange-200 transition-colors duration-300 border border-orange-300">
                      <img 
                        src={feature.image} 
                        alt={feature.title}
                        className="w-12 h-12 object-contain"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                      />
                      {/* Fallback if image doesn't load */}
                      <div className="w-12 h-12 items-center justify-center text-orange-600 font-bold text-lg hidden">
                        {feature.title.charAt(0)}
                      </div>
                    </div>
                  </div>
                  <div className="text-base font-bold text-gray-800 group-hover:text-gray-900 font-sans">
                    <TranslatedText>{feature.title}</TranslatedText>
                  </div>
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

        {/* Footer Note */}
        <div className="max-w-md mx-auto mt-10 px-4 text-center">
          <div className="bg-white/80 rounded-2xl p-4 shadow-lg backdrop-blur-sm">
            <p className="text-sm text-gray-700 font-semibold font-sans">
              <TranslatedText>Empowering democratic processes through technology</TranslatedText>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;