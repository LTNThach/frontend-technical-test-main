import { jwtDecode } from 'jwt-decode';
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export type AuthenticationState =
  | {
      isAuthenticated: true;
      token: string;
      userId: string;
    }
  | {
      isAuthenticated: false;
    };

export type Authentication = {
  state: AuthenticationState;
  authenticate: (token: string) => void;
  signout: () => void;
};

export const AuthenticationContext = createContext<Authentication | undefined>(
  undefined
);

const isTokenExpired = (token: string): boolean => {
  try {
    const { exp } = jwtDecode<{ exp: number }>(token);
    if (exp * 1000 < Date.now()) {
      return true;
    }
    return false;
  } catch (error) {
    return true;
  }
};

export const AuthenticationProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const [state, setState] = useState<AuthenticationState>({
    isAuthenticated: false,
  });

  const authenticate = useCallback(
    (token: string) => {
      localStorage.setItem('authToken', token);

      setState({
        isAuthenticated: true,
        token,
        userId: jwtDecode<{ id: string }>(token).id,
      });
    },
    [setState]
  );

  const signout = useCallback(() => {
    localStorage.removeItem('authToken');

    setState({ isAuthenticated: false });
  }, [setState]);

  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');

    if (storedToken && !isTokenExpired(storedToken)) {
      authenticate(storedToken);
    } else if (storedToken && isTokenExpired(storedToken)) {
      signout();
    }
  }, [authenticate, signout]);

  const contextValue = useMemo(
    () => ({ state, authenticate, signout }),
    [state, authenticate, signout]
  );

  return (
    <AuthenticationContext.Provider value={contextValue}>
      {children}
    </AuthenticationContext.Provider>
  );
};

export function useAuthentication() {
  const context = useContext(AuthenticationContext);
  if (!context) {
    throw new Error(
      'useAuthentication must be used within an AuthenticationProvider'
    );
  }
  return context;
}

export function useAuthToken() {
  const { state } = useAuthentication();
  if (!state.isAuthenticated) {
    throw new Error('User is not authenticated');
  }
  return state.token;
}
