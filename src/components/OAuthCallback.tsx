import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// import coreKitInstance from '../utils/web3auth'; // Import your Web3Auth instance

export const OAuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const hasRequiredParams = urlParams.get('code') || urlParams.get('state');

        if (hasRequiredParams) {
          // await coreKitInstance.handleRedirectResult(); // Process the redirect
          setTimeout(() => {
            navigate('/'); // Redirect to the home page
          }, 3000);
        } else {
          setTimeout(() => {
            navigate('/login'); // Redirect to the login page
          }, 3000);
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
        navigate('/login');
      }
    };

    handleCallback();
  }, [navigate]);

  return <div>Processing login...</div>;
};
