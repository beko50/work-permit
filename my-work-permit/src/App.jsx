import './App.css';
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SignInPage from './SignInPage';
import SignUpPage from './SignUpPage';
import Dashboard from './Sidebar';
import Home from './Home';
import JobSafetyPermit from './JobSafetyPermit';    //Job Safety Permits page
import SafetyForm from './SafetyForm';      //Job Safety form with all checkboxes
import PermitToWork from './PermitToWork';   //Permit to Work page
import PendingApprovals from './PendingApprovals';
import ViewPermits from './ViewPermits';   //View All Permits page
import ApprovalHistory from './ApprovalHistory';
import SuccessPage from './SuccessPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SignInPage />} />
        <Route path="/sign-up" element={<SignUpPage />} />
        <Route path="/dashboard" element={<Dashboard />}>
          <Route index element={<Home />} />
          <Route path="permits">
            <Route path="job-permits" element={<JobSafetyPermit />} />
            <Route path="job-permits/create" element={<SafetyForm />} />
            <Route path="job-permits/success" element={<SuccessPage />} />
            <Route path="permit-to-work" element={<PermitToWork />} />
          </Route>  //'/dashboard/my-tasks/pending-approvals'
          <Route path="my-tasks">
            <Route path="pending-approvals" element={<PendingApprovals />} />
            <Route path="view-permits" element={<ViewPermits />} />
            <Route path="approval-history" element={<ApprovalHistory />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;