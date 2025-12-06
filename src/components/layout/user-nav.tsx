import { trpc } from "@/app/_trpc/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { initials } from "@/lib/utils";
import { LogOut, UserRound } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export function UserNav() {
  const { data } = useSession();
  const user = data?.user;
  const router = useRouter();

  const logout = trpc.user.logout.useMutation({
    onSuccess: async () => {
      await signOut();
      router.push("/login");
    },
    onError: (error) => {
      console.log(error);
    },
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 overflow-hidden rounded-full border border-primary/20 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-background to-secondary/10" />
          <Avatar className="relative h-9 w-9 ring-2 ring-background">
            <AvatarImage src={user?.profilePictureUrl} alt={`@${user?.username}`} />
            <AvatarFallback>{initials(user?.name)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-64 rounded-2xl border border-border/70 bg-card p-2 shadow-xl"
        align="end"
        forceMount
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-center gap-3 rounded-xl bg-muted p-3">
            <Avatar className="h-10 w-10 ring-2 ring-primary/20">
              <AvatarImage src={user?.profilePictureUrl} alt={`@${user?.username}`} />
              <AvatarFallback>{initials(user?.name)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-semibold leading-none text-foreground">
                {user?.name}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                @{user?.username}
              </p>
            </div>
            <span className="ml-auto h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_6px] shadow-emerald-500/20" />
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => router.push("/profile")}
            className="gap-2 rounded-lg px-3 py-2 text-sm transition hover:bg-primary/10"
          >
            <UserRound className="h-4 w-4 text-primary" />
            Profile
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuItem
          onClick={() => logout.mutate()}
          className="gap-2 rounded-lg px-3 py-2 text-sm text-destructive transition hover:bg-destructive/10"
        >
          <LogOut className="text-destructive h-4 w-4" />
          Log Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
