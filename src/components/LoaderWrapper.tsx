import { Loader2Icon } from "lucide-react";

interface LoaderWrapperProps {
  loading: boolean;
  children: React.ReactNode;
}

export default function LoaderWrapper({
  loading: isLoading,
  children,
}: LoaderWrapperProps) {
  if (isLoading) {
    return (
      <>
        <div className="relative w-full [display:inherit]">
          <div className="opacity-0 [display:inherit]">{children}</div>
          <div className="absolute inset-0 flex h-full w-full items-center justify-center">
            <Loader2Icon className="z-[100] animate-spin opacity-100" />
          </div>
        </div>
      </>
    );
  } else {
    return children;
  }
}
