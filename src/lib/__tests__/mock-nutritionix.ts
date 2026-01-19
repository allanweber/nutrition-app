import { InstantSearchResponse, NaturalLanguageResponse, NutritionixFood } from '@/types/nutritionix';

// Helper to create a search result entry
function createSearchEntry(food_name: string, tag_id: number, serving_unit: string): InstantSearchResponse {
  return {
    branded: [],
    common: [
      {
        food_name,
        tag_id,
        serving_unit,
        locale: "en_US",
        photo: {
          thumb: `https://nix-tag-images.s3.amazonaws.com/common_${tag_id}.jpg`
        }
      }
    ]
  };
}

// Helper to create a nutrient data entry
function createNutrientEntry(
  id: number,
  food_name: string,
  serving_qty: number,
  serving_unit: string,
  serving_weight_grams: number,
  calories: number,
  protein: number,
  carbs: number,
  fat: number,
  fiber: number,
  sugar: number,
  sodium: number,
  saturated_fat: number = 0,
  cholesterol: number = 0,
  potassium: number = 0
): NaturalLanguageResponse {
  return {
    foods: [
      {
        food_name,
        serving_qty,
        serving_unit,
        serving_weight_grams,
        nf_calories: calories,
        nf_protein: protein,
        nf_total_carbohydrate: carbs,
        nf_total_fat: fat,
        nf_dietary_fiber: fiber,
        nf_sugars: sugar,
        nf_sodium: sodium,
        nf_saturated_fat: saturated_fat,
        nf_cholesterol: cholesterol,
        nf_potassium: potassium,
        nf_p: 0,
        nix_item_id: id.toString(),
        brand_name: null,
        photo: {
          thumb: `https://nix-tag-images.s3.amazonaws.com/common_${id}.jpg`,
          highres: `https://nix-tag-images.s3.amazonaws.com/common_${id}.jpg`,
          is_user_uploaded: false
        },
        upc: null,
        consumed_at: new Date().toISOString(),
        metadata: { is_raw_food: false },
        source: 1,
        ndb_no: id,
        tags: { item: food_name.toLowerCase(), measure: null, quantity: serving_qty.toString(), food_group: 1, tag_id: id },
        alt_measures: [],
        meal_type: 0,
        sub_recipe: null,
        class_code: null,
        brick_code: null,
        full_nutrients: []
      } as NutritionixFood
    ]
  };
}

// ============================================================================
// MOCK SEARCH RESULTS
// ============================================================================
export const mockSearchResults: Record<string, InstantSearchResponse> = {
  // === PROTEINS - Poultry ===
  "chicken": createSearchEntry("Chicken Breast", 1, "4 oz"),
  "chicken breast": createSearchEntry("Chicken Breast", 1, "4 oz"),
  "chicken thigh": createSearchEntry("Chicken Thigh", 2, "4 oz"),
  "ground chicken": createSearchEntry("Ground Chicken", 3, "4 oz"),
  "turkey": createSearchEntry("Turkey Breast", 4, "4 oz"),
  "turkey breast": createSearchEntry("Turkey Breast", 4, "4 oz"),
  "ground turkey": createSearchEntry("Ground Turkey (93% lean)", 5, "4 oz"),

  // === PROTEINS - Beef ===
  "beef": createSearchEntry("Beef Sirloin", 10, "4 oz"),
  "steak": createSearchEntry("Beef Sirloin Steak", 10, "6 oz"),
  "sirloin": createSearchEntry("Beef Sirloin", 10, "4 oz"),
  "ground beef": createSearchEntry("Ground Beef (90% lean)", 11, "4 oz"),
  "lean ground beef": createSearchEntry("Ground Beef (93% lean)", 12, "4 oz"),
  "flank steak": createSearchEntry("Flank Steak", 13, "4 oz"),
  "ribeye": createSearchEntry("Ribeye Steak", 14, "6 oz"),
  "filet mignon": createSearchEntry("Filet Mignon", 15, "6 oz"),
  "beef tenderloin": createSearchEntry("Beef Tenderloin", 15, "4 oz"),
  "roast beef": createSearchEntry("Roast Beef", 16, "3 oz"),
  "beef jerky": createSearchEntry("Beef Jerky", 17, "1 oz"),

  // === PROTEINS - Pork ===
  "pork": createSearchEntry("Pork Tenderloin", 20, "4 oz"),
  "pork tenderloin": createSearchEntry("Pork Tenderloin", 20, "4 oz"),
  "pork chop": createSearchEntry("Pork Chop", 21, "4 oz"),
  "bacon": createSearchEntry("Bacon", 22, "2 slices"),
  "turkey bacon": createSearchEntry("Turkey Bacon", 23, "2 slices"),
  "ham": createSearchEntry("Ham", 24, "3 oz"),
  "canadian bacon": createSearchEntry("Canadian Bacon", 25, "2 oz"),

  // === PROTEINS - Fish & Seafood ===
  "salmon": createSearchEntry("Atlantic Salmon", 30, "4 oz"),
  "tuna": createSearchEntry("Tuna", 31, "4 oz"),
  "tuna steak": createSearchEntry("Tuna Steak", 31, "4 oz"),
  "canned tuna": createSearchEntry("Canned Tuna in Water", 32, "1 can (5 oz)"),
  "tilapia": createSearchEntry("Tilapia", 33, "4 oz"),
  "cod": createSearchEntry("Cod", 34, "4 oz"),
  "shrimp": createSearchEntry("Shrimp", 35, "4 oz"),
  "crab": createSearchEntry("Crab Meat", 36, "4 oz"),
  "lobster": createSearchEntry("Lobster", 37, "4 oz"),
  "scallops": createSearchEntry("Scallops", 38, "4 oz"),
  "sardines": createSearchEntry("Sardines", 39, "1 can (3.75 oz)"),
  "mackerel": createSearchEntry("Mackerel", 40, "4 oz"),
  "trout": createSearchEntry("Rainbow Trout", 41, "4 oz"),
  "halibut": createSearchEntry("Halibut", 42, "4 oz"),
  "mahi mahi": createSearchEntry("Mahi Mahi", 43, "4 oz"),
  "sea bass": createSearchEntry("Sea Bass", 44, "4 oz"),

  // === PROTEINS - Eggs & Dairy ===
  "egg": createSearchEntry("Whole Egg", 50, "1 large"),
  "eggs": createSearchEntry("Whole Eggs", 50, "1 large"),
  "egg white": createSearchEntry("Egg Whites", 51, "1 large"),
  "egg whites": createSearchEntry("Egg Whites", 51, "3 large"),
  "greek yogurt": createSearchEntry("Greek Yogurt (Plain, Nonfat)", 52, "1 cup"),
  "cottage cheese": createSearchEntry("Cottage Cheese (Low Fat)", 53, "1 cup"),
  "milk": createSearchEntry("Milk (2%)", 54, "1 cup"),
  "skim milk": createSearchEntry("Skim Milk", 55, "1 cup"),
  "whole milk": createSearchEntry("Whole Milk", 56, "1 cup"),
  "cheese": createSearchEntry("Cheddar Cheese", 57, "1 oz"),
  "cheddar cheese": createSearchEntry("Cheddar Cheese", 57, "1 oz"),
  "mozzarella": createSearchEntry("Mozzarella Cheese", 58, "1 oz"),
  "parmesan": createSearchEntry("Parmesan Cheese", 59, "1 oz"),
  "feta cheese": createSearchEntry("Feta Cheese", 60, "1 oz"),
  "cream cheese": createSearchEntry("Cream Cheese", 61, "1 oz"),
  "string cheese": createSearchEntry("String Cheese", 62, "1 stick"),

  // === PROTEINS - Plant-Based ===
  "tofu": createSearchEntry("Tofu (Firm)", 70, "4 oz"),
  "tempeh": createSearchEntry("Tempeh", 71, "4 oz"),
  "edamame": createSearchEntry("Edamame", 72, "1 cup"),
  "seitan": createSearchEntry("Seitan", 73, "4 oz"),
  "black beans": createSearchEntry("Black Beans", 74, "1 cup cooked"),
  "kidney beans": createSearchEntry("Kidney Beans", 75, "1 cup cooked"),
  "chickpeas": createSearchEntry("Chickpeas", 76, "1 cup cooked"),
  "lentils": createSearchEntry("Lentils", 77, "1 cup cooked"),
  "pinto beans": createSearchEntry("Pinto Beans", 78, "1 cup cooked"),
  "navy beans": createSearchEntry("Navy Beans", 79, "1 cup cooked"),

  // === CARBS - Grains & Rice ===
  "rice": createSearchEntry("White Rice", 100, "1 cup cooked"),
  "white rice": createSearchEntry("White Rice", 100, "1 cup cooked"),
  "brown rice": createSearchEntry("Brown Rice", 101, "1 cup cooked"),
  "jasmine rice": createSearchEntry("Jasmine Rice", 102, "1 cup cooked"),
  "basmati rice": createSearchEntry("Basmati Rice", 103, "1 cup cooked"),
  "wild rice": createSearchEntry("Wild Rice", 104, "1 cup cooked"),
  "quinoa": createSearchEntry("Quinoa", 105, "1 cup cooked"),
  "oatmeal": createSearchEntry("Oatmeal", 106, "1 cup cooked"),
  "oats": createSearchEntry("Rolled Oats", 107, "1/2 cup dry"),
  "steel cut oats": createSearchEntry("Steel Cut Oats", 108, "1/4 cup dry"),
  "cream of wheat": createSearchEntry("Cream of Wheat", 109, "1 cup cooked"),
  "grits": createSearchEntry("Grits", 110, "1 cup cooked"),
  "couscous": createSearchEntry("Couscous", 111, "1 cup cooked"),
  "bulgur": createSearchEntry("Bulgur", 112, "1 cup cooked"),
  "farro": createSearchEntry("Farro", 113, "1 cup cooked"),
  "barley": createSearchEntry("Barley", 114, "1 cup cooked"),

  // === CARBS - Bread & Pasta ===
  "bread": createSearchEntry("Whole Wheat Bread", 120, "1 slice"),
  "whole wheat bread": createSearchEntry("Whole Wheat Bread", 120, "1 slice"),
  "white bread": createSearchEntry("White Bread", 121, "1 slice"),
  "ezekiel bread": createSearchEntry("Ezekiel Bread", 122, "1 slice"),
  "sourdough": createSearchEntry("Sourdough Bread", 123, "1 slice"),
  "bagel": createSearchEntry("Bagel", 124, "1 medium"),
  "english muffin": createSearchEntry("English Muffin", 125, "1 muffin"),
  "tortilla": createSearchEntry("Flour Tortilla", 126, "1 medium"),
  "whole wheat tortilla": createSearchEntry("Whole Wheat Tortilla", 127, "1 medium"),
  "pita": createSearchEntry("Pita Bread", 128, "1 large"),
  "pasta": createSearchEntry("Pasta", 130, "2 oz dry"),
  "spaghetti": createSearchEntry("Spaghetti", 131, "2 oz dry"),
  "whole wheat pasta": createSearchEntry("Whole Wheat Pasta", 132, "2 oz dry"),
  "penne": createSearchEntry("Penne Pasta", 133, "2 oz dry"),
  "rice noodles": createSearchEntry("Rice Noodles", 134, "2 oz dry"),

  // === CARBS - Potatoes & Starchy Vegetables ===
  "potato": createSearchEntry("Potato", 140, "1 medium"),
  "baked potato": createSearchEntry("Baked Potato", 140, "1 medium"),
  "sweet potato": createSearchEntry("Sweet Potato", 141, "1 medium"),
  "yam": createSearchEntry("Yam", 142, "1 cup cubed"),
  "red potato": createSearchEntry("Red Potato", 143, "1 medium"),
  "russet potato": createSearchEntry("Russet Potato", 144, "1 medium"),
  "mashed potatoes": createSearchEntry("Mashed Potatoes", 145, "1 cup"),
  "hash browns": createSearchEntry("Hash Browns", 146, "1 cup"),
  "french fries": createSearchEntry("French Fries", 147, "medium serving"),
  "corn": createSearchEntry("Corn", 148, "1 cup"),
  "peas": createSearchEntry("Green Peas", 149, "1 cup"),
  "butternut squash": createSearchEntry("Butternut Squash", 150, "1 cup cubed"),

  // === VEGETABLES ===
  "broccoli": createSearchEntry("Broccoli", 160, "1 cup"),
  "spinach": createSearchEntry("Spinach", 161, "1 cup raw"),
  "kale": createSearchEntry("Kale", 162, "1 cup"),
  "asparagus": createSearchEntry("Asparagus", 163, "6 spears"),
  "green beans": createSearchEntry("Green Beans", 164, "1 cup"),
  "brussels sprouts": createSearchEntry("Brussels Sprouts", 165, "1 cup"),
  "cauliflower": createSearchEntry("Cauliflower", 166, "1 cup"),
  "zucchini": createSearchEntry("Zucchini", 167, "1 medium"),
  "cucumber": createSearchEntry("Cucumber", 168, "1 medium"),
  "bell pepper": createSearchEntry("Bell Pepper", 169, "1 medium"),
  "tomato": createSearchEntry("Tomato", 170, "1 medium"),
  "carrot": createSearchEntry("Carrot", 171, "1 medium"),
  "carrots": createSearchEntry("Carrots", 171, "1 cup"),
  "celery": createSearchEntry("Celery", 172, "2 stalks"),
  "onion": createSearchEntry("Onion", 173, "1 medium"),
  "garlic": createSearchEntry("Garlic", 174, "3 cloves"),
  "mushrooms": createSearchEntry("Mushrooms", 175, "1 cup sliced"),
  "lettuce": createSearchEntry("Lettuce (Romaine)", 176, "1 cup"),
  "cabbage": createSearchEntry("Cabbage", 177, "1 cup shredded"),
  "bok choy": createSearchEntry("Bok Choy", 178, "1 cup"),
  "eggplant": createSearchEntry("Eggplant", 179, "1 cup"),
  "artichoke": createSearchEntry("Artichoke", 180, "1 medium"),
  "beets": createSearchEntry("Beets", 181, "1 cup"),
  "radish": createSearchEntry("Radish", 182, "1 cup"),
  "snap peas": createSearchEntry("Sugar Snap Peas", 183, "1 cup"),

  // === FRUITS ===
  "apple": createSearchEntry("Apple", 200, "1 medium"),
  "banana": createSearchEntry("Banana", 201, "1 medium"),
  "orange": createSearchEntry("Orange", 202, "1 medium"),
  "strawberries": createSearchEntry("Strawberries", 203, "1 cup"),
  "blueberries": createSearchEntry("Blueberries", 204, "1 cup"),
  "raspberries": createSearchEntry("Raspberries", 205, "1 cup"),
  "blackberries": createSearchEntry("Blackberries", 206, "1 cup"),
  "grapes": createSearchEntry("Grapes", 207, "1 cup"),
  "watermelon": createSearchEntry("Watermelon", 208, "1 cup diced"),
  "cantaloupe": createSearchEntry("Cantaloupe", 209, "1 cup diced"),
  "honeydew": createSearchEntry("Honeydew", 210, "1 cup diced"),
  "pineapple": createSearchEntry("Pineapple", 211, "1 cup"),
  "mango": createSearchEntry("Mango", 212, "1 cup"),
  "papaya": createSearchEntry("Papaya", 213, "1 cup"),
  "kiwi": createSearchEntry("Kiwi", 214, "1 medium"),
  "peach": createSearchEntry("Peach", 215, "1 medium"),
  "pear": createSearchEntry("Pear", 216, "1 medium"),
  "plum": createSearchEntry("Plum", 217, "1 medium"),
  "cherries": createSearchEntry("Cherries", 218, "1 cup"),
  "grapefruit": createSearchEntry("Grapefruit", 219, "1/2 medium"),
  "avocado": createSearchEntry("Avocado", 220, "1/2 medium"),
  "lemon": createSearchEntry("Lemon", 221, "1 medium"),
  "lime": createSearchEntry("Lime", 222, "1 medium"),
  "pomegranate": createSearchEntry("Pomegranate Seeds", 223, "1/2 cup"),
  "dried cranberries": createSearchEntry("Dried Cranberries", 224, "1/4 cup"),
  "raisins": createSearchEntry("Raisins", 225, "1/4 cup"),
  "dates": createSearchEntry("Dates", 226, "2 dates"),
  "prunes": createSearchEntry("Prunes", 227, "5 prunes"),

  // === HEALTHY FATS - Nuts & Seeds ===
  "almonds": createSearchEntry("Almonds", 240, "1 oz (23 nuts)"),
  "walnuts": createSearchEntry("Walnuts", 241, "1 oz"),
  "cashews": createSearchEntry("Cashews", 242, "1 oz"),
  "peanuts": createSearchEntry("Peanuts", 243, "1 oz"),
  "pecans": createSearchEntry("Pecans", 244, "1 oz"),
  "pistachios": createSearchEntry("Pistachios", 245, "1 oz"),
  "macadamia nuts": createSearchEntry("Macadamia Nuts", 246, "1 oz"),
  "brazil nuts": createSearchEntry("Brazil Nuts", 247, "1 oz"),
  "hazelnuts": createSearchEntry("Hazelnuts", 248, "1 oz"),
  "mixed nuts": createSearchEntry("Mixed Nuts", 249, "1 oz"),
  "peanut butter": createSearchEntry("Peanut Butter", 250, "2 tbsp"),
  "almond butter": createSearchEntry("Almond Butter", 251, "2 tbsp"),
  "cashew butter": createSearchEntry("Cashew Butter", 252, "2 tbsp"),
  "sunflower seeds": createSearchEntry("Sunflower Seeds", 253, "1 oz"),
  "pumpkin seeds": createSearchEntry("Pumpkin Seeds", 254, "1 oz"),
  "chia seeds": createSearchEntry("Chia Seeds", 255, "1 oz"),
  "flax seeds": createSearchEntry("Flax Seeds", 256, "1 tbsp"),
  "hemp seeds": createSearchEntry("Hemp Seeds", 257, "3 tbsp"),
  "sesame seeds": createSearchEntry("Sesame Seeds", 258, "1 tbsp"),

  // === HEALTHY FATS - Oils ===
  "olive oil": createSearchEntry("Olive Oil", 260, "1 tbsp"),
  "coconut oil": createSearchEntry("Coconut Oil", 261, "1 tbsp"),
  "avocado oil": createSearchEntry("Avocado Oil", 262, "1 tbsp"),
  "butter": createSearchEntry("Butter", 263, "1 tbsp"),
  "ghee": createSearchEntry("Ghee", 264, "1 tbsp"),
  "mct oil": createSearchEntry("MCT Oil", 265, "1 tbsp"),
  "flaxseed oil": createSearchEntry("Flaxseed Oil", 266, "1 tbsp"),
  "sesame oil": createSearchEntry("Sesame Oil", 267, "1 tbsp"),

  // === SUPPLEMENTS & PROTEIN POWDERS ===
  "whey protein": createSearchEntry("Whey Protein Powder", 280, "1 scoop (30g)"),
  "protein powder": createSearchEntry("Whey Protein Powder", 280, "1 scoop (30g)"),
  "casein protein": createSearchEntry("Casein Protein Powder", 281, "1 scoop (30g)"),
  "plant protein": createSearchEntry("Plant Protein Powder", 282, "1 scoop (30g)"),
  "pea protein": createSearchEntry("Pea Protein Powder", 283, "1 scoop (30g)"),
  "protein bar": createSearchEntry("Protein Bar", 284, "1 bar"),
  "mass gainer": createSearchEntry("Mass Gainer", 285, "1 serving"),
  "creatine": createSearchEntry("Creatine Monohydrate", 286, "5g"),
  "bcaa": createSearchEntry("BCAA Powder", 287, "1 scoop"),
  "pre workout": createSearchEntry("Pre-Workout", 288, "1 scoop"),

  // === BEVERAGES ===
  "water": createSearchEntry("Water", 300, "8 oz"),
  "coffee": createSearchEntry("Coffee (Black)", 301, "8 oz"),
  "green tea": createSearchEntry("Green Tea", 302, "8 oz"),
  "black tea": createSearchEntry("Black Tea", 303, "8 oz"),
  "orange juice": createSearchEntry("Orange Juice", 304, "8 oz"),
  "apple juice": createSearchEntry("Apple Juice", 305, "8 oz"),
  "coconut water": createSearchEntry("Coconut Water", 306, "8 oz"),
  "almond milk": createSearchEntry("Almond Milk (Unsweetened)", 307, "1 cup"),
  "oat milk": createSearchEntry("Oat Milk", 308, "1 cup"),
  "soy milk": createSearchEntry("Soy Milk", 309, "1 cup"),
  "protein shake": createSearchEntry("Protein Shake", 310, "1 shake"),
  "smoothie": createSearchEntry("Fruit Smoothie", 311, "12 oz"),

  // === CONDIMENTS & SAUCES ===
  "honey": createSearchEntry("Honey", 320, "1 tbsp"),
  "maple syrup": createSearchEntry("Maple Syrup", 321, "1 tbsp"),
  "salsa": createSearchEntry("Salsa", 322, "2 tbsp"),
  "hot sauce": createSearchEntry("Hot Sauce", 323, "1 tsp"),
  "soy sauce": createSearchEntry("Soy Sauce", 324, "1 tbsp"),
  "mustard": createSearchEntry("Mustard", 325, "1 tbsp"),
  "ketchup": createSearchEntry("Ketchup", 326, "1 tbsp"),
  "mayonnaise": createSearchEntry("Mayonnaise", 327, "1 tbsp"),
  "hummus": createSearchEntry("Hummus", 328, "2 tbsp"),
  "guacamole": createSearchEntry("Guacamole", 329, "2 tbsp"),
  "ranch dressing": createSearchEntry("Ranch Dressing", 330, "2 tbsp"),
  "balsamic vinegar": createSearchEntry("Balsamic Vinegar", 331, "1 tbsp"),
  "apple cider vinegar": createSearchEntry("Apple Cider Vinegar", 332, "1 tbsp"),
  "teriyaki sauce": createSearchEntry("Teriyaki Sauce", 333, "1 tbsp"),
  "bbq sauce": createSearchEntry("BBQ Sauce", 334, "2 tbsp"),
  "sriracha": createSearchEntry("Sriracha", 335, "1 tsp"),
  "tahini": createSearchEntry("Tahini", 336, "1 tbsp"),
};

// ============================================================================
// MOCK NUTRIENT DATA
// ============================================================================
export const mockNutrientData: Record<string, NaturalLanguageResponse> = {
  // === PROTEINS - Poultry ===
  "chicken": createNutrientEntry(1, "Chicken Breast", 4, "oz", 113, 165, 31, 0, 3.6, 0, 0, 74, 1, 85, 256),
  "chicken breast": createNutrientEntry(1, "Chicken Breast", 4, "oz", 113, 165, 31, 0, 3.6, 0, 0, 74, 1, 85, 256),
  "chicken thigh": createNutrientEntry(2, "Chicken Thigh", 4, "oz", 113, 209, 26, 0, 11, 0, 0, 84, 3, 95, 222),
  "ground chicken": createNutrientEntry(3, "Ground Chicken", 4, "oz", 113, 170, 20, 0, 9.3, 0, 0, 77, 2.5, 80, 190),
  "turkey": createNutrientEntry(4, "Turkey Breast", 4, "oz", 113, 153, 34, 0, 0.8, 0, 0, 54, 0.2, 71, 293),
  "turkey breast": createNutrientEntry(4, "Turkey Breast", 4, "oz", 113, 153, 34, 0, 0.8, 0, 0, 54, 0.2, 71, 293),
  "ground turkey": createNutrientEntry(5, "Ground Turkey (93% lean)", 4, "oz", 113, 170, 21, 0, 9, 0, 0, 88, 2.5, 80, 230),

  // === PROTEINS - Beef ===
  "beef": createNutrientEntry(10, "Beef Sirloin", 4, "oz", 113, 207, 26, 0, 11, 0, 0, 58, 4.3, 76, 350),
  "steak": createNutrientEntry(10, "Beef Sirloin Steak", 6, "oz", 170, 311, 39, 0, 16, 0, 0, 87, 6.5, 114, 525),
  "sirloin": createNutrientEntry(10, "Beef Sirloin", 4, "oz", 113, 207, 26, 0, 11, 0, 0, 58, 4.3, 76, 350),
  "ground beef": createNutrientEntry(11, "Ground Beef (90% lean)", 4, "oz", 113, 199, 23, 0, 11, 0, 0, 75, 4.5, 70, 310),
  "lean ground beef": createNutrientEntry(12, "Ground Beef (93% lean)", 4, "oz", 113, 170, 24, 0, 8, 0, 0, 70, 3.2, 65, 295),
  "flank steak": createNutrientEntry(13, "Flank Steak", 4, "oz", 113, 180, 26, 0, 8, 0, 0, 66, 3.2, 55, 340),
  "ribeye": createNutrientEntry(14, "Ribeye Steak", 6, "oz", 170, 400, 36, 0, 28, 0, 0, 90, 12, 105, 450),
  "filet mignon": createNutrientEntry(15, "Filet Mignon", 6, "oz", 170, 348, 42, 0, 19, 0, 0, 78, 7.5, 126, 510),
  "beef tenderloin": createNutrientEntry(15, "Beef Tenderloin", 4, "oz", 113, 232, 28, 0, 13, 0, 0, 52, 5, 84, 340),
  "roast beef": createNutrientEntry(16, "Roast Beef", 3, "oz", 85, 140, 21, 0, 5.5, 0, 0, 45, 2, 60, 260),
  "beef jerky": createNutrientEntry(17, "Beef Jerky", 1, "oz", 28, 116, 9, 3, 7, 0.4, 3, 590, 3, 14, 169),

  // === PROTEINS - Pork ===
  "pork": createNutrientEntry(20, "Pork Tenderloin", 4, "oz", 113, 136, 24, 0, 4, 0, 0, 55, 1.4, 73, 410),
  "pork tenderloin": createNutrientEntry(20, "Pork Tenderloin", 4, "oz", 113, 136, 24, 0, 4, 0, 0, 55, 1.4, 73, 410),
  "pork chop": createNutrientEntry(21, "Pork Chop", 4, "oz", 113, 197, 27, 0, 9, 0, 0, 60, 3.2, 76, 360),
  "bacon": createNutrientEntry(22, "Bacon", 2, "slices", 16, 86, 6, 0.2, 6.7, 0, 0, 274, 2.2, 18, 67),
  "turkey bacon": createNutrientEntry(23, "Turkey Bacon", 2, "slices", 28, 60, 4, 0.5, 4.5, 0, 0, 366, 1.3, 25, 72),
  "ham": createNutrientEntry(24, "Ham", 3, "oz", 85, 137, 14, 4, 7, 0, 4, 1128, 2.3, 48, 243),
  "canadian bacon": createNutrientEntry(25, "Canadian Bacon", 2, "oz", 56, 68, 9, 1, 3, 0, 1, 554, 1, 27, 181),

  // === PROTEINS - Fish & Seafood ===
  "salmon": createNutrientEntry(30, "Atlantic Salmon", 4, "oz", 113, 233, 25, 0, 14, 0, 0, 59, 3.2, 63, 430),
  "tuna": createNutrientEntry(31, "Tuna Steak", 4, "oz", 113, 147, 33, 0, 1, 0, 0, 50, 0.2, 49, 444),
  "tuna steak": createNutrientEntry(31, "Tuna Steak", 4, "oz", 113, 147, 33, 0, 1, 0, 0, 50, 0.2, 49, 444),
  "canned tuna": createNutrientEntry(32, "Canned Tuna in Water", 1, "can (5 oz)", 142, 140, 32, 0, 1, 0, 0, 400, 0.2, 50, 340),
  "tilapia": createNutrientEntry(33, "Tilapia", 4, "oz", 113, 109, 23, 0, 2, 0, 0, 56, 0.8, 50, 340),
  "cod": createNutrientEntry(34, "Cod", 4, "oz", 113, 93, 20, 0, 0.8, 0, 0, 70, 0.2, 47, 207),
  "shrimp": createNutrientEntry(35, "Shrimp", 4, "oz", 113, 112, 23, 1, 1.2, 0, 0, 190, 0.3, 179, 180),
  "crab": createNutrientEntry(36, "Crab Meat", 4, "oz", 113, 98, 20, 0, 1.3, 0, 0, 340, 0.2, 90, 275),
  "lobster": createNutrientEntry(37, "Lobster", 4, "oz", 113, 102, 21, 0.5, 1, 0, 0, 380, 0.2, 72, 220),
  "scallops": createNutrientEntry(38, "Scallops", 4, "oz", 113, 94, 18, 3, 0.8, 0, 0, 567, 0.1, 37, 333),
  "sardines": createNutrientEntry(39, "Sardines", 1, "can (3.75 oz)", 106, 191, 23, 0, 11, 0, 0, 465, 1.5, 131, 365),
  "mackerel": createNutrientEntry(40, "Mackerel", 4, "oz", 113, 230, 21, 0, 16, 0, 0, 83, 3.7, 64, 341),
  "trout": createNutrientEntry(41, "Rainbow Trout", 4, "oz", 113, 168, 24, 0, 7.5, 0, 0, 36, 1.4, 65, 450),
  "halibut": createNutrientEntry(42, "Halibut", 4, "oz", 113, 124, 24, 0, 2.6, 0, 0, 61, 0.4, 37, 490),
  "mahi mahi": createNutrientEntry(43, "Mahi Mahi", 4, "oz", 113, 109, 24, 0, 0.9, 0, 0, 100, 0.2, 85, 453),
  "sea bass": createNutrientEntry(44, "Sea Bass", 4, "oz", 113, 124, 24, 0, 2.6, 0, 0, 74, 0.7, 53, 279),

  // === PROTEINS - Eggs & Dairy ===
  "egg": createNutrientEntry(50, "Whole Egg", 1, "large", 50, 72, 6, 0.4, 5, 0, 0.2, 71, 1.6, 186, 69),
  "eggs": createNutrientEntry(50, "Whole Eggs", 2, "large", 100, 144, 12, 0.8, 10, 0, 0.4, 142, 3.2, 372, 138),
  "egg white": createNutrientEntry(51, "Egg White", 1, "large", 33, 17, 3.6, 0.2, 0, 0, 0.2, 55, 0, 0, 54),
  "egg whites": createNutrientEntry(51, "Egg Whites", 3, "large", 99, 51, 10.8, 0.6, 0, 0, 0.6, 165, 0, 0, 162),
  "greek yogurt": createNutrientEntry(52, "Greek Yogurt (Plain, Nonfat)", 1, "cup", 245, 130, 23, 8, 0.7, 0, 6, 82, 0.5, 10, 282),
  "cottage cheese": createNutrientEntry(53, "Cottage Cheese (Low Fat)", 1, "cup", 226, 183, 28, 6, 2.5, 0, 6, 918, 1.5, 9, 194),
  "milk": createNutrientEntry(54, "Milk (2%)", 1, "cup", 244, 122, 8, 12, 5, 0, 12, 100, 3, 20, 342),
  "skim milk": createNutrientEntry(55, "Skim Milk", 1, "cup", 245, 83, 8, 12, 0.2, 0, 12, 103, 0.1, 5, 382),
  "whole milk": createNutrientEntry(56, "Whole Milk", 1, "cup", 244, 149, 8, 12, 8, 0, 12, 98, 4.5, 24, 322),
  "cheese": createNutrientEntry(57, "Cheddar Cheese", 1, "oz", 28, 114, 7, 0.4, 9, 0, 0.1, 176, 6, 30, 28),
  "cheddar cheese": createNutrientEntry(57, "Cheddar Cheese", 1, "oz", 28, 114, 7, 0.4, 9, 0, 0.1, 176, 6, 30, 28),
  "mozzarella": createNutrientEntry(58, "Mozzarella Cheese", 1, "oz", 28, 85, 6, 0.6, 6, 0, 0.3, 176, 3.7, 22, 24),
  "parmesan": createNutrientEntry(59, "Parmesan Cheese", 1, "oz", 28, 111, 10, 0.9, 7, 0, 0.2, 449, 4.7, 22, 26),
  "feta cheese": createNutrientEntry(60, "Feta Cheese", 1, "oz", 28, 75, 4, 1.2, 6, 0, 1.1, 316, 4.2, 25, 18),
  "cream cheese": createNutrientEntry(61, "Cream Cheese", 1, "oz", 28, 99, 1.7, 0.8, 10, 0, 0.7, 86, 5.7, 29, 30),
  "string cheese": createNutrientEntry(62, "String Cheese", 1, "stick", 28, 80, 7, 1, 6, 0, 0, 200, 3.5, 20, 20),

  // === PROTEINS - Plant-Based ===
  "tofu": createNutrientEntry(70, "Tofu (Firm)", 4, "oz", 113, 88, 10, 2, 5, 0.5, 0.5, 14, 0.7, 0, 150),
  "tempeh": createNutrientEntry(71, "Tempeh", 4, "oz", 113, 222, 21, 11, 13, 0, 0, 15, 2.5, 0, 410),
  "edamame": createNutrientEntry(72, "Edamame", 1, "cup", 155, 188, 18, 14, 8, 8, 3, 9, 1, 0, 676),
  "seitan": createNutrientEntry(73, "Seitan", 4, "oz", 113, 140, 28, 4, 2, 1, 0, 420, 0.3, 0, 100),
  "black beans": createNutrientEntry(74, "Black Beans", 1, "cup cooked", 172, 227, 15, 41, 0.9, 15, 0.6, 2, 0.2, 0, 611),
  "kidney beans": createNutrientEntry(75, "Kidney Beans", 1, "cup cooked", 177, 225, 15, 40, 0.9, 11, 0.6, 2, 0.1, 0, 717),
  "chickpeas": createNutrientEntry(76, "Chickpeas", 1, "cup cooked", 164, 269, 15, 45, 4, 12, 8, 11, 0.4, 0, 477),
  "lentils": createNutrientEntry(77, "Lentils", 1, "cup cooked", 198, 230, 18, 40, 0.8, 16, 3.6, 4, 0.1, 0, 731),
  "pinto beans": createNutrientEntry(78, "Pinto Beans", 1, "cup cooked", 171, 245, 15, 45, 1.1, 15, 0.6, 2, 0.2, 0, 746),
  "navy beans": createNutrientEntry(79, "Navy Beans", 1, "cup cooked", 182, 255, 15, 47, 1.1, 19, 0.5, 0, 0.1, 0, 708),

  // === CARBS - Grains & Rice ===
  "rice": createNutrientEntry(100, "White Rice", 1, "cup cooked", 158, 206, 4.3, 45, 0.4, 0.6, 0.1, 1, 0.1, 0, 55),
  "white rice": createNutrientEntry(100, "White Rice", 1, "cup cooked", 158, 206, 4.3, 45, 0.4, 0.6, 0.1, 1, 0.1, 0, 55),
  "brown rice": createNutrientEntry(101, "Brown Rice", 1, "cup cooked", 195, 216, 5, 45, 1.8, 3.5, 0.7, 10, 0.4, 0, 84),
  "jasmine rice": createNutrientEntry(102, "Jasmine Rice", 1, "cup cooked", 158, 205, 4.2, 45, 0.4, 0.6, 0.1, 1, 0.1, 0, 55),
  "basmati rice": createNutrientEntry(103, "Basmati Rice", 1, "cup cooked", 163, 210, 4.4, 46, 0.5, 0.6, 0.1, 1, 0.1, 0, 55),
  "wild rice": createNutrientEntry(104, "Wild Rice", 1, "cup cooked", 164, 166, 6.5, 35, 0.6, 3, 1.2, 5, 0.1, 0, 166),
  "quinoa": createNutrientEntry(105, "Quinoa", 1, "cup cooked", 185, 222, 8, 39, 3.6, 5, 1.6, 13, 0.4, 0, 318),
  "oatmeal": createNutrientEntry(106, "Oatmeal", 1, "cup cooked", 234, 166, 6, 28, 3.6, 4, 0.6, 9, 0.6, 0, 164),
  "oats": createNutrientEntry(107, "Rolled Oats", 0.5, "cup dry", 40, 150, 5, 27, 3, 4, 1, 0, 0.5, 0, 140),
  "steel cut oats": createNutrientEntry(108, "Steel Cut Oats", 0.25, "cup dry", 40, 150, 5, 27, 2.5, 4, 0, 0, 0.5, 0, 120),
  "cream of wheat": createNutrientEntry(109, "Cream of Wheat", 1, "cup cooked", 251, 133, 4, 28, 0.5, 1.3, 0, 4, 0.1, 0, 46),
  "grits": createNutrientEntry(110, "Grits", 1, "cup cooked", 242, 143, 3, 31, 0.5, 0.8, 0.2, 5, 0.1, 0, 51),
  "couscous": createNutrientEntry(111, "Couscous", 1, "cup cooked", 157, 176, 6, 36, 0.3, 2, 0.1, 8, 0, 0, 91),
  "bulgur": createNutrientEntry(112, "Bulgur", 1, "cup cooked", 182, 151, 6, 34, 0.4, 8, 0.2, 9, 0.1, 0, 124),
  "farro": createNutrientEntry(113, "Farro", 1, "cup cooked", 170, 220, 8, 47, 1.5, 5, 0, 5, 0.2, 0, 180),
  "barley": createNutrientEntry(114, "Barley", 1, "cup cooked", 157, 193, 4, 44, 0.7, 6, 0.4, 5, 0.1, 0, 146),

  // === CARBS - Bread & Pasta ===
  "bread": createNutrientEntry(120, "Whole Wheat Bread", 1, "slice", 43, 81, 4, 14, 1, 2, 1.4, 146, 0.2, 0, 81),
  "whole wheat bread": createNutrientEntry(120, "Whole Wheat Bread", 1, "slice", 43, 81, 4, 14, 1, 2, 1.4, 146, 0.2, 0, 81),
  "white bread": createNutrientEntry(121, "White Bread", 1, "slice", 29, 77, 2.6, 14, 1, 0.6, 1.5, 142, 0.2, 0, 36),
  "ezekiel bread": createNutrientEntry(122, "Ezekiel Bread", 1, "slice", 34, 80, 4, 15, 0.5, 3, 0, 75, 0, 0, 80),
  "sourdough": createNutrientEntry(123, "Sourdough Bread", 1, "slice", 47, 120, 4, 24, 0.5, 1, 1, 250, 0.1, 0, 40),
  "bagel": createNutrientEntry(124, "Bagel", 1, "medium", 98, 277, 11, 54, 1.4, 2, 5, 478, 0.2, 0, 89),
  "english muffin": createNutrientEntry(125, "English Muffin", 1, "muffin", 57, 134, 4, 26, 1, 2, 2, 264, 0.2, 0, 75),
  "tortilla": createNutrientEntry(126, "Flour Tortilla", 1, "medium", 45, 140, 4, 24, 3, 1, 0.5, 330, 0.8, 0, 50),
  "whole wheat tortilla": createNutrientEntry(127, "Whole Wheat Tortilla", 1, "medium", 45, 120, 4, 20, 3, 3, 0, 300, 0.5, 0, 60),
  "pita": createNutrientEntry(128, "Pita Bread", 1, "large", 64, 170, 6, 35, 0.7, 1, 1, 322, 0.1, 0, 72),
  "pasta": createNutrientEntry(130, "Pasta", 2, "oz dry", 56, 200, 7, 42, 1, 2, 1, 0, 0.2, 0, 80),
  "spaghetti": createNutrientEntry(131, "Spaghetti", 2, "oz dry", 56, 200, 7, 42, 1, 2, 1, 0, 0.2, 0, 80),
  "whole wheat pasta": createNutrientEntry(132, "Whole Wheat Pasta", 2, "oz dry", 56, 180, 8, 39, 1.5, 5, 1, 5, 0.3, 0, 100),
  "penne": createNutrientEntry(133, "Penne Pasta", 2, "oz dry", 56, 200, 7, 42, 1, 2, 1, 0, 0.2, 0, 80),
  "rice noodles": createNutrientEntry(134, "Rice Noodles", 2, "oz dry", 56, 207, 1.8, 46, 0.4, 0.9, 0, 33, 0.1, 0, 7),

  // === CARBS - Potatoes ===
  "potato": createNutrientEntry(140, "Potato", 1, "medium", 173, 161, 4, 37, 0.2, 4, 1.7, 17, 0.1, 0, 926),
  "baked potato": createNutrientEntry(140, "Baked Potato", 1, "medium", 173, 161, 4, 37, 0.2, 4, 1.7, 17, 0.1, 0, 926),
  "sweet potato": createNutrientEntry(141, "Sweet Potato", 1, "medium", 130, 103, 2, 24, 0.1, 4, 7, 41, 0, 0, 438),
  "yam": createNutrientEntry(142, "Yam", 1, "cup cubed", 136, 177, 2.3, 42, 0.3, 6, 0.8, 14, 0.1, 0, 911),
  "red potato": createNutrientEntry(143, "Red Potato", 1, "medium", 170, 154, 4, 34, 0.2, 3, 2, 20, 0.1, 0, 943),
  "russet potato": createNutrientEntry(144, "Russet Potato", 1, "medium", 173, 168, 4.5, 38, 0.2, 3, 1, 10, 0.1, 0, 888),
  "mashed potatoes": createNutrientEntry(145, "Mashed Potatoes", 1, "cup", 210, 174, 4, 37, 1.2, 3, 2, 620, 0.4, 5, 579),
  "hash browns": createNutrientEntry(146, "Hash Browns", 1, "cup", 156, 326, 4, 35, 20, 3, 0.5, 534, 2.8, 0, 565),
  "french fries": createNutrientEntry(147, "French Fries", 1, "medium serving", 117, 365, 4, 48, 17, 4, 0.4, 246, 2.3, 0, 541),
  "corn": createNutrientEntry(148, "Corn", 1, "cup", 164, 132, 5, 29, 1.8, 4, 5, 23, 0.3, 0, 325),
  "peas": createNutrientEntry(149, "Green Peas", 1, "cup", 160, 134, 9, 25, 0.4, 9, 9, 7, 0.1, 0, 354),
  "butternut squash": createNutrientEntry(150, "Butternut Squash", 1, "cup cubed", 205, 82, 2, 22, 0.2, 7, 4, 8, 0, 0, 582),

  // === VEGETABLES ===
  "broccoli": createNutrientEntry(160, "Broccoli", 1, "cup", 91, 31, 2.5, 6, 0.3, 2.4, 1.5, 30, 0.1, 0, 288),
  "spinach": createNutrientEntry(161, "Spinach", 1, "cup raw", 30, 7, 0.9, 1.1, 0.1, 0.7, 0.1, 24, 0, 0, 167),
  "kale": createNutrientEntry(162, "Kale", 1, "cup", 67, 33, 2.2, 6, 0.5, 1.3, 1.6, 25, 0.1, 0, 296),
  "asparagus": createNutrientEntry(163, "Asparagus", 6, "spears", 90, 20, 2.2, 4, 0.1, 1.8, 1.2, 2, 0, 0, 202),
  "green beans": createNutrientEntry(164, "Green Beans", 1, "cup", 100, 31, 1.8, 7, 0.1, 2.7, 3.3, 6, 0, 0, 211),
  "brussels sprouts": createNutrientEntry(165, "Brussels Sprouts", 1, "cup", 88, 38, 3, 8, 0.3, 3.3, 2, 22, 0.1, 0, 342),
  "cauliflower": createNutrientEntry(166, "Cauliflower", 1, "cup", 100, 25, 1.9, 5, 0.3, 2, 1.9, 30, 0, 0, 299),
  "zucchini": createNutrientEntry(167, "Zucchini", 1, "medium", 196, 33, 2.4, 6, 0.6, 2, 5, 16, 0.1, 0, 512),
  "cucumber": createNutrientEntry(168, "Cucumber", 1, "medium", 201, 30, 1.6, 7, 0.2, 1, 3, 4, 0, 0, 293),
  "bell pepper": createNutrientEntry(169, "Bell Pepper", 1, "medium", 119, 31, 1, 6, 0.3, 2, 4, 4, 0, 0, 211),
  "tomato": createNutrientEntry(170, "Tomato", 1, "medium", 123, 22, 1.1, 5, 0.2, 1.5, 3.2, 6, 0, 0, 292),
  "carrot": createNutrientEntry(171, "Carrot", 1, "medium", 61, 25, 0.6, 6, 0.1, 1.7, 2.9, 42, 0, 0, 195),
  "carrots": createNutrientEntry(171, "Carrots", 1, "cup", 128, 52, 1.2, 12, 0.3, 3.6, 6, 88, 0, 0, 410),
  "celery": createNutrientEntry(172, "Celery", 2, "stalks", 80, 13, 0.6, 2.4, 0.1, 1.3, 1.3, 64, 0, 0, 208),
  "onion": createNutrientEntry(173, "Onion", 1, "medium", 110, 44, 1.2, 10, 0.1, 1.9, 4.7, 4, 0, 0, 161),
  "garlic": createNutrientEntry(174, "Garlic", 3, "cloves", 9, 13, 0.6, 3, 0, 0.2, 0.1, 2, 0, 0, 36),
  "mushrooms": createNutrientEntry(175, "Mushrooms", 1, "cup sliced", 70, 15, 2.2, 2.3, 0.2, 0.7, 1.4, 4, 0, 0, 223),
  "lettuce": createNutrientEntry(176, "Lettuce (Romaine)", 1, "cup", 47, 8, 0.6, 1.5, 0.1, 1, 0.6, 4, 0, 0, 116),
  "cabbage": createNutrientEntry(177, "Cabbage", 1, "cup shredded", 89, 22, 1.1, 5, 0.1, 2.2, 2.8, 16, 0, 0, 151),
  "bok choy": createNutrientEntry(178, "Bok Choy", 1, "cup", 70, 9, 1, 1.5, 0.1, 0.7, 0.8, 46, 0, 0, 176),
  "eggplant": createNutrientEntry(179, "Eggplant", 1, "cup", 82, 20, 0.8, 5, 0.2, 2.5, 2, 2, 0, 0, 188),
  "artichoke": createNutrientEntry(180, "Artichoke", 1, "medium", 128, 60, 4.2, 13, 0.2, 6.9, 1.3, 120, 0, 0, 474),
  "beets": createNutrientEntry(181, "Beets", 1, "cup", 136, 59, 2.2, 13, 0.2, 3.8, 9, 106, 0, 0, 442),
  "radish": createNutrientEntry(182, "Radish", 1, "cup", 116, 19, 0.8, 4, 0.1, 1.9, 2.2, 45, 0, 0, 270),
  "snap peas": createNutrientEntry(183, "Sugar Snap Peas", 1, "cup", 63, 26, 1.8, 5, 0.1, 1.6, 2.5, 2, 0, 0, 126),

  // === FRUITS ===
  "apple": createNutrientEntry(200, "Apple", 1, "medium", 182, 95, 0.5, 25, 0.3, 4.4, 19, 2, 0.1, 0, 195),
  "banana": createNutrientEntry(201, "Banana", 1, "medium", 118, 105, 1.3, 27, 0.4, 3.1, 14, 1, 0.1, 0, 422),
  "orange": createNutrientEntry(202, "Orange", 1, "medium", 131, 62, 1.2, 15, 0.2, 3.1, 12, 0, 0, 0, 237),
  "strawberries": createNutrientEntry(203, "Strawberries", 1, "cup", 144, 46, 1, 11, 0.4, 2.9, 7, 1, 0, 0, 220),
  "blueberries": createNutrientEntry(204, "Blueberries", 1, "cup", 148, 84, 1.1, 21, 0.5, 3.6, 15, 1, 0, 0, 114),
  "raspberries": createNutrientEntry(205, "Raspberries", 1, "cup", 123, 64, 1.5, 15, 0.8, 8, 5, 1, 0, 0, 186),
  "blackberries": createNutrientEntry(206, "Blackberries", 1, "cup", 144, 62, 2, 14, 0.7, 7.6, 7, 1, 0, 0, 233),
  "grapes": createNutrientEntry(207, "Grapes", 1, "cup", 151, 104, 1.1, 27, 0.2, 1.4, 23, 3, 0.1, 0, 288),
  "watermelon": createNutrientEntry(208, "Watermelon", 1, "cup diced", 152, 46, 0.9, 12, 0.2, 0.6, 9, 2, 0, 0, 170),
  "cantaloupe": createNutrientEntry(209, "Cantaloupe", 1, "cup diced", 160, 54, 1.3, 13, 0.3, 1.4, 13, 26, 0.1, 0, 427),
  "honeydew": createNutrientEntry(210, "Honeydew", 1, "cup diced", 170, 61, 0.9, 15, 0.2, 1.4, 14, 31, 0, 0, 388),
  "pineapple": createNutrientEntry(211, "Pineapple", 1, "cup", 165, 82, 0.9, 22, 0.2, 2.3, 16, 2, 0, 0, 180),
  "mango": createNutrientEntry(212, "Mango", 1, "cup", 165, 99, 1.4, 25, 0.6, 2.6, 23, 2, 0.1, 0, 277),
  "papaya": createNutrientEntry(213, "Papaya", 1, "cup", 145, 55, 0.9, 14, 0.2, 2.5, 8, 4, 0.1, 0, 264),
  "kiwi": createNutrientEntry(214, "Kiwi", 1, "medium", 69, 42, 0.8, 10, 0.4, 2.1, 6, 2, 0, 0, 215),
  "peach": createNutrientEntry(215, "Peach", 1, "medium", 150, 59, 1.4, 14, 0.4, 2.3, 13, 0, 0, 0, 285),
  "pear": createNutrientEntry(216, "Pear", 1, "medium", 178, 101, 0.6, 27, 0.2, 5.5, 17, 2, 0, 0, 206),
  "plum": createNutrientEntry(217, "Plum", 1, "medium", 66, 30, 0.5, 8, 0.2, 0.9, 7, 0, 0, 0, 104),
  "cherries": createNutrientEntry(218, "Cherries", 1, "cup", 138, 87, 1.5, 22, 0.3, 2.9, 18, 0, 0.1, 0, 306),
  "grapefruit": createNutrientEntry(219, "Grapefruit", 0.5, "medium", 123, 52, 0.9, 13, 0.2, 2, 8, 0, 0, 0, 166),
  "avocado": createNutrientEntry(220, "Avocado", 0.5, "medium", 100, 160, 2, 9, 15, 7, 0.7, 7, 2.1, 0, 485),
  "lemon": createNutrientEntry(221, "Lemon", 1, "medium", 58, 17, 0.6, 5, 0.2, 1.6, 1.5, 1, 0, 0, 80),
  "lime": createNutrientEntry(222, "Lime", 1, "medium", 67, 20, 0.5, 7, 0.1, 1.9, 1.1, 1, 0, 0, 68),
  "pomegranate": createNutrientEntry(223, "Pomegranate Seeds", 0.5, "cup", 87, 72, 1.5, 16, 1, 3.5, 12, 3, 0.1, 0, 205),
  "dried cranberries": createNutrientEntry(224, "Dried Cranberries", 0.25, "cup", 40, 123, 0.1, 33, 0.4, 2, 26, 2, 0, 0, 16),
  "raisins": createNutrientEntry(225, "Raisins", 0.25, "cup", 41, 123, 1, 33, 0.2, 1.6, 26, 4, 0, 0, 309),
  "dates": createNutrientEntry(226, "Dates", 2, "dates", 48, 133, 1.1, 36, 0.1, 3.2, 32, 0, 0, 0, 334),
  "prunes": createNutrientEntry(227, "Prunes", 5, "prunes", 42, 100, 0.9, 26, 0.2, 3, 15, 1, 0, 0, 306),

  // === HEALTHY FATS - Nuts & Seeds ===
  "almonds": createNutrientEntry(240, "Almonds", 1, "oz (23 nuts)", 28, 164, 6, 6, 14, 3.5, 1.2, 0, 1.1, 0, 208),
  "walnuts": createNutrientEntry(241, "Walnuts", 1, "oz", 28, 185, 4.3, 4, 18, 1.9, 0.7, 1, 1.7, 0, 125),
  "cashews": createNutrientEntry(242, "Cashews", 1, "oz", 28, 157, 5, 9, 12, 0.9, 1.7, 3, 2.2, 0, 187),
  "peanuts": createNutrientEntry(243, "Peanuts", 1, "oz", 28, 161, 7, 5, 14, 2.4, 1.3, 5, 1.9, 0, 200),
  "pecans": createNutrientEntry(244, "Pecans", 1, "oz", 28, 196, 2.6, 4, 20, 2.7, 1.1, 0, 1.8, 0, 116),
  "pistachios": createNutrientEntry(245, "Pistachios", 1, "oz", 28, 159, 6, 8, 13, 2.8, 2.2, 0, 1.5, 0, 291),
  "macadamia nuts": createNutrientEntry(246, "Macadamia Nuts", 1, "oz", 28, 204, 2.2, 4, 21, 2.4, 1.3, 1, 3.4, 0, 104),
  "brazil nuts": createNutrientEntry(247, "Brazil Nuts", 1, "oz", 28, 186, 4.1, 3, 19, 2.1, 0.7, 1, 4.3, 0, 187),
  "hazelnuts": createNutrientEntry(248, "Hazelnuts", 1, "oz", 28, 178, 4.2, 5, 17, 2.7, 1.2, 0, 1.3, 0, 193),
  "mixed nuts": createNutrientEntry(249, "Mixed Nuts", 1, "oz", 28, 172, 5, 6, 15, 2, 1.5, 3, 2, 0, 169),
  "peanut butter": createNutrientEntry(250, "Peanut Butter", 2, "tbsp", 32, 188, 8, 6, 16, 1.8, 3, 136, 3.3, 0, 208),
  "almond butter": createNutrientEntry(251, "Almond Butter", 2, "tbsp", 32, 196, 7, 6, 18, 3.4, 2, 2, 1.4, 0, 240),
  "cashew butter": createNutrientEntry(252, "Cashew Butter", 2, "tbsp", 32, 188, 6, 9, 16, 0.9, 2, 4, 3.1, 0, 174),
  "sunflower seeds": createNutrientEntry(253, "Sunflower Seeds", 1, "oz", 28, 165, 5.5, 7, 14, 3, 0.8, 1, 1.5, 0, 226),
  "pumpkin seeds": createNutrientEntry(254, "Pumpkin Seeds", 1, "oz", 28, 151, 7, 5, 13, 1.7, 0.4, 5, 2.4, 0, 229),
  "chia seeds": createNutrientEntry(255, "Chia Seeds", 1, "oz", 28, 137, 4, 12, 9, 10, 0, 5, 0.9, 0, 115),
  "flax seeds": createNutrientEntry(256, "Flax Seeds", 1, "tbsp", 10, 55, 2, 3, 4, 3, 0.2, 3, 0.4, 0, 84),
  "hemp seeds": createNutrientEntry(257, "Hemp Seeds", 3, "tbsp", 30, 166, 10, 2.6, 14.6, 1.2, 0.5, 0, 1.4, 0, 330),
  "sesame seeds": createNutrientEntry(258, "Sesame Seeds", 1, "tbsp", 9, 52, 1.6, 2, 4.5, 1, 0, 1, 0.6, 0, 42),

  // === HEALTHY FATS - Oils ===
  "olive oil": createNutrientEntry(260, "Olive Oil", 1, "tbsp", 14, 119, 0, 0, 14, 0, 0, 0, 1.9, 0, 0),
  "coconut oil": createNutrientEntry(261, "Coconut Oil", 1, "tbsp", 14, 121, 0, 0, 13, 0, 0, 0, 11.2, 0, 0),
  "avocado oil": createNutrientEntry(262, "Avocado Oil", 1, "tbsp", 14, 124, 0, 0, 14, 0, 0, 0, 1.6, 0, 0),
  "butter": createNutrientEntry(263, "Butter", 1, "tbsp", 14, 102, 0.1, 0, 12, 0, 0, 2, 7.3, 31, 3),
  "ghee": createNutrientEntry(264, "Ghee", 1, "tbsp", 14, 123, 0, 0, 14, 0, 0, 0, 8.7, 33, 0),
  "mct oil": createNutrientEntry(265, "MCT Oil", 1, "tbsp", 14, 115, 0, 0, 14, 0, 0, 0, 14, 0, 0),
  "flaxseed oil": createNutrientEntry(266, "Flaxseed Oil", 1, "tbsp", 14, 120, 0, 0, 14, 0, 0, 0, 1.2, 0, 0),
  "sesame oil": createNutrientEntry(267, "Sesame Oil", 1, "tbsp", 14, 120, 0, 0, 14, 0, 0, 0, 2, 0, 0),

  // === SUPPLEMENTS & PROTEIN POWDERS ===
  "whey protein": createNutrientEntry(280, "Whey Protein Powder", 1, "scoop (30g)", 30, 120, 24, 3, 1.5, 0, 1, 50, 0.5, 30, 160),
  "protein powder": createNutrientEntry(280, "Whey Protein Powder", 1, "scoop (30g)", 30, 120, 24, 3, 1.5, 0, 1, 50, 0.5, 30, 160),
  "casein protein": createNutrientEntry(281, "Casein Protein Powder", 1, "scoop (30g)", 30, 120, 24, 3, 1, 0, 1, 50, 0.5, 25, 150),
  "plant protein": createNutrientEntry(282, "Plant Protein Powder", 1, "scoop (30g)", 30, 110, 21, 4, 2, 2, 0, 250, 0.3, 0, 100),
  "pea protein": createNutrientEntry(283, "Pea Protein Powder", 1, "scoop (30g)", 30, 110, 24, 1, 1.5, 0, 0, 330, 0.2, 0, 80),
  "protein bar": createNutrientEntry(284, "Protein Bar", 1, "bar", 60, 200, 20, 22, 7, 3, 5, 200, 2.5, 10, 150),
  "mass gainer": createNutrientEntry(285, "Mass Gainer", 1, "serving", 165, 650, 50, 85, 10, 3, 10, 240, 2, 45, 400),
  "creatine": createNutrientEntry(286, "Creatine Monohydrate", 1, "serving (5g)", 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
  "bcaa": createNutrientEntry(287, "BCAA Powder", 1, "scoop", 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
  "pre workout": createNutrientEntry(288, "Pre-Workout", 1, "scoop", 15, 10, 0, 2, 0, 0, 0, 50, 0, 0, 0),

  // === BEVERAGES ===
  "water": createNutrientEntry(300, "Water", 8, "oz", 240, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
  "coffee": createNutrientEntry(301, "Coffee (Black)", 8, "oz", 240, 2, 0.3, 0, 0, 0, 0, 5, 0, 0, 116),
  "green tea": createNutrientEntry(302, "Green Tea", 8, "oz", 240, 2, 0, 0, 0, 0, 0, 7, 0, 0, 20),
  "black tea": createNutrientEntry(303, "Black Tea", 8, "oz", 240, 2, 0, 0.5, 0, 0, 0, 7, 0, 0, 88),
  "orange juice": createNutrientEntry(304, "Orange Juice", 8, "oz", 240, 112, 1.7, 26, 0.5, 0.5, 21, 2, 0.1, 0, 496),
  "apple juice": createNutrientEntry(305, "Apple Juice", 8, "oz", 240, 114, 0.2, 28, 0.3, 0.5, 24, 10, 0.1, 0, 250),
  "coconut water": createNutrientEntry(306, "Coconut Water", 8, "oz", 240, 46, 1.7, 9, 0.5, 2.6, 6, 252, 0.4, 0, 600),
  "almond milk": createNutrientEntry(307, "Almond Milk (Unsweetened)", 1, "cup", 240, 30, 1, 1, 2.5, 0, 0, 170, 0, 0, 160),
  "oat milk": createNutrientEntry(308, "Oat Milk", 1, "cup", 240, 120, 3, 16, 5, 2, 7, 100, 0.5, 0, 390),
  "soy milk": createNutrientEntry(309, "Soy Milk", 1, "cup", 240, 80, 7, 4, 4, 1, 1, 90, 0.5, 0, 300),
  "protein shake": createNutrientEntry(310, "Protein Shake", 1, "shake", 350, 160, 30, 8, 2, 1, 3, 180, 0.5, 30, 350),
  "smoothie": createNutrientEntry(311, "Fruit Smoothie", 12, "oz", 360, 180, 4, 40, 1, 3, 30, 50, 0.2, 0, 400),

  // === CONDIMENTS & SAUCES ===
  "honey": createNutrientEntry(320, "Honey", 1, "tbsp", 21, 64, 0.1, 17, 0, 0, 17, 1, 0, 0, 11),
  "maple syrup": createNutrientEntry(321, "Maple Syrup", 1, "tbsp", 20, 52, 0, 13, 0, 0, 12, 2, 0, 0, 42),
  "salsa": createNutrientEntry(322, "Salsa", 2, "tbsp", 32, 10, 0.5, 2, 0, 0.5, 1, 230, 0, 0, 95),
  "hot sauce": createNutrientEntry(323, "Hot Sauce", 1, "tsp", 5, 1, 0, 0, 0, 0, 0, 124, 0, 0, 9),
  "soy sauce": createNutrientEntry(324, "Soy Sauce", 1, "tbsp", 16, 9, 1.3, 0.8, 0, 0, 0.1, 902, 0, 0, 38),
  "mustard": createNutrientEntry(325, "Mustard", 1, "tbsp", 15, 9, 0.6, 0.6, 0.5, 0.5, 0, 168, 0, 0, 24),
  "ketchup": createNutrientEntry(326, "Ketchup", 1, "tbsp", 17, 19, 0.2, 5, 0, 0, 4, 154, 0, 0, 57),
  "mayonnaise": createNutrientEntry(327, "Mayonnaise", 1, "tbsp", 14, 94, 0.1, 0.1, 10, 0, 0.1, 88, 1.6, 6, 3),
  "hummus": createNutrientEntry(328, "Hummus", 2, "tbsp", 30, 70, 2, 6, 5, 1, 0, 130, 0.6, 0, 71),
  "guacamole": createNutrientEntry(329, "Guacamole", 2, "tbsp", 30, 50, 0.6, 3, 4.5, 2, 0.3, 120, 0.6, 0, 150),
  "ranch dressing": createNutrientEntry(330, "Ranch Dressing", 2, "tbsp", 30, 129, 0.4, 2, 13, 0.1, 1, 270, 2, 5, 36),
  "balsamic vinegar": createNutrientEntry(331, "Balsamic Vinegar", 1, "tbsp", 16, 14, 0, 3, 0, 0, 2.4, 4, 0, 0, 18),
  "apple cider vinegar": createNutrientEntry(332, "Apple Cider Vinegar", 1, "tbsp", 15, 3, 0, 0.1, 0, 0, 0, 1, 0, 0, 11),
  "teriyaki sauce": createNutrientEntry(333, "Teriyaki Sauce", 1, "tbsp", 18, 16, 1.1, 3, 0, 0, 3, 690, 0, 0, 28),
  "bbq sauce": createNutrientEntry(334, "BBQ Sauce", 2, "tbsp", 36, 52, 0.4, 13, 0.1, 0.3, 10, 349, 0, 0, 70),
  "sriracha": createNutrientEntry(335, "Sriracha", 1, "tsp", 5, 5, 0.1, 1, 0, 0.1, 0.9, 100, 0, 0, 12),
  "tahini": createNutrientEntry(336, "Tahini", 1, "tbsp", 15, 89, 2.6, 3.2, 8, 0.7, 0.2, 17, 1.1, 0, 62),
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getMockSearchResults(query: string): InstantSearchResponse {
  const lowerQuery = query.toLowerCase().trim();
  
  // Exact match
  if (mockSearchResults[lowerQuery]) {
    return mockSearchResults[lowerQuery];
  }

  // Partial matches - collect all matching results
  const commonResults: Array<{ food_name: string; tag_id: number; serving_unit: string; locale: string; photo: { thumb: string } }> = [];
  
  for (const [key, value] of Object.entries(mockSearchResults)) {
    if (key.includes(lowerQuery) || lowerQuery.includes(key)) {
      if (value.common) {
        commonResults.push(...value.common);
      }
    }
  }

  // Remove duplicates based on tag_id
  const seen = new Set<number>();
  const uniqueResults = commonResults.filter(item => {
    if (seen.has(item.tag_id)) return false;
    seen.add(item.tag_id);
    return true;
  });

  if (uniqueResults.length > 0) {
    return { branded: [], common: uniqueResults };
  }

  // Fuzzy search - find items where any word matches
  const queryWords = lowerQuery.split(/\s+/);
  for (const [key, value] of Object.entries(mockSearchResults)) {
    const keyWords = key.split(/\s+/);
    if (queryWords.some(qw => keyWords.some(kw => kw.startsWith(qw) || qw.startsWith(kw)))) {
      if (value.common) {
        commonResults.push(...value.common);
      }
    }
  }

  // Remove duplicates again
  const finalResults = commonResults.filter(item => {
    if (seen.has(item.tag_id)) return false;
    seen.add(item.tag_id);
    return true;
  });

  return { branded: [], common: finalResults };
}

export function getMockNutrientData(query: string): NaturalLanguageResponse {
  const lowerQuery = query.toLowerCase().trim();
  
  // Exact match
  if (mockNutrientData[lowerQuery]) {
    return mockNutrientData[lowerQuery];
  }

  // Partial matches
  for (const [key, value] of Object.entries(mockNutrientData)) {
    if (key.includes(lowerQuery) || lowerQuery.includes(key)) {
      return value;
    }
  }

  // Fuzzy search
  const queryWords = lowerQuery.split(/\s+/);
  for (const [key, value] of Object.entries(mockNutrientData)) {
    const keyWords = key.split(/\s+/);
    if (queryWords.some(qw => keyWords.some(kw => kw.startsWith(qw) || qw.startsWith(kw)))) {
      return value;
    }
  }

  return { foods: [] };
}
