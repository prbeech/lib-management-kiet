import React from 'react';
import { UserRole } from '../types';
import { Library, User, ShieldCheck, Heart, Armchair, LogOut } from 'lucide-react';

interface NavbarProps {
  currentRole: UserRole;
  username: string;
  onLogout: () => void;
  onHomeClick: () => void;
  onWishlistClick: () => void;
  onLiveSeatsClick: () => void;
  wishlistCount: number;
  availableSeats: number;
  totalSeats: number;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  currentRole, 
  username,
  onLogout, 
  onHomeClick, 
  onWishlistClick, 
  onLiveSeatsClick,
  wishlistCount,
  availableSeats,
  totalSeats
}) => {
  const occupancyRate = ((totalSeats - availableSeats) / totalSeats) * 100;
  
  let statusColor = "bg-emerald-500";
  let statusBg = "bg-emerald-50 text-emerald-700 border-emerald-100";
  
  if (occupancyRate > 90) {
    statusColor = "bg-rose-500";
    statusBg = "bg-rose-50 text-rose-700 border-rose-100";
  } else if (occupancyRate > 60) {
    statusColor = "bg-amber-500";
    statusBg = "bg-amber-50 text-amber-700 border-amber-100";
  }

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center cursor-pointer" onClick={onHomeClick}>
            <div className="bg-indigo-600 p-2 rounded-lg mr-3">
              <Library className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Kiet</h1>
              <p className="text-xs text-slate-500 hidden sm:block">Smart Library Management</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Live Seat Monitor Widget */}
            <button 
              onClick={onLiveSeatsClick}
              className={`hidden md:flex items-center px-3 py-1.5 rounded-full border ${statusBg} transition-all duration-300 hover:shadow-md cursor-pointer`}
              title="View Live Seat Map"
            >
              <div className="relative mr-2">
                <Armchair className="h-4 w-4" />
                <span className={`absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full ${statusColor} animate-pulse`}></span>
              </div>
              <div className="flex flex-col leading-none text-left">
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">Live Seats</span>
                <span className="text-sm font-bold tabular-nums">
                  {availableSeats} <span className="text-xs font-normal opacity-70">/ {totalSeats}</span>
                </span>
              </div>
            </button>

            {currentRole === UserRole.STUDENT && (
              <button 
                onClick={onWishlistClick}
                className="group relative p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all"
                title="My Wishlist"
              >
                <Heart className="h-6 w-6 transition-transform group-hover:scale-110" />
                {wishlistCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-rose-500 rounded-full shadow-sm">
                    {wishlistCount}
                  </span>
                )}
              </button>
            )}
            
            <div className="h-8 w-px bg-slate-200 mx-2 hidden sm:block"></div>

            <div className="flex items-center gap-3">
               <div className="hidden sm:flex flex-col items-end">
                 <span className="text-sm font-semibold text-slate-800">{username}</span>
                 <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
                   {currentRole === UserRole.ADMIN ? 'Administrator' : 'Student'}
                 </span>
               </div>
               
               <button
                onClick={onLogout}
                className="flex items-center justify-center p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};