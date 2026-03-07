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
  /** Backend isOpen flag — null means unknown (treated as open) */
  isOpen: boolean | null;
  /** Lowercase concatenation of name + description + menuItem names/categories for filtering */
  _searchText: string;
};
