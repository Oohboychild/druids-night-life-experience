// SAMPLE DATA ONLY: placeholder content until Druids Lounge provides the real menu.
export type FeaturedItem = {
  id: string;
  name: string;
  description: string;
  priceKes: number;
  category: "drink" | "food";
};

export const SAMPLE_FEATURED: FeaturedItem[] = [
  { id: "s1", name: "Sample Cocktail", description: "Placeholder description", priceKes: 800, category: "drink" },
  { id: "s2", name: "Sample Platter", description: "Placeholder description", priceKes: 1500, category: "food" },
  { id: "s3", name: "Sample Bottle Service", description: "Placeholder description", priceKes: 8000, category: "drink" },
];

export const formatKes = (amount: number) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);