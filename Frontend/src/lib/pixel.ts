type PixelEvent =
  | 'PageView'
  | 'ViewContent'
  | 'AddToCart'
  | 'InitiateCheckout'
  | 'Purchase'
  | 'Search'
  | 'Contact';

type PixelData = Record<string, any>;

declare global {
  interface Window {
    fbq: (type: string, eventName: PixelEvent, data?: PixelData) => void;
    _fbq: any;
  }
}

export const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID;

export const init = () => {
  if (typeof window.fbq === 'undefined') {
    console.warn('Meta Pixel not initialized');
  }
};

export const pageview = () => {
  if (typeof window.fbq !== 'undefined') {
    window.fbq('track', 'PageView');
  }
};

export const track = (event: PixelEvent, data?: PixelData) => {
  if (typeof window.fbq !== 'undefined') {
    window.fbq('track', event, data);
  } else {
    console.warn(`Meta Pixel not found, couldn't track ${event}`);
  }
};

export const viewContent = (data: {
  content_ids: string[];
  content_name: string;
  content_type: string;
  value?: number;
  currency?: string;
}) => {
  track('ViewContent', data);
};

export const addToCart = (data: {
  content_ids: string[];
  content_name: string;
  content_type: string;
  value?: number;
  currency?: string;
}) => {
  track('AddToCart', data);
};

export const initiateCheckout = (data: {
  content_ids: string[];
  num_items: number;
  value?: number;
  currency?: string;
}) => {
  track('InitiateCheckout', data);
};

export const purchase = (data: {
  content_ids: string[];
  content_type: string;
  value: number;
  currency: string;
  num_items?: number;
}) => {
  track('Purchase', data);
};

export default {
  init,
  pageview,
  track,
  viewContent,
  addToCart,
  initiateCheckout,
  purchase,
};
