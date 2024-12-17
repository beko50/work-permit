import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent } from './components/ui/card';

const SuccessCard = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prevCount) => prevCount - 1);
    }, 1000);

    const redirectTimer = setTimeout(() => {
      navigate('/dashboard/permits/job-permits');
    }, 5000);

    return () => {
      clearInterval(timer);
      clearTimeout(redirectTimer);
    };
  }, [navigate]);

  return (
    <div className="mt-6 flex justify-center">
     <Card className="bg-green-100 border-l-4 border-green-500 p-6 shadow-lg max-w-lg mx-auto">
  <CardHeader>
    <div className="flex items-center">
      <svg
        className="fill-current h-8 w-8 text-green-500 mr-4"
        viewBox="0 0 24 24"
      >
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
      </svg>
      <h3 className="text-green-900 font-bold text-lg">Form submitted successfully!</h3>
    </div>
  </CardHeader>
  <CardContent>
    <p className="text-green-700 text-base mt-2">Redirecting to Home Page in {countdown} seconds...</p>
  </CardContent>
</Card>

    </div>
  );
};

export default SuccessCard;