import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './features/landing/LandingPage';
import { AuthPage } from './features/auth/AuthPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Promotional landing page — shown first when visiting "/" */}
        <Route path="/" element={<LandingPage />} />

        {/* Login/Auth page — navigated to when clicking "Sign In" */}
        <Route path="/auth" element={<AuthPage />} />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;