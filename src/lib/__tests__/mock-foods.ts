import { BaseFood, FoodSource } from '@/types/food';

// Generic mock food data for multiple sources
export const mockFoods: BaseFood[] = [
  // User custom foods
  {
    id: 1,
    sourceId: 'custom_001',
    sourceType: 'user_custom',
    name: 'Homemade Protein Shake',
    brandName: null,
    servingQty: 1,
    servingUnit: 'cup',
    servingWeightGrams: 250,
    calories: 250,
    protein: 25,
    carbs: 10,
    fat: 5,
    fiber: 2,
    sugar: 3,
    sodium: 150,
    photoUrl: null,
    upc: null,
    metadata: { isPublic: false, userCreated: true },
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z')
  },
  {
    id: 2,
    sourceId: 'custom_002', 
    sourceType: 'user_custom',
    name: 'Greek Salad',
    brandName: null,
    servingQty: 1,
    servingUnit: 'bowl',
    servingWeightGrams: 200,
    calories: 150,
    protein: 5,
    carbs: 12,
    fat: 8,
    fiber: 4,
    sugar: 3,
    sodium: 200,
    photoUrl: null,
    upc: null,
    metadata: { isPublic: false, userCreated: true },
    createdAt: new Date('2024-01-02T00:00:00.000Z'),
    updatedAt: new Date('2024-01-02T00:00:00.000Z')
  },

  // Database/USDA foods
  {
    id: 3,
    sourceId: 'usda_001',
    sourceType: 'usda',
    name: 'Raw Spinach',
    brandName: 'USDA',
    servingQty: 100,
    servingUnit: 'g',
    servingWeightGrams: 100,
    calories: 23,
    protein: 2.9,
    carbs: 3.6,
    fat: 0.4,
    fiber: 2.2,
    sugar: 0.4,
    sodium: 79,
    photoUrl: null,
    upc: null,
    metadata: { ndbNo: 10162, verifiedBy: 'USDA' },
    createdAt: new Date('2024-01-15T00:00:00.000Z'),
    updatedAt: new Date('2024-01-15T00:00:00.000Z')
  },
  // Manual entry foods
  {
    id: 4,
    sourceId: 'manual_001',
    sourceType: 'manual',
    name: 'Energy Bar',
    brandName: 'Custom Brand',
    servingQty: 1,
    servingUnit: 'bar',
    servingWeightGrams: 68,
    calories: 300,
    protein: 15,
    carbs: 45,
    fat: 10,
    fiber: 5,
    sugar: 25,
    sodium: 200,
    photoUrl: null,
    upc: '123456789012',
    metadata: { barcodeScanned: true, customEntry: true },
    createdAt: new Date('2024-02-01T00:00:00.000Z'),
    updatedAt: new Date('2024-02-01T00:00:00.000Z')
  },

  // Nutritionix foods (still can coexist)
  {
    id: 5,
    sourceId: 'nix_item_001',
    sourceType: 'nutritionix',
    name: 'Chicken Breast',
    brandName: 'Generic',
    servingQty: 100,
    servingUnit: 'g',
    servingWeightGrams: 100,
    calories: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
    fiber: 0,
    sugar: 0,
    sodium: 74,
    photoUrl: 'https://nix-tag-images.s3.amazonaws.com/common_123.jpg',
    upc: null,
    metadata: { is_raw_food: false },
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z')
  },
  {
    id: 6,
    sourceId: 'nix_item_002',
    sourceType: 'nutritionix',
    name: 'Brown Rice',
    brandName: null,
    servingQty: 1,
    servingUnit: 'cup',
    servingWeightGrams: 195,
    calories: 216,
    protein: 4.5,
    carbs: 45,
    fat: 1.8,
    fiber: 3.5,
    sugar: 0.7,
    sodium: 5,
    photoUrl: 'https://nix-tag-images.s3.amazonaws.com/common_456.jpg',
    upc: null,
    metadata: { is_raw_food: false },
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z')
  }
];

// Search mock that returns different sources
export const mockFoodSearch = {
  // Common foods (USDA + user custom)
  common: [
    {
      food_name: 'Raw Spinach',
      tag_id: 10162,
      serving_unit: '100g',
      photo: {
        thumb: 'https://nix-tag-images.s3.amazonaws.com/common_10162.jpg'
      }
    },
    {
      food_name: 'Greek Salad', 
      tag_id: 'custom_001',
      serving_unit: 'bowl',
      photo: {
        thumb: null
      }
    }
  ],
  // Branded products
  branded: [
    {
      food_name: 'Energy Bar',
      brand_name: 'Custom Brand',
      nix_brand_id: 'brand_001',
      nix_item_id: 'manual_001',
      nix_item_name: 'Energy Bar',
      serving_qty: 1,
      serving_unit: 'bar',
      tag_id: 'custom_001',
      photo: {
        thumb: null
      }
    },
    {
      food_name: 'Chicken Breast',
      brand_name: 'Generic',
      nix_brand_id: 'brand_002',
      nix_item_id: 'nix_item_001',
      nix_item_name: 'Chicken Breast',
      serving_qty: 100,
      serving_unit: 'g',
      tag_id: 123,
      photo: {
        thumb: 'https://nix-tag-images.s3.amazonaws.com/common_123.jpg'
      }
    }
  ]
};