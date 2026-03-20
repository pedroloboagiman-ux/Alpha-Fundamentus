import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, doc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { Loader2, Image as ImageIcon, CheckCircle } from 'lucide-react';

export function PostIdea() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [ticker, setTicker] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [coverImage, setCoverImage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      const ideaId = doc(collection(db, 'ideas')).id;
      const newIdea = {
        id: ideaId,
        authorId: user.uid,
        authorName: user.displayName,
        authorPhoto: user.photoURL || '',
        title,
        ticker: ticker.toUpperCase(),
        content,
        coverImage,
        votesCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'ideas', ideaId), newIdea);
      await updateDoc(doc(db, 'users', user.uid), {
        lastPostDate: serverTimestamp()
      });
      
      await refreshUser();
      navigate(`/idea/${ideaId}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'ideas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-stone-900 tracking-tight">Post Fundamental Analysis</h1>
        <p className="text-stone-500 mt-2">Share your thesis. High-quality ideas keep your access active.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-stone-700 mb-1">Thesis Title</label>
              <input
                type="text"
                id="title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                placeholder="e.g., The Undervalued AI Infrastructure Play"
              />
            </div>

            <div>
              <label htmlFor="ticker" className="block text-sm font-medium text-stone-700 mb-1">Ticker Symbol</label>
              <input
                type="text"
                id="ticker"
                required
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all uppercase"
                placeholder="e.g., NVDA"
                maxLength={10}
              />
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-stone-700 mb-1">Analysis Content</label>
              <textarea
                id="content"
                required
                rows={12}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-y"
                placeholder="Write your detailed fundamental analysis here..."
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
              <h3 className="text-sm font-semibold text-stone-900 mb-4 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" /> Cover Image
              </h3>
              
              {coverImage ? (
                <div className="relative rounded-xl overflow-hidden mb-4 group">
                  <img src={coverImage} alt="Cover" className="w-full aspect-video object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => setCoverImage('')}
                      className="text-white text-sm font-medium hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="w-full aspect-video bg-stone-100 rounded-xl flex flex-col items-center justify-center mb-4 border border-dashed border-stone-300">
                  <ImageIcon className="w-8 h-8 text-stone-400 mb-2" />
                  <span className="text-xs text-stone-500 text-center px-4">Provide an image URL below</span>
                </div>
              )}

              <input
                type="url"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm"
              />
            </div>

            <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
              <h3 className="text-sm font-semibold text-emerald-900 mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Access Granted
              </h3>
              <p className="text-xs text-emerald-800 leading-relaxed">
                Posting this idea will grant you 3 months of full access to Alpha Fundamental.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-6 border-t border-stone-200">
          <button
            type="submit"
            disabled={loading || !title || !ticker || !content}
            className="px-8 py-3 bg-stone-900 text-white font-medium rounded-xl hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Publish Analysis
          </button>
        </div>
      </form>
    </div>
  );
}
