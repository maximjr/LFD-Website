import { MapPin, Phone, Mail, Clock, ExternalLink, Send } from 'lucide-react';
import { motion } from 'motion/react';

export default function Contact() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-slate-900 text-white py-20 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img 
            src="https://i.imgur.com/Ejjufjy.png" 
            alt="Contact Us background" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6">Contact <span className="text-emerald-400">Us</span></h1>
            <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              We're here to help. Reach out to us for appointments, inquiries, or emergency assistance. Our team is ready to support you.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        {/* Contact Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24 lg:mb-32">
          {[
            { 
              icon: <Phone className="w-8 h-8 text-emerald-600" />, 
              title: "Call Us", 
              desc: "24/7 Emergency Support", 
              info: "+237 671 826 002",
              bg: "bg-emerald-50",
              border: "border-emerald-100"
            },
            { 
              icon: <Mail className="w-8 h-8 text-purple-600" />, 
              title: "Email Us", 
              desc: "For general inquiries", 
              info: "info@optimalhealthcare.com",
              bg: "bg-purple-50",
              border: "border-purple-100"
            },
            { 
              icon: <Clock className="w-8 h-8 text-amber-600" />, 
              title: "Working Hours", 
              desc: "Mon - Sat: 8:00 AM - 8:00 PM", 
              info: "Sun: Closed",
              bg: "bg-amber-50",
              border: "border-amber-100"
            }
          ].map((card, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -10 }}
              className={`${card.bg} p-10 rounded-[2.5rem] text-center border ${card.border} flex flex-col items-center shadow-sm`}
            >
              <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-md">
                {card.icon}
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">{card.title}</h3>
              <p className="text-slate-500 mb-4 font-medium">{card.desc}</p>
              <p className="text-xl font-black text-slate-900">{card.info}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white p-8 sm:p-12 rounded-[2.5rem] border border-slate-100 shadow-2xl"
          >
            <h2 className="text-3xl font-bold text-slate-900 mb-8">Send us a Message</h2>
            <form className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Full Name</label>
                  <input type="text" placeholder="John Doe" className="w-full px-6 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
                  <input type="email" placeholder="john@example.com" className="w-full px-6 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Subject</label>
                <input type="text" placeholder="How can we help?" className="w-full px-6 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Message</label>
                <textarea rows={5} placeholder="Tell us more about your inquiry..." className="w-full px-6 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium resize-none"></textarea>
              </div>
              <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-5 rounded-2xl font-bold text-lg transition-all shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2">
                <Send className="w-5 h-5" /> Send Message
              </button>
            </form>
          </motion.div>

          {/* Map & Address */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-12"
          >
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-6">Our Location</h2>
              <p className="text-slate-600 text-lg leading-relaxed mb-8">
                Visit Optimal Healthcare at our location for quality medical care. We are conveniently located in the heart of the medical district.
              </p>
              
              <div className="flex items-start gap-6 p-8 rounded-3xl bg-slate-50 border border-slate-100 mb-8">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shrink-0 shadow-sm p-2">
                  <img 
                    src="https://i.imgur.com/7ryePWK.png" 
                    alt="Optimal Healthcare Logo" 
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Main Hospital</h3>
                  <p className="text-slate-600 text-lg">fin goudron bange, kotto<br/>Douala, Cameroon</p>
                </div>
              </div>

              <a 
                href="https://maps.app.goo.gl/vQ3zXVbocWvX5JHH6" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-3 bg-purple-600 hover:bg-purple-700 text-white px-10 py-5 rounded-2xl font-bold text-lg transition-all shadow-xl shadow-purple-600/20 w-full sm:w-auto"
              >
                Open in Google Maps <ExternalLink className="w-5 h-5" />
              </a>
            </div>

            <div className="aspect-video rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-100 relative">
              <iframe 
                src="https://maps.google.com/maps?q=1st%20Mega%20Center%20for%20Optimal%20Healthcare%20By%20LFD%20service&t=&z=15&ie=UTF8&iwloc=&output=embed"
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen={false} 
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0 w-full h-full"
              ></iframe>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
