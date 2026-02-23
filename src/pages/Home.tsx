import React from 'react';
import Hero from '../components/Hero';
import HowItWorks from '../components/HowItWorks';
import CategoriesSection from '../components/Categories';
import SuccessStories from '../components/SuccessStories';
import FAQ from '../components/FAQ';
import FinalCTA from '../components/FinalCTA';
import ContactForm from '../components/ContactForm';

const Home: React.FC = () => {
  return (
    <>
      <Hero />
      <HowItWorks />
      <CategoriesSection />
      <SuccessStories />
      <FAQ />
      <FinalCTA />
      <ContactForm />
    </>
  );
};

export default Home;