import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 py-20 lg:py-32 relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl -mr-48 -mt-48"></div>
      
      <div className="container-custom relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 lg:gap-12">
          
          <div className="space-y-8">
            <Link to="/" className="flex items-center gap-4 group">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/10 p-2 transition-transform group-hover:scale-105">
                <img 
                  src="https://i.imgur.com/7ryePWK.png" 
                  alt="Optimal Health Care Logo" 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="font-bold text-xl sm:text-2xl lg:text-3xl tracking-tight flex items-center gap-2">
                <span className="text-[#00a651]">Optimal</span>
                <span className="text-[#9333ea]">Health</span>
                <span className="text-[#00a651]">Care</span>
              </span>
            </Link>
            <p className="text-lg leading-relaxed text-slate-400 font-medium max-w-sm">
              Providing world-class healthcare with compassion and excellence. Your health is our top priority.
            </p>
            <div className="flex space-x-4">
              {[
                { icon: <Facebook className="w-5 h-5" />, label: "Facebook" },
                { icon: <Twitter className="w-5 h-5" />, label: "Twitter" },
                { icon: <Instagram className="w-5 h-5" />, label: "Instagram" },
                { icon: <Linkedin className="w-5 h-5" />, label: "LinkedIn" }
              ].map((social, i) => (
                <div key={i} className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all cursor-pointer shadow-sm group min-h-[44px] min-w-[44px]">
                  <div className="group-hover:scale-110 transition-transform">
                    {social.icon}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:pl-12">
            <h3 className="text-white font-bold text-xl mb-8">Quick Links</h3>
            <ul className="space-y-4 text-lg font-medium">
              <li><Link to="/about" className="hover:text-emerald-400 transition-colors flex items-center gap-2 group min-h-[44px]"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span> About Us</Link></li>
              <li><Link to="/products" className="hover:text-emerald-400 transition-colors flex items-center gap-2 group min-h-[44px]"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span> Our Products</Link></li>
              <li><Link to="/seminars" className="hover:text-emerald-400 transition-colors flex items-center gap-2 group min-h-[44px]"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span> Seminars & Training</Link></li>
              <li><Link to="/contact" className="hover:text-emerald-400 transition-colors flex items-center gap-2 group min-h-[44px]"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span> Book Appointment</Link></li>
              <li><Link to="/contact" className="hover:text-emerald-400 transition-colors flex items-center gap-2 group min-h-[44px]"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span> Contact Us</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold text-xl mb-8">Products</h3>
            <ul className="space-y-4 text-lg font-medium">
              <li><Link to="/products" className="hover:text-emerald-400 transition-colors flex items-center gap-2 group min-h-[44px]"><span className="w-1.5 h-1.5 bg-purple-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span> Vital Food</Link></li>
              <li><Link to="/products" className="hover:text-emerald-400 transition-colors flex items-center gap-2 group min-h-[44px]"><span className="w-1.5 h-1.5 bg-purple-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span> Vital Pufa</Link></li>
              <li><Link to="/products" className="hover:text-emerald-400 transition-colors flex items-center gap-2 group min-h-[44px]"><span className="w-1.5 h-1.5 bg-purple-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span> Vital Buccal Care</Link></li>
              <li><Link to="/products" className="hover:text-emerald-400 transition-colors flex items-center gap-2 group min-h-[44px]"><span className="w-1.5 h-1.5 bg-purple-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span> Exotic Natural Drink</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold text-xl mb-8">Contact Us</h3>
            <ul className="space-y-6 text-lg font-medium">
              <li className="flex items-start gap-4">
                <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center shrink-0 text-emerald-500 min-h-[40px] min-w-[40px]">
                  <MapPin className="w-5 h-5" />
                </div>
                <span className="leading-snug">fin goudron bange, kotto, Douala, Cameroon</span>
              </li>
              <li className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center shrink-0 text-emerald-500 min-h-[40px] min-w-[40px]">
                  <Phone className="w-5 h-5" />
                </div>
                <span>+237 671 826 002</span>
              </li>
              <li className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center shrink-0 text-emerald-500 min-h-[40px] min-w-[40px]">
                  <Mail className="w-5 h-5" />
                </div>
                <span className="break-all">info@optimalhealthcare.com</span>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center shrink-0 text-emerald-500 min-h-[40px] min-w-[40px]">
                  <Clock className="w-5 h-5" />
                </div>
                <span className="leading-snug">Mon - Sat: 8:00 AM - 8:00 PM<br/><span className="text-emerald-500 font-bold">Emergency: 24/7</span></span>
              </li>
            </ul>
          </div>

        </div>
        
        <div className="border-t border-slate-800 mt-24 pt-12 flex flex-col md:flex-row justify-between items-center gap-8 text-slate-500 font-medium">
          <p className="text-center md:text-left">&copy; {new Date().getFullYear()} Optimal Health Care. All rights reserved.</p>
          <div className="flex space-x-8">
            <Link to="/privacy" className="hover:text-white transition-colors min-h-[44px] flex items-center">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white transition-colors min-h-[44px] flex items-center">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
