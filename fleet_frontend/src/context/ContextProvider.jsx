import { createContext, useContext, useState, useMemo } from "react";

const StateContext = createContext({
  user: null,
  token: null,
  setUser: () => {},
  setToken: () => {},
});

export const ContextProvider = ({ children }) => {
  // 1. On récupère les données directement du localStorage au démarrage (Instantané)
  const [user, setUserState] = useState(() => {
    const savedUser = localStorage.getItem("USER");
    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setTokenState] = useState(localStorage.getItem("ACCESS_TOKEN"));

  // 2. Fonction pour mettre à jour le Token et le Storage
  const setToken = (newToken) => {
    setTokenState(newToken);
    if (newToken) {
      localStorage.setItem("ACCESS_TOKEN", newToken);
    } else {
      localStorage.removeItem("ACCESS_TOKEN");
      localStorage.removeItem("USER"); // On nettoie tout à la déconnexion
    }
  };

  // 3. Fonction pour mettre à jour l'utilisateur et le Storage
  const setUser = (newUser) => {
    setUserState(newUser);
    if (newUser) {
      localStorage.setItem("USER", JSON.stringify(newUser));
    } else {
      localStorage.removeItem("USER");
    }
  };

  // 4. Optimisation des performances
  const contextValue = useMemo(() => ({
    user,
    token,
    setUser,
    setToken,
  }), [user, token]);

  return (
    <StateContext.Provider value={contextValue}>
      {children}
    </StateContext.Provider>
  );
};

export const useStateContext = () => useContext(StateContext);