import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/client';

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [canteens, setCanteens] = useState([]);
  const [bestsellers, setBestsellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const canteenRes = await axiosClient.get('/canteens?limit=100');
        setCanteens(canteenRes.data.data || []);
      } catch (err) {
        console.error('Canteen fetch error:', err);
      }

      try {
        const searchRes = await axiosClient.get('/menu-items/search?q=bestseller');
        const items = searchRes.data.data || [];
        setBestsellers(items.length > 0 ? items.slice(0, 6) : []);
      } catch (err) {
        console.error('Bestsellers fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHomeData();
    const interval = setInterval(fetchHomeData, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/canteens?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const formatRupees = (paise) => `₹${(paise / 100).toFixed(2)}`;

  return (
    <div className="page-container py-8 space-y-8 animate-fade-in">
      {/* Campus Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-200 shadow-md text-white">
        <img
          src="/images/nitjsr_hero.jpg"
          alt="NIT Jamshedpur Campus Courtyard"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-orange-950/70" />

        <div className="relative z-10 p-6 sm:p-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-semibold text-orange-300 border border-white/10">
            <span>🏛️ Academic Courtyard & Hostels • NIT Jamshedpur</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-display font-extrabold tracking-tight">
            {user ? `Welcome back, ${user.name.split(' ')[0]} 👋` : 'Campus Food Delivered to Your Hostel Room 🍱'}
          </h1>

          <p className="text-slate-200 text-sm sm:text-base leading-relaxed max-w-xl font-normal">
            Order online from <strong>Main Canteen</strong>, <strong>Amba Canteen</strong>, or <strong>H1 Canteen</strong>. Smart Group Pooling automatically groups hostel room orders to drop delivery fees to <strong>₹10–15 per order</strong>.
          </p>

          {/* Action button & Search bar */}
          <div className="space-y-3 pt-2">
            <Link to="/canteens" className="btn btn-primary inline-flex shadow-sm font-bold">
              🏪 Browse All Canteens →
            </Link>

            <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search food (e.g. Samosa Chaat, Chole Bhature, Dosa)..."
                className="input bg-white/15 border-white/25 text-white placeholder-slate-300 focus:bg-white/25"
              />
              <button type="submit" className="btn btn-primary px-5 font-bold whitespace-nowrap">
                Search
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Canteens List Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 font-display">Campus Canteens</h2>
            <p className="text-xs text-slate-500">Order online for room delivery or quick pickup</p>
          </div>
          <Link to="/canteens" className="text-xs font-bold text-orange-600 hover:text-orange-700">
            View All Canteens ({canteens.length}) →
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card h-48 bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : canteens.length === 0 ? (
          <div className="card p-8 text-center text-slate-500 font-medium">
            🏪 Canteens loading... Please check back in a moment!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {canteens.map((canteen) => (
              <Link
                key={canteen._id}
                to={`/canteens/${canteen._id}`}
                className="card-hover overflow-hidden group flex flex-col justify-between"
              >
                <div className="relative h-44 overflow-hidden bg-slate-100">
                  <img
                    src={canteen.imageUrl || '/images/nitjsr_hero.jpg'}
                    alt={canteen.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3">
                    {canteen.statusMode === 'BUSY' ? (
                      <span className="bg-amber-500 text-white font-extrabold text-xs px-2.5 py-1 rounded-full shadow-md animate-pulse">
                        ⚡ PEAK RUSH HOUR
                      </span>
                    ) : canteen.acceptingOrders && canteen.statusMode !== 'OFFLINE' ? (
                      <span className="badge badge-green">
                        ● Open Now
                      </span>
                    ) : (
                      <span className="badge badge-red">
                        🚫 Queue Paused
                      </span>
                    )}
                  </div>
                  <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-md text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                    ⚡ {canteen.statusMode === 'BUSY' ? '30 mins (Rush)' : `${canteen.avgPrepTimeMinutes || 15} mins prep`}
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-slate-900 text-base group-hover:text-orange-600 transition-colors">
                        {canteen.name}
                      </h3>
                      {canteen.rating?.average > 0 && (
                        <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          ★ {canteen.rating.average.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2">{canteen.description}</p>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                    <span className="text-xs font-semibold text-slate-500">
                      📍 {canteen.location?.name || 'NIT Jamshedpur'}
                    </span>
                    <span className="text-xs font-bold text-orange-600 group-hover:translate-x-1 transition-transform">
                      View Menu →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Bestsellers Section */}
      {bestsellers.length > 0 && (
        <section className="space-y-4 pt-2">
          <div>
            <h2 className="text-xl font-bold text-slate-900 font-display">Popular Bestsellers 🔥</h2>
            <p className="text-xs text-slate-500 font-medium">Most ordered items across campus hostels</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {bestsellers.map((item) => (
              <div
                key={item._id}
                onClick={() => navigate(`/canteens/${item.canteenId?._id || item.canteenId}`)}
                className="card p-4 flex gap-3.5 items-center hover:border-orange-300 cursor-pointer transition-all hover:shadow-md"
              >
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-orange-50 text-2xl flex items-center justify-center flex-shrink-0">
                    🍲
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`w-2.5 h-2.5 rounded-full ${item.isVeg ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <span className="text-xs text-slate-400 font-medium truncate">
                      {item.canteenId?.name || 'Main Canteen'}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 truncate">{item.name}</h4>
                  <p className="text-sm font-extrabold text-orange-600 mt-1">
                    {formatRupees(item.priceInPaise)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
