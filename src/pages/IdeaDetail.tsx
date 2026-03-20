import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { Idea } from '../types';
import { ArrowUpRight, Loader2, Calendar, User as UserIcon, Edit } from 'lucide-react';
import { format } from 'date-fns';
import Markdown from 'react-markdown';
import { Comments } from '../components/Comments';

export function IdeaDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [idea, setIdea] = useState<Idea | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    if (!id || !user) return;

    const fetchIdea = async () => {
      try {
        const docRef = doc(db, 'ideas', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setIdea({ id: docSnap.id, ...docSnap.data() } as Idea);
        } else {
          navigate('/');
        }

        // Check if user has voted
        const voteRef = doc(db, 'votes', `${user.uid}_${id}`);
        const voteSnap = await getDoc(voteRef);
        setHasVoted(voteSnap.exists());
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `ideas/${id}`);
      } finally {
        setLoading(false);
      }
    };

    fetchIdea();
  }, [id, user, navigate]);

  const handleVote = async () => {
    if (!user || !idea || voting) return;
    setVoting(true);

    try {
      const voteId = `${user.uid}_${idea.id}`;
      const voteRef = doc(db, 'votes', voteId);
      const ideaRef = doc(db, 'ideas', idea.id);

      if (hasVoted) {
        await deleteDoc(voteRef);
        await updateDoc(ideaRef, { votesCount: increment(-1) });
        setIdea({ ...idea, votesCount: idea.votesCount - 1 });
        setHasVoted(false);
      } else {
        await setDoc(voteRef, {
          id: voteId,
          userId: user.uid,
          ideaId: idea.id,
          createdAt: serverTimestamp()
        });
        await updateDoc(ideaRef, { votesCount: increment(1) });
        setIdea({ ...idea, votesCount: idea.votesCount + 1 });
        setHasVoted(true);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `votes`);
    } finally {
      setVoting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-stone-200 border-t-stone-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!idea) return null;

  return (
    <div className="max-w-4xl mx-auto py-8">
      {idea.coverImage && (
        <div className="w-full h-64 md:h-96 rounded-3xl overflow-hidden mb-8 relative">
          <img src={idea.coverImage} alt={idea.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-8 left-8 right-8 text-white">
            <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold bg-white/20 backdrop-blur-md mb-4">
              ${idea.ticker}
            </span>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">{idea.title}</h1>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-12">
        <div className="flex-grow space-y-8">
          {!idea.coverImage && (
            <div>
              <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold bg-stone-200 text-stone-800 mb-4">
                ${idea.ticker}
              </span>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-stone-900 mb-4">{idea.title}</h1>
            </div>
          )}

          <div className="flex items-center justify-between py-4 border-y border-stone-200">
            <div className="flex items-center gap-4">
              {idea.authorPhoto ? (
                <img src={idea.authorPhoto} alt={idea.authorName} className="w-12 h-12 rounded-full" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-12 h-12 bg-stone-200 rounded-full flex items-center justify-center">
                  <UserIcon className="w-6 h-6 text-stone-500" />
                </div>
              )}
              <div>
                <div className="font-semibold text-stone-900">{idea.authorName}</div>
                <div className="flex items-center gap-2 text-sm text-stone-500">
                  <Calendar className="w-4 h-4" />
                  {idea.createdAt?.toDate ? format(idea.createdAt.toDate(), 'MMMM d, yyyy') : 'Recently'}
                </div>
              </div>
            </div>
            
            {user?.uid === idea.authorId && (
              <Link
                to={`/edit-idea/${idea.id}`}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-stone-600 bg-stone-100 rounded-lg hover:bg-stone-200 transition-colors"
              >
                <Edit className="w-4 h-4" />
                Edit
              </Link>
            )}
          </div>

          <div className="prose prose-stone max-w-none prose-lg markdown-body">
            <Markdown
              components={{
                img: ({node, ...props}) => <img {...props} referrerPolicy="no-referrer" style={{maxWidth: '100%', borderRadius: '0.5rem'}} />
              }}
            >
              {idea.content}
            </Markdown>
          </div>

          <Comments ideaId={idea.id} />
        </div>

        <div className="md:w-64 flex-shrink-0">
          <div className="sticky top-24">
            <button
              onClick={handleVote}
              disabled={voting}
              className={`w-full flex flex-col items-center justify-center py-6 rounded-3xl border-2 transition-all ${
                hasVoted 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                  : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300 hover:bg-stone-50'
              }`}
            >
              <ArrowUpRight className={`w-8 h-8 mb-2 ${hasVoted ? 'text-emerald-600' : 'text-stone-400'}`} />
              <span className="text-3xl font-bold mb-1">{idea.votesCount}</span>
              <span className="text-sm font-medium uppercase tracking-wider">
                {hasVoted ? 'Voted' : 'Upvote'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
