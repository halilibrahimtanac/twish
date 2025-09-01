"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";

import { cn } from "@/lib/utils";
import { NavigationMenuLink } from "@/components/ui/navigation-menu";
import { UserNav } from "./user-nav";
import { UserSearch } from "../UserSearch";
import { Button } from "../ui/button";
import { useUserStore } from "@/lib/store/user.store";

export function Navbar() {
  const { user } = useUserStore();

  return (
    <header className="px-4 sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between gap-x-4">
        <div className="flex items-center">
          <Link href="/home" className="flex items-center space-x-2">
            <Image
              alt="twish-logo"
              src={"/twish-logo-preview.png"}
              width={79}
              height={50}
              className="w-[60px] h-auto md:w-[79px]"
            />
          </Link>
        </div>

        {user && (
          <div className="flex-1 justify-center md:flex">
            <UserSearch />
          </div>
        )}

        <div className="flex items-center space-x-2">
          {user ? (
            <UserNav />
          ) : (
            <Link href="/login">
              <Button variant="ghost">Login</Button> 
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

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
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:bg-accent-foreground",
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