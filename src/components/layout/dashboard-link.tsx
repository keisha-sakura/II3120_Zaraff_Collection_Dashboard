"use client";
import Link from "next/link";
import {
  createContext,
  useContext,
  type ComponentProps,
  type ReactNode,
} from "react";

type Navigation = {
  resolveHref: (href: string) => string;
  navigate: (href: string) => void;
};
const NavigationContext = createContext<Navigation | null>(null);
export function useDashboardNavigation() {
  return useContext(NavigationContext);
}
export function DashboardNavigationProvider({
  value,
  children,
}: {
  value: Navigation;
  children: ReactNode;
}) {
  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

/** Keeps standard links outside the demo; preview navigation preserves its role. */
export function DashboardLink({
  href,
  onClick,
  ...props
}: Omit<ComponentProps<typeof Link>, "href"> & { href: string }) {
  const navigation = useContext(NavigationContext);
  return (
    <Link
      href={navigation?.resolveHref(href) ?? href}
      onClick={(event) => {
        onClick?.(event);
        if (
          navigation &&
          !event.defaultPrevented &&
          !event.metaKey &&
          !event.ctrlKey &&
          !event.shiftKey &&
          !event.altKey &&
          event.button === 0
        ) {
          event.preventDefault();
          navigation.navigate(href);
        }
      }}
      {...props}
    />
  );
}
