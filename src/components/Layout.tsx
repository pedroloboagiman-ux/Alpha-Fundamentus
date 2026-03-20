import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, PlusCircle, TrendingUp, User as UserIcon } from 'lucide-react';
import { motion } from 'framer-motion';

export function Layout() {
  const { user, loading, signIn, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-emerald-200">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-stone-900 text-white rounded-lg flex items-center justify-center font-bold text-lg group-hover:bg-emerald-600 transition-colors">
                &alpha;
              </div>
              <span className="font-semibold text-xl tracking-tight">Alpha Fundamental</span>
            </Link>

            <div className="flex items-center gap-6">
              {loading ? null : user ? (
                <>
                  <Link
                    to="/post"
                    className="hidden sm:flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Post Idea
                  </Link>
                  <div className="h-6 w-px bg-stone-200 hidden sm:block"></div>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end hidden sm:flex">
                      <span className="text-sm font-medium leading-none">{user.displayName}</span>
                      <span className="text-xs text-stone-500 mt-1">
                        {user.isPremium ? 'Premium' : 'Analyst'}
                      </span>
                    </div>
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName} className="w-8 h-8 rounded-full border border-stone-200" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-8 h-8 bg-stone-200 rounded-full flex items-center justify-center">
                        <UserIcon className="w-4 h-4 text-stone-500" />
                      </div>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="p-2 text-stone-400 hover:text-stone-900 transition-colors rounded-full hover:bg-stone-100"
                      title="Sign Out"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={signIn}
                  className="text-sm font-medium bg-stone-900 text-white px-4 py-2 rounded-full hover:bg-stone-800 transition-colors"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}
