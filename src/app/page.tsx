import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#100D19] p-6 text-white">
      <h1 className="text-4xl font-bold tracking-widest text-[#D6B779]">
        DRUIDS LOUNGE
      </h1>
      <p className="text-[#B8B2C5]">Setup check: Next.js, Tailwind and shadcn/ui are working.</p>
      <Button className="bg-[#A855F7] hover:bg-[#9333EA]">Test button</Button>
    </main>
  );
}