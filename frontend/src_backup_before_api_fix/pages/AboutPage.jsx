// src/pages/AboutPage.jsx
import React from 'react';
import ScrollToTopButton from './ScrollToTop';

const AboutPage = () => {
  return (
    <div className="about-page bg-white dark:bg-gray-900 text-black dark:text-white min-h-screen">
      <div className="container mx-auto p-6">
        {/* Header Section */}
        <header className="text-center py-10 bg-indigo-500 text-white rounded-lg shadow-lg">
          <h1 className="text-4xl font-bold mb-4">About Coaching Finder</h1>
          <p className="text-xl">Your trusted partner in finding the best educational opportunities.</p>
        </header>

        {/* Our Mission */}
        <section className="my-10 text-center">
          <h2 className="text-2xl font-semibold text-indigo-600 mb-4">Our Mission</h2>
          <p className="text-lg max-w-3xl mx-auto">
            At Coaching Finder, our mission is simple: to help students and professionals easily discover the right coaching institutes that match their goals. We believe that finding quality education should be easy, transparent, and accessible to everyone.
          </p>
        </section>

        {/* Our Story */}
        <section className="my-10 text-center">
          <h2 className="text-2xl font-semibold text-indigo-600 mb-4">Our Story</h2>
          <p className="text-lg max-w-3xl mx-auto">
            Founded by a team of passionate educators and tech enthusiasts, Coaching Finder was born out of the need for a centralized platform that connects students with the best coaching centers across the country. With the right guidance and verified reviews, we aim to empower learners to make confident decisions for their future.
          </p>
        </section>

        {/* Core Values */}
        <section className="my-10 text-center">
          <h2 className="text-2xl font-semibold text-indigo-600 mb-4">Our Core Values</h2>
          <div className="flex justify-center gap-6 flex-wrap">
            <div className="bg-indigo-500 text-white p-6 rounded-lg shadow-lg w-64">
              <h3 className="text-xl font-semibold mb-2">Transparency</h3>
              <p>We provide honest reviews and detailed information to help you choose wisely.</p>
            </div>
            <div className="bg-indigo-500 text-white p-6 rounded-lg shadow-lg w-64">
              <h3 className="text-xl font-semibold mb-2">Trust</h3>
              <p>We verify institutes thoroughly to build a reliable and safe learning ecosystem.</p>
            </div>
            <div className="bg-indigo-500 text-white p-6 rounded-lg shadow-lg w-64">
              <h3 className="text-xl font-semibold mb-2">Innovation</h3>
              <p>We leverage technology to simplify your search and learning journey.</p>
            </div>
          </div>
        </section>

        {/* Scroll To Top */}
        <ScrollToTopButton />
      </div>
    </div>
  );
};

export default AboutPage;