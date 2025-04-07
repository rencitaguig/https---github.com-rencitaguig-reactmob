import React, { createContext, useState } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userRole, setUserRole] = useState(null);

  const getVisibleScreens = () => {
    
    if (userRole === "admin") {
      return ["Profile", "Discounts", "Admin"];
    }
    
    return ["Home", "Cart", "Notifications", "Profile"];
  };

  return (
    <AuthContext.Provider value={{ userRole, setUserRole, getVisibleScreens }}>
      {children}
    </AuthContext.Provider>
  );
};
