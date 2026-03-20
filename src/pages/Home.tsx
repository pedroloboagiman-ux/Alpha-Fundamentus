import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Idea } from '../types';
import { Link } from 'react-router-dom';
import { TrendingUp, Clock, Flame, ArrowUpRight, Shield, PenTool, CreditCard } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

export function Home() {
  const { user, loading: authLoading, signIn } = useAuth();
  const [topIdeas, setTopIdeas] = useState<Idea[]>([]);
  const [recentIdeas, setRecentIdeas] = useState<Idea[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [filter, setFilter] = useState<'recent' | 'popular'>('recent');

  useEffect(() => {
    if (!user) return;

    setDataLoading(true);
    // Top 10 hottest ideas
    const qTop = query(collection(db, 'ideas'), orderBy('votesCount', 'desc'), limit(10));
    const unsubTop = onSnapshot(qTop, (snapshot) => {
      setTopIdeas(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Idea)));
    }, (error) => console.error(error));

    // Filtered ideas
    const qRecent = query(
      collection(db, 'ideas'), 
      orderBy(filter === 'recent' ? 'createdAt' : 'votesCount', 'desc'), 
      limit(50)
    );
    const unsubRecent = onSnapshot(qRecent, (snapshot) => {
      setRecentIdeas(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Idea)));
      setDataLoading(false);
    }, (error) => console.error(error));

    return () => {
      unsubTop();
      unsubRecent();
    };
  }, [user, filter]);

  if (authLoading || !user) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-stone-900 text-white rounded-3xl mb-8 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-300">
            <span className="text-4xl font-bold font-serif">&alpha;</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-stone-900 mb-6 leading-tight">
            Exclusive Fundamental Analysis.
          </h1>
          <p className="text-xl text-stone-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            Join an elite community of investors. Access is strictly gated: contribute one high-quality thesis every 3 months, or subscribe for $100/month.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <button
              onClick={signIn}
              className="w-full sm:w-auto px-8 py-4 bg-stone-900 text-white text-lg font-medium rounded-full hover:bg-stone-800 transition-all hover:scale-105 shadow-xl flex items-center justify-center gap-2"
            >
              <Shield className="w-5 h-5" />
              Sign In to Access
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-8 text-left max-w-4xl mx-auto">
            <div className="p-8 rounded-3xl bg-white border border-stone-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center mb-6">
                <PenTool className="w-6 h-6 text-stone-900" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Contribute to Access</h3>
              <p className="text-stone-600 leading-relaxed">
                Share your best investment ideas. A single high-quality fundamental analysis grants you 3 months of full platform access.
              </p>
            </div>
            <div className="p-8 rounded-3xl bg-white border border-stone-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-6">
                <CreditCard className="w-6 h-6 text-emerald-700" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Passive Subscription</h3>
              <p className="text-stone-600 leading-relaxed">
                Prefer to just read? Pay $100/month to access all theses and community votes without posting.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (dataLoading) {
    return (
      <div className="space-y-16 animate-pulse">
        <section>
          <div className="h-10 bg-stone-200 rounded-lg w-64 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-96 bg-stone-200 rounded-2xl"></div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-16">
      <section>
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-orange-100 text-orange-600 rounded-xl">
            <Flame className="w-6 h-6" />
          </div>
          <h2 className="text-3xl font-semibold tracking-tight">Hottest Ideas</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topIdeas.map((idea, index) => (
            <Link key={idea.id} to={`/idea/${idea.id}`} className="group block h-full">
              <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden hover:shadow-xl hover:border-stone-300 transition-all duration-300 flex flex-col h-full">
                {idea.coverImage ? (
                  <div className="h-48 overflow-hidden relative">
                    <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur text-stone-900 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                      #{index + 1}
                    </div>
                    <img src={idea.coverImage} alt={idea.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                  </div>
                ) : (
                  <div className="h-48 bg-stone-100 flex items-center justify-center relative">
                    <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur text-stone-900 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                      #{index + 1}
                    </div>
                    <TrendingUp className="w-12 h-12 text-stone-300" />
                  </div>
                )}
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex justify-between items-start mb-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-stone-100 text-stone-800">
                      ${idea.ticker}
                    </span>
                    <div className="flex items-center gap-1 text-stone-500 text-sm font-medium">
                      <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                      {idea.votesCount} votes
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-stone-900 mb-2 line-clamp-2 group-hover:text-emerald-700 transition-colors">
                    {idea.title}
                  </h3>
                  <div className="mt-auto pt-6 flex items-center gap-3">
                    {idea.authorPhoto ? (
                      <img src={idea.authorPhoto} alt={idea.authorName} className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-8 h-8 bg-stone-200 rounded-full" />
                    )}
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-stone-900">{idea.authorName}</span>
                      <span className="text-xs text-stone-500">
                        {idea.createdAt?.toDate ? formatDistanceToNow(idea.createdAt.toDate(), { addSuffix: true }) : 'Recently'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-stone-100 text-stone-600 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
            <h2 className="text-3xl font-semibold tracking-tight">All Ideas</h2>
          </div>
          
          <div className="flex items-center gap-2 bg-stone-100 p-1 rounded-xl">
            <button
              onClick={() => setFilter('recent')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${filter === 'recent' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-900'}`}
            >
              Recent
            </button>
            <button
              onClick={() => setFilter('popular')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${filter === 'popular' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-900'}`}
            >
              Popular
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
          <div className="divide-y divide-stone-100">
            {recentIdeas.map((idea) => (
              <Link key={idea.id} to={`/idea/${idea.id}`} className="block hover:bg-stone-50 transition-colors p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col items-center justify-center w-16 h-16 bg-stone-50 rounded-xl border border-stone-100">
                      <span className="text-lg font-bold text-stone-900">${idea.ticker}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-stone-900 mb-1">{idea.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-stone-500">
                        <span className="flex items-center gap-1">
                          <img src={idea.authorPhoto || ''} alt="" className="w-4 h-4 rounded-full" referrerPolicy="no-referrer" />
                          {idea.authorName}
                        </span>
                        <span>&bull;</span>
                        <span>{idea.createdAt?.toDate ? formatDistanceToNow(idea.createdAt.toDate(), { addSuffix: true }) : 'Recently'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-stone-500 font-medium">
                    {idea.votesCount} <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
