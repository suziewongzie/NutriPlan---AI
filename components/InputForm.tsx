import React, { useState, useEffect, useMemo } from 'react';
import { ActivityLevel, Gender, UserFormData, MealItem } from '../types';
import { Info, Calculator, Flame, Coffee, Wallet, Heart, Utensils } from 'lucide-react';

interface InputFormProps {
  onSubmit: (data: UserFormData) => void;
  isLoading: boolean;
  savedFavorites: MealItem[];
}

const InputForm: React.FC<InputFormProps> = ({ onSubmit, isLoading, savedFavorites }) => {
  const [formData, setFormData] = useState<UserFormData>({
    age: 30,
    gender: Gender.FEMALE,
    height: 170,
    weight: 70,
    activityLevel: ActivityLevel.MODERATE,
    dietaryPreference: 'Normal',
    allergies: '',
    mealsPerDay: 3,
    cuisinePreference: 'Southeast Asian Fusion',
    duration: 3,
    planGoal: 'maintenance',
    includeSnacks: true,
    snacksPerDay: 2,
    budget: 'medium',
    includeFavorites: false
  });

  // --- Step 1: Calculate BMR (Mifflin-St Jeor) ---
  const bmr = useMemo(() => {
    const { weight, height, age, gender } = formData;
    if (!weight || !height || !age) return 0;
    
    let base = (10 * weight) + (6.25 * height) - (5 * age);
    return gender === Gender.MALE ? base + 5 : base - 161;
  }, [formData.weight, formData.height, formData.age, formData.gender]);

  // --- Step 2: Calculate TDEE ---
  const tdee = useMemo(() => {
    const multipliers: Record<ActivityLevel, number> = {
      [ActivityLevel.SEDENTARY]: 1.2,
      [ActivityLevel.LIGHT]: 1.375,
      [ActivityLevel.MODERATE]: 1.55,
      [ActivityLevel.ACTIVE]: 1.725,
      [ActivityLevel.VERY_ACTIVE]: 1.9
    };
    return Math.round(bmr * multipliers[formData.activityLevel]);
  }, [bmr, formData.activityLevel]);

  // --- Step 3: Determine Target Calories ---
  const targetCalories = useMemo(() => {
    if (formData.planGoal === 'deficit') {
      const deficit = tdee - 500;
      return deficit > bmr ? deficit : Math.max(1200, Math.round(tdee * 0.85)); // Safety floor
    }
    return tdee;
  }, [tdee, formData.planGoal, bmr]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    const val = (name === 'age' || name === 'height' || name === 'weight' || name === 'mealsPerDay' || name === 'duration' || name === 'snacksPerDay') 
        ? Number(value) 
        : value;

    setFormData(prev => ({
      ...prev,
      [name]: val
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      calculatedBMR: bmr,
      calculatedTDEE: tdee,
      targetCalories: targetCalories
    });
  };

  const cuisineOptions = [
    "Southeast Asian Fusion",
    "Chinese",
    "Indian", 
    "Thai",
    "Indonesian",
    "Vietnamese",
    "Malay",
    "Filipino",
    "Western",
    "Mixed",
    "Other"
  ];

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl p-6 md:p-8 w-full max-w-5xl mx-auto border border-slate-100">
      <div className="flex items-center gap-2 mb-8 text-emerald-700 bg-emerald-50 p-4 rounded-xl border border-emerald-100">
        <Info className="w-5 h-5 flex-shrink-0" />
        <p className="text-sm font-medium">All plans are estimates using the Mifflin-St Jeor equation. Consult a doctor for medical advice.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        
        {/* Left Column: Stats, Profile & Calculator Input */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-slate-800 border-b pb-3 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-emerald-500" /> 
            Personal Profile
          </h3>
          
          <div className="grid grid-cols-2 gap-5">
             <div>
              <label className="block text-sm font-bold text-slate-600 mb-1.5">Age</label>
              <input type="number" name="age" min="15" max="100" required value={formData.age} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none transition-shadow" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-1.5">Gender</label>
              <select name="gender" value={formData.gender} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white transition-shadow">
                {Object.values(Gender).map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-1.5">Height (cm)</label>
              <input type="number" name="height" min="100" max="250" required value={formData.height} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none transition-shadow" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-1.5">Weight (kg)</label>
              <input type="number" name="weight" min="30" max="300" required value={formData.weight} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none transition-shadow" />
            </div>
          </div>
          
           <div>
            <label className="block text-sm font-bold text-slate-600 mb-1.5">Activity Level</label>
            <select name="activityLevel" value={formData.activityLevel} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none transition-shadow bg-white">
              {Object.values(ActivityLevel).map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <p className="text-xs text-slate-400 mt-1.5 ml-1">
              Used to calculate your daily energy expenditure
            </p>
          </div>

          {/* Calculator Output */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3 mt-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 font-medium">BMR (Basal Metabolic Rate):</span>
              <span className="font-mono font-bold text-slate-600">{Math.round(bmr)} kcal</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 font-medium">TDEE (Maintenance):</span>
              <span className="font-mono font-bold text-slate-800">{tdee} kcal</span>
            </div>
             <div className="border-t border-slate-200 my-2 pt-3">
               <div className="flex justify-between items-center">
                 <span className="text-sm font-bold text-emerald-700">Recommended Target:</span>
                 <span className="text-xl font-extrabold text-emerald-600">{targetCalories} kcal</span>
               </div>
               <p className="text-xs text-emerald-600/70 mt-1 font-medium text-right">Based on {formData.planGoal} goal</p>
             </div>
          </div>
        </div>

        {/* Right Column: Plan Settings & Preferences */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-slate-800 border-b pb-3 flex items-center gap-2">
             <Flame className="w-5 h-5 text-orange-500" />
             Plan Customization
          </h3>

          {/* Diet, Allergies, Cuisine moved to Right Column */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-1.5">Dietary Preference</label>
              <input type="text" name="dietaryPreference" placeholder="e.g. Halal, Vegetarian" required value={formData.dietaryPreference} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none transition-shadow" />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-600 mb-1.5">Allergies</label>
              <input type="text" name="allergies" placeholder="e.g. Peanuts (Optional)" value={formData.allergies} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none transition-shadow" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-600 mb-1.5">Cuisine Style</label>
            <div className="relative">
              <Utensils className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select name="cuisinePreference" value={formData.cuisinePreference} onChange={handleChange} className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none transition-shadow bg-white appearance-none">
                {cuisineOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
             <label className="block text-sm font-bold text-slate-600 mb-2">Nutrition Goal</label>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
               <label className={`flex flex-col p-4 border rounded-2xl cursor-pointer transition-all h-full ${formData.planGoal === 'maintenance' ? 'border-emerald-500 bg-emerald-50/50 shadow-sm ring-1 ring-emerald-500/20' : 'border-slate-200 hover:bg-slate-50'}`}>
                 <div className="flex items-center gap-2 mb-2">
                   <input 
                     type="radio" 
                     name="planGoal" 
                     value="maintenance" 
                     checked={formData.planGoal === 'maintenance'} 
                     onChange={(e) => setFormData({...formData, planGoal: 'maintenance'})}
                     className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                   />
                   <span className="text-sm font-bold text-slate-800">Maintain</span>
                 </div>
                 <p className="text-xs text-slate-500 leading-relaxed">
                   Eat to match your daily energy use. Best for performance & stability.
                 </p>
                 <span className="mt-auto pt-2 text-xs font-bold text-emerald-700">~{tdee} kcal</span>
               </label>
               
               <label className={`flex flex-col p-4 border rounded-2xl cursor-pointer transition-all h-full ${formData.planGoal === 'deficit' ? 'border-emerald-500 bg-emerald-50/50 shadow-sm ring-1 ring-emerald-500/20' : 'border-slate-200 hover:bg-slate-50'}`}>
                 <div className="flex items-center gap-2 mb-2">
                   <input 
                     type="radio" 
                     name="planGoal" 
                     value="deficit" 
                     checked={formData.planGoal === 'deficit'} 
                     onChange={(e) => setFormData({...formData, planGoal: 'deficit'})}
                     className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                   />
                   <span className="text-sm font-bold text-slate-800">Weight Loss</span>
                 </div>
                 <p className="text-xs text-slate-500 leading-relaxed">
                   Moderate deficit (~300-500 kcal) for safe, sustainable fat loss.
                 </p>
                 <span className="mt-auto pt-2 text-xs font-bold text-amber-600">Safe Deficit</span>
               </label>
             </div>
          </div>

          {/* Budget Section */}
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-2">Budget Range</label>
            <div className="grid grid-cols-3 gap-3">
               {(['low', 'medium', 'high'] as const).map((b) => (
                  <button
                   key={b}
                   type="button"
                   onClick={() => setFormData(prev => ({ ...prev, budget: b }))}
                   className={`flex flex-col items-center justify-center py-3 rounded-xl border transition-all ${
                      formData.budget === b 
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500' 
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                   }`}
                 >
                   <span className="font-bold text-lg">{b === 'low' ? '$' : b === 'medium' ? '$$' : '$$$'}</span>
                   <span className="text-[10px] uppercase font-bold tracking-wide mt-1">{b === 'low' ? 'Budget' : b === 'medium' ? 'Standard' : 'Premium'}</span>
                 </button>
               ))}
            </div>
          </div>

           <div className="grid grid-cols-2 gap-5">
             <div>
                <label className="block text-sm font-bold text-slate-600 mb-1.5">Meals / Day</label>
                <select name="mealsPerDay" value={formData.mealsPerDay} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white transition-shadow">
                  {[2, 3, 4].map(n => <option key={n} value={n}>{n} Meals</option>)}
                </select>
             </div>
             <div>
                <label className="block text-sm font-bold text-slate-600 mb-1.5">Plan Duration</label>
                <select name="duration" value={formData.duration} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white transition-shadow">
                  {[1, 3, 5, 7].map(n => <option key={n} value={n}>{n} Days</option>)}
                  <option value={30}>30 Days (4 Weeks)</option>
                </select>
             </div>
           </div>

           {/* Snack Configuration */}
           <div className={`p-4 rounded-xl border transition-all ${formData.includeSnacks ? 'bg-orange-50 border-orange-100' : 'bg-slate-50 border-slate-200'}`}>
             <div className="flex items-center justify-between">
               <label className="flex items-center gap-3 cursor-pointer select-none">
                 <div className="relative">
                   <input 
                     type="checkbox" 
                     className="sr-only peer"
                     checked={formData.includeSnacks}
                     onChange={(e) => setFormData(prev => ({ ...prev, includeSnacks: e.target.checked }))}
                   />
                   <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                 </div>
                 <div className="flex items-center gap-2">
                    <Coffee className={`w-4 h-4 ${formData.includeSnacks ? 'text-orange-500' : 'text-slate-400'}`} />
                    <span className={`text-sm font-bold ${formData.includeSnacks ? 'text-slate-800' : 'text-slate-500'}`}>Include Snacks</span>
                 </div>
               </label>

               {formData.includeSnacks && (
                 <select 
                   name="snacksPerDay" 
                   value={formData.snacksPerDay} 
                   onChange={handleChange}
                   className="text-xs font-bold text-orange-700 bg-white border-orange-200 border rounded-lg px-2 py-1 outline-none"
                 >
                   <option value={1}>1 / day</option>
                   <option value={2}>2 / day</option>
                   <option value={3}>3 / day</option>
                 </select>
               )}
             </div>
             {formData.includeSnacks && (
               <p className="text-xs text-orange-600/80 mt-2 pl-1">
                 Healthy snacks will be distributed between main meals.
               </p>
             )}
           </div>
           
           {/* Favorites Option */}
           {savedFavorites.length > 0 && (
              <div className={`p-4 rounded-xl border transition-all ${formData.includeFavorites ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-200'}`}>
                 <label className="flex items-center gap-3 cursor-pointer select-none">
                   <div className="relative">
                     <input 
                       type="checkbox" 
                       className="sr-only peer"
                       checked={formData.includeFavorites}
                       onChange={(e) => setFormData(prev => ({ ...prev, includeFavorites: e.target.checked }))}
                     />
                     <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-rose-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                   </div>
                   <div className="flex items-center gap-2">
                      <Heart className={`w-4 h-4 ${formData.includeFavorites ? 'text-rose-500 fill-rose-500' : 'text-slate-400'}`} />
                      <span className={`text-sm font-bold ${formData.includeFavorites ? 'text-slate-800' : 'text-slate-500'}`}>Prioritize Favorites</span>
                   </div>
                 </label>
                 <p className="text-xs text-slate-500 mt-2 pl-1">
                   Try to include your {savedFavorites.length} saved favorite meals in the plan.
                 </p>
              </div>
           )}
        </div>

      </div>

      <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center">
        <button 
          type="submit" 
          disabled={isLoading}
          className={`w-full max-w-md py-4 rounded-2xl font-bold text-lg shadow-lg transition-all transform hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-2 ${isLoading ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'}`}
        >
          {isLoading ? (
            <>Generating Plan...</>
          ) : (
            <>Generate My Nutrition Plan <Flame className="w-5 h-5" /></>
          )}
        </button>
      </div>
    </form>
  );
};

export default InputForm;