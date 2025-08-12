/**
 * Admin Service for Firebase Custom Claims Management
 * 
 * This service handles role management using Firebase Custom Claims,
 * which is the industry-standard approach for RBAC in Firebase apps.
 */

import { auth } from '../firebase';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Get authorization headers with Firebase ID token
 */
const getAuthHeaders = async () => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  const token = await user.getIdToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

/**
 * Assign admin role to a user using Firebase Custom Claims
 * @param {string} uid - User ID to promote to admin
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const assignAdminRole = async (uid) => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/admin/assign-admin`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ uid }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to assign admin role');
    }

    console.log('✅ Admin role assigned successfully:', data);
    return { success: true, message: data.message };
  } catch (error) {
    console.error('❌ Error assigning admin role:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Revoke admin role from a user
 * @param {string} uid - User ID to revoke admin from
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const revokeAdminRole = async (uid) => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/admin/revoke-admin`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ uid }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to revoke admin role');
    }

    console.log('✅ Admin role revoked successfully:', data);
    return { success: true, message: data.message };
  } catch (error) {
    console.error('❌ Error revoking admin role:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Get all users with their roles
 * @returns {Promise<Array>} List of users with role information
 */
export const getAllUsers = async () => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/admin/users`, {
      method: 'GET',
      headers,
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch users');
    }

    console.log('✅ Users fetched successfully:', data.users.length, 'users');
    return data.users;
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    throw error;
  }
};

/**
 * Force refresh current user's token to get updated custom claims
 * This should be called after any role changes to ensure the frontend
 * immediately reflects the new permissions.
 */
export const refreshUserToken = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No authenticated user');
    }

    // Force token refresh to get updated custom claims
    await user.getIdToken(true);
    
    console.log('✅ User token refreshed successfully');
    return true;
  } catch (error) {
    console.error('❌ Error refreshing user token:', error);
    throw error;
  }
};

/**
 * Check if current user has admin privileges via custom claims
 * @returns {Promise<boolean>}
 */
export const checkAdminStatus = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return false;
    }

    const tokenResult = await user.getIdTokenResult();
    const customClaims = tokenResult.claims || {};
    
    return customClaims.admin === true;
  } catch (error) {
    console.error('❌ Error checking admin status:', error);
    return false;
  }
};

/**
 * Get current user's roles from custom claims
 * @returns {Promise<Array<string>>}
 */
export const getCurrentUserRoles = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return [];
    }

    const tokenResult = await user.getIdTokenResult();
    const customClaims = tokenResult.claims || {};
    
    return customClaims.roles || [];
  } catch (error) {
    console.error('❌ Error getting user roles:', error);
    return [];
  }
};

/**
 * Export audit logs (admin only)
 * @returns {Promise<Blob>} CSV file blob
 */
export const exportAuditLogs = async () => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/admin/export-audit-logs`, {
      method: 'GET',
      headers: {
        ...headers,
        'Content-Type': 'text/csv',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to export audit logs');
    }

    return await response.blob();
  } catch (error) {
    console.error('❌ Error exporting audit logs:', error);
    throw error;
  }
};

/**
 * Export login logs (admin only)
 * @returns {Promise<Blob>} CSV file blob
 */
export const exportLoginLogs = async () => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/admin/export-login-logs`, {
      method: 'GET',
      headers: {
        ...headers,
        'Content-Type': 'text/csv',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to export login logs');
    }

    return await response.blob();
  } catch (error) {
    console.error('❌ Error exporting login logs:', error);
    throw error;
  }
};
