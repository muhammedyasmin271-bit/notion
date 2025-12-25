import React, { useState, useEffect } from 'react';
import { useLocation, useParams, Navigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';

const CompanyRouteGuard = ({ children }) => {
  const location = useLocation();
  const params = useParams();
  const { user } = useAppContext();
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [companyId, setCompanyId] = useState(null);

  useEffect(() => {
    const validateCompany = async () => {
      // Skip validation for superadmin
      if (user?.role === 'superadmin') {
        setIsValid(true);
        setIsValidating(false);
        return;
      }

      // Get companyId from URL params (e.g., /:companyId/notepad)
      let companyIdFromPath = params.companyId;
      
      // Get companyId from query params (e.g., ?company=xxx)
      const urlParams = new URLSearchParams(location.search);
      const companyIdFromQuery = urlParams.get('company');
      
      // Get companyId from localStorage as fallback
      const companyIdFromStorage = localStorage.getItem('currentCompanyId');
      
      // Determine which companyId to use
      const finalCompanyId = companyIdFromPath || companyIdFromQuery || companyIdFromStorage;
      
      // If no company ID found, invalid
      if (!finalCompanyId) {
        setIsValid(false);
        setIsValidating(false);
        return;
      }

      setCompanyId(finalCompanyId);

      // Validate company exists in database
      try {
        const token = localStorage.getItem('token');
        const envBackendUrl = process.env.REACT_APP_BACKEND_URL;
        const fallbackUrl = 'https://notion-l9ti.onrender.com';
        
        let backendUrl = fallbackUrl;
        if (envBackendUrl && envBackendUrl !== 'undefined' && envBackendUrl.startsWith('http')) {
          backendUrl = envBackendUrl;
        }
        
        const fetchUrl = `${backendUrl}/api/auth/company/${finalCompanyId}`;
        console.log('🔍 CompanyRouteGuard: Validating company at:', fetchUrl);
        
        const response = await fetch(fetchUrl, {
          headers: {
            'x-auth-token': token || ''
          }
        });

        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('❌ CompanyRouteGuard: Received non-JSON response:', text.substring(0, 100));
            throw new Error('Server returned HTML instead of JSON. Check backend URL.');
          }
          
          const companyData = await response.json();
          // Check if company exists (if we get data, company exists)
          if (companyData && companyData.companyId) {
            // Also check if company exists in super admin (optional additional check)
            // For now, if API returns data, company exists
            setIsValid(true);
          } else {
            setIsValid(false);
          }
        } else if (response.status === 404) {
          // Company not found in database
          setIsValid(false);
        } else {
          // Other error
          setIsValid(false);
        }
      } catch (error) {
        console.error('Error validating company:', error);
        setIsValid(false);
      } finally {
        setIsValidating(false);
      }
    };

    validateCompany();
  }, [location, params, user]);

  // Show nothing while validating
  if (isValidating) {
    return null;
  }

  // If invalid, show nothing (as requested by user)
  if (!isValid) {
    return null;
  }

  // If valid, render children
  return children;
};

export default CompanyRouteGuard;

