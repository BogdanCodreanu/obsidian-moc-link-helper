import { useContext } from "react";
import { AppContext, IAppContext } from "../context/AppContext";

export const useApp = (): IAppContext => {
  return useContext(AppContext)!;
};
