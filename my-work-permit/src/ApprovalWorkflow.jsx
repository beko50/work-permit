import React from 'react';
import { Check, Clock, X, } from 'lucide-react';
import { Card, CardHeader, CardContent } from './components/ui/card';
import { Button } from './components/ui/button';

const defaultApprovals = [
  {
    title: "Permit Issuer",
    status: "approved",
    comments: "",
    approvedBy: "Dennis Appiah",
    approvedDate: "20/01/2024",
    isCurrentApprover: false
  },
  {
    title: "Head of Department",
    status: "pending",
    comments: "",
    isCurrentApprover: true
  },
  {
    title: "QHSSE",
    status: "pending",
    comments: "",
    isCurrentApprover: false
  }
];

const PermitApprovalWorkflow = ({ approvals = defaultApprovals, onClose }) => {
  if (!Array.isArray(approvals)) {
    return (
      <Card className="max-w-3xl mx-auto">
        <CardContent>
          <p className="text-gray-600">No approval data available</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return (
          <div className="inline-flex items-center px-3 py-1 bg-green-600 text-white rounded-full text-sm">
            <Check size={16} className="mr-1" />
            Approved
          </div>
        );
      case 'pending':
        return (
          <div className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
            <Clock size={16} className="mr-1" />
            Pending
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-hidden bg-black/50">
      <div className="relative w-full max-w-3xl m-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
        <Card className="bg-white shadow-xl">
          <CardHeader className="sticky top-0 z-50 border-b pb-2 pt-2 bg-white">
            <h1 className="text-xl font-semibold text-center">Approval Workflow</h1>
            <Button
              variant="ghost"
              onClick={onClose}
              className="absolute top-2 right-2 transition-transform duration-300 hover:scale-110 group"
            >
              <X className="h-5 w-5 group-hover:h-6 group-hover:w-6 transition-all duration-300" />
            </Button>
          </CardHeader>

          <CardContent className="p-6">
            <div className="mb-4">
              <h2 className="text-lg font-medium">Status</h2>
              <p className="text-gray-600">For approval</p>
            </div>

            <div className="mb-4">
              <h2 className="text-lg font-medium">Approval Process</h2>
            </div>

            <div className="relative">
              {/* Vertical Timeline Line */}
              <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200" />

              {/* Approval Steps */}
              {approvals.map((approval, index) => (
                <div key={index} className="relative pl-10 pb-6">
                  {/* Timeline Dot */}
                  <div 
                    className={`absolute left-0 rounded-full border-2 w-6 h-6 transition-all duration-300
                      ${approval.status === 'approved' ? 'bg-green-500 border-green-500' : 
                        approval.isCurrentApprover ? 'bg-blue-500 border-blue-500' : 
                        'bg-gray-200 border-gray-300'}`}
                  />

                  {/* Approval Content */}
                  <div className="border rounded-md p-4">
                    <div className="mb-4">
                      <h3 className="font-medium text-lg mb-2">{approval.title}</h3>
                      {getStatusBadge(approval.status)}
                    </div>

                    {(approval.status === 'approved' || approval.isCurrentApprover) && (
                      <>
                        <div className="mb-4">
                          <label className="block text-sm text-gray-600 mb-2">
                            Approval Comments
                          </label>
                          <textarea 
                            className="w-full border rounded-md p-2"
                            rows="3"
                            disabled={approval.status === 'approved'}
                            defaultValue={approval.comments}
                          />
                        </div>

                        {approval.status === 'approved' && (
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                            <div>
                              <span>Approved By</span>
                              <div className="font-medium text-black">{approval.approvedBy}</div>
                            </div>
                            <div>
                              <span>Approved Date</span>
                              <div className="font-medium text-black">{approval.approvedDate}</div>
                            </div>
                          </div>
                        )}

                        {approval.isCurrentApprover && approval.status === 'pending' && (
                          <div className="flex justify-end gap-3 mt-4">
                            <Button variant="danger">
                              Reject
                            </Button>
                            <Button variant="success">
                              Approve
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PermitApprovalWorkflow;