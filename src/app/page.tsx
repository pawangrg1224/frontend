'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'
import { Stethoscope, Clock, Users, BarChart3, Check, ArrowRight } from 'lucide-react'

const LandingPage = () => {
  // Intersection Observer for Fade-in animations
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
          observer.unobserve(entry.target)
        }
      })
    }, observerOptions)

    const fadeElements = document.querySelectorAll('.fade-in-up')
    fadeElements.forEach(el => observer.observe(el))

    // Navbar scroll effect
    const handleScroll = () => {
      const nav = document.getElementById('navbar')
      if (window.scrollY > 20) {
        nav?.classList.add('shadow-md')
      } else {
        nav?.classList.remove('shadow-md')
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="relative overflow-x-hidden scroll-smooth">
      {/* Noise Texture Overlay */}
      <div
        className="fixed top-0 left-0 w-full h-full pointer-events-none z-50 opacity-[0.03]"
        style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")"
        }}
      />

      {/* Navigation */}
      <nav className="fixed w-full z-40 top-0 transition-all duration-300" id="navbar">
        <div className="absolute inset-0 bg-white/80 backdrop-blur-md border-b border-zinc-200/50"></div>
        <div className="max-w-6xl mx-auto px-6 h-16 relative flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center group-hover:shadow-lg transition-all duration-300">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold tracking-tight text-lg bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">MediBook</span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-700">
            <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
            <a href="#benefits" className="hover:text-blue-600 transition-colors">Benefits</a>
            <a href="#pricing" className="hover:text-blue-600 transition-colors">Pricing</a>
          </div>

          {/* CTA */}
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="hidden md:block text-sm font-medium hover:text-zinc-600 transition-colors">Log in</Link>
            <Link href="/auth/signup" className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-sm font-semibold rounded-lg hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5">
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 md:pt-48 md:pb-32 px-6 relative">
        <div className="max-w-4xl mx-auto text-center z-10 relative">
          <div className="fade-in-up delay-100 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-sm font-semibold text-blue-700 mb-8">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            Smart appointment scheduling
          </div>

          <h1 className="fade-in-up delay-200 text-5xl md:text-7xl font-bold tracking-tight text-black leading-[1.1] mb-6">
            Healthcare appointments<br />
            <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">made simple</span>
          </h1>

          <p className="fade-in-up delay-300 text-lg md:text-xl text-zinc-600 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
            Streamline your medical appointment management with our intuitive scheduling platform. Built for healthcare professionals and patients who value their time.
          </p>

          <div className="fade-in-up delay-400 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/signup" className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-2">
              Start Free Trial
              <ArrowRight size={18} />
            </Link>
            <Link href="#features" className="w-full sm:w-auto px-8 py-4 border-2 border-zinc-200 bg-white text-black font-semibold rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-300">
              Explore Features
            </Link>
          </div>

          {/* Hero Mockup */}
          <div className="fade-in-up delay-500 mt-20 max-w-5xl mx-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-200 via-cyan-200 to-teal-200 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition duration-1000"></div>

            <div className="relative bg-white border border-zinc-200 rounded-2xl shadow-2xl overflow-hidden">
              {/* Window Header */}
              <div className="h-14 border-b border-zinc-100 flex items-center px-6 justify-between bg-gradient-to-r from-blue-50 to-cyan-50">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="text-xs text-zinc-400 font-mono">medibook.app/dashboard</div>
                <div className="w-4"></div>
              </div>

              {/* Hero Image Placeholder */}
              <div className="relative bg-gradient-to-br from-blue-50 via-white to-cyan-50 aspect-video flex items-center justify-center overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute top-10 left-10 w-32 h-32 bg-blue-200 rounded-full blur-3xl opacity-20"></div>
                <div className="absolute bottom-10 right-10 w-40 h-40 bg-cyan-200 rounded-full blur-3xl opacity-20"></div>

                {/* Content */}
                <div className="relative z-10 text-center px-6">
                  <div className="flex justify-center gap-4 mb-6">
                    <div className="p-3 bg-white rounded-lg shadow-sm border border-zinc-200">
                      <Stethoscope size={24} className="text-blue-600" />
                    </div>
                    <div className="p-3 bg-white rounded-lg shadow-sm border border-zinc-200">
                      <Clock size={24} className="text-cyan-600" />
                    </div>
                    <div className="p-3 bg-white rounded-lg shadow-sm border border-zinc-200">
                      <Users size={24} className="text-teal-600" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-zinc-800 mb-2">All Your Medical Appointments in One Place</h3>
                  <p className="text-zinc-600 text-sm">Manage patients, doctors, and schedules effortlessly</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 border-y border-zinc-100 bg-white">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-8">Trusted by professionals worldwide</p>
          <div className="flex flex-wrap justify-center gap-12 md:gap-20 opacity-50">
            <div className="font-bold text-lg text-zinc-400">✨ Bright Design</div>
            <div className="font-bold text-lg text-zinc-400">⚡ Lightning Fast</div>
            <div className="font-bold text-lg text-zinc-400">🎯 Simple & Intuitive</div>
            <div className="font-bold text-lg text-zinc-400">🔒 Secure & Reliable</div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6 bg-white relative">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16 max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-bold text-black mb-4 tracking-tight">
              Everything you need for appointment success
            </h2>
            <p className="text-lg text-zinc-600 font-light leading-relaxed">
              Powerful features designed to save time, reduce no-shows, and keep your business running smoothly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="fade-in-up p-8 bg-gradient-to-br from-white to-blue-50 border border-blue-100 rounded-xl hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-6">
                <Stethoscope className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-black mb-3">Smart Scheduling</h3>
              <p className="text-sm text-zinc-600 leading-relaxed">Automated appointment booking with real-time availability and conflict detection</p>
            </div>

            {/* Feature 2 */}
            <div className="fade-in-up p-8 bg-gradient-to-br from-white to-cyan-50 border border-cyan-100 rounded-xl hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-cyan-100 flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-cyan-600" />
              </div>
              <h3 className="text-lg font-semibold text-black mb-3">Patient Management</h3>
              <p className="text-sm text-zinc-600 leading-relaxed">Organize patient information, track medical history, and manage appointments</p>
            </div>

            {/* Feature 3 */}
            <div className="fade-in-up p-8 bg-gradient-to-br from-white to-teal-50 border border-teal-100 rounded-xl hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-teal-100 flex items-center justify-center mb-6">
                <Clock className="w-6 h-6 text-teal-600" />
              </div>
              <h3 className="text-lg font-semibold text-black mb-3">Department Management</h3>
              <p className="text-sm text-zinc-600 leading-relaxed">Manage medical departments with specialized services, pricing, and availability</p>
            </div>

            {/* Feature 4 */}
            <div className="fade-in-up p-8 bg-gradient-to-br from-white to-emerald-50 border border-emerald-100 rounded-xl hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center mb-6">
                <BarChart3 className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-black mb-3">Analytics Dashboard</h3>
              <p className="text-sm text-zinc-600 leading-relaxed">Gain insights into bookings, peak hours, customer trends, and revenue</p>
            </div>

            {/* Feature 5 */}
            <div className="fade-in-up p-8 bg-gradient-to-br from-white to-orange-50 border border-orange-100 rounded-xl hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center mb-6">
                <Check className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-black mb-3">Automated Reminders</h3>
              <p className="text-sm text-zinc-600 leading-relaxed">Send SMS and email reminders to reduce no-shows and cancellations</p>
            </div>

            {/* Feature 6 */}
            <div className="fade-in-up p-8 bg-gradient-to-br from-white via-blue-50 to-cyan-50 border border-blue-100 rounded-xl hover:shadow-lg transition-all duration-300 lg:col-span-1">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center mb-6">
                <ArrowRight className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-black mb-3">Easy Integration</h3>
              <p className="text-sm text-zinc-600 leading-relaxed">Seamlessly integrate with your existing healthcare management tools</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-24 px-6 bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-black mb-4">Why choose MediBook?</h2>
            <p className="text-lg text-zinc-600 max-w-2xl mx-auto">The smartest way to manage medical appointments for healthcare providers</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="fade-in-up flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                  <Check size={24} />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-black mb-2">Save Time & Reduce Overhead</h3>
                <p className="text-zinc-600">Automate the entire scheduling process and eliminate back-and-forth emails</p>
              </div>
            </div>

            <div className="fade-in-up flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 text-white">
                  <Check size={24} />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-black mb-2">Reduce No-Shows</h3>
                <p className="text-zinc-600">Automated reminders keep patients informed and reduce missed appointments</p>
              </div>
            </div>

            <div className="fade-in-up flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 text-white">
                  <Check size={24} />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-black mb-2">Improve Efficiency</h3>
                <p className="text-zinc-600">More patient visits, fewer cancellations, and better resource utilization</p>
              </div>
            </div>

            <div className="fade-in-up flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                  <Check size={24} />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-black mb-2">Professional Experience</h3>
                <p className="text-zinc-600">Modern, beautiful interface that impresses patients and enhances healthcare delivery</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-black mb-4">Simple, Transparent Pricing</h2>
            <p className="text-lg text-zinc-600">Start free, upgrade as you grow</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Starter Plan */}
            <div className="fade-in-up p-8 bg-white border border-zinc-200 rounded-xl hover:shadow-lg transition-all duration-300">
              <h3 className="text-xl font-bold text-black mb-2">Starter</h3>
              <p className="text-sm text-zinc-600 mb-6">Perfect for freelancers</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-black">$0</span>
                <span className="text-zinc-600 ml-2">/month</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-sm text-zinc-700">
                  <Check size={18} className="text-blue-600 flex-shrink-0" /> Up to 50 appointments/month
                </li>
                <li className="flex items-center gap-3 text-sm text-zinc-700">
                  <Check size={18} className="text-blue-600 flex-shrink-0" /> 1 Admin user
                </li>
                <li className="flex items-center gap-3 text-sm text-zinc-700">
                  <Check size={18} className="text-blue-600 flex-shrink-0" /> Basic analytics
                </li>
              </ul>
              <Link href="/auth/signup" className="block w-full py-3 text-center border-2 border-zinc-200 rounded-lg text-black font-semibold hover:border-blue-300 hover:bg-blue-50 transition-all">
                Get Started
              </Link>
            </div>

            {/* Professional Plan (Popular) */}
            <div className="fade-in-up p-8 bg-gradient-to-br from-blue-600 to-cyan-600 text-white rounded-xl shadow-xl relative overflow-hidden transform md:scale-105">
              <div className="absolute top-4 right-4">
                <span className="text-xs font-bold uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full">Popular</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Professional</h3>
              <p className="text-sm text-blue-100 mb-6">For growing businesses</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">$29</span>
                <span className="text-blue-100 ml-2">/month</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-sm text-blue-100">
                  <Check size={18} className="flex-shrink-0" /> Unlimited appointments
                </li>
                <li className="flex items-center gap-3 text-sm text-blue-100">
                  <Check size={18} className="flex-shrink-0" /> Up to 5 Admin users
                </li>
                <li className="flex items-center gap-3 text-sm text-blue-100">
                  <Check size={18} className="flex-shrink-0" /> Advanced analytics
                </li>
                <li className="flex items-center gap-3 text-sm text-blue-100">
                  <Check size={18} className="flex-shrink-0" /> SMS reminders
                </li>
              </ul>
              <Link href="/auth/signup" className="block w-full py-3 text-center bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-all">
                Start Free Trial
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div className="fade-in-up p-8 bg-white border border-zinc-200 rounded-xl hover:shadow-lg transition-all duration-300">
              <h3 className="text-xl font-bold text-black mb-2">Enterprise</h3>
              <p className="text-sm text-zinc-600 mb-6">For large teams</p>
              <div className="mb-6">
                <span className="text-2xl font-bold text-black">Custom</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-sm text-zinc-700">
                  <Check size={18} className="text-blue-600 flex-shrink-0" /> Everything in Professional
                </li>
                <li className="flex items-center gap-3 text-sm text-zinc-700">
                  <Check size={18} className="text-blue-600 flex-shrink-0" /> Unlimited team members
                </li>
                <li className="flex items-center gap-3 text-sm text-zinc-700">
                  <Check size={18} className="text-blue-600 flex-shrink-0" /> API access
                </li>
                <li className="flex items-center gap-3 text-sm text-zinc-700">
                  <Check size={18} className="text-blue-600 flex-shrink-0" /> Priority support
                </li>
              </ul>
              <button className="block w-full py-3 text-center border-2 border-zinc-200 rounded-lg text-black font-semibold hover:border-blue-300 hover:bg-blue-50 transition-all">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to transform your healthcare scheduling?</h2>
          <p className="text-lg text-blue-100 mb-10 max-w-2xl mx-auto">Join hundreds of healthcare professionals using MediBook to manage their appointments effortlessly</p>
          <Link href="/auth/signup" className="inline-block px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-all duration-300 shadow-lg hover:shadow-xl">
            Start Your Free Trial Today
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-900 text-zinc-300 pt-16 pb-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <Stethoscope className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-white">MediBook</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Smart appointment scheduling for healthcare professionals.
                <br />© 2024 MediBook. All rights reserved.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-zinc-800 text-center text-xs text-zinc-500">
            <p>Made with ❤️ for healthcare professionals who value their time</p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        .fade-in-up {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.8s ease-out, transform 0.8s ease-out;
        }
        
        .fade-in-up.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .delay-100 { transition-delay: 100ms; }
        .delay-200 { transition-delay: 200ms; }
        .delay-300 { transition-delay: 300ms; }
        .delay-400 { transition-delay: 400ms; }
        .delay-500 { transition-delay: 500ms; }

        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: #d4d4d8;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #a1a1aa;
        }

        ::selection {
          background: #3b82f6;
          color: white;
        }
      `}</style>
    </div>
  )
}

export default LandingPage
