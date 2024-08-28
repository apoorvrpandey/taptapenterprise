import React from 'react';

const People = ({ company }) => {
  return (
    <div className="container mx-auto p-8">
      <section className="bg-white rounded-lg shadow-lg p-8 mb-12">
        <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">Alumni of the Company</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-4 text-gray-700">2023 Alumni in Software Engineering</h3>
            <div className="flex justify-center space-x-4 mb-4">
              {['man1.avif', 'girl1.avif', 'man2.avif', 'girl2.avif', 'man3.avif'].map((src, index) => (
                <div key={index} className="relative">
                  <img src={`img/${src}`} alt="Alumni" className="w-16 h-16 rounded-full border-2 border-white shadow-md object-cover" />
                </div>
              ))}
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-200 border-2 border-white shadow-md">
                <span className="text-lg font-bold text-gray-700">29+</span>
              </div>
            </div>
            <p className="text-sm text-gray-600">Alex, Anika, Aarav, Anna Mehra & 4000 others</p>
          </div>

          <div className="text-center">
            <h3 className="text-xl font-semibold mb-4 text-gray-700">2023 Alumni in Tata Consultancy Services</h3>
            <div className="flex justify-center space-x-4 mb-4">
              {['man1.jpg', 'man2.jpeg', 'man3.jpeg', 'lady1.avif', 'lady2.jpeg'].map((src, index) => (
                <div key={index} className="relative">
                  <img src={`img/${src}`} alt="Alumni" className="w-16 h-16 rounded-full border-2 border-white shadow-md object-cover" />
                </div>
              ))}
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-200 border-2 border-white shadow-md">
                <span className="text-lg font-bold text-gray-700">29+</span>
              </div>
            </div>
            <p className="text-sm text-gray-600">Rahul, Joseph, Sumit, Sneha, Sreya & 3000 others</p>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">People You May Know</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { name: 'Alex Johnson', img: 'man1.avif', title: 'Software Engineer', followers: '5K followers' },
            { name: 'Anika Sharma', img: 'girl1.avif', title: 'Product Manager', followers: '4K followers' },
            { name: 'Aarav Patel', img: 'man2.avif', title: 'Software Engineer', followers: '3K followers' },
          ].map((person, index) => (
            <div key={index} className="bg-white rounded-lg shadow-lg p-6 text-center transition-transform transform hover:scale-105">
              <img src={`img/${person.img}`} alt="Profile Picture" className="w-24 h-24 rounded-full mx-auto mb-4 shadow-md object-cover" />
              <h3 className="text-xl font-semibold mb-2 text-gray-700">{person.name}</h3>
              <p className="text-sm text-gray-600 mb-2">{person.title} at <span className="font-semibold">{company.company_name}</span></p>
              <p className="text-xs text-gray-400">{person.followers} • Passionate about technology and innovation</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default People;
