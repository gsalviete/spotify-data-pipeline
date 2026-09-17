import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import RecentlyPlayed from './pages/RecentlyPlayed';
import Share from './pages/Share';
import ChatWidget from './components/ChatWidget';
import DemoProvider from './demo/DemoProvider';

function AppRoutes() {
  const location = useLocation();
  const showChat = location.pathname !== '/';

  return (
    <>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/recently-played" element={<RecentlyPlayed />} />
        <Route path="/share" element={<Share />} />
      </Routes>
      {showChat && <ChatWidget />}
    </>
  );
}

export default function App() {
  return (
    <DemoProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </DemoProvider>
  );
}
