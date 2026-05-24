import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export interface UserLocation {
  city: string;
  area?: string;
  pincode?: string;
}

const LocCtx = createContext<{
  location: UserLocation | null;
  setLocation: (l: UserLocation) => void;
  clear: () => void;
}>({ location: null, setLocation: () => {}, clear: () => {} });

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLoc] = useState<UserLocation | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("rentify-location");
    if (raw) try { setLoc(JSON.parse(raw)); } catch {}
  }, []);

  const setLocation = (l: UserLocation) => {
    setLoc(l);
    localStorage.setItem("rentify-location", JSON.stringify(l));
  };
  const clear = () => { setLoc(null); localStorage.removeItem("rentify-location"); };

  return <LocCtx.Provider value={{ location, setLocation, clear }}>{children}</LocCtx.Provider>;
}

export const useLocation = () => useContext(LocCtx);