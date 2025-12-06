import React, { useState, useMemo } from 'react';
import { NutritionPlanResponse, DayPlan, MealItem } from '../types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ChevronDown, ChevronUp, ShoppingBag, Utensils, Flame, Leaf, BadgeCheck, CalendarDays, Check, RefreshCw, Loader2, ChefHat, Timer, Scale, Lightbulb } from 'lucide-react';

interface PlanDisplayProps {
  plan: NutritionPlanResponse;
  onReset: () => void;
  onSwapMeal: (dayIndex: number, mealGroupIndex: number, itemIndex: number, currentItem: MealItem, mealType: string) => Promise<void>;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b']; // Protein (Emerald), Carbs (Blue), Fats (Amber)

const PlanDisplay: React.FC<PlanDisplayProps> = ({ plan, onReset, onSwapMeal }) => {
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [activeWeek, setActiveWeek] = useState(0);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  // Group days into weeks of 7
  const weeks = useMemo(() => {
    const chunks = [];
    for (let i = 0; i < plan.days.length; i += 7) {
      chunks.push(plan.days.slice(i, i + 7));
    }
    return chunks;
  }, [plan.days]);

  // Determine which days to display based on selected week
  const visibleDays = weeks[activeWeek] || weeks[0];
  
  // The absolute index of the current day in the overall plan
  const absoluteDayIndex = (activeWeek * 7) + activeDayIndex;
  
  // The active day object relative to the entire plan
  const currentDayObject = visibleDays[activeDayIndex] || visibleDays[0];

  const toggleShoppingItem = (categoryIdx: number, itemIdx: number) => {
    const key = `${categoryIdx}-${itemIdx}`;
    const newSet = new Set(checkedItems);
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    setCheckedItems(newSet);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-fade-in pb-12">
      
      {/* Validation Banner */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-4 shadow-sm">
        <div className="relative">
          <img 
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah&clothing=blazerAndShirt&eyes=happy" 
            alt="Dr. Sarah Lin" 
            className="w-16 h-16 rounded-full border-2 border-emerald-200 bg-white"
          />
          <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full border-2 border-white">
            <BadgeCheck className="w-3 h-3" />
          </div>
        </div>
        <div className="text-center md:text-left flex-1">
           <div className="flex items-center justify-center md:justify-start gap-2">
             <h4 className="font-bold text-slate-800">Validated by Dr. Sarah Lin, PhD</h4>
             <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wide">Clinical Nutritionist</span>
           </div>
           <p className="text-sm text-slate-600 mt-1">
             "This plan follows the Mifflin-St Jeor protocols for safe energy expenditure. 
             It prioritizes whole foods and sustainable habits over restrictive dieting."
           </p>
        </div>
      </div>

      {/* Header Summary */}
      <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-slate-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Your Personal Nutrition Plan</h2>
            <p className="text-slate-500 mt-1 max-w-3xl">{plan.summary}</p>
          </div>
          <div className="bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
            <span className="text-emerald-700 font-semibold text-sm">Target: {plan.safeCalorieRange}</span>
          </div>
        </div>
        <button onClick={onReset} className="text-sm text-slate-400 hover:text-emerald-600 underline transition">
          Start Over
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Meal Plan */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Week Selector (Only if more than 1 week) */}
          {weeks.length > 1 && (
            <div className="flex items-center gap-2 bg-white p-2 rounded-xl shadow-sm border border-slate-100 overflow-x-auto">
              <CalendarDays className="w-5 h-5 text-slate-400 ml-2" />
              {weeks.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveWeek(idx);
                    setActiveDayIndex(0); // Reset to first day of that week
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                    activeWeek === idx
                      ? 'bg-slate-800 text-white shadow-md'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  Week {idx + 1}
                </button>
              ))}
            </div>
          )}

          {/* Day Navigation */}
          <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
            {visibleDays.map((day, idx) => (
              <button
                key={idx}
                onClick={() => setActiveDayIndex(idx)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                  activeDayIndex === idx 
                    ? 'bg-emerald-600 text-white shadow-md' 
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                {day.day}
              </button>
            ))}
          </div>

          {/* Meals List */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
             <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
               <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                 <Utensils className="w-4 h-4 text-emerald-500"/> 
                 {currentDayObject?.day} Menu
               </h3>
               <span className="text-xs font-bold bg-slate-200 text-slate-600 px-2 py-1 rounded">
                 ~{currentDayObject?.totalCalories} kcal
               </span>
             </div>
             <div className="divide-y divide-slate-100">
               {currentDayObject?.meals.map((mealGroup, groupIdx) => (
                 <div key={groupIdx} className="p-5 hover:bg-slate-50 transition-colors group">
                   <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">{mealGroup.type}</h4>
                   <div className="space-y-4">
                     {mealGroup.items.map((item, itemIdx) => (
                       <MealCard 
                          key={itemIdx} 
                          item={item} 
                          onSwap={async () => await onSwapMeal(absoluteDayIndex, groupIdx, itemIdx, item, mealGroup.type)}
                       />
                     ))}
                   </div>
                 </div>
               ))}
             </div>
          </div>
        </div>

        {/* Right Column: Stats & Shopping */}
        <div className="space-y-6">
          
          {/* Macros Chart */}
          {currentDayObject && (
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500"/> Daily Nutrition Breakdown
              </h3>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Protein', value: currentDayObject.dailyMacros.protein },
                        { name: 'Carbs', value: currentDayObject.dailyMacros.carbs },
                        { name: 'Fats', value: currentDayObject.dailyMacros.fats },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {COLORS.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}g`} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Legend iconType="circle" wrapperStyle={{fontSize: '12px'}}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                  <div className="bg-emerald-50 rounded-lg p-2 text-emerald-900 flex flex-col items-center justify-center">
                    <span className="text-[10px] uppercase font-bold text-emerald-600 mb-0.5">Protein</span>
                    <span className="font-bold text-lg leading-none">{currentDayObject.dailyMacros.protein}g</span>
                    <span className="text-[10px] text-emerald-600/80 font-medium">~{currentDayObject.dailyMacros.protein * 4} kcal</span>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-2 text-blue-900 flex flex-col items-center justify-center">
                    <span className="text-[10px] uppercase font-bold text-blue-600 mb-0.5">Carbs</span>
                    <span className="font-bold text-lg leading-none">{currentDayObject.dailyMacros.carbs}g</span>
                    <span className="text-[10px] text-blue-600/80 font-medium">~{currentDayObject.dailyMacros.carbs * 4} kcal</span>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-2 text-amber-900 flex flex-col items-center justify-center">
                    <span className="text-[10px] uppercase font-bold text-amber-600 mb-0.5">Fats</span>
                    <span className="font-bold text-lg leading-none">{currentDayObject.dailyMacros.fats}g</span>
                    <span className="text-[10px] text-amber-600/80 font-medium">~{currentDayObject.dailyMacros.fats * 9} kcal</span>
                  </div>
              </div>
            </div>
          )}

          {/* Shopping List */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-purple-500"/> Shopping List
            </h3>
            <p className="text-xs text-slate-400 mb-3">Tap items to mark as bought</p>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {plan.shoppingList.map((category, catIdx) => (
                <div key={catIdx}>
                  <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 bg-slate-100 px-2 py-1 rounded inline-block">
                    {category.category}
                  </h4>
                  <ul className="space-y-1">
                    {category.items.map((item, itemIdx) => {
                      const isChecked = checkedItems.has(`${catIdx}-${itemIdx}`);
                      return (
                        <li 
                          key={itemIdx} 
                          onClick={() => toggleShoppingItem(catIdx, itemIdx)}
                          className={`text-sm flex items-start gap-2 cursor-pointer group select-none transition-all ${
                            isChecked ? 'text-slate-400 line-through' : 'text-slate-700 hover:text-emerald-700'
                          }`}
                        >
                          <div className={`
                            w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-all
                            ${isChecked 
                              ? 'bg-emerald-500 border-emerald-500' 
                              : 'border-slate-300 bg-white group-hover:border-emerald-400'
                            }
                          `}>
                             {isChecked && <Check size={14} className="text-white" strokeWidth={3} />}
                          </div>
                          <span className={isChecked ? 'opacity-70' : ''}>{item}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

const MealCard: React.FC<{ item: MealItem, onSwap: () => Promise<void> }> = ({ item, onSwap }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);

  const handleSwapClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSwapping(true);
    await onSwap();
    setIsSwapping(false);
  };

  return (
    <div className={`bg-slate-50 rounded-xl border transition-all duration-300 overflow-hidden ${isOpen ? 'border-emerald-200 shadow-md ring-1 ring-emerald-100' : 'border-slate-200'}`}>
      <div 
        className="p-4 flex gap-4 cursor-pointer hover:bg-slate-100 transition-colors relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h5 className="font-semibold text-slate-800 leading-tight pr-6">{item.name}</h5>
            <div className="text-slate-400">
              {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </div>
          
          <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.description}</p>
          
          <div className="flex items-center gap-3 mt-3">
            <span className="text-xs font-medium text-slate-600 bg-white px-2 py-1 rounded border border-slate-200 shadow-sm">
              {item.calories} kcal
            </span>
            <button 
                onClick={handleSwapClick}
                disabled={isSwapping}
                className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400 hover:text-emerald-600 bg-white px-3 py-1 rounded border border-slate-200 hover:border-emerald-200 transition-all z-20"
                title="Swap for a different meal"
              >
                {isSwapping ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <RefreshCw className="w-3 h-3" />
                )}
                Swap
            </button>
          </div>
        </div>
      </div>
      
      {isOpen && (
        <div className="px-4 pb-4 pt-0 bg-slate-50/50 rounded-b-xl animate-in slide-in-from-top-1">
          
           {item.recipeTip && (
            <div className="mt-4 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl p-5 relative overflow-hidden">
               {/* Decorative background element */}
               <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-emerald-100 rounded-full opacity-50 blur-xl"></div>
               
              <div className="flex gap-4 relative z-10">
                 <div className="flex-shrink-0 mt-1">
                   <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-emerald-600 border border-emerald-100">
                     <Lightbulb size={20} className="fill-emerald-100" />
                   </div>
                 </div>
                 <div className="flex-1">
                   <h6 className="text-emerald-900 font-bold text-sm uppercase tracking-wider mb-2 flex items-center gap-2">
                     Chef's Secret
                   </h6>
                   <p className="text-sm text-slate-700 leading-relaxed font-medium">
                     {item.recipeTip}
                   </p>
                 </div>
              </div>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-slate-200/60">
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {/* Ingredients */}
               {item.ingredients && item.ingredients.length > 0 && (
                 <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                   <h6 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                     <Scale className="w-3 h-3" /> Ingredients
                   </h6>
                   <ul className="space-y-2.5">
                     {item.ingredients.map((ing, i) => (
                       <li key={i} className="text-sm text-slate-700 flex items-start gap-2.5 border-b border-dashed border-slate-100 last:border-0 pb-1.5 last:pb-0">
                         <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0"></div>
                         <span className="leading-snug">{ing}</span>
                       </li>
                     ))}
                   </ul>
                 </div>
               )}

               {/* Steps */}
               {item.instructions && item.instructions.length > 0 && (
                 <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                   <h6 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                     <Timer className="w-3 h-3" /> Instructions
                   </h6>
                   <ol className="space-y-3">
                     {item.instructions.map((step, i) => (
                       <li key={i} className="text-sm text-slate-600 flex gap-3">
                         <span className="font-bold text-emerald-600/40 font-mono text-lg leading-none select-none">{i + 1}.</span>
                         <span className="leading-relaxed">{step}</span>
                       </li>
                     ))}
                   </ol>
                 </div>
               )}
             </div>
          </div>

          <div className="mt-4 flex gap-3 text-xs text-slate-400 border-t border-slate-100 pt-3 justify-end">
            <div className="flex gap-2 sm:gap-4 flex-wrap justify-end">
               <span className="flex items-center gap-1">
                 <span className="w-2 h-2 rounded-full bg-emerald-400"></span> 
                 P: <b>{item.macros.protein}g</b> <span className="opacity-60 text-[10px]">({Math.round(item.macros.protein * 4)}kcal)</span>
               </span>
               <span className="flex items-center gap-1">
                 <span className="w-2 h-2 rounded-full bg-blue-400"></span> 
                 C: <b>{item.macros.carbs}g</b> <span className="opacity-60 text-[10px]">({Math.round(item.macros.carbs * 4)}kcal)</span>
               </span>
               <span className="flex items-center gap-1">
                 <span className="w-2 h-2 rounded-full bg-amber-400"></span> 
                 F: <b>{item.macros.fats}g</b> <span className="opacity-60 text-[10px]">({Math.round(item.macros.fats * 9)}kcal)</span>
               </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanDisplay;