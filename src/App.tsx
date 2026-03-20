import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { PostIdea } from './pages/PostIdea';
import { IdeaDetail } from './pages/IdeaDetail';
import { Paywall } from './pages/Paywall';

function ProtectedRoute({ children, requireAccess = true }: { children: React.ReactNode, requireAccess?: boolean }) {
  const { user, loading, hasAccess } = useAuth();

  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (requireAccess && !hasAccess) {
    return <Navigate to="/paywall" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="paywall" element={
          <ProtectedRoute requireAccess={false}>
            <Paywall />
          </ProtectedRoute>
        } />
        <Route path="post" element={
          <ProtectedRoute requireAccess={false}>
            <PostIdea />
          </ProtectedRoute>
        } />
        <Route path="edit-idea/:id" element={
          <ProtectedRoute requireAccess={false}>
            <PostIdea />
          </ProtectedRoute>
        } />
        <Route path="idea/:id" element={
          <ProtectedRoute>
            <IdeaDetail />
          </ProtectedRoute>
        } />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
