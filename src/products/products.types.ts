export interface ProductCategory {
  id: number;
  name: string;
  slug: string;
}

export interface ProductImage {
  id: number;
  url: string;
  is_primary: boolean;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  sale_price: number | null;
  final_price: number;
  stock_quantity: number;
  is_in_stock: boolean;
  category: ProductCategory;
  images: ProductImage[];
  primary_image: string;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductsListResponse {
  data: Product[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface ProductDetailResponse {
  data: Product;
}
