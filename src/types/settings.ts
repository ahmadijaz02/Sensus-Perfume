export interface StoreSettings {
  globalDiscountPercent: number;
  promoCode: string;
  promoDiscountPercent: number;
  promoDiscountMaxAmount?: number;
  deliveryCost: number;
  freeDeliveryEnabled: boolean;
  freeDeliveryMinAmount: number;
  updated_at?: string;
}
