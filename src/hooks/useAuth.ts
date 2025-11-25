// mobile/src/hooks/useAuth.ts

import { useContext } from 'react';
import { AuthContext, AuthContextData } from '../contexts/AuthContext'; 

export const useAuth = (): AuthContextData => {
    return useContext(AuthContext);
};