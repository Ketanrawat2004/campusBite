import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axiosClient from '../api/client';

let cachedCanteenList = null;

export default function CanteenListPage() {
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [canteens, setCanteens] = useState(() => cachedCanteenList || []);
  const [loading, setLoading] = useState(() => !cachedCanteenList);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [vegOnly, setVegOnly] = useState(false);
  const [openOnly, setOpenOnly] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchCanteens = async (isBackground = false) => {
      if (document.hidden) return;
      try {
        const { data } = await axiosClient.get('/canteens?limit=100');
        if (!isMounted) return;
        const list = data.data || [];
        cachedCanteenList = list;
        setCanteens(list);
      } catch (err) {
        console.error('Error fetching canteens:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCanteens(!cachedCanteenList);

    const interval = setInterval(() => {
      fetchCanteens(true);
    }, 20000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const filteredCanteens = canteens.filter((c) => {
    if (openOnly && !c.acceptingOrders) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = c.name.toLowerCase().includes(q);
      const matchDesc = c.description?.toLowerCase().includes(q);
      const matchTag = c.tags?.some((t) => t.toLowerCase().includes(q));
      if (!matchName && !matchDesc && !matchTag) return false;
    }
    return true;
  });

  return (
    <div className="page-container py-4 sm:py-8 space-y-4 sm:space-y-6 animate-fade-in px-3 sm:px-6 lg:px-8">
      {/* Header Banner featuring NITJSR landmark sign */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-slate-900 border border-slate-200 p-5 sm:p-8 md:p-10 text-white">
        <img
          src="/images/nitjsr_landmark_sign.png"
          alt="NITJSR Campus Canteens"
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-orange-950/70" />

        <div className="relative z-10 space-y-2 sm:space-y-3 max-w-2xl">
          <span className="badge badge-orange text-[11px] sm:text-xs">NIT Jamshedpur Campus Canteens</span>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-white">
            Explore Campus Canteens 🏪
          </h1>
          <p className="text-slate-200 text-xs sm:text-sm leading-relaxed">
            Select a canteen to view fresh daily menus, order food online for quick canteen pickup (₹0 delivery fee) or hostel room delivery (₹10–15 pool fee).
          </p>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="card p-3.5 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
        <div className="w-full sm:w-80 md:w-96">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search canteen by name or food item..."
            className="input text-xs sm:text-sm"
          />
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto justify-start sm:justify-end">
          <label className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm font-semibold text-slate-700 select-none">
            <input
              type="checkbox"
              checked={openOnly}
              onChange={(e) => setOpenOnly(e.target.checked)}
              className="w-4 h-4 text-orange-600 rounded border-slate-300 focus:ring-orange-500"
            />
            <span>Open Now Only</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm font-semibold text-slate-700 select-none">
            <input
              type="checkbox"
              checked={vegOnly}
              onChange={(e) => setVegOnly(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
            />
            <span>Veg Only</span>
          </label>
        </div>
      </div>

      {/* Canteens List */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card h-56 bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : filteredCanteens.length === 0 ? (
        <div className="card p-8 sm:p-12 text-center space-y-3">
          <span className="text-4xl">🔍</span>
          <h3 className="text-base sm:text-lg font-bold text-slate-900">No canteens match your filters</h3>
          <p className="text-xs text-slate-500">Try adjusting your search query or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredCanteens.map((canteen) => (
            <Link
              key={canteen._id}
              to={`/canteens/${canteen._id}`}
              className="card-hover overflow-hidden group flex flex-col justify-between"
            >
              <div className="relative h-40 sm:h-44 overflow-hidden bg-slate-100">
                <img
                  src={canteen.imageUrl || '/images/nitjsr_courtyard.png'}
                  alt={canteen.name}
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

              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3 sm:space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-slate-900 text-base sm:text-lg group-hover:text-orange-600 transition-colors truncate">
                      {canteen.name}
                    </h3>
                    {canteen.rating?.average > 0 && (
                      <span className="text-[10px] sm:text-xs font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200 flex-shrink-0 ml-1">
                        ★ {canteen.rating.average.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2">{canteen.description}</p>
                </div>

                <div className="flex items-center justify-between pt-2.5 sm:pt-3 border-t border-slate-100">
                  <span className="text-xs font-semibold text-slate-500 truncate max-w-[150px]">
                    📍 {canteen.location?.name || 'NIT Jamshedpur'}
                  </span>
                  <span className="btn btn-primary btn-sm text-xs font-bold">
                    View Menu →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
