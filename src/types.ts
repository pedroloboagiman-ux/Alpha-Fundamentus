export interface User {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  lastPostDate?: any; // Firestore Timestamp
  isPremium: boolean;
  role: 'user' | 'admin';
  createdAt: any;
}

export interface Idea {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  title: string;
  ticker: string;
  content: string;
  coverImage?: string;
  votesCount: number;
  createdAt: any;
  updatedAt: any;
}

export interface Vote {
  id: string;
  userId: string;
  ideaId: string;
  createdAt: any;
}
