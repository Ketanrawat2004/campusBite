const CANTEEN_URL = import.meta.env.VITE_CANTEEN_URL || 'https://campusbite-canteen.onrender.com';
const ADMIN_URL = import.meta.env.VITE_ADMIN_URL || 'https://campusbite-admin-cxux.onrender.com';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-orange-500 selection:text-white">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="page-container h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-xl text-white font-bold">
              🍱
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900 font-display">
                Campus<span className="text-orange-600">Bite</span>
              </span>
              <span className="block text-[10px] text-slate-500 font-semibold tracking-wide uppercase -mt-1">
                NIT Jamshedpur Edition
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href={CANTEEN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 transition-colors flex items-center gap-1"
            >
              <span>👨‍🍳</span> <span className="hidden sm:inline">Canteen Staff</span>
            </a>
            <a
              href={ADMIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-colors flex items-center gap-1"
            >
              <span>🛡️</span> <span className="hidden sm:inline">Admin Console</span>
            </a>
            <Link to="/login" className="btn btn-secondary text-xs sm:text-sm py-1.5 sm:py-2 px-3 sm:px-4">
              Sign In
            </Link>
            <Link to="/register" className="btn btn-primary text-xs sm:text-sm py-1.5 sm:py-2 px-3 sm:px-4">
              Get Started →
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section featuring Real NIT Jamshedpur DJLHC Photo */}
      <section className="py-12 md:py-20 bg-white border-b border-slate-200">
        <div className="page-container grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-xs font-bold text-orange-700">
              <span>🏛️ Official NIT Jamshedpur Food Delivery Platform</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-display font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              Canteen Food.<br />
              <span className="text-orange-600">
                Delivered Direct to Your Hostel Room.
              </span>
            </h1>

            <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
              Order food online from <strong>Main Canteen</strong>, <strong>H1 Canteen</strong>, and <strong>Library Café</strong>. Smart Group Pooling automatically groups orders to the same hostel block, dropping delivery fee to <strong>₹10–15 per order</strong>.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <Link to="/register" className="btn btn-primary btn-lg font-bold shadow-md">
                Order Food Now →
              </Link>
              <Link to="/login" className="btn btn-secondary btn-lg font-bold">
                Student Sign In
              </Link>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-200 max-w-md">
              <div>
                <div className="text-2xl font-extrabold text-slate-900 font-display">13+</div>
                <div className="text-xs text-slate-500 font-medium">Hostels (H1–H13, MB)</div>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-orange-600 font-display">3</div>
                <div className="text-xs text-slate-500 font-medium">Campus Canteens</div>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-emerald-600 font-display">₹10</div>
                <div className="text-xs text-slate-500 font-medium">Group Delivery Fee</div>
              </div>
            </div>
          </div>

          {/* Hero Media Card using user-uploaded Diamond Jubilee Lecture Hall Complex Photo */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl overflow-hidden border border-slate-200 shadow-xl bg-slate-900 relative">
              <img
                src="/images/nitjsr_djlhc.png"
                alt="NIT Jamshedpur Diamond Jubilee Lecture Hall Complex"
                className="w-full h-[420px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-lg text-slate-900">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 font-bold flex items-center justify-center text-xl flex-shrink-0">
                    🏛️
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Diamond Jubilee Complex, NITJSR</h4>
                    <p className="text-xs text-slate-500">Delivering to H1–H13 & MB Girls Hostel daily</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Real NIT Jamshedpur Gallery & Features */}
      <section className="py-16 bg-slate-50">
        <div className="page-container space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-3xl font-display font-extrabold text-slate-900">
              Campus Photo Gallery & Features 📸
            </h2>
            <p className="text-sm text-slate-500">
              Experience authentic campus food delivery powered by Smart Group Pooling across NIT Jamshedpur hostels.
            </p>
          </div>

          {/* 3 Photo Grid showcasing uploaded photos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card overflow-hidden group">
              <div className="h-52 overflow-hidden bg-slate-200">
                <img
                  src="/images/nitjsr_landmark_sign.png"
                  alt="NITJSR Landmark Sign"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-5 space-y-2">
                <h3 className="font-bold text-base text-slate-900">NITJSR Campus Landmark</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Connecting students directly with campus canteen staff for quick meal prep and room delivery.
                </p>
              </div>
            </div>

            <div className="card overflow-hidden group">
              <div className="h-52 overflow-hidden bg-slate-200">
                <img
                  src="/images/nitjsr_mega_hostel.png"
                  alt="NIT Jamshedpur Mega Hostels"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-5 space-y-2">
                <h3 className="font-bold text-base text-slate-900">Mega Hostel Blocks (H1–H13)</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Smart Pooling automatically batches room orders heading to the same block in 30-min windows.
                </p>
              </div>
            </div>

            <div className="card overflow-hidden group">
              <div className="h-52 overflow-hidden bg-slate-200">
                <img
                  src="/images/nitjsr_courtyard.png"
                  alt="NIT Jamshedpur Courtyard"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-5 space-y-2">
                <h3 className="font-bold text-base text-slate-900">Academic Courtyard & Library</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Order canteen pickup or room delivery during study sessions with zero delivery charge for pickup.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Staff & Administration Portal Links Section */}
      <section className="py-12 bg-white border-t border-slate-200">
        <div className="page-container space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="badge badge-orange font-bold text-xs uppercase tracking-wider">
              Management & Staff Portals
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900">
              Canteen Staff & Campus Admin Access
            </h2>
            <p className="text-sm text-slate-500">
              Direct access portals for kitchen operators, hostel delivery coordinators, and campus administrators.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Canteen Staff Card */}
            <div className="card p-6 border-orange-200 bg-gradient-to-br from-orange-50/50 via-white to-white hover:shadow-lg transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center text-2xl font-bold">
                    👨‍🍳
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-orange-100 text-orange-800 text-[11px] font-bold">
                    Vendor Portal
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">Canteen Staff Portal</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Live kitchen order queue with audio chime notifications, item availability controls, and prep status updates.
                </p>
              </div>

              <div className="pt-5 border-t border-slate-100 mt-5">
                <a
                  href={CANTEEN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary w-full justify-center text-sm font-bold flex items-center gap-2"
                >
                  <span>Launch Canteen Portal</span>
                  <span>↗</span>
                </a>
              </div>
            </div>

            {/* Admin Console Card */}
            <div className="card p-6 border-slate-200 bg-gradient-to-br from-slate-50/70 via-white to-white hover:shadow-lg transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center text-2xl font-bold">
                    🛡️
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 text-[11px] font-bold">
                    Admin Console
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">Campus Admin Console</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Live revenue analytics, delivery tier configuration, student and vendor management, and complaint resolution.
                </p>
              </div>

              <div className="pt-5 border-t border-slate-100 mt-5">
                <a
                  href={ADMIN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary w-full justify-center text-sm font-bold flex items-center gap-2 border-slate-300"
                >
                  <span>Launch Admin Console</span>
                  <span>↗</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-white border-t border-slate-200 text-center text-xs text-slate-500">
        <div className="page-container space-y-3">
          <p className="font-bold text-slate-700">© 2026 CampusBite • National Institute of Technology Jamshedpur</p>
          <div className="flex flex-wrap justify-center items-center gap-3 pt-1">
            <a
              href={CANTEEN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 font-semibold transition-colors"
            >
              👨‍🍳 Canteen Staff Portal ↗
            </a>
            <span>•</span>
            <a
              href={ADMIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 font-semibold transition-colors"
            >
              🛡️ Admin Console ↗
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
