import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center leading-none", className)}>
      <span className="font-serif text-2xl font-semibold tracking-[0.35em] text-[#D6B779]">
        DRUIDS
      </span>
      <span className="mt-1 text-[0.6rem] tracking-[0.6em] text-[#B8B2C5]">
        LOUNGE
      </span>
    </div>
  );
}