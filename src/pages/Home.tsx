import { Calendar, Clock, PhoneCall, ArrowRight, Star, ShoppingCart, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

export default function Home() {
  const featuredProducts = [
    { name: "Vital Food", desc: "A nutrient-dense superfood blend designed to boost your immune system.", img: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" },
    { name: "Vital Pufa", desc: "A healthy, low-glycemic alternative to traditional fufu.", img: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" },
    { name: "Vital Buccal Care", desc: "Natural oral care solution formulated to promote healthy gums.", img: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" },
    { name: "Exotic Natural Drink", desc: "Refreshing and revitalizing herbal beverage packed with antioxidants.", img: "https://images.unsplash.com/photo-1544145945-f90425340c7e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" }
  ];

  const stats = [
    { value: "25+", label: "Years Experience" },
    { value: "100%", label: "Happy Patients" },
    { value: "50k+", label: "Patients Treated" },
    { value: "100%", label: "Commitment" }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center overflow-hidden bg-slate-900">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://i.imgur.com/01y4Sdh.png" 
            alt="Hospital background"
            className="w-full h-full object-cover opacity-40"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent"></div>
        </div>

        <div className="container-custom relative z-10 py-20">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold text-sm mb-6 border border-emerald-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Your Health, Our Priority
            </div>
            <h1 className="text-white mb-6">
              Advanced Healthcare <br className="hidden sm:block" />
              <span className="text-emerald-500">For You & Your Family</span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-300 mb-10 leading-relaxed max-w-2xl">
              Experience world-class medical care with our team of expert specialists. We combine compassionate care with cutting-edge technology to ensure your optimal health.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-full font-bold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-lg min-h-[56px]">
                <Calendar className="w-5 h-5" /> Book Appointment
              </button>
              <Link to="/products" className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 px-8 py-4 rounded-full font-bold transition-all flex items-center justify-center gap-2 text-lg min-h-[56px]">
                Explore Products <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Info Cards Section */}
      <section className="py-12 lg:py-20 -mt-12 lg:-mt-24 relative z-20">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100 flex flex-col"
            >
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 mb-6">
                <Calendar className="w-7 h-7" />
              </div>
              <h3 className="text-slate-900 mb-3">Online Appointment</h3>
              <p className="text-slate-600 mb-8 leading-relaxed">
                Schedule your visit with our specialists easily through our online booking system.
              </p>
              <Link to="/contact" className="mt-auto text-emerald-600 font-bold flex items-center gap-2 group min-h-[44px]">
                Book Now <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>

            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100 border-t-4 border-t-purple-500 flex flex-col"
            >
              <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600 mb-6">
                <Clock className="w-7 h-7" />
              </div>
              <h3 className="text-slate-900 mb-3">Working Hours</h3>
              <ul className="space-y-4 text-slate-600 mb-4">
                <li className="flex justify-between items-center border-b border-slate-50 pb-2">
                  <span className="font-medium">Mon - Sat</span>
                  <span className="text-slate-900 font-bold">8:00 AM - 8:00 PM</span>
                </li>
                <li className="flex justify-between items-center border-b border-slate-50 pb-2">
                  <span className="font-medium">Sun - Tue</span>
                  <span className="text-slate-900 font-bold">Closed</span>
                </li>
                <li className="flex justify-between items-center pt-2">
                  <span className="font-medium">Emergency</span>
                  <span className="text-purple-600 font-bold">24/7</span>
                </li>
              </ul>
            </motion.div>

            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-emerald-600 rounded-3xl shadow-xl p-8 text-white md:col-span-2 lg:col-span-1"
            >
              <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center mb-6">
                <PhoneCall className="w-7 h-7" />
              </div>
              <h3 className="mb-3">Emergency Cases</h3>
              <p className="text-emerald-50 mb-8 leading-relaxed">
                Our emergency department is open 24/7 to handle critical medical situations.
              </p>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <p className="text-sm text-emerald-200 mb-1 uppercase tracking-wider font-bold">Call us immediately</p>
                <a href="tel:+237671826002" className="text-2xl sm:text-3xl font-black tracking-tight hover:text-emerald-200 transition-colors min-h-[44px]">
                  +237 671 826 002
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Products Preview */}
      <section className="py-20 lg:py-32 bg-white">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div className="max-w-2xl">
              <h2 className="text-slate-900 mb-4">Our Health Products</h2>
              <p className="text-slate-600 text-lg sm:text-xl">Natural, safe, and effective products tailored to your wellness needs.</p>
            </div>
            <Link to="/products" className="inline-flex items-center gap-2 text-emerald-600 font-bold hover:gap-3 transition-all min-h-[44px]">
              View All Products <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          
          <div className="grid-responsive">
            {featuredProducts.map((product, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -10 }}
                className="bg-white rounded-3xl border border-slate-100 p-8 hover:shadow-2xl transition-all group flex flex-col items-center text-center"
              >
                <div className="w-24 h-24 bg-emerald-50 rounded-3xl flex items-center justify-center mb-8 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                  <ShoppingCart className="w-10 h-10" />
                </div>
                <h3 className="text-slate-900 mb-3">{product.name}</h3>
                <p className="text-slate-600 mb-8 leading-relaxed flex-grow">{product.desc}</p>
                <Link to="/products" className="w-full py-3 px-6 rounded-xl border-2 border-emerald-600 text-emerald-600 font-bold hover:bg-emerald-600 hover:text-white transition-all min-h-[44px]">
                  Learn more
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 lg:py-32 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-emerald-500 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500 rounded-full blur-[120px]"></div>
        </div>
        <div className="container-custom relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-4xl sm:text-5xl lg:text-6xl font-black text-emerald-500 mb-2 tracking-tight">{stat.value}</p>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs sm:text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Patient Stories */}
      <section className="py-20 lg:py-32 bg-slate-50">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-slate-900 mb-6">Patient Stories</h2>
            <p className="text-slate-600 text-lg sm:text-xl">Hear what our patients have to say about their experience with Optimal Health Care.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
            {[
              { name: "Sarah Johnson", role: "Patient", text: "The care I received at Optimal Health Care was truly exceptional. The doctors were attentive and the staff made me feel comfortable throughout my treatment." },
              { name: "Michael Chen", role: "Patient", text: "I highly recommend this hospital. The facilities are state-of-the-art and the medical team goes above and beyond to ensure patient well-being." },
              { name: "Emily Davis", role: "Patient", text: "Outstanding service from start to finish. The online appointment system was incredibly convenient, and the consultation was thorough." }
            ].map((review, i) => (
              <motion.div 
                key={i}
                whileHover={{ scale: 1.02 }}
                className="bg-white p-10 rounded-3xl shadow-sm border border-slate-100 relative"
              >
                <div className="flex gap-1 text-amber-400 mb-8">
                  {[...Array(5)].map((_, j) => <Star key={j} className="w-5 h-5 fill-current" />)}
                </div>
                <p className="text-slate-700 text-lg mb-10 leading-relaxed italic font-medium">"{review.text}"</p>
                <div className="flex items-center gap-4 pt-6 border-t border-slate-50">
                  <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-700 font-black text-xl">
                    {review.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-lg">{review.name}</h4>
                    <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">{review.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Find Us Section */}
      <section className="py-20 lg:py-32 bg-white">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-slate-900 mb-6">Find Us</h2>
            <p className="text-slate-600 text-lg sm:text-xl">Visit Optimal Health Care at our location for quality medical care.</p>
          </div>
          
          <div className="rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-100 relative h-[500px] lg:h-[600px]">
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
        </div>
      </section>
    </div>
  );
}
