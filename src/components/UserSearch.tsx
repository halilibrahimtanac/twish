"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "use-debounce";
import { SearchInput } from "./ui/search.input";
import { trpc } from "@/app/_trpc/client";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export function UserSearch() {
  const { data } = useSession();
  const user = data?.user;
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const [debouncedQuery] = useDebounce(query, 300); // 300ms gecikme
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const { data: users, isLoading } = trpc.search.searchUser.useQuery(
    { query: debouncedQuery },
    {
      enabled: debouncedQuery.length >= 2 && isFocused && !!user,
    }
  );

  // Dışarı tıklandığında sonuçları gizle
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [searchContainerRef]);

  const showResults = isFocused && query.length > 0;

  return (
    <div className="relative w-full max-w-md" ref={searchContainerRef}>
      <SearchInput
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setIsFocused(true)}
        placeholder="Kullanıcı veya twish ara..." // Placeholder'ı güncelleyebiliriz
      />

      {showResults && (
        <Card className="absolute top-full mt-2 w-full z-10 py-2">
          <CardContent className="p-2 max-h-80 overflow-y-auto">
            {isLoading && debouncedQuery.length >= 2 && <LoadingSkeleton />}

            {!isLoading && users && users.length > 0 && (
              <ul>
                {users.map((user) => (
                  <li key={user.id}>
                    <Link
                      href={`/user/${user.username}`}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-accent transition-colors"
                      onClick={() => {
                        setIsFocused(false);
                        setQuery("");
                      }}
                    >
                      <Avatar>
                        <AvatarImage
                          src={user.profilePictureUrl ?? undefined}
                        />
                        <AvatarFallback>
                          {user.name?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-semibold">{user.name}</span>
                        <span className="text-sm text-muted-foreground">
                          @{user.username}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {!isLoading && debouncedQuery.length >= 2 && users?.length === 0 && (
              <p className="text-center text-sm text-muted-foreground p-4">
                Kullanıcı bulunamadı.
              </p>
            )}

            {query.length > 0 && query.length < 2 && (
              <p className="text-center text-sm text-muted-foreground p-4">
                Aramak için en az 2 karakter girin.
              </p>
            )}

            {query.length > 0 && (
              <>
                {users && users.length > 0 && (
                  <div className="border-t -mx-2 my-2" />
                )}
                <Link
                  href={`/twish-search?query=${encodeURIComponent(query)}&type=word`}
                  onClick={() => {
                    setIsFocused(false);
                    setQuery("");
                  }}
                >
                  <Button
                    variant="ghost"
                    className="w-full justify-start font-normal text-sm"
                  >
                    <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      <span className="font-semibold text-primary">{query}</span>{" "}
                      için arama yap
                    </span>
                  </Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

const LoadingSkeleton = () => (
  <div className="space-y-2 p-2">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    ))}
  </div>
);