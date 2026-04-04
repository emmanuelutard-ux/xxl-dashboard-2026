"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'client' | 'agency' | 'expert';

interface RoleContextType {
    role: UserRole;
    setRole: (role: UserRole) => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider = ({ children }: { children: ReactNode }) => {
    const [role, setRole] = useState<UserRole>('client');

    return (
        <RoleContext.Provider value={{ role, setRole }}>
            {children}
        </RoleContext.Provider>
    );
};

export const useRole = () => {
    const context = useContext(RoleContext);
    if (!context) {
        throw new Error('useRole must be used within a RoleProvider');
    }
    return context;
};
