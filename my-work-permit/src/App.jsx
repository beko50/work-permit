//import logo from './logo.svg';
import './App.css';
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SignInPage from './SignInPage';
import Dashboard from './Dashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SignInPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/view-permits" element={<ViewPermits />} />
        {/*<Route path="/approval-history" element={<ApprovalHistory />} />
        <Route path="/view-jobs" element={<ViewJobs />} /> */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
