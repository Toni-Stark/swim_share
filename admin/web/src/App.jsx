import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Dynamics from './pages/Dynamics';
import Comments from './pages/Comments';
import Competitions from './pages/Competitions';
import CheckIns from './pages/CheckIns';
import Content from './pages/Content';
import TierStats from './pages/TierStats';
import GlobalConfig from './pages/GlobalConfig';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('admin_token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="users" element={<Users />} />
        <Route path="dynamics" element={<Dynamics />} />
        <Route path="comments" element={<Comments />} />
        <Route path="competitions" element={<Competitions />} />
        <Route path="checkins" element={<CheckIns />} />
        <Route path="content" element={<Content />} />
        <Route path="tiers" element={<TierStats />} />
        <Route path="config" element={<GlobalConfig />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
