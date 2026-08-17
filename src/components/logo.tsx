import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({ className, height = 28 }: { className?: string; height?: number }) {
  return (
    <Image
      src="/logo.png"
      alt="Cybaethrex"
      width={Math.round((416 / 89) * height)}
      height={height}
      className={cn("select-none", className)}
      priority
    />
  );
}
