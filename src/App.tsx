import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Splash } from './components/ui';
import { Login } from './pages/Login';
import { Pair } from './pages/Pair';
import { Dashboard } from './pages/Dashboard';
import { Notes } from './pages/Notes';
import { Complaints } from './pages/Complaints';
import { Todos } from './pages/Todos';
import { Brainstorms } from './pages/Brainstorms';
import { Finances } from './pages/Finances';
import { BucketList } from './pages/BucketList';
import { Periods } from './pages/Periods';
import { Milestones } from './pages/Milestones';
import { Health } from './pages/Health';
import { Updates } from './pages/Updates';
import { SettingsPage } from './pages/Settings';

function Gate() {
  const { session, loading, coupleId } = useAuth();
  const location = useLocation();

  if (loading && !session) {
    return <Splash />;
  }

  if (!session) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace state={{ from: location }} />} />
      </Routes>
    );
  }

  // Signed in but not yet paired — every feature is couple-scoped.
  if (!coupleId) {
    return (
      <Routes>
        <Route path="/pair" element={<Pair />} />
        <Route path="/settings" element={<Pair />} />
        <Route path="*" element={<Navigate to="/pair" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="notes" element={<Notes />} />
        <Route path="complaints" element={<Complaints />} />
        <Route path="todos" element={<Todos />} />
        <Route path="brainstorms" element={<Brainstorms />} />
        <Route path="finances" element={<Finances />} />
        <Route path="bucket-list" element={<BucketList />} />
        <Route path="periods" element={<Periods />} />
        <Route path="milestones" element={<Milestones />} />
        <Route path="health" element={<Health />} />
        <Route path="updates" element={<Updates />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}
