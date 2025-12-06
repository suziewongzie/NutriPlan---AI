import React, { useState, useEffect } from 'react';
import { UserFormData, NutritionPlanResponse, MealItem } from './types';
import { generateMealPlan, getAlternativeMeal } from './services/geminiService';
import InputForm from './components/InputForm';
import PlanDisplay from './components/PlanDisplay';
import MealLogger from './components/MealLogger';
import { Leaf, Loader2, CalendarHeart, PenLine, ArrowRight } from 'lucide-react';

type AppView = 'home' | 'generator' | 'logger';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('home');
  
  // Initialize from LocalStorage if available
  const [plan, setPlan] = useState<NutritionPlanResponse | null>(() => {
    try {
      const savedPlan = localStorage.getItem('userPlan');
      return savedPlan ? JSON.parse(savedPlan) : null;
    } catch (e) {
      console.error("Failed to parse plan from local storage");
      return null;
    }
  });

  const [currentFormData, setCurrentFormData] = useState<UserFormData | null>(() => {
    try {
      const savedData = localStorage.getItem('userFormData');
      return savedData ? JSON.parse(savedData) : null;
    } catch (e) {
      console.error("Failed to parse form data from local storage");
      return null;
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Persistence Effects
  useEffect(() => {
    if (plan) {
      localStorage.setItem('userPlan', JSON.stringify(plan));
    } else {
      localStorage.removeItem('userPlan');
    }
  }, [plan]);

  useEffect(() => {
    if (currentFormData) {
      localStorage.setItem('userFormData', JSON.stringify(currentFormData));
    } else {
      localStorage.removeItem('userFormData');
    }
  }, [currentFormData]);

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

  const handleResetGenerator = () => {
    setPlan(null);
    setError(null);
    setCurrentFormData(null);
    // Explicitly remove from local storage
    localStorage.removeItem('userPlan');
    localStorage.removeItem('userFormData');
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
      const newMeal = await getAlternativeMeal(currentFormData, currentItem, mealType);
      const newPlan = JSON.parse(JSON.stringify(plan)) as NutritionPlanResponse;
      newPlan.days[dayIndex].meals[mealGroupIndex].items[itemIndex] = newMeal;
      
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
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('home')}>
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
        
        {view === 'home' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500 flex flex-col items-center justify-center py-10">
            <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6 text-center tracking-tight">
              Your Personal <span className="text-emerald-600">Health Companion</span>
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto text-center mb-12">
              Choose how you want to manage your nutrition today.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
              
              {/* Option 1: Generator */}
              <div 
                onClick={() => setView('generator')}
                className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 cursor-pointer hover:shadow-2xl hover:border-emerald-200 hover:-translate-y-1 transition-all group"
              >
                <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-100 transition-colors">
                  <CalendarHeart className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-3 group-hover:text-emerald-700 transition-colors">Generate Meal Plan</h3>
                <p className="text-slate-500 mb-6">
                  Create a customized 7-30 day meal plan based on your body metrics, goals, and cuisine preferences.
                </p>
                <div className="flex items-center font-semibold text-emerald-600">
                  {plan ? "View Saved Plan" : "Start Planning"} <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Option 2: Logger */}
              <div 
                onClick={() => setView('logger')}
                className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 cursor-pointer hover:shadow-2xl hover:border-indigo-200 hover:-translate-y-1 transition-all group"
              >
                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-100 transition-colors">
                  <PenLine className="w-8 h-8 text-indigo-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-3 group-hover:text-indigo-700 transition-colors">Track Your Meals</h3>
                <p className="text-slate-500 mb-6">
                  Log your daily intake quickly. Use AI to estimate calories from simple text descriptions.
                </p>
                <div className="flex items-center font-semibold text-indigo-600">
                  Start Logging <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

            </div>
          </div>
        )}

        {view === 'generator' && (
          <>
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
                 <button onClick={() => setView('home')} className="mb-6 text-sm text-slate-400 hover:text-emerald-600 flex items-center gap-1 transition-colors">
                    ← Back to Menu
                 </button>
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-slate-900 mb-2">
                    Meal Plan Generator
                  </h2>
                  <p className="text-slate-600">
                    Tell us about yourself and we'll handle the rest.
                  </p>
                </div>
                <InputForm onSubmit={handleFormSubmit} isLoading={loading} />
              </div>
            ) : (
              <div className="space-y-4">
                <button onClick={() => setView('home')} className="text-sm text-slate-400 hover:text-emerald-600 flex items-center gap-1 transition-colors">
                    ← Back to Menu
                 </button>
                <PlanDisplay 
                  plan={plan} 
                  onReset={handleResetGenerator} 
                  onSwapMeal={handleSwapMeal}
                />
              </div>
            )}
          </>
        )}

        {view === 'logger' && (
          <MealLogger onBack={() => setView('home')} />
        )}

      </main>

      <footer className="py-8 text-center text-slate-400 text-sm">
        <p>&copy; {new Date().getFullYear()} NutriPlan Safe. Not medical advice.</p>
      </footer>
    </div>
  );
};

export default App;