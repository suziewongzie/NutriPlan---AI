import React, { useState } from 'react';
import { UserFormData, NutritionPlanResponse, MealItem } from './types';
import { generateMealPlan, getAlternativeMeal } from './services/geminiService';
import InputForm from './components/InputForm';
import PlanDisplay from './components/PlanDisplay';
import { Leaf, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [plan, setPlan] = useState<NutritionPlanResponse | null>(null);
  const [currentFormData, setCurrentFormData] = useState<UserFormData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFormSubmit = async (data: UserFormData) => {
    setLoading(true);
    setError(null);
    setCurrentFormData(data);
    try {
      const result = await generateMealPlan(data);
      setPlan(result);
    } catch (err: any) {
      setError("We encountered an issue connecting to our nutritionist AI. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPlan(null);
    setError(null);
    setCurrentFormData(null);
  };

  const handleSwapMeal = async (
    dayIndex: number, 
    mealGroupIndex: number, 
    itemIndex: number, 
    currentItem: MealItem, 
    mealType: string
  ) => {
    if (!plan || !currentFormData) return;

    try {
      // Fetch new meal
      const newMeal = await getAlternativeMeal(currentFormData, currentItem, mealType);
      
      // Deep copy plan to update state immutably
      const newPlan = JSON.parse(JSON.stringify(plan)) as NutritionPlanResponse;
      
      // Update the specific item
      newPlan.days[dayIndex].meals[mealGroupIndex].items[itemIndex] = newMeal;
      
      // Recalculate daily totals (simplistic update, ideally we'd sum all items again)
      const day = newPlan.days[dayIndex];
      let newTotalCals = 0;
      let newProtein = 0;
      let newCarbs = 0;
      let newFats = 0;

      day.meals.forEach(group => {
        group.items.forEach(item => {
          newTotalCals += item.calories;
          newProtein += item.macros.protein;
          newCarbs += item.macros.carbs;
          newFats += item.macros.fats;
        });
      });

      day.totalCalories = Math.round(newTotalCals);
      day.dailyMacros = {
        protein: Math.round(newProtein),
        carbs: Math.round(newCarbs),
        fats: Math.round(newFats)
      };

      setPlan(newPlan);
    } catch (err) {
      console.error("Failed to swap meal", err);
      // Optional: Show a toast error
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={handleReset}>
            <div className="bg-emerald-500 p-1.5 rounded-lg text-white">
               <Leaf className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-700">
              NutriPlan Safe
            </span>
          </div>
          <div className="text-xs text-slate-400 font-medium">
            AI-Powered Nutrition
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 animate-in fade-in duration-500">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-200 rounded-full blur-xl opacity-50 animate-pulse"></div>
              <div className="bg-white p-4 rounded-full shadow-lg relative">
                 <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-slate-700">Crafting your perfect plan...</h2>
            <p className="text-slate-500 text-sm max-w-md text-center">
              Analyzing your profile, checking nutritional balance, and generating recipes.
            </p>
          </div>
        ) : error ? (
           <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-4">
             <div className="bg-red-50 p-6 rounded-2xl border border-red-100 max-w-md text-center">
               <h3 className="text-red-700 font-semibold mb-2">Oops! Something went wrong.</h3>
               <p className="text-red-600/80 text-sm mb-4">{error}</p>
               <button onClick={() => setError(null)} className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition">
                 Try Again
               </button>
             </div>
           </div>
        ) : !plan ? (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-10">
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
                Your Personal <span className="text-emerald-600">Dietitian</span>
              </h1>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Generate safe, balanced, and customized meal plans in seconds. 
                Whether you're halal, vegan, or just trying to eat better—we've got you covered.
              </p>
            </div>
            <InputForm onSubmit={handleFormSubmit} isLoading={loading} />
          </div>
        ) : (
          <PlanDisplay 
            plan={plan} 
            onReset={handleReset} 
            onSwapMeal={handleSwapMeal}
          />
        )}

      </main>

      <footer className="py-8 text-center text-slate-400 text-sm">
        <p>&copy; {new Date().getFullYear()} NutriPlan Safe. Not medical advice.</p>
      </footer>
    </div>
  );
};

export default App;