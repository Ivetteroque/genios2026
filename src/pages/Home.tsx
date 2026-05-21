import React from 'react';
import Hero from '../components/Hero';
import HowItWorks from '../components/HowItWorks';
import CategoriesSection from '../components/Categories';
import SuccessStories from '../components/SuccessStories';
import FAQ from '../components/FAQ';
import ContactForm from '../components/ContactForm';

const Home: React.FC = () => {
  return (
    <>
      <Hero />
      <CategoriesSection />
      <HowItWorks />
      <SuccessStories />
      <FAQ />
      <ContactForm />
    </>
  );
};

export default Home;