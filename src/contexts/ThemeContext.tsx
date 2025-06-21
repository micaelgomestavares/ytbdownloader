import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Sempre começar no modo claro, forçado
  const [theme, setTheme] = useState<Theme>("light");

  // Forçar tema claro na inicialização
  useEffect(() => {
    try {
      if (typeof document !== "undefined") {
        const root = document.documentElement;
        root.classList.remove("light", "dark");
        root.classList.add("light");
        root.setAttribute("data-theme", "light");
      }
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem("theme", "light");
      }
    } catch (error) {
      console.warn("Erro ao forçar tema claro:", error);
    }
  }, []); // Executar apenas uma vez na inicialização

  useEffect(() => {
    try {
      // Salvar tema no localStorage se disponível
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem("theme", theme);
      }

      // Aplicar classes CSS
      if (typeof document !== "undefined") {
        const root = document.documentElement;
        root.classList.remove("light", "dark");
        root.classList.add(theme);
        root.setAttribute("data-theme", theme);
      }
    } catch (error) {
      console.warn("Erro ao aplicar tema:", error);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
