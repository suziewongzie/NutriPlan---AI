export enum ActivityLevel {
  SEDENTARY = 'Sedentary',
  LIGHT = 'Light',
  MODERATE = 'Moderate',
  ACTIVE = 'Active',
  VERY_ACTIVE = 'Very Active'
}

export enum Gender {
  MALE = 'Male',
  FEMALE = 'Female',
  OTHER = 'Other'
}

export interface UserFormData {
  age: number;
  gender: Gender;
  height: number; // cm
  weight: number; // kg
  activityLevel: ActivityLevel;
  dietaryPreference: string;
  allergies: string;
  mealsPerDay: number; // Main meals
  cuisinePreference: string;
  duration: number; // days
  
  // New Calculator Fields
  calculatedBMR?: number;
  calculatedTDEE?: number;
  targetCalories?: number;
  planGoal: 'maintenance' | 'deficit'; // No surplus allowed per requirements
  
  // Snack configuration
  includeSnacks: boolean;
  snacksPerDay: number;
}

export interface MacroNutrients {
  protein: number;
  carbs: number;
  fats: number;
}

export interface MealItem {
  name: string;
  description: string;
  calories: number;
  macros: MacroNutrients;
  recipeTip?: string;
  ingredients?: string[];
  instructions?: string[];
}

export interface DayPlan {
  day: string;
  meals: {
    type: string; // Breakfast, Lunch, etc.
    items: MealItem[];
  }[];
  totalCalories: number;
  dailyMacros: MacroNutrients;
}

export interface NutritionPlanResponse {
  safeCalorieRange: string;
  summary: string;
  days: DayPlan[];
  shoppingList: {
    category: string;
    items: string[];
  }[];
}

export interface FoodLogEntry {
  id: string;
  name: string;
  calories: number;
  macros: MacroNutrients;
  timestamp: string; // ISO string
}