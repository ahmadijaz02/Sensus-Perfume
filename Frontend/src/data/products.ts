import { Product } from '@/types/product';
import perfumeMen from '@/assets/perfume-men.jpg';
import perfumeUnisex from '@/assets/perfume-unisex.jpg';

export const products: Product[] = [
  {
    id: '1',
    name: 'Alba',
    brand: 'SENSUS PERFUME',
    description: 'A radiant morning fragrance that captures the first light of dawn. Alba opens with crisp bergamot and fresh grapefruit, blooming into a heart of white tea and lavender, before settling into a warm embrace of white musk and cedarwood.',
    shortDescription: 'A radiant fragrance capturing the essence of dawn.',
    category: 'men',
    image: perfumeMen,
    images: [perfumeMen, perfumeMen, perfumeMen],
    variants: [
      { size: '30ml', price: 95 },
      { size: '50ml', price: 145 },
      { size: '100ml', price: 195 },
    ],
    fragranceNotes: [
      { type: 'top', notes: ['Bergamot', 'Grapefruit', 'Green Apple'] },
      { type: 'heart', notes: ['White Tea', 'Lavender', 'Cardamom'] },
      { type: 'base', notes: ['White Musk', 'Cedarwood', 'Ambrette'] },
    ],
    concentration: 'Eau de Parfum',
    featured: true,
    new: true,
    averageRating: 4.8,
    totalReviews: 126,
  },
  {
    id: '2',
    name: 'Fera',
    brand: 'SENSUS PERFUME',
    description: 'An untamed, wild fragrance that embodies raw masculinity. Fera unleashes with fierce black pepper and smoky leather, revealing a heart of dark woods and tobacco, grounded by an animalistic base of oud, benzoin, and musk.',
    shortDescription: 'An untamed fragrance embodying raw masculinity.',
    category: 'men',
    image: perfumeUnisex,
    images: [perfumeUnisex, perfumeUnisex, perfumeUnisex],
    variants: [
      { size: '30ml', price: 120 },
      { size: '50ml', price: 180 },
      { size: '100ml', price: 250 },
    ],
    fragranceNotes: [
      { type: 'top', notes: ['Black Pepper', 'Elemi', 'Juniper'] },
      { type: 'heart', notes: ['Leather', 'Tobacco', 'Dark Woods'] },
      { type: 'base', notes: ['Oud', 'Benzoin', 'Animalic Musk'] },
    ],
    concentration: 'Extrait de Parfum',
    featured: true,
    bestseller: true,
    averageRating: 4.9,
    totalReviews: 204,
  },
  {
    id: '3',
    name: 'Solis',
    brand: 'SENSUS PERFUME',
    description: 'A luminous, solar fragrance that radiates confidence and warmth. Solis bursts open with zesty citrus and aromatic herbs, evolving into a golden heart of saffron and immortelle, resting on a sun-drenched base of amber, sandalwood, and vanilla.',
    shortDescription: 'A luminous solar fragrance radiating confidence.',
    category: 'men',
    image: perfumeMen,
    images: [perfumeMen, perfumeMen, perfumeMen],
    variants: [
      { size: '30ml', price: 110 },
      { size: '50ml', price: 165 },
      { size: '100ml', price: 220 },
    ],
    fragranceNotes: [
      { type: 'top', notes: ['Blood Orange', 'Lemon', 'Basil'] },
      { type: 'heart', notes: ['Saffron', 'Immortelle', 'Neroli'] },
      { type: 'base', notes: ['Amber', 'Sandalwood', 'Vanilla'] },
    ],
    concentration: 'Eau de Parfum',
    featured: true,
    bestseller: true,
    averageRating: 4.7,
    totalReviews: 158,
  },
];

export const getFeaturedProducts = () => products.filter(p => p.featured);
export const getProductsByCategory = (category: string) => 
  category === 'all' ? products : products.filter(p => p.category === category);
export const getProductById = (id: string) => products.find(p => p.id === id);
