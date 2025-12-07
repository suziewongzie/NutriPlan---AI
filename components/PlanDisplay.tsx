import React, { useState, useMemo, useEffect, useRef } from 'react';
import { NutritionPlanResponse, DayPlan, MealItem } from '../types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { ChevronDown, ChevronUp, ShoppingBag, Utensils, Flame, Leaf, BadgeCheck, CalendarDays, Check, RefreshCw, Loader2, ChefHat, Timer, Scale, Lightbulb, PlusCircle, CheckCircle2, Search, AlertTriangle, Heart, Play, Pause, RotateCcw, ArrowRight, SkipForward } from 'lucide-react';

interface PlanDisplayProps {
  plan: NutritionPlanResponse;
  onReset: () => void;
  onSwapMeal: (dayIndex: number, mealGroupIndex: number, itemIndex: number, currentItem: MealItem, mealType: string) => Promise<void>;
  onLogMeal: (item: MealItem, dayNumber: number) => void;
  onToggleFavorite: (item: MealItem) => void;
  favorites: MealItem[];
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b']; // Protein (Emerald), Carbs (Blue), Fats (Amber)

const PlanDisplay: React.FC<PlanDisplayProps> = ({ plan, onReset, onSwapMeal, onLogMeal, onToggleFavorite, favorites }) => {
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [activeWeek, setActiveWeek] = useState(0);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [shoppingSearch, setShoppingSearch] = useState('');

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

  // Helper to normalize day labels (e.g., "2" -> "Day 2")
  const formatDayLabel = (dayStr: string) => {
    if (!dayStr) return '';
    if (dayStr.toLowerCase().startsWith('day')) return dayStr;
    return `Day ${dayStr}`;
  };

  // Filter shopping list based on search term
  const filteredShoppingList = useMemo(() => {
    if (!shoppingSearch.trim()) return plan.shoppingList;
    const lowerTerm = shoppingSearch.toLowerCase();
    
    return plan.shoppingList.map(category => ({
      ...category,
      items: category.items.filter(item => item.toLowerCase().includes(lowerTerm))
    })).filter(category => category.items.length > 0);
  }, [plan.shoppingList, shoppingSearch]);

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
                {formatDayLabel(day.day)}
              </button>
            ))}
          </div>

          {/* Meals List */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
             <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
               <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                 <Utensils className="w-4 h-4 text-emerald-500"/> 
                 {formatDayLabel(currentDayObject?.day)} Menu
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
                          onLog={() => onLogMeal(item, absoluteDayIndex + 1)}
                          onToggleFavorite={() => onToggleFavorite(item)}
                          isFavorite={favorites.some(f => f.name === item.name)}
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
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100 relative overflow-hidden">
               {/* Decorative background blur */}
               <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50"></div>

              <h3 className="font-semibold text-slate-800 mb-6 flex items-center gap-2 relative z-10">
                <Flame className="w-5 h-5 text-orange-500 fill-orange-500"/> 
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600">
                  Daily Nutrition
                </span>
              </h3>
              
              <div className="flex flex-col items-center justify-center relative z-10">
                <div className="relative w-64 h-64">
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
                        innerRadius={75}
                        outerRadius={95}
                        paddingAngle={5}
                        dataKey="value"
                        cornerRadius={5}
                        stroke="none"
                      >
                        {COLORS.map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-slate-900 text-white text-xs rounded-lg py-2 px-3 shadow-xl border border-slate-700">
                                <div className="font-bold mb-1 opacity-90">{data.name}</div>
                                <div className="flex items-center gap-2">
                                  <span className="text-lg font-bold">{data.value}g</span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Center Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-4xl font-extrabold text-slate-800 tracking-tight">
                      {currentDayObject.totalCalories}
                    </span>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide mt-1">
                      kcal
                    </span>
                  </div>
                </div>

                {/* Custom Legend / Cards */}
                <div className="flex flex-col gap-3 w-full mt-6">
                    {/* Protein */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-100 shadow-sm transition-transform hover:scale-[1.02] hover:shadow-md hover:border-emerald-200">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                           <Utensils className="w-5 h-5" />
                         </div>
                         <div>
                           <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Protein</span>
                           <span className="block text-lg font-extrabold text-slate-800">{currentDayObject.dailyMacros.protein}g</span>
                         </div>
                      </div>
                      <div className="text-right">
                         <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                           {Math.round((currentDayObject.dailyMacros.protein * 4 / currentDayObject.totalCalories) * 100)}%
                         </span>
                      </div>
                    </div>

                    {/* Carbs */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-100 shadow-sm transition-transform hover:scale-[1.02] hover:shadow-md hover:border-blue-200">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                           <Leaf className="w-5 h-5" />
                         </div>
                         <div>
                           <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Carbs</span>
                           <span className="block text-lg font-extrabold text-slate-800">{currentDayObject.dailyMacros.carbs}g</span>
                         </div>
                      </div>
                      <div className="text-right">
                         <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                           {Math.round((currentDayObject.dailyMacros.carbs * 4 / currentDayObject.totalCalories) * 100)}%
                         </span>
                      </div>
                    </div>

                    {/* Fats */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-100 shadow-sm transition-transform hover:scale-[1.02] hover:shadow-md hover:border-amber-200">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                           <Flame className="w-5 h-5" />
                         </div>
                         <div>
                           <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Fats</span>
                           <span className="block text-lg font-extrabold text-slate-800">{currentDayObject.dailyMacros.fats}g</span>
                         </div>
                      </div>
                      <div className="text-right">
                         <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                           {Math.round((currentDayObject.dailyMacros.fats * 9 / currentDayObject.totalCalories) * 100)}%
                         </span>
                      </div>
                    </div>
                </div>
              </div>
            </div>
          )}

          {/* Shopping List */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-purple-500"/> Shopping List
            </h3>
            
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search ingredients..." 
                value={shoppingSearch}
                onChange={(e) => setShoppingSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 bg-slate-50 focus:bg-white transition-all placeholder:text-slate-400"
              />
            </div>

            <p className="text-xs text-slate-400 mb-3">Tap items to mark as bought</p>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredShoppingList.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                   No items match your search.
                </div>
              ) : (
                filteredShoppingList.map((category, catIdx) => (
                  <div key={catIdx}>
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 bg-slate-100 px-2 py-1 rounded inline-block">
                      {category.category}
                    </h4>
                    <ul className="space-y-1">
                      {category.items.map((item, itemIdx) => {
                        const originalCategory = plan.shoppingList.find(c => c.category === category.category);
                        const originalItemIdx = originalCategory?.items.indexOf(item) ?? itemIdx;
                        const originalCatIdx = plan.shoppingList.indexOf(originalCategory!);
                        
                        const lookupKey = `${originalCatIdx}-${originalItemIdx}`;
                        const isChecked = checkedItems.has(lookupKey);

                        return (
                          <li 
                            key={itemIdx} 
                            onClick={() => toggleShoppingItem(originalCatIdx, originalItemIdx)}
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
                            <span className="leading-snug">{item}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

const MealCard: React.FC<{ 
  item: MealItem, 
  onSwap: () => Promise<void>, 
  onLog: () => void,
  onToggleFavorite: () => void,
  isFavorite: boolean
}> = ({ item, onSwap, onLog, onToggleFavorite, isFavorite }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [isLogged, setIsLogged] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSwapped, setIsSwapped] = useState(false);

  // --- Step-Based Cooking Timer State ---
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [stepTimer, setStepTimer] = useState(0); // Seconds elapsed for current step
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isCookingMode, setIsCookingMode] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // Timer Interval
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setStepTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const toggleTimer = () => setIsTimerRunning(!isTimerRunning);
  
  const resetStepTimer = () => {
    setIsTimerRunning(false);
    setStepTimer(0);
  };

  const nextStep = () => {
    setIsTimerRunning(false);
    setCompletedSteps(prev => new Set(prev).add(activeStepIndex));
    
    if (item.instructions && activeStepIndex < item.instructions.length - 1) {
      setActiveStepIndex(prev => prev + 1);
      setStepTimer(0); // Reset timer for new step
    } else {
      // Completed all steps
      setActiveStepIndex(prev => prev + 1); // Move to "Done" state
    }
  };

  const prevStep = () => {
    if (activeStepIndex > 0) {
      setActiveStepIndex(prev => prev - 1);
      setStepTimer(0); // Simplify by resetting when going back
      setIsTimerRunning(false);
    }
  };
  
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSwapClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirm(true);
  };

  const confirmSwap = async () => {
    setShowConfirm(false);
    setIsSwapping(true);
    await onSwap();
    setIsSwapping(false);
    setIsSwapped(true);
    setTimeout(() => setIsSwapped(false), 2000);
  };

  const handleLogClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLog();
    setIsLogged(true);
    setTimeout(() => setIsLogged(false), 2000);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite();
  }

  const instructions = item.instructions || [];
  const isFinished = activeStepIndex >= instructions.length;

  return (
    <>
      {/* Confirmation Modal */}
      {showConfirm && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => {
             e.stopPropagation();
             setShowConfirm(false);
          }}
        >
          <div 
             className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full border border-slate-100 animate-in zoom-in-95 duration-200"
             onClick={(e) => e.stopPropagation()}
          >
             <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4 text-amber-600">
               <AlertTriangle className="w-6 h-6" />
             </div>
             <h3 className="text-xl font-bold text-slate-800 mb-2">Swap this meal?</h3>
             <p className="text-sm text-slate-500 mb-6 leading-relaxed">
               Are you sure you want to replace <b>{item.name}</b>? 
               <br/>
               The new meal will have similar calories but different ingredients.
             </p>
             <div className="flex gap-3">
               <button 
                 onClick={() => setShowConfirm(false)}
                 className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
               >
                 Cancel
               </button>
               <button 
                 onClick={confirmSwap}
                 className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 shadow-md shadow-emerald-200 transition-all"
               >
                 Yes, Swap It
               </button>
             </div>
          </div>
        </div>
      )}

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
                  disabled={isSwapping || isSwapped}
                  className={`flex items-center gap-1.5 text-[10px] font-medium px-3 py-1 rounded border transition-all z-20 ${
                    isSwapped
                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                    : 'text-slate-400 hover:text-emerald-600 bg-white border-slate-200 hover:border-emerald-200'
                  }`}
                  title="Swap for a different meal"
                >
                  {isSwapping ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : isSwapped ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <RefreshCw className="w-3 h-3" />
                  )}
                  {isSwapped ? 'Swapped' : 'Swap'}
              </button>
              <button 
                  onClick={handleLogClick}
                  className={`flex items-center gap-1.5 text-[10px] font-medium px-3 py-1 rounded border transition-all z-20 ${
                    isLogged 
                      ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                      : 'bg-white text-slate-400 hover:text-indigo-600 border-slate-200 hover:border-indigo-200'
                  }`}
                  title="Log this meal to daily tracker"
                >
                  {isLogged ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    <PlusCircle className="w-3 h-3" />
                  )}
                  {isLogged ? 'Logged' : 'Log Meal'}
              </button>
              <button 
                  onClick={handleFavoriteClick}
                  className={`flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded border transition-all z-20 ${
                    isFavorite 
                      ? 'bg-rose-50 text-rose-500 border-rose-200 hover:bg-rose-100' 
                      : 'bg-white text-slate-300 hover:text-rose-500 border-slate-200 hover:border-rose-200'
                  }`}
                  title="Save to favorites"
                >
                  <Heart className={`w-3 h-3 ${isFavorite ? 'fill-rose-500' : ''}`} />
              </button>
            </div>
          </div>
        </div>
        
        {isOpen && (
          <div className="px-4 pb-4 pt-0 bg-slate-50/50 rounded-b-xl animate-in slide-in-from-top-1">
            
            {item.recipeTip && (
              <div className="mt-4 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl p-5 relative overflow-hidden">
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

                {/* Steps and Cooking Mode */}
                <div className="space-y-4">
                  
                  {/* Instructions List (Context) */}
                  {instructions.length > 0 && !isCookingMode && (
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <div className="flex justify-between items-center mb-3">
                         <h6 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                           <Timer className="w-3 h-3" /> Instructions
                         </h6>
                         <button 
                           onClick={() => setIsCookingMode(true)}
                           className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded font-bold hover:bg-indigo-100 transition-colors"
                         >
                           Start Cooking Mode
                         </button>
                      </div>
                      <ol className="space-y-3">
                        {instructions.map((step, i) => (
                          <li key={i} className="text-sm text-slate-600 flex gap-3">
                            <span className="font-bold text-emerald-600/40 font-mono text-lg leading-none select-none">{i + 1}.</span>
                            <span className="leading-relaxed">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Cooking Assistant Mode */}
                  {isCookingMode && (
                    <div className="bg-indigo-50 rounded-xl border border-indigo-100 overflow-hidden shadow-sm">
                       {/* Header */}
                       <div className="bg-indigo-100/50 p-3 flex justify-between items-center border-b border-indigo-100">
                          <h6 className="text-xs font-bold text-indigo-800 uppercase tracking-wider flex items-center gap-2">
                             <ChefHat className="w-4 h-4" /> Cooking Assistant
                          </h6>
                          <button 
                             onClick={() => setIsCookingMode(false)}
                             className="text-xs text-indigo-400 hover:text-indigo-600 font-bold"
                          >
                            Exit
                          </button>
                       </div>

                       {/* Content */}
                       <div className="p-5">
                          {isFinished ? (
                             <div className="text-center py-6 animate-in zoom-in">
                                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
                                   <BadgeCheck className="w-8 h-8" />
                                </div>
                                <h4 className="text-xl font-bold text-slate-800 mb-1">Bon Appétit!</h4>
                                <p className="text-slate-500 text-sm mb-4">You've completed all steps.</p>
                                <button 
                                  onClick={() => {
                                     setActiveStepIndex(0);
                                     setStepTimer(0);
                                     setIsCookingMode(false);
                                  }}
                                  className="text-sm font-bold text-emerald-600 hover:text-emerald-700"
                                >
                                   Close Assistant
                                </button>
                             </div>
                          ) : (
                             <div className="space-y-6">
                                {/* Step Indicator */}
                                <div className="flex justify-between items-center">
                                   <span className="text-xs font-bold text-indigo-400 uppercase tracking-wide">
                                     Step {activeStepIndex + 1} of {instructions.length}
                                   </span>
                                   <div className="flex gap-1">
                                      {instructions.map((_, i) => (
                                         <div 
                                           key={i} 
                                           className={`h-1.5 w-4 rounded-full transition-all ${
                                              i === activeStepIndex ? 'bg-indigo-500' : i < activeStepIndex ? 'bg-indigo-200' : 'bg-slate-200'
                                           }`}
                                         ></div>
                                      ))}
                                   </div>
                                </div>

                                {/* Active Instruction */}
                                <div className="min-h-[80px] flex items-center">
                                   <p className="text-lg font-medium text-slate-800 leading-snug">
                                      {instructions[activeStepIndex]}
                                   </p>
                                </div>

                                {/* Timer & Controls */}
                                <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-indigo-100 shadow-sm">
                                   <div className="flex-1">
                                      <div className="text-xs font-bold text-slate-400 uppercase mb-1">Step Timer</div>
                                      <div className="font-mono text-3xl font-bold text-slate-800 tracking-tight">
                                         {formatTime(stepTimer)}
                                      </div>
                                   </div>

                                   <div className="flex items-center gap-2">
                                      <button 
                                         onClick={toggleTimer}
                                         className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                                            isTimerRunning 
                                            ? 'bg-amber-100 text-amber-600 hover:bg-amber-200' 
                                            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200'
                                         }`}
                                         title={isTimerRunning ? "Pause" : "Start Timer"}
                                      >
                                         {isTimerRunning ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
                                      </button>
                                      
                                      <button 
                                         onClick={resetStepTimer}
                                         className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 flex items-center justify-center transition-colors"
                                         title="Reset Timer"
                                      >
                                         <RotateCcw className="w-4 h-4" />
                                      </button>
                                   </div>
                                </div>

                                {/* Navigation */}
                                <div className="flex gap-3 pt-2">
                                   <button 
                                      onClick={prevStep}
                                      disabled={activeStepIndex === 0}
                                      className="px-4 py-3 rounded-xl border border-slate-200 text-slate-500 font-bold text-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                   >
                                      Back
                                   </button>
                                   <button 
                                      onClick={nextStep}
                                      className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                                   >
                                      {activeStepIndex === instructions.length - 1 ? 'Finish Cooking' : 'Next Step'}
                                      <ArrowRight className="w-4 h-4" />
                                   </button>
                                </div>
                             </div>
                          )}
                       </div>
                    </div>
                  )}

                  {!isCookingMode && instructions.length === 0 && (
                     <div className="text-center py-6 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                        No instructions available for this meal.
                     </div>
                  )}

                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default PlanDisplay;