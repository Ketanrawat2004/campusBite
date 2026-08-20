import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/client';

// Local + Session cache for instant zero-lag rendering
const CACHE_CANTEENS_KEY = 'campusbite_cached_canteens';
const CACHE_BESTSELLERS_KEY = 'campusbite_cached_bestsellers';

export function getCachedHomeData() {
  try {
    const rawC = sessionStorage.getItem(CACHE_CANTEENS_KEY) || localStorage.getItem(CACHE_CANTEENS_KEY);
    const rawB = sessionStorage.getItem(CACHE_BESTSELLERS_KEY) || localStorage.getItem(CACHE_BESTSELLERS_KEY);
    return {
      canteens: rawC ? JSON.parse(rawC) : null,
      bestsellers: rawB ? JSON.parse(rawB) : null,
    };
  } catch {
    return { canteens: null, bestsellers: null };
  }
}

export function saveCachedHomeData(canteens, bestsellers) {
  try {
    if (canteens && canteens.length > 0) {
      sessionStorage.setItem(CACHE_CANTEENS_KEY, JSON.stringify(canteens));
      localStorage.setItem(CACHE_CANTEENS_KEY, JSON.stringify(canteens));
    }
    if (bestsellers && bestsellers.length > 0) {
      sessionStorage.setItem(CACHE_BESTSELLERS_KEY, JSON.stringify(bestsellers));
      localStorage.setItem(CACHE_BESTSELLERS_KEY, JSON.stringify(bestsellers));
    }
  } catch {
    // Ignore storage quota errors
  }
}

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const initialCache = getCachedHomeData();
  const [canteens, setCanteens] = useState(() => initialCache.canteens || []);
  const [bestsellers, setBestsellers] = useState(() => initialCache.bestsellers || []);
  const [loading, setLoading] = useState(() => !initialCache.canteens || initialCache.canteens.length === 0);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let isMounted = true;

    const fetchHomeData = async (isBackground = false) => {
      if (document.hidden) return; // Skip if tab is hidden
      try {
        const [canteenRes, searchRes] = await Promise.all([
          axiosClient.get('/canteens?limit=100'),
          axiosClient.get('/menu-items/search?q=bestseller').catch(() => ({ data: { data: [] } })),
        ]);

        if (!isMounted) return;

        const cList = canteenRes.data?.data || [];
        const bList = (searchRes.data?.data || []).slice(0, 6);

        if (cList.length > 0) {
          setCanteens(cList);
          setBestsellers(bList);
          saveCachedHomeData(cList, bList);
        }
      } catch (err) {
        console.error('Home fetch error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchHomeData(Boolean(initialCache.canteens && initialCache.canteens.length > 0));

    // Smart Polling: 30 seconds, only when tab is visible
    const interval = setInterval(() => {
      fetchHomeData(true);
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/canteens?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const formatRupees = (paise) => `₹${(paise / 100).toFixed(2)}`;

  return (
    <div className="page-container py-4 sm:py-8 space-y-6 sm:space-y-8 animate-fade-in px-3 sm:px-6 lg:px-8">
      {/* Campus Hero Banner */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-slate-900 border border-slate-200 shadow-md text-white">
        <img
          src="/images/nitjsr_hero.jpg"
          alt="NIT Jamshedpur Campus Courtyard"
          loading="eager"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-orange-950/70" />

        <div className="relative z-10 p-5 sm:p-8 md:p-10 max-w-3xl space-y-3 sm:space-y-4">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold text-orange-300 border border-white/10">
            <span>🏛️ Academic Courtyard & Hostels • NIT Jamshedpur</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-extrabold tracking-tight leading-tight">
            {user ? `Welcome back, ${user.name.split(' ')[0]} 👋` : 'Campus Food Delivered to Your Hostel Room 🍱'}
          </h1>

          <p className="text-slate-200 text-xs sm:text-sm md:text-base leading-relaxed max-w-xl font-normal">
            Order online from <strong>Main Canteen</strong>, <strong>Amba Canteen</strong>, or <strong>H1 Canteen</strong>. Smart Group Pooling automatically groups hostel room orders to drop delivery fees to <strong>₹10–15 per order</strong>.
          </p>

          {/* Action button & Search bar */}
          <div className="space-y-3 pt-1 sm:pt-2">
            <Link to="/canteens" className="btn btn-primary inline-flex shadow-sm font-bold text-xs sm:text-sm">
              🏪 Browse All Canteens →
            </Link>

            <form onSubmit={handleSearchSubmit} className="flex flex-col xs:flex-row gap-2 max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search food (e.g. Samosa, Dosa, Thali)..."
                className="input bg-white/15 border-white/25 text-white placeholder-slate-300 focus:bg-white/25 text-xs sm:text-sm"
              />
              <button type="submit" className="btn btn-primary px-4 sm:px-5 font-bold whitespace-nowrap text-xs sm:text-sm">
                Search
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Canteens List Grid */}
      <section className="space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 font-display">Campus Canteens</h2>
            <p className="text-[11px] sm:text-xs text-slate-500">Order online for room delivery or quick pickup</p>
          </div>
          <Link to="/canteens" className="text-xs font-bold text-orange-600 hover:text-orange-700">
            View All ({canteens.length}) →
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 text-xs font-semibold text-orange-700 bg-orange-50 border border-orange-200 px-3.5 py-2.5 rounded-2xl animate-pulse">
              <span className="inline-block w-2 h-2 rounded-full bg-orange-500 animate-ping" />
              <span>Connecting to campus canteens & menus... Please wait</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card h-48 bg-slate-100 animate-pulse rounded-2xl" />
              ))}
            </div>
          </div>
        ) : canteens.length === 0 ? (
          <div className="card p-8 text-center text-slate-500 font-medium text-xs sm:text-sm">
            🏪 Canteens loading... Please check back in a moment!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {canteens.map((canteen) => (
              <Link
                key={canteen._id}
                to={`/canteens/${canteen._id}`}
                className="card-hover overflow-hidden group flex flex-col justify-between"
              >
                <div className="relative h-40 sm:h-44 overflow-hidden bg-slate-100">
                  <img
                    src={canteen.imageUrl || '/images/nitjsr_hero.jpg'}
                    alt={canteen.name}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3">
                    {canteen.statusMode === 'BUSY' ? (
                      <span className="bg-amber-500 text-white font-extrabold text-[10px] sm:text-xs px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full shadow-md animate-pulse">
                        ⚡ PEAK RUSH HOUR
                      </span>
                    ) : canteen.acceptingOrders && canteen.statusMode !== 'OFFLINE' ? (
                      <span className="badge badge-green text-[10px] sm:text-xs">
                        ● Open Now
                      </span>
                    ) : (
                      <span className="badge badge-red text-[10px] sm:text-xs">
                        🚫 Queue Paused
                      </span>
                    )}
                  </div>
                  <div className="absolute bottom-2.5 right-2.5 sm:bottom-3 sm:right-3 bg-slate-900/80 backdrop-blur-md text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg">
                    ⚡ {canteen.statusMode === 'BUSY' ? '30m (Rush)' : `${canteen.avgPrepTimeMinutes || 15}m prep`}
                  </div>
                </div>

                <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-orange-600 transition-colors truncate">
                        {canteen.name}
                      </h3>
                      {canteen.rating?.average > 0 && (
                        <span className="text-[10px] sm:text-xs font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200 flex-shrink-0 ml-1">
                          ★ {canteen.rating.average.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-500 line-clamp-2">{canteen.description}</p>
                  </div>

                  <div className="flex items-center justify-between mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-slate-100">
                    <span className="text-[11px] sm:text-xs font-semibold text-slate-500 truncate max-w-[150px]">
                      📍 {canteen.location?.name || 'NIT Jamshedpur'}
                    </span>
                    <span className="text-[11px] sm:text-xs font-bold text-orange-600 group-hover:translate-x-1 transition-transform whitespace-nowrap">
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
        <section className="space-y-3 sm:space-y-4 pt-2">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 font-display">Popular Bestsellers 🔥</h2>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium">Most ordered items across campus hostels</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {bestsellers.map((item) => (
              <div
                key={item._id}
                onClick={() => navigate(`/canteens/${item.canteenId?._id || item.canteenId}`)}
                className="card p-3 sm:p-4 flex gap-3 items-center hover:border-orange-300 cursor-pointer transition-all hover:shadow-md"
              >
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-orange-50 text-xl sm:text-2xl flex items-center justify-center flex-shrink-0">
                    🍲
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={`w-2 h-2 rounded-full ${item.isVeg ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <span className="text-[11px] text-slate-400 font-medium truncate">
                      {item.canteenId?.name || 'Main Canteen'}
                    </span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">{item.name}</h4>
                  <p className="text-xs sm:text-sm font-extrabold text-orange-600 mt-0.5">
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
