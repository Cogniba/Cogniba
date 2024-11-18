import { useTransition } from "react";
import { CircleArrowUpIcon, CircleUserIcon, LogOutIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSidebar } from "@/context/SidebarContext";
import { cn } from "@/lib/cn";
import { useRouter } from "next/navigation";
import LoaderWrapper from "../LoaderWrapper";
import { Button } from "../ui/button";
import { useToast } from "@/hooks/use-toast";

interface UserButtonProps {
  fullName: string;
  email: string;
}

export default function UserButton({ fullName, email }: UserButtonProps) {
  const { isExpanded, isUserDropdownOpen, setIsUserDropdownOpen } =
    useSidebar();
  const [isSignOutPending, startSignOutTransition] = useTransition();
  const [isUpgradePending, startUpgradeTransition] = useTransition();

  const isPending = isSignOutPending || isUpgradePending;

  const router = useRouter();
  const { toast } = useToast();

  const handleSignOut = () => {
    startSignOutTransition(async () => {
      const response = await fetch("/api/auth/sign-out", { method: "POST" });
      if (response.ok) {
        router.replace(process.env.NEXT_PUBLIC_SITE_URL!);
      }
    });
  };

  const handleUpgrade = () => {
    startUpgradeTransition(async () => {
      const response = await fetch("/api/stripe/checkoutSession", {
        method: "POST",
      });

      if (!response.ok) {
        toast({ title: "Unexpected error ocurred", variant: "destructive" });
      } else {
        const { url } = await response.json();
        window.location.assign(url as string);
      }
    });
  };

  return (
    <DropdownMenu
      open={isUserDropdownOpen}
      onOpenChange={(open) => setIsUserDropdownOpen(open)}
    >
      <DropdownMenuTrigger asChild>
        <div className="w-full">
          <button
            className={cn(
              "group/item relative flex h-12 w-full items-center justify-center rounded-md text-secondary-foreground transition duration-200 hover:bg-secondary hover:shadow-sm group-data-[state=expanded]:w-full group-data-[state=expanded]:justify-start",
              isUserDropdownOpen && "bg-secondary",
            )}
          >
            <div className="absolute left-0 top-0 flex h-12 w-12 items-center justify-center">
              <div className="flex h-7 w-7 items-center justify-center rounded-full">
                <CircleUserIcon className="h-6 w-6 text-secondary-foreground transition duration-200" />
              </div>
            </div>
            <div
              className="absolute left-9 w-40 space-y-0.5 text-left text-base font-medium opacity-0 transition-[opacity,left] group-data-[state=expanded]:left-11 group-data-[state=expanded]:opacity-100"
              aria-hidden={isExpanded || isUserDropdownOpen || undefined}
            >
              <div className="truncate font-medium">{fullName}</div>
              <div className="truncate text-xs font-normal text-muted-foreground transition duration-200">
                {email}
              </div>
            </div>
          </button>
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-[var(--radix-popper-anchor-width)] xs:w-64"
        align="start"
      >
        <DropdownMenuGroup>
          <DropdownMenuItem
            className="font-medium focus:bg-background"
            disabled={isPending}
            onClick={handleUpgrade}
            onSelect={(e) => e.preventDefault()}
          >
            <Button className="w-full gap-1.5 font-semibold">
              <LoaderWrapper loading={isUpgradePending}>
                <CircleArrowUpIcon />
                <span>Upgrade to Pro</span>
              </LoaderWrapper>
            </Button>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            className="font-medium"
            disabled={isPending}
            onClick={handleSignOut}
            onSelect={(e) => e.preventDefault()}
          >
            <LoaderWrapper loading={isSignOutPending}>
              <LogOutIcon className="mr-1" />
              <span>Sign Out</span>
            </LoaderWrapper>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
