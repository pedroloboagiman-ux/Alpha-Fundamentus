import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, doc, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { Comment } from '../types';
import { format } from 'date-fns';
import { User as UserIcon, MessageSquare, Reply, Trash2 } from 'lucide-react';

interface CommentsProps {
  ideaId: string;
}

export function Comments({ ideaId }: CommentsProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!ideaId) return;

    const q = query(
      collection(db, 'comments'),
      where('ideaId', '==', ideaId),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Comment[];
      setComments(commentsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'comments');
    });

    return () => unsubscribe();
  }, [ideaId]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;
    setLoading(true);

    try {
      const commentId = doc(collection(db, 'comments')).id;
      await setDoc(doc(db, 'comments', commentId), {
        id: commentId,
        ideaId,
        authorId: user.uid,
        authorName: user.displayName,
        authorPhoto: user.photoURL || '',
        content: newComment.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setNewComment('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'comments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReply = async (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    if (!user || !replyContent.trim()) return;
    setLoading(true);

    try {
      const commentId = doc(collection(db, 'comments')).id;
      await setDoc(doc(db, 'comments', commentId), {
        id: commentId,
        ideaId,
        authorId: user.uid,
        authorName: user.displayName,
        authorPhoto: user.photoURL || '',
        content: replyContent.trim(),
        parentId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setReplyContent('');
      setReplyingTo(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'comments');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await deleteDoc(doc(db, 'comments', commentId));
      setDeletingId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `comments/${commentId}`);
    }
  };

  // Group comments into threads
  const topLevelComments = comments.filter(c => !c.parentId);
  const repliesByParentId = comments.reduce((acc, comment) => {
    if (comment.parentId) {
      if (!acc[comment.parentId]) acc[comment.parentId] = [];
      acc[comment.parentId].push(comment);
    }
    return acc;
  }, {} as Record<string, Comment[]>);

  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment.id} className={`flex gap-4 ${isReply ? 'ml-12 mt-4' : 'mt-6'}`}>
      {comment.authorPhoto ? (
        <img src={comment.authorPhoto} alt={comment.authorName} className="w-10 h-10 rounded-full flex-shrink-0" referrerPolicy="no-referrer" />
      ) : (
        <div className="w-10 h-10 bg-stone-200 rounded-full flex items-center justify-center flex-shrink-0">
          <UserIcon className="w-5 h-5 text-stone-500" />
        </div>
      )}
      <div className="flex-grow">
        <div className="bg-stone-50 rounded-2xl p-4 border border-stone-100">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold text-stone-900 text-sm">{comment.authorName}</div>
            <div className="text-xs text-stone-500">
              {comment.createdAt?.toDate ? format(comment.createdAt.toDate(), 'MMM d, yyyy h:mm a') : 'Just now'}
            </div>
          </div>
          <p className="text-stone-700 text-sm whitespace-pre-wrap">{comment.content}</p>
        </div>
        
        <div className="flex items-center gap-4 mt-2 ml-2">
          {!isReply && user && (
            <button 
              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
              className="text-xs font-medium text-stone-500 hover:text-stone-900 flex items-center gap-1 transition-colors"
            >
              <Reply className="w-3 h-3" />
              Reply
            </button>
          )}
          {user?.uid === comment.authorId && (
            <div className="flex items-center gap-2">
              {deletingId === comment.id ? (
                <>
                  <span className="text-xs text-stone-500">Delete?</span>
                  <button 
                    onClick={() => handleDelete(comment.id)}
                    className="text-xs font-medium text-red-600 hover:text-red-700 transition-colors"
                  >
                    Yes
                  </button>
                  <button 
                    onClick={() => setDeletingId(null)}
                    className="text-xs font-medium text-stone-500 hover:text-stone-700 transition-colors"
                  >
                    No
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setDeletingId(comment.id)}
                  className="text-xs font-medium text-red-400 hover:text-red-600 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
              )}
            </div>
          )}
        </div>

        {replyingTo === comment.id && (
          <form onSubmit={(e) => handleSubmitReply(e, comment.id)} className="mt-4 flex gap-3">
            <input
              type="text"
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write a reply..."
              className="flex-grow px-4 py-2 text-sm rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              autoFocus
            />
            <button
              type="submit"
              disabled={loading || !replyContent.trim()}
              className="px-4 py-2 bg-stone-900 text-white text-sm font-medium rounded-xl hover:bg-stone-800 transition-colors disabled:opacity-50"
            >
              Reply
            </button>
          </form>
        )}

        {/* Render replies */}
        {repliesByParentId[comment.id]?.map(reply => renderComment(reply, true))}
      </div>
    </div>
  );

  return (
    <div className="mt-12 pt-8 border-t border-stone-200">
      <h3 className="text-xl font-bold text-stone-900 mb-6 flex items-center gap-2">
        <MessageSquare className="w-5 h-5" />
        Discussion ({comments.length})
      </h3>

      {user ? (
        <form onSubmit={handleSubmitComment} className="mb-8">
          <div className="flex gap-4">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || ''} className="w-10 h-10 rounded-full flex-shrink-0" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-10 h-10 bg-stone-200 rounded-full flex items-center justify-center flex-shrink-0">
                <UserIcon className="w-5 h-5 text-stone-500" />
              </div>
            )}
            <div className="flex-grow">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add to the discussion..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none text-sm"
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={loading || !newComment.trim()}
                  className="px-6 py-2 bg-stone-900 text-white text-sm font-medium rounded-xl hover:bg-stone-800 transition-colors disabled:opacity-50"
                >
                  Post Comment
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="bg-stone-50 rounded-2xl p-6 text-center mb-8 border border-stone-100">
          <p className="text-stone-600">Sign in to join the discussion.</p>
        </div>
      )}

      <div className="space-y-2">
        {topLevelComments.length > 0 ? (
          topLevelComments.map(comment => renderComment(comment))
        ) : (
          <p className="text-stone-500 text-center py-8">No comments yet. Be the first to share your thoughts!</p>
        )}
      </div>
    </div>
  );
}
