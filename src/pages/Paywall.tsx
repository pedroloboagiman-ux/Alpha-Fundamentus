import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Lock, PenTool, CreditCard } from 'lucide-react';

export function Paywall() {
  const { user } = useAuth();

  return (
    <div className="max-w-3xl mx-auto py-12">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-stone-100 rounded-2xl mb-6">
          <Lock className="w-8 h-8 text-stone-900" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-stone-900 mb-4">
          Exclusive Access Required
        </h1>
        <p className="text-lg text-stone-600 max-w-xl mx-auto">
          Alpha Fundamental is a closed community for serious analysts. To view the hottest investment ideas, you must contribute or subscribe.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Option 1: Contribute */}
        <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5">
            <PenTool className="w-32 h-32" />
          </div>
          <div className="relative z-10">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center mb-6">
              <PenTool className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Contribute</h2>
            <p className="text-stone-600 mb-8">
              Share one high-quality fundamental analysis idea every 3 months to maintain free access to the platform.
            </p>
            <Link
              to="/post"
              className="inline-flex w-full justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-stone-900 hover:bg-stone-800 transition-colors"
            >
              Post an Idea Now
            </Link>
          </div>
        </div>

        {/* Option 2: Subscribe */}
        <div className="bg-stone-900 p-8 rounded-3xl border border-stone-800 shadow-lg relative overflow-hidden text-white">
          <div className="absolute top-0 right-0 p-6 opacity-5">
            <CreditCard className="w-32 h-32 text-white" />
          </div>
          <div className="relative z-10">
            <div className="w-12 h-12 bg-stone-800 text-stone-300 rounded-xl flex items-center justify-center mb-6">
              <CreditCard className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Subscribe</h2>
            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-4xl font-bold">$100</span>
              <span className="text-stone-400">/month</span>
            </div>
            <p className="text-stone-400 mb-8">
              Get unlimited access without the requirement to post. Perfect for passive investors and funds.
            </p>
            <button
              onClick={() => alert('Payment integration would go here.')}
              className="inline-flex w-full justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-stone-900 bg-white hover:bg-stone-100 transition-colors"
            >
              Upgrade to Premium
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
