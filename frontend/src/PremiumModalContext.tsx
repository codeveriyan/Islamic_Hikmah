import React, { createContext, useContext, useState, useCallback } from "react";

interface PremiumModalContextType {
  visible: boolean;
  featureName: string;
  showPremiumModal: (feature?: string) => void;
  hidePremiumModal: () => void;
}

const PremiumModalContext = createContext<PremiumModalContextType | undefined>(undefined);

export function PremiumModalProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [featureName, setFeatureName] = useState("");

  const showPremiumModal = useCallback((feature?: string) => {
    setFeatureName(feature || "Premium Feature");
    setVisible(true);
  }, []);

  const hidePremiumModal = useCallback(() => {
    setVisible(false);
  }, []);

  return (
    <PremiumModalContext.Provider value={{ visible, featureName, showPremiumModal, hidePremiumModal }}>
      {children}
    </PremiumModalContext.Provider>
  );
}

export function usePremiumModal() {
  const ctx = useContext(PremiumModalContext);
  if (!ctx) throw new Error("usePremiumModal must be used within PremiumModalProvider");
  return ctx;
}
