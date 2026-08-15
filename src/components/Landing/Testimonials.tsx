/* eslint-disable react/jsx-no-comment-textnodes */
/* eslint-disable react/no-unescaped-entities */
// src/components/Landing/Testimonials.tsx
'use client'

import { motion } from 'framer-motion'
import { Card } from '@/components/UI/Card'

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Software Engineer',
    avatar: 'SJ',
    content: 'Pulse AI has completely transformed my workflow. The code generation is incredibly accurate and saves me hours every day.',
    rating: 5,
  },
  {
    name: 'Michael Chen',
    role: 'Content Creator',
    avatar: 'MC',
    content: 'The writing assistance is phenomenal. Pulse AI helps me create engaging content that resonates with my audience.',
    rating: 5,
  },
  {
    name: 'Emily Rodriguez',
    role: 'Data Scientist',
    avatar: 'ER',
    content: 'The file analysis feature is a game-changer. I can upload complex documents and get instant insights.',
    rating: 5,
  },
  {
    name: 'David Kim',
    role: 'Product Manager',
    avatar: 'DK',
    content: 'Pulse AI helps me stay organized and focused. The memory feature remembers my preferences and makes helpful suggestions.',
    rating: 5,
  },
]

export function Testimonials() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-surface/30">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            What People Are Saying
          </h2>
          <p className="text-xl text-muted max-w-2xl mx-auto">
            Join thousands of satisfied users who trust Pulse AI
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <Card variant="glass" className="p-6 h-full">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary-pulse/20 flex items-center justify-center font-semibold text-primary-pulse">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <h3 className="font-semibold">{testimonial.name}</h3>
                    <p className="text-sm text-muted">{testimonial.role}</p>
                  </div>
                </div>
                
                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <span key={i} className="text-yellow-500">★</span>
                  ))}
                </div>
                
                <p className="text-muted">
                  // eslint-disable-next-line react/no-unescaped-entities
                  "{testimonial.content}"
                </p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}