import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db, storage, handleFirestoreError, OperationType } from '../firebase';
import { collection, doc, setDoc, serverTimestamp, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Loader2, Image as ImageIcon, CheckCircle } from 'lucide-react';
import MDEditor from '@uiw/react-md-editor';

export function PostIdea() {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [ticker, setTicker] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);
  const [coverImage, setCoverImage] = useState('');

  useEffect(() => {
    if (!isEditing || !id || !user) {
      setInitialLoading(false);
      return;
    }

    const fetchIdea = async () => {
      try {
        const docRef = doc(db, 'ideas', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.authorId !== user.uid) {
            navigate('/'); // Unauthorized
            return;
          }
          setTitle(data.title);
          setTicker(data.ticker);
          setContent(data.content);
          setCoverImage(data.coverImage || '');
        } else {
          navigate('/');
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `ideas/${id}`);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchIdea();
  }, [id, isEditing, user, navigate]);

  const handleImageUpload = async (file: File): Promise<string> => {
    if (!user) throw new Error('Not authenticated');
    const fileExt = file.name ? file.name.split('.').pop() : 'png';
    const fileName = `ideas/${user.uid}/${Date.now()}.${fileExt}`;
    const storageRef = ref(storage, fileName);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const handlePaste = useCallback(async (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        event.preventDefault();
        const file = items[i].getAsFile();
        if (!file) continue;

        try {
          // Show a temporary loading text
          const loadingText = `\n![Uploading image...]()\n`;
          setContent(prev => prev + loadingText);
          
          const url = await handleImageUpload(file);
          
          // Replace loading text with actual image markdown
          setContent(prev => prev.replace(loadingText, `\n![Image](${url})\n`));
        } catch (error) {
          console.error('Error uploading pasted image:', error);
          alert('Failed to upload image. Please try again.');
          setContent(prev => prev.replace(`\n![Uploading image...]()\n`, ''));
        }
      }
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      if (isEditing && id) {
        await updateDoc(doc(db, 'ideas', id), {
          title,
          ticker: ticker.toUpperCase(),
          content,
          coverImage,
          updatedAt: serverTimestamp(),
        });
        navigate(`/idea/${id}`);
      } else {
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
      }
    } catch (error) {
      handleFirestoreError(error, isEditing ? OperationType.UPDATE : OperationType.CREATE, 'ideas');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-stone-200 border-t-stone-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-stone-900 tracking-tight">
          {isEditing ? 'Edit Fundamental Analysis' : 'Post Fundamental Analysis'}
        </h1>
        <p className="text-stone-500 mt-2">
          {isEditing ? 'Update your thesis.' : 'Share your thesis. High-quality ideas keep your access active.'}
        </p>
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
              <label htmlFor="content" className="block text-sm font-medium text-stone-700 mb-1">Analysis Content (Markdown supported)</label>
              <div data-color-mode="light">
                <MDEditor
                  value={content}
                  onChange={(val) => setContent(val || '')}
                  height={400}
                  preview="edit"
                  className="w-full rounded-xl border border-stone-200 overflow-hidden"
                  textareaProps={{
                    placeholder: "Write your detailed fundamental analysis here... You can paste images directly!",
                    onPaste: handlePaste
                  }}
                />
              </div>
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
