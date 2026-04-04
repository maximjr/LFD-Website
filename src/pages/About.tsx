import { CheckCircle2, Target, Eye, Heart } from 'lucide-react';
import { motion } from 'motion/react';

export default function About() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-slate-900 text-white py-20 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img 
            src="https://i.imgur.com/Ejjufjy.png" 
            alt="Hospital background" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="container-custom relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-white mb-6">About <span className="text-emerald-400">Optimal Health Care</span></h1>
            <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Dedicated to providing exceptional medical care and improving the health of our community through innovation, compassion, and excellence.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container-custom py-20 lg:py-32">
        {/* Legacy Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center mb-32">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-slate-900 mb-8 leading-tight">A Legacy of Excellence in Healthcare</h2>
            <p className="text-slate-600 text-lg mb-6 leading-relaxed">
              Founded in 1998, Optimal Health Care has grown from a small community clinic into a comprehensive medical center. Our journey is defined by a relentless commitment to patient-centered care, medical innovation, and clinical excellence.
            </p>
            <p className="text-slate-600 text-lg mb-10 leading-relaxed">
              We believe that healthcare should be accessible, compassionate, and of the highest quality. Our state-of-the-art facilities and team of renowned specialists ensure that you receive the best possible treatment.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                "State-of-the-art equipment",
                "Award-winning patient care",
                "Internationally recognized",
                "24/7 emergency support"
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-slate-700 font-bold">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="aspect-[4/5] rounded-[2.5rem] overflow-hidden shadow-2xl relative">
              <img 
                src="https://i.imgur.com/mWxQGd3.png" 
                alt="Healthcare Excellence" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-white/50"></div>
            </div>
            <div className="absolute -bottom-8 -left-8 bg-white p-8 sm:p-10 rounded-3xl shadow-2xl border border-slate-100 hidden sm:block">
              <p className="text-5xl lg:text-6xl font-black text-emerald-600 mb-2 tracking-tighter">25+</p>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Years of Excellence</p>
            </div>
          </motion.div>
        </div>

        {/* Mission, Vision, Values */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-32">
          {[
            { 
              title: "Our Mission", 
              icon: <Target className="w-8 h-8 text-emerald-600" />, 
              bg: "bg-emerald-50", 
              border: "border-emerald-100",
              text: "To improve the health and well-being of the communities we serve by providing compassionate, high-quality, and accessible healthcare."
            },
            { 
              title: "Our Vision", 
              icon: <Eye className="w-8 h-8 text-purple-600" />, 
              bg: "bg-purple-50", 
              border: "border-purple-100",
              text: "To be the premier healthcare destination recognized for clinical excellence, innovation, and an unparalleled patient experience."
            },
            { 
              title: "Our Values", 
              icon: <Heart className="w-8 h-8 text-amber-600" />, 
              bg: "bg-amber-50", 
              border: "border-amber-100",
              text: "Compassion, Excellence, Integrity, Respect, and Teamwork guide every interaction and decision we make."
            }
          ].map((card, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -10 }}
              className={`${card.bg} p-10 rounded-[2rem] text-center border ${card.border} flex flex-col items-center shadow-sm`}
            >
              <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-md">
                {card.icon}
              </div>
              <h3 className="text-slate-900 mb-4">{card.title}</h3>
              <p className="text-slate-600 text-lg leading-relaxed">
                {card.text}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Leadership */}
        <div className="text-center mb-20">
          <h2 className="text-slate-900 mb-6">Our Leadership</h2>
          <p className="text-slate-600 text-lg sm:text-xl max-w-2xl mx-auto">Guided by experienced professionals dedicated to advancing healthcare.</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-16 max-w-6xl mx-auto">
          {[
            { name: "Dr. Robert Wilson", role: "Chief Executive Officer", img: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" },
            { name: "Dr. Amanda Chen", role: "Chief Medical Officer", img: "https://images.unsplash.com/photo-1594824436998-058d0152a28b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" },
            { name: "James Thompson", role: "Chief Operations Officer", img: "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" }
          ].map((leader, i) => (
            <motion.div 
              key={i} 
              whileHover={{ y: -5 }}
              className="text-center group"
            >
              <div className="relative w-64 h-64 mx-auto mb-8 rounded-[2.5rem] overflow-hidden shadow-xl group-hover:shadow-2xl transition-all">
                <img src={leader.img} alt={leader.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
              <h3 className="text-slate-900 mb-2">{leader.name}</h3>
              <p className="text-emerald-600 font-bold uppercase tracking-widest text-sm">{leader.role}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
