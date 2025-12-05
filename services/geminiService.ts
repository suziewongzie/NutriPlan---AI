import { GoogleGenAI, Type, Schema } from "@google/genai";
import { UserFormData, NutritionPlanResponse, MealItem } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const macroSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    protein: { type: Type.NUMBER, description: "Protein in grams" },
    carbs: { type: Type.NUMBER, description: "Carbohydrates in grams" },
    fats: { type: Type.NUMBER, description: "Fats in grams" },
  },
  required: ["protein", "carbs", "fats"],
};

const mealItemSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    description: { type: Type.STRING },
    calories: { type: Type.NUMBER },
    macros: macroSchema,
    recipeTip: { type: Type.STRING, description: "A helpful cooking tip, flavor variation, or plating suggestion (2-3 sentences)." },
    ingredients: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING }, 
      description: "List of 5-6 main ingredients WITH QUANTITIES/PORTIONS matching the calories (e.g. '150g Chicken Breast', '1 cup Rice')." 
    },
    instructions: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING }, 
      description: "3-4 simplified step-by-step cooking instructions" 
    }
  },
  required: ["name", "description", "calories", "macros", "ingredients", "instructions"],
};

const dayPlanSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    day: { type: Type.STRING, description: "Day 1, Day 2, etc." },
    meals: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, description: "Breakfast, Lunch, Dinner, Snack 1, Snack 2, etc." },
          items: { type: Type.ARRAY, items: mealItemSchema },
        },
        required: ["type", "items"],
      },
    },
    totalCalories: { type: Type.NUMBER },
    dailyMacros: macroSchema,
  },
  required: ["day", "meals", "totalCalories", "dailyMacros"],
};

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    safeCalorieRange: { type: Type.STRING, description: "e.g., '1800-2000 kcal'" },
    summary: { type: Type.STRING, description: "A brief summary of the plan's strategy" },
    days: { type: Type.ARRAY, items: dayPlanSchema },
    shoppingList: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING, description: "Produce, Meat, Pantry, etc." },
          items: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["category", "items"],
      },
    },
  },
  required: ["safeCalorieRange", "summary", "days", "shoppingList"],
};

export const generateMealPlan = async (data: UserFormData): Promise<NutritionPlanResponse> => {
  const modelId = "gemini-2.5-flash"; 

  // Handle 30-day requests by generating a 4-week plan (28 days).
  const isLongDuration = data.duration > 7;
  const durationInstruction = isLongDuration 
    ? "The user requested a 30-day plan. Generate a full 4-week plan (28 days). Label days strictly as 'Day 1' through 'Day 28'."
    : `Create a ${data.duration}-day meal plan.`;

  const prompt = `
    You are a professional nutritionist validating a meal plan.
    User Profile:
    - Age: ${data.age}, Gender: ${data.gender}
    - Height: ${data.height} cm, Weight: ${data.weight} kg
    - Activity: ${data.activityLevel}
    - Calculated BMR: ${data.calculatedBMR || 'N/A'} kcal
    - Calculated Maintenance (TDEE): ${data.calculatedTDEE || 'N/A'} kcal
    - Target Calorie Goal: ${data.targetCalories || 'N/A'} kcal (${data.planGoal === 'deficit' ? 'Safe Deficit' : 'Maintenance'})
    - Diet: ${data.dietaryPreference}
    - Allergies: ${data.allergies || "None"}
    - Main Meals per day: ${data.mealsPerDay} (e.g. Breakfast, Lunch, Dinner)
    - Snacks per day: ${data.includeSnacks ? data.snacksPerDay : '0 (No snacks)'}
    - Cuisine Preference: ${data.cuisinePreference}

    INSTRUCTIONS:
    ${durationInstruction}
    ${data.cuisinePreference === 'Southeast Asian Fusion' ? "The user requested a Southeast Asian focus. Ensure the meal plan includes a diverse variety of authentic dishes from Chinese, Indian, Thai, Indonesian, Vietnamese, and Malay cuisines. Do not repeat the same cuisine for every meal; mix them up." : ""}
    
    IMPORTANT SAFETY GUIDELINES:
    1. STRICTLY ADHERE to the Target Calorie Goal of approx ${data.targetCalories} kcal/day.
    2. Do not promote starvation. If the target is dangerously low (<1200 kcal), default to 1200 and warn the user in the summary.
    3. Ensure adequate protein (>0.8g/kg bodyweight) and balanced macronutrients.
    4. Provide specific recipes/dishes matching the cuisine preference.
    5. Meal Structure: Generate exactly ${data.mealsPerDay} main meals${data.includeSnacks ? ` and ${data.snacksPerDay} snacks` : ''} for each day. Label them clearly.
    6. RECIPE DETAILS: 
       - Ingredients MUST have specific quantities (e.g. "150g Chicken", "1/2 cup Rice") to match the calories.
       - Provide a detailed Chef's Tip or variation for every meal.

    Output the result as a structured JSON object matching the schema.
  `;

  try {
    const result = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        systemInstruction: "You are a professional, safety-conscious nutritionist AI. You generate realistic, balanced meal plans.",
      },
    });

    const text = result.text;
    if (!text) throw new Error("No data returned from Gemini");
    
    return JSON.parse(text) as NutritionPlanResponse;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const getAlternativeMeal = async (
  data: UserFormData, 
  currentMeal: MealItem, 
  mealType: string
): Promise<MealItem> => {
  const modelId = "gemini-2.5-flash";

  const prompt = `
    The user wants to SWAP a specific meal in their plan.
    User Profile:
    - Target Calories: ${data.targetCalories} kcal
    - Diet: ${data.dietaryPreference}
    - Cuisine: ${data.cuisinePreference}
    - Allergies: ${data.allergies || "None"}

    Current Meal to Replace: "${currentMeal.name}" (${currentMeal.calories} kcal).
    Meal Type: ${mealType}

    INSTRUCTION:
    Generate ONE SINGLE alternative meal item that:
    1. Is a distinctively different dish from "${currentMeal.name}".
    2. Has similar calories (within +/- 10%) and balanced macros.
    3. Matches the cuisine preference: ${data.cuisinePreference}.
    4. Is strictly safe and healthy.
    5. Includes ingredients list WITH QUANTITIES and detailed cooking instructions.

    Output JSON matching the MealItem schema.
  `;

  try {
    const result = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: mealItemSchema,
        systemInstruction: "You are a helpful nutritionist finding a meal alternative.",
      },
    });

    const text = result.text;
    if (!text) throw new Error("No data returned from Gemini");

    return JSON.parse(text) as MealItem;
  } catch (error) {
    console.error("Gemini Swap Error:", error);
    throw error;
  }
};