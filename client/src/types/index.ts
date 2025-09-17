export interface CartItemInput {
  productId: number;
  quantity: number;
}

export interface CheckoutPayload {
  email: string;
  fullName: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  items: CartItemInput[];
}
