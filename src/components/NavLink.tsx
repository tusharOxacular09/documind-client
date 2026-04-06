"use client";

import Link, { type LinkProps } from "next/link";
import { usePathname } from "next/navigation";
import { forwardRef } from "react";

import { cn } from "@/lib/utils";

type NavLinkProps = Omit<LinkProps, "className"> & {
  className?: string;
  activeClassName?: string;
  pendingClassName?: string;
  /** When true, only exact pathname matches as active. */
  end?: boolean;
  children: React.ReactNode;
};

const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(
  ({ className, activeClassName, end, href, ...props }, ref) => {
    const pathname = usePathname();
    const path = typeof href === "string" ? href : href.pathname ?? "";

    const isActive = end
      ? pathname === path
      : pathname === path || (path !== "/" && pathname.startsWith(path));

    return (
      <Link
        ref={ref}
        href={href}
        className={cn(className, isActive && activeClassName)}
        {...props}
      />
    );
  }
);

NavLink.displayName = "NavLink";

export { NavLink };
