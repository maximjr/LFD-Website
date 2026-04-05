import { useState } from 'react';
import { Search, ShoppingCart, Star, CheckCircle2, ShieldCheck, Zap, Leaf, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Products() {
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', 'Supplements', 'Health Drinks', 'Oral Care', 'Nutrition'];

  const products = [
    { id: 1, name: "Vital Food", category: "Nutrition", price: 45.00, rating: 4.8, img: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=500&q=80", desc: "A nutrient-dense superfood blend designed to boost your immune system." },
    { id: 2, name: "Vital Pufa", category: "Nutrition", price: 38.50, rating: 4.9, img: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80", desc: "A healthy, low-glycemic alternative to traditional fufu." },
    { id: 3, name: "Vital Buccal Care", category: "Oral Care", price: 22.00, rating: 4.7, img: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=500&q=80", desc: "Natural oral care solution formulated to promote healthy gums." },
    { id: 4, name: "Exotic Natural Drink", category: "Health Drinks", price: 15.99, rating: 4.6, img: "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=500&q=80", desc: "Refreshing and revitalizing herbal beverage packed with antioxidants." },
    { id: 5, name: "Immune Booster", category: "Supplements", price: 55.00, rating: 4.9, img: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&w=500&q=80", desc: "High-potency vitamin and mineral complex for peak immunity." },
    { id: 6, name: "Green Detox", category: "Health Drinks", price: 29.99, rating: 4.5, img: "https://images.unsplash.com/photo-1610970881699-44a5587cabec?auto=format&fit=crop&w=500&q=80", desc: "Cleanse your system with our organic green juice blend." }
  ];

  const filteredProducts = activeCategory === 'All' 
    ? products 
    : products.filter(p => p.category === activeCategory);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-emerald-900 text-white py-20 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img 
            src="https://i.imgur.com/Ejjufjy.png" 
            alt="Products background" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.2),transparent_70%)]"></div>
        </div>
        <div className="container-custom relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-white mb-6">Health & <span className="text-emerald-400">Wellness Products</span></h1>
            <p className="text-lg sm:text-xl text-emerald-100 max-w-3xl mx-auto leading-relaxed">
              Discover our curated selection of natural, clinically tested products designed to support your journey to optimal health.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container-custom py-20 lg:py-32">
        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          {[
            { icon: <ShieldCheck className="w-8 h-8 text-emerald-600" />, title: "Clinically Tested", desc: "All products undergo rigorous testing for safety and efficacy." },
            { icon: <Zap className="w-8 h-8 text-purple-600" />, title: "Natural Ingredients", desc: "We use only the finest organic and natural ingredients." },
            { icon: <Heart className="w-8 h-8 text-rose-600" />, title: "Holistic Wellness", desc: "Designed to support your body, mind, and spirit." }
          ].map((feature, i) => (
            <div key={i} className="flex items-start gap-6 p-8 rounded-3xl bg-slate-50 border border-slate-100">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm shrink-0">
                {feature.icon}
              </div>
              <div>
                <h3 className="text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filter & Search */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-12 gap-8">
          <div className="flex flex-wrap gap-3">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-6 py-3 rounded-full font-bold text-sm transition-all min-h-[44px] ${
                  activeCategory === cat 
                    ? 'bg-emerald-600 text-white shadow-lg' 
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-emerald-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="relative max-w-md w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search products..." 
              className="w-full pl-12 pr-6 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all min-h-[44px]"
            />
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid-responsive">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product) => (
              <motion.div
                layout
                key={product.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden group hover:shadow-2xl transition-all flex flex-col"
              >
                <div className="aspect-[4/3] overflow-hidden relative">
                  <img src={product.img} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full font-black text-emerald-600 shadow-lg">
                    ${product.price.toFixed(2)}
                  </div>
                  <div className="absolute top-6 left-6 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-400 fill-current" /> {product.rating}
                  </div>
                </div>
                <div className="p-8 flex flex-col flex-grow">
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">{product.category}</p>
                  <h3 className="text-slate-900 mb-3">{product.name}</h3>
                  <p className="text-slate-600 mb-8 leading-relaxed line-clamp-2 flex-grow">{product.desc}</p>
                  <button className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all group-hover:bg-emerald-600 min-h-[56px]">
                    <ShoppingCart className="w-5 h-5" /> Add to Cart
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
