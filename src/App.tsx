import React from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import WorkNumbers from './components/WorkNumbers';
import HowCanIHelp from './components/HowCanIHelp';
import ConsultSection from './components/ConsultCall';
import SelectedWork from './components/SelectedWork';
import Reviews from './components/Reviews';
import Footer from './components/Footer';
import CaseStudy, { caseStudies } from './components/CaseStudy';
import { page } from './i18n';

function App() {
  // Project story pages: /work/<project> and /en/work/<project>
  const story = caseStudies[page];
  if (story) {
    return (
      <div className="min-h-screen">
        <Header />
        <CaseStudy story={story} />
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <WorkNumbers />
      <Reviews />
      <HowCanIHelp />
      <SelectedWork />
      <ConsultSection />
      <Footer />
    </div>
  );
}

export default App;