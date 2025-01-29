import './App.css';
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SignInPage from './SignInPage';
import SignUpPage from './SignUpPage';
import Dashboard from './Sidebar';
import Home from './Home';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import RequestJobPermit from './RequestJobPermit';    //Job Safety Permits page
import RequestPTW from './RequestPTW';
import SafetyForm from './SafetyForm';      //Job Safety form with all checkboxes
import PermitToWork from './PermitToWork';   //Permit to Work page
//import PendingApprovals from './PendingApprovals';
import ViewPermits from './ViewPermits';   //View All Permits page
import ApprovalHistory from './ApprovalHistory';
import SuccessPage from './SuccessPage';
import SubmittedPermit from './SubmittedPermit';  // New import
import SubmittedPTW from './SubmittedPTW';
import PermitReview from './ReviewPermit';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
        <Route path="/" element={<SignInPage />} />
        <Route path="/sign-up" element={<SignUpPage />} />
        <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          >
          <Route index element={<Home />} />
          <Route path="permits">
            <Route path="job-permits" element={<RequestJobPermit />} />
            <Route path="job-permits/create" element={<SafetyForm />} />
            <Route path="job-permits/success" element={<SuccessPage />} />
            <Route path="view/:permitId" element={<SubmittedPermit />} />
            <Route path="review/:permitId" element={<PermitReview/>} /> 
            {/* Permit to Work should have its own routing */}
            <Route path="permit-to-work" element={<PermitToWork />} />
            <Route path="permit-to-work/:ptwId" element={<SubmittedPTW />} />
            <Route path="requestPTW" element={<RequestPTW />} />
          </Route>  //'/dashboard/my-tasks/pending-approvals'
          <Route path="my-tasks">
            {/* <Route path="pending-approvals" element={<PendingApprovals />} /> */}
            <Route path="view-permits" element={<ViewPermits />} />
            <Route path="approval-history" element={<ApprovalHistory />} />
          </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;