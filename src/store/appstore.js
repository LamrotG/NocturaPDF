import React, { createContext, useCallback, useContext, useMemo, useReducer } from "react";

const AppStoreContext = createContext(null);

function nextId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `tab-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function reducer(state, action) {
  switch (action.type) {
    case "OPEN_TAB": {
      const tab = { id: nextId(), file: action.file, name: action.name };
      return { tabs: [...state.tabs, tab], activeTabId: tab.id };
    }
    case "CLOSE_TAB": {
      const index = state.tabs.findIndex((t) => t.id === action.id);
      if (index === -1) return state;

      const tabs = state.tabs.filter((t) => t.id !== action.id);
      let activeTabId = state.activeTabId;
      if (activeTabId === action.id) {
        const fallback = tabs[index] || tabs[index - 1];
        activeTabId = fallback ? fallback.id : null;
      }
      return { tabs, activeTabId };
    }
    case "SET_ACTIVE_TAB":
      return { ...state, activeTabId: action.id };
    default:
      return state;
  }
}

// Plain .js (no JSX) — createElement keeps this file usable without a Vite
// JSX-loader override for non-.jsx files.
export function AppStoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, { tabs: [], activeTabId: null });

  const openTab = useCallback(
    (file, name) => dispatch({ type: "OPEN_TAB", file, name }),
    []
  );
  const closeTab = useCallback((id) => dispatch({ type: "CLOSE_TAB", id }), []);
  const setActiveTab = useCallback(
    (id) => dispatch({ type: "SET_ACTIVE_TAB", id }),
    []
  );

  const activeTab = state.tabs.find((t) => t.id === state.activeTabId) || null;

  const value = useMemo(
    () => ({
      tabs: state.tabs,
      activeTabId: state.activeTabId,
      activeTab,
      openTab,
      closeTab,
      setActiveTab,
    }),
    [state.tabs, state.activeTabId, activeTab, openTab, closeTab, setActiveTab]
  );

  return React.createElement(AppStoreContext.Provider, { value }, children);
}

export function useAppStore() {
  const ctx = useContext(AppStoreContext);
  if (!ctx) {
    throw new Error("useAppStore must be used within an AppStoreProvider");
  }
  return ctx;
}
