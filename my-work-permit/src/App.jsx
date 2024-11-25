import './App.css';
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SignInPage from './SignInPage';
import SignUpPage from './SignUpPage';
import Dashboard from './Dashboard';
import Home from './Home';
import ViewPermits from './ViewPermits';
import JobPermit from './JobPermit';
import PermitForm from './PermitForm';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SignInPage />} />
        <Route path="/sign-up" element={<SignUpPage />} />
        <Route path="/dashboard" element={<Dashboard />}>
          <Route index element={<Home />} />
          <Route path="permits">
            <Route path="job-permits" element={<JobPermit />} />
            <Route path="job-permits/create" element={<PermitForm />} />
            <Route path="permit-to-work" element={<div>Permit to Work Content</div>} />
          </Route>
          <Route path="my-tasks">
            <Route path="view-permits" element={<ViewPermits />} />
            <Route path="approval-history" element={<div>Approval History Content</div>} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;