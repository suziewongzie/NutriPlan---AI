import React, { useState, useEffect, useMemo } from 'react';
import { ActivityLevel, Gender, UserFormData } from '../types';
import { Info, Calculator, Flame, Coffee } from 'lucide-react';

interface InputFormProps {
  onSubmit: (data: UserFormData) => void;
  isLoading: boolean;
}

const InputForm: React.FC<InputFormProps> = ({ onSubmit, isLoading }) => {
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
    snacksPerDay: 2
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
      // Safe deficit: ~500 kcal, but typically not below BMR for extended periods without supervision
      // We'll use a standard safe approach: TDEE - 500 or TDEE * 0.85
      const deficit = tdee - 500;
      return deficit > bmr ? deficit : Math.max(1200, Math.round(tdee * 0.85)); // Safety floor
    }
    return tdee;
  }, [tdee, formData.planGoal, bmr]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    // Handle checkboxes specifically if we had standard checkboxes, 
    // but for includeSnacks we use a custom UI handler below, so this is mostly for standard inputs
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
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-6 md:p-8 w-full max-w-4xl mx-auto border border-slate-100">
      <div className="flex items-center gap-2 mb-6 text-emerald-600 bg-emerald-50 p-3 rounded-lg">
        <Info className="w-5 h-5 flex-shrink-0" />
        <p className="text-sm font-medium">All plans are estimates using the Mifflin-St Jeor equation. Consult a doctor for medical advice.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left Column: Stats & Calculator Input */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-slate-800 border-b pb-2 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-emerald-500" /> 
            Body Metrics
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Age</label>
              <input type="number" name="age" min="15" max="100" required value={formData.age} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
              <select name="gender" value={formData.gender} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none">
                {Object.values(Gender).map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Height (cm)</label>
              <input type="number" name="height" min="100" max="250" required value={formData.height} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Weight (kg)</label>
              <input type="number" name="weight" min="30" max="300" required value={formData.weight} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
          </div>
          
           <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Activity Level</label>
            <select name="activityLevel" value={formData.activityLevel} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none transition">
              {Object.values(ActivityLevel).map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <p className="text-xs text-slate-400 mt-1">
              Used to calculate TDEE (Total Daily Energy Expenditure)
            </p>
          </div>

          {/* Calculator Output */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">BMR (Basal Metabolic Rate):</span>
              <span className="font-mono font-medium text-slate-700">{Math.round(bmr)} kcal</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">TDEE (Maintenance):</span>
              <span className="font-mono font-bold text-slate-800">{tdee} kcal</span>
            </div>
             <div className="border-t border-slate-200 my-2 pt-2">
               <div className="flex justify-between items-center">
                 <span className="text-sm font-semibold text-emerald-700">Recommended Target:</span>
                 <span className="text-lg font-bold text-emerald-600">{targetCalories} kcal</span>
               </div>
               <p className="text-xs text-slate-400 mt-1">Based on your goal selected below.</p>
             </div>
          </div>

          {/* Snack Configuration - Moved to Left Column */}
           <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
             <div className="flex items-center justify-between mb-2">
               <label className="flex items-center gap-2 cursor-pointer">
                 <div className="relative">
                   <input 
                     type="checkbox" 
                     className="sr-only peer"
                     checked={formData.includeSnacks}
                     onChange={(e) => setFormData(prev => ({...prev, includeSnacks: e.target.checked}))}
                   />
                   <div className="w-10 h-6 bg-slate-300 rounded-full peer peer-checked:bg-orange-500 peer-focus:ring-2 peer-focus:ring-orange-300 transition-all after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                 </div>
                 <span className="text-sm font-medium text-slate-800 flex items-center gap-2">
                   <Coffee className="w-4 h-4 text-orange-600" />
                   Include Snacks?
                 </span>
               </label>
             </div>
             
             {formData.includeSnacks && (
               <div className="mt-2 animate-in slide-in-from-top-2">
                 <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Snacks Per Day</label>
                 <select 
                    name="snacksPerDay" 
                    value={formData.snacksPerDay} 
                    onChange={handleChange} 
                    className="w-full px-3 py-2 rounded-lg border border-orange-200 focus:ring-2 focus:ring-orange-500 outline-none bg-white text-sm"
                 >
                   {[1, 2, 3].map(n => <option key={n} value={n}>{n} Snack{n > 1 ? 's' : ''}</option>)}
                 </select>
               </div>
             )}
           </div>
        </div>

        {/* Right Column: Preferences */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-slate-800 border-b pb-2 flex items-center gap-2">
             <Flame className="w-5 h-5 text-orange-500" />
             Plan Customization
          </h3>

          <div>
             <label className="block text-sm font-medium text-slate-700 mb-2">Nutrition Goal</label>
             <div className="grid grid-cols-1 gap-2">
               <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${formData.planGoal === 'maintenance' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                 <input 
                   type="radio" 
                   name="planGoal" 
                   value="maintenance" 
                   checked={formData.planGoal === 'maintenance'} 
                   onChange={(e) => setFormData({...formData, planGoal: 'maintenance'})}
                   className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                 />
                 <span className="ml-3 text-sm font-medium text-slate-800">
                   Maintain Weight <span className="text-slate-500 font-normal">(~{tdee} kcal)</span>
                 </span>
               </label>
               
               <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${formData.planGoal === 'deficit' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                 <input 
                   type="radio" 
                   name="planGoal" 
                   value="deficit" 
                   checked={formData.planGoal === 'deficit'} 
                   onChange={(e) => setFormData({...formData, planGoal: 'deficit'})}
                   className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                 />
                 <span className="ml-3 text-sm font-medium text-slate-800">
                   Healthy Weight Loss <span className="text-slate-500 font-normal">(Safe Deficit)</span>
                 </span>
               </label>
             </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Cuisine Style</label>
            <select name="cuisinePreference" value={formData.cuisinePreference} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none transition">
              {cuisineOptions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Dietary Preference</label>
            <input type="text" name="dietaryPreference" placeholder="e.g. Halal, Vegetarian, None" required value={formData.dietaryPreference} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Allergies</label>
            <input type="text" name="allergies" placeholder="e.g. Peanuts, Dairy (Optional)" value={formData.allergies} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
          
           <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Main Meals</label>
                <select name="mealsPerDay" value={formData.mealsPerDay} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none">
                  {[2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">Excluding snacks</p>
             </div>
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Duration</label>
                <select name="duration" value={formData.duration} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none">
                  {[1, 3, 5, 7].map(n => <option key={n} value={n}>{n} Days</option>)}
                  <option value={30}>30 Days (4 Weeks)</option>
                </select>
             </div>
           </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-100 flex justify-center">
        <button 
          type="submit" 
          disabled={isLoading}
          className={`px-12 py-4 rounded-xl text-white font-bold text-lg shadow-xl transition-all transform hover:scale-105 ${isLoading ? 'bg-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:shadow-emerald-500/30'}`}
        >
          {isLoading ? 'Calculating & Generating...' : `Generate ${formData.duration}-Day Plan`}
        </button>
      </div>
    </form>
  );
};

export default InputForm;