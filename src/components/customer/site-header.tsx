import { Logo } from "@/components/brand/logo";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#100D19]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-md items-center justify-center px-4">
        <Logo />
      </div>
    </header>
  );
}