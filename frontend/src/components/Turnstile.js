import React, { useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';

// Hard-coded fallback key - only for development
const FALLBACK_SITE_KEY = '0x4AAAAAABi8AaTK_UF25ZzJ';

const TurnstileWidget = ({ onVerify, onError, siteKey }) => {
  const turnstileRef = useRef(null);
  const widgetId = useRef(null);
  const isMounted = useRef(true);
  
  // Get siteKey with multiple fallbacks
  const actualSiteKey = siteKey || 
                       process.env.REACT_APP_CLOUDFLARE_TURNSTILE_SITE_KEY || 
                       FALLBACK_SITE_KEY;
  
  console.log('Turnstile component - Environment variables:', {
    fromProps: siteKey ? 'Yes' : 'No',
    fromEnv: process.env.REACT_APP_CLOUDFLARE_TURNSTILE_SITE_KEY ? 'Yes' : 'No',
    usingFallback: (!siteKey && !process.env.REACT_APP_CLOUDFLARE_TURNSTILE_SITE_KEY) ? 'Yes' : 'No',
    finalKey: actualSiteKey ? actualSiteKey.substring(0, 5) + '...' : 'Missing'
  });

  // Function to handle verification
  const handleVerify = useCallback((token) => {
    if (typeof onVerify === 'function' && isMounted.current) {
      onVerify(token);
    }
  }, [onVerify]);

  // Function to handle errors
  const handleError = useCallback((message) => {
    if (typeof onError === 'function' && isMounted.current) {
      onError(message);
    }
  }, [onError]);

  // Initialize the Turnstile widget
  const initTurnstile = useCallback(() => {
    if (!window.turnstile) {
      console.error('Cloudflare Turnstile not loaded');
      handleError('Security check failed to load. Please refresh the page.');
      return;
    }

    if (!actualSiteKey) {
      console.error('Turnstile siteKey is missing');
      handleError('Security check configuration error. Please contact support.');
      return;
    }

    // Remove existing widget if it exists
    if (widgetId.current !== null) {
      try {
        window.turnstile.remove(widgetId.current);
        widgetId.current = null;
      } catch (error) {
        console.error('Error removing Turnstile widget:', error);
      }
    }

    // Render the Turnstile widget
    try {
      widgetId.current = window.turnstile.render(turnstileRef.current, {
        sitekey: actualSiteKey,
        callback: handleVerify,
        'error-callback': () => handleError('Failed to load security check. Please try again.'),
        'expired-callback': () => {
          handleError('Verification expired. Please try again.');
          resetTurnstile();
        },
        'timeout-callback': () => {
          handleError('Verification timed out. Please try again.');
          resetTurnstile();
        },
      });
    } catch (error) {
      console.error('Error initializing Turnstile:', error);
      handleError('Error initializing security check. Please refresh the page.');
    }
  }, [actualSiteKey, handleVerify, handleError]);

  // Reset the Turnstile widget
  const resetTurnstile = useCallback(() => {
    if (window.turnstile && widgetId.current !== null) {
      try {
        window.turnstile.reset(widgetId.current);
      } catch (error) {
        console.error('Error resetting Turnstile widget:', error);
      }
    }
  }, []);

  // Effect to handle the loading of the Turnstile script
  useEffect(() => {
    isMounted.current = true;
    
    // Check if Turnstile is already loaded
    if (window.turnstile) {
      initTurnstile();
    } else {
      // Set up a listener for when the script loads
      const handleScriptLoad = () => {
        if (isMounted.current) {
          initTurnstile();
        }
      };

      // Check if the script is already in the document
      const existingScript = document.querySelector('script[src*="challenges.cloudflare.com/turnstile"]');
      
      if (existingScript) {
        // If script is already there but not loaded yet, wait for it
        if (!window.turnstile) {
          existingScript.addEventListener('load', handleScriptLoad);
        } else {
          handleScriptLoad();
        }
      }

      // Cleanup function
      return () => {
        if (existingScript) {
          existingScript.removeEventListener('load', handleScriptLoad);
        }
      };
    }

    // Component unmount cleanup
    return () => {
      isMounted.current = false;
      if (window.turnstile && widgetId.current !== null) {
        try {
          window.turnstile.remove(widgetId.current);
        } catch (error) {
          console.error('Error removing Turnstile widget on unmount:', error);
        }
      }
    };
  }, [initTurnstile]);

  return (
    <div 
      ref={turnstileRef} 
      className="cf-turnstile"
      style={{ minHeight: '65px' }} // Ensure minimum height to prevent layout shift
      data-sitekey={actualSiteKey}
      data-size="flexible"
      data-theme="light"	
    />
  );
};

TurnstileWidget.propTypes = {
  onVerify: PropTypes.func.isRequired,
  onError: PropTypes.func,
  siteKey: PropTypes.string,
};

export default TurnstileWidget;
