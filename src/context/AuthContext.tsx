import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { AuthState, User, Organization } from '../types/auth';

type AuthAction =
  | { type: 'SET_USER'; payload: User }
  | { type: 'SET_ORGANIZATION'; payload: Organization }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOGOUT' };

const initialState: AuthState = {
  user: null,
  organization: null,
  isLoading: true,
  error: null,
};

const AuthContext = createContext<{
  state: AuthState;
  dispatch: React.Dispatch<AuthAction>;
}>({
  state: initialState,
  dispatch: () => null,
});

const loadSavedAuth = () => {
  try {
    const savedUser = localStorage.getItem('user');
    const savedOrg = localStorage.getItem('organization');
    return {
      user: savedUser ? JSON.parse(savedUser) : null,
      organization: savedOrg ? JSON.parse(savedOrg) : null,
    };
  } catch (error) {
    console.error('Error loading saved auth:', error);
    return { user: null, organization: null };
  }
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  let newState: AuthState;
  
  switch (action.type) {
    case 'SET_USER':
      newState = { ...state, user: action.payload };
      localStorage.setItem('user', JSON.stringify(action.payload));
      return newState;
      
    case 'SET_ORGANIZATION':
      newState = { ...state, organization: action.payload };
      localStorage.setItem('organization', JSON.stringify(action.payload));
      return newState;
      
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
      
    case 'SET_ERROR':
      return { ...state, error: action.payload };
      
    case 'LOGOUT':
      localStorage.removeItem('user');
      localStorage.removeItem('organization');
      localStorage.removeItem('authToken');
      return { ...initialState, isLoading: false };
      
    default:
      return state;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const savedAuth = loadSavedAuth();
  const [state, dispatch] = useReducer(authReducer, {
    ...initialState,
    user: savedAuth.user,
    organization: savedAuth.organization,
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token || !state.user || !state.organization) {
          dispatch({ type: 'LOGOUT' });
        }
        dispatch({ type: 'SET_LOADING', payload: false });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Authentication failed' });
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ state, dispatch }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};