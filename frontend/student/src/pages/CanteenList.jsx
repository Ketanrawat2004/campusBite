import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axiosClient from '../api/client';

export default function CanteenListPage() {
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [canteens, setCanteens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [vegOnly, setVegOnly] = useState(false);
  const [openOnly, setOpenOnly] = useState(false);

  useEffect(() => {
    const fetchCanteens = async () => {
      try {
        const { data } = await axiosClient.get('/canteens?limit=100');
        setCanteens(data.data || []);
      } catch (err) {
        console.error('Error fetching canteens:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCanteens();
    const interval = setInterval(fetchCanteens, 2000);
    return () => clearInterval(interval);
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
    <div className="page-container py-8 space-y-6 animate-fade-in">
      {/* Header Banner featuring NITJSR landmark sign */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-200 p-6 sm:p-10 text-white">
        <img
          src="/images/nitjsr_landmark_sign.png"
          alt="NITJSR Campus Canteens"
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-orange-950/70" />

        <div className="relative z-10 space-y-3 max-w-2xl">
          <span className="badge badge-orange">NIT Jamshedpur Campus Canteens</span>
          <h1 className="text-3xl font-display font-extrabold text-white">
            Explore Campus Canteens 🏪
          </h1>
          <p className="text-slate-200 text-sm leading-relaxed">
            Select a canteen to view fresh daily menus, order food online for quick canteen pickup (₹0 delivery fee) or hostel room delivery (₹10–15 pool fee).
          </p>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-96">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search canteen by name or food item..."
            className="input"
          />
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={openOnly}
              onChange={(e) => setOpenOnly(e.target.checked)}
              className="w-4 h-4 text-orange-600 rounded border-slate-300 focus:ring-orange-500"
            />
            <span>Open Now Only</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-700">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card h-56 bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : filteredCanteens.length === 0 ? (
        <div className="card p-12 text-center space-y-3">
          <span className="text-4xl">🔍</span>
          <h3 className="text-lg font-bold text-slate-900">No canteens match your filters</h3>
          <p className="text-xs text-slate-500">Try adjusting your search query or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredCanteens.map((canteen) => (
            <Link
              key={canteen._id}
              to={`/canteens/${canteen._id}`}
              className="card-hover overflow-hidden group flex flex-col justify-between"
            >
              <div className="relative h-44 overflow-hidden bg-slate-100">
                <img
                  src={canteen.imageUrl || '/images/nitjsr_courtyard.png'}
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

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-slate-900 text-lg group-hover:text-orange-600 transition-colors">
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

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className="text-xs font-semibold text-slate-500">
                    📍 {canteen.location?.name || 'NIT Jamshedpur'}
                  </span>
                  <span className="btn btn-primary btn-sm">
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
