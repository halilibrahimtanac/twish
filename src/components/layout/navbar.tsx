"use client";

import * as React from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { NavigationMenuLink } from "@/components/ui/navigation-menu";

// import { ThemeToggle } from "./theme-toggle";
import { UserNav } from "./user-nav";
import Image from "next/image";

export function Navbar() {
  return (
    <header className="px-4 sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center relative justify-between md:justify-start">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 md:relative md:left-auto md:top-auto md:translate-x-0 md:translate-y-0 md:mr-4">
          <Link href="/home" className="flex items-center space-x-2">
            <Image 
              alt="twish-logo" 
              src={"/twish-logo.png"} 
              width={79}
              height={50} 
              className="w-[60px] h-auto md:w-[79px]"
            />
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-2">
          {/* <ThemeToggle /> */}
          <UserNav />
        </div>
      </div>
    </header>
  );
}

// Re-usable component for the dropdown menu links
const ListItem = React.forwardRef<
  React.ComponentRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";