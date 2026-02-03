import React, { useEffect } from 'react';
import LandingPage from '@/components/LandingPage';

export default function PlansPage() {
  useEffect(() => {
    // wait for LandingPage to render then scroll to plans section
    const t = setTimeout(() => {
      const el = document.getElementById('plans');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);
    return () => clearTimeout(t);
  }, []);

  return <LandingPage />;
}
