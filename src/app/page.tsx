// src/app/page.tsx
'use client'

import { Navbar } from '@/components/Navbar/Navbar'
import { Hero } from '@/components/Landing/Hero'
import { Features } from '@/components/Landing/Features'
import { HowItWorks } from '@/components/Landing/HowItWorks'
import { PulsePreview } from '@/components/Landing/PulsePreview'
import { Testimonials } from '@/components/Landing/Testimonials'
import { CTA } from '@/components/Landing/CTA'
import { Footer } from '@/components/Landing/Footer'

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <PulsePreview />
      <Testimonials />
      <CTA />
      <Footer />
    </main>
  )
}