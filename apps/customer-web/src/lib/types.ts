export type Category = {
  id: string;
  label: string;
  emoji?: string;
};

export type Restaurant = {
  id: string;
  name: string;
  image: string;
  rating: number;
  ratingCount: number;
  deliveryFee: number;
  etaMin: number;
  tags: string[];
  isFeatured: boolean;
  isRecommended: boolean;
};
