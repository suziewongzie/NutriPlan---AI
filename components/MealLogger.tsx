import React, { useState, useRef } from 'react';
import { FoodLogEntry } from '../types';
import { analyzeFoodWithAI } from '../services/geminiService';
import { Plus, Trash2, Loader2, Sparkles, PieChart as PieChartIcon, Search, ImagePlus, X, UploadCloud, Camera, ArrowLeft, Beef, Wheat, Droplet, Flame, Check } from 'lucide-react';

interface MealLoggerProps {
  onBack: () => void;
  logs: FoodLogEntry[];
  onAddLog: (log: FoodLogEntry) => void;
  onRemoveLog: (id: string) => void;
  dailyGoal: number;
  planDuration: number;
}

const MealLogger: React.FC<MealLoggerProps> = ({ onBack, logs, onAddLog, onRemoveLog, dailyGoal, planDuration }) => {
  const [activeTab, setActiveTab] = useState<'ai' | 'manual'>('ai');
  const [selectedDay, setSelectedDay] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // AI State
  const [aiInput, setAiInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Manual State
  const [manualForm, setManualForm] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fats: '',
    image: '' as string | null
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAiAnalyze = async () => {
    if (!aiInput.trim() && !selectedImage) return;
    
    setIsAnalyzing(true);
    try {
      const result = await analyzeFoodWithAI(aiInput, selectedImage || undefined);
      
      setManualForm({
        name: result.name,
        calories: result.calories.toString(),
        protein: result.macros.protein.toString(),
        carbs: result.macros.carbs.toString(),
        fats: result.macros.fats.toString(),
        image: selectedImage
      });
      
      setActiveTab('manual'); 
    } catch (error) {
      console.error(error);
      alert("Could not analyze food. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.name || !manualForm.calories) return;

    const newLog: FoodLogEntry = {
      id: Date.now().toString(),
      name: manualForm.name,
      calories: Number(manualForm.calories),
      macros: {
        protein: Number(manualForm.protein) || 0,
        carbs: Number(manualForm.carbs) || 0,
        fats: Number(manualForm.fats) || 0,
      },
      timestamp: new Date().toISOString(),
      dayNumber: selectedDay
    };

    (newLog as any).image = manualForm.image;

    onAddLog(newLog);
    
    // Show success feedback on button
    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), 2000);

    setManualForm({ name: '', calories: '', protein: '', carbs: '', fats: '', image: null });
    setAiInput('');
    setSelectedImage(null);
  };

  // Filter logs for the selected day
  // Default to Day 1 if dayNumber is missing (legacy logs)
  const currentDayLogs = logs.filter(log => (log.dayNumber || 1) === selectedDay);

  const totals = currentDayLogs.reduce((acc, log) => ({
    calories: acc.calories + (log.calories || 0),
    protein: acc.protein + (log.macros?.protein || 0),
    carbs: acc.carbs + (log.macros?.carbs || 0),
    fats: acc.fats + (log.macros?.fats || 0)
  }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

  const progress = Math.min(100, (totals.calories / dailyGoal) * 100);
  const radius = 92; 
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="w-full max-w-3xl mx-auto pb-12 animate-fade-in px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={onBack} 
          className="p-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Daily Tracker</h2>
          <p className="text-slate-500 text-xs">Log meals for your plan</p>
        </div>
        <div className="w-10"></div> {/* Spacer for centering */}
      </div>

      {/* Day Selector */}
      <div className="flex overflow-x-auto gap-2 pb-4 mb-4 scrollbar-hide justify-start md:justify-center">
        {Array.from({ length: planDuration }, (_, i) => i + 1).map((dayNum) => (
          <button
            key={dayNum}
            onClick={() => setSelectedDay(dayNum)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap border ${
              selectedDay === dayNum
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-105'
                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Day {dayNum}
          </button>
        ))}
      </div>

      <div className="space-y-8">
        
        {/* Stats Panel - Centered */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-60"></div>
             
             <div className="flex items-center justify-center gap-2 mb-8 relative z-10">
               <div className="p-1.5 bg-emerald-100 rounded-lg text-emerald-700">
                 <Flame className="w-4 h-4" />
               </div>
               <h3 className="font-bold text-slate-800 text-lg">Day {selectedDay} Calories</h3>
             </div>

             <div className="flex flex-col items-center">
                 {/* Circular Chart */}
                 <div className="relative w-72 h-72 mb-10 flex items-center justify-center">
                   <svg className="w-full h-full transform -rotate-90 drop-shadow-sm" viewBox="0 0 224 224">
                     {/* Background Circle */}
                     <circle 
                       cx="112" cy="112" r={radius} 
                       stroke="#f1f5f9" 
                       strokeWidth="12" 
                       fill="none" 
                     />
                     {/* Progress Circle */}
                     <circle 
                       cx="112" cy="112" r={radius} 
                       stroke={totals.calories > dailyGoal ? "#ef4444" : "#10b981"} 
                       strokeWidth="12" 
                       strokeLinecap="round" 
                       fill="none" 
                       strokeDasharray={circumference}
                       strokeDashoffset={strokeDashoffset}
                       className="transition-all duration-1000 ease-out"
                     />
                   </svg>
                   
                   <div className="absolute inset-0 flex flex-col items-center justify-center select-none p-6 gap-2">
                     <span className="text-6xl font-extrabold text-slate-800 tracking-tighter leading-none">
                       {Math.round(totals.calories || 0)}
                     </span>
                     <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                       of {dailyGoal} kcal
                     </span>
                     <div className="text-xs font-bold px-4 py-1.5 bg-slate-100 rounded-full text-slate-600 shadow-sm border border-slate-200 mt-2">
                        {Math.max(0, dailyGoal - Math.round(totals.calories || 0))} remaining
                     </div>
                   </div>
                 </div>

                 {/* Macros Breakdown - Centered Grid */}
                 <div className="grid grid-cols-3 gap-4 w-full">
                   <div className="bg-slate-50 rounded-2xl p-4 flex flex-col items-center justify-center border border-slate-100 group hover:border-emerald-200 transition-colors">
                       <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                          <Beef className="w-4 h-4" />
                       </div>
                       <p className="text-lg font-bold text-slate-700">{Math.round(totals.protein || 0)}g</p>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Protein</p>
                   </div>

                   <div className="bg-slate-50 rounded-2xl p-4 flex flex-col items-center justify-center border border-slate-100 group hover:border-blue-200 transition-colors">
                       <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                          <Wheat className="w-4 h-4" />
                       </div>
                       <p className="text-lg font-bold text-slate-700">{Math.round(totals.carbs || 0)}g</p>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Carbs</p>
                   </div>

                   <div className="bg-slate-50 rounded-2xl p-4 flex flex-col items-center justify-center border border-slate-100 group hover:border-amber-200 transition-colors">
                       <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                          <Droplet className="w-4 h-4" />
                       </div>
                       <p className="text-lg font-bold text-slate-700">{Math.round(totals.fats || 0)}g</p>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fats</p>
                   </div>
                 </div>
             </div>
        </div>

        {/* Input Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
            {/* Custom Tab Switcher */}
            <div className="p-2 bg-slate-50 border-b border-slate-100 flex gap-2">
              <button 
                onClick={() => setActiveTab('ai')}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'ai' 
                    ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200' 
                    : 'text-slate-500 hover:bg-slate-200/50'
                }`}
              >
                <Sparkles className="w-4 h-4" /> 
                Smart AI Entry
              </button>
              <button 
                onClick={() => setActiveTab('manual')}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'manual' 
                    ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-slate-200' 
                    : 'text-slate-500 hover:bg-slate-200/50'
                }`}
              >
                <Plus className="w-4 h-4" /> 
                Manual Entry
              </button>
            </div>

            <div className="p-6 md:p-8">
              {activeTab === 'ai' ? (
                <div className="space-y-6 animate-in fade-in duration-300">
                   <div className="flex items-start gap-4 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                     <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600 flex-shrink-0">
                       <Sparkles className="w-5 h-5" />
                     </div>
                     <div>
                       <h4 className="font-bold text-indigo-900 text-sm mb-1">AI-Powered Analysis</h4>
                       <p className="text-sm text-indigo-800/70 leading-relaxed">
                         Snap a photo or describe your meal to identify ingredients and estimate nutrition.
                       </p>
                     </div>
                   </div>

                   <div className="space-y-4">
                      <div className="relative">
                         <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Meal Description</label>
                         <textarea
                            value={aiInput}
                            onChange={(e) => setAiInput(e.target.value)}
                            placeholder="e.g. 'Avocado toast with a poached egg and cherry tomatoes...'"
                            className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none resize-none min-h-[100px] text-slate-700 placeholder:text-slate-400 bg-white shadow-sm transition-all text-base"
                          />
                          <div className="absolute bottom-4 right-4 text-slate-300">
                            <Search className="w-4 h-4" />
                          </div>
                      </div>

                      <div 
                        className={`relative border-2 border-dashed rounded-2xl p-6 transition-all text-center group cursor-pointer ${
                          selectedImage 
                            ? 'border-indigo-400 bg-indigo-50' 
                            : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
                        }`}
                        onClick={() => !selectedImage && fileInputRef.current?.click()}
                      >
                         <input 
                           type="file" 
                           ref={fileInputRef}
                           onChange={handleImageUpload}
                           accept="image/*"
                           className="hidden"
                         />
                         
                         {selectedImage ? (
                           <div className="relative inline-block shadow-xl rounded-lg overflow-hidden group-hover:scale-[1.02] transition-transform">
                              <img src={selectedImage} alt="Food preview" className="h-48 w-auto object-cover" />
                              <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
                              <button 
                                onClick={(e) => { e.stopPropagation(); clearImage(); }}
                                className="absolute top-2 right-2 bg-white/90 text-slate-700 hover:text-red-600 p-2 rounded-full shadow-lg backdrop-blur-sm transition-all hover:scale-110"
                              >
                                <X className="w-4 h-4" />
                              </button>
                           </div>
                         ) : (
                           <div className="space-y-2 py-2">
                             <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:scale-110 group-hover:bg-indigo-200 transition-all">
                               <ImagePlus className="w-6 h-6 text-indigo-600" />
                             </div>
                             <div>
                               <h4 className="font-bold text-slate-700">Upload Photo</h4>
                             </div>
                           </div>
                         )}
                      </div>

                      <button
                        onClick={handleAiAnalyze}
                        disabled={isAnalyzing || (!aiInput.trim() && !selectedImage)}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-200 transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-3"
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" /> Analyzing...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-5 h-5" /> Calculate Nutrition
                          </>
                        )}
                      </button>
                   </div>
                </div>
              ) : (
                <form onSubmit={handleAddLog} className="space-y-6 animate-in fade-in duration-300">
                  {manualForm.image && (
                     <div className="flex items-center gap-4 bg-indigo-50 p-3 rounded-2xl border border-indigo-100">
                        <img src={manualForm.image} alt="Meal" className="w-20 h-20 rounded-xl object-cover shadow-sm" />
                        <div className="flex-1">
                          <p className="text-xs font-bold text-indigo-600 uppercase mb-1">Image Attached</p>
                          <p className="text-sm text-indigo-900 font-medium truncate">{manualForm.name || 'Analyzed Meal'}</p>
                          <button 
                            type="button" 
                            onClick={() => setManualForm({...manualForm, image: null})}
                            className="text-xs text-red-500 hover:text-red-700 font-medium mt-2 flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" /> Remove Image
                          </button>
                        </div>
                     </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Meal Name</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Grilled Salmon Salad"
                      value={manualForm.name}
                      onChange={(e) => setManualForm({...manualForm, name: e.target.value})}
                      className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none text-slate-800 font-semibold placeholder:font-normal bg-slate-50 focus:bg-white transition-all"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                       <label className="block text-xs font-bold text-slate-500 uppercase ml-1">Calories</label>
                       <div className="relative group">
                         <input 
                           type="number" required
                           value={manualForm.calories}
                           onChange={(e) => setManualForm({...manualForm, calories: e.target.value})}
                           className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-slate-400 outline-none font-bold text-slate-800 bg-slate-50 focus:bg-white transition-all"
                         />
                         <span className="absolute right-3 top-3.5 text-xs text-slate-400 font-bold pointer-events-none">kcal</span>
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="block text-xs font-bold text-emerald-600 uppercase ml-1">Protein</label>
                       <div className="relative">
                         <input 
                           type="number"
                           value={manualForm.protein}
                           onChange={(e) => setManualForm({...manualForm, protein: e.target.value})}
                           className="w-full px-4 py-3 rounded-xl border border-emerald-100 bg-emerald-50/50 focus:bg-white focus:border-emerald-500 outline-none transition-all font-medium text-emerald-900"
                         />
                         <span className="absolute right-3 top-3.5 text-xs text-emerald-600 font-bold pointer-events-none">g</span>
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="block text-xs font-bold text-blue-600 uppercase ml-1">Carbs</label>
                       <div className="relative">
                         <input 
                           type="number"
                           value={manualForm.carbs}
                           onChange={(e) => setManualForm({...manualForm, carbs: e.target.value})}
                           className="w-full px-4 py-3 rounded-xl border border-blue-100 bg-blue-50/50 focus:bg-white focus:border-blue-500 outline-none transition-all font-medium text-blue-900"
                         />
                         <span className="absolute right-3 top-3.5 text-xs text-blue-600 font-bold pointer-events-none">g</span>
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="block text-xs font-bold text-amber-600 uppercase ml-1">Fat</label>
                       <div className="relative">
                         <input 
                           type="number"
                           value={manualForm.fats}
                           onChange={(e) => setManualForm({...manualForm, fats: e.target.value})}
                           className="w-full px-4 py-3 rounded-xl border border-amber-100 bg-amber-50/50 focus:bg-white focus:border-amber-500 outline-none transition-all font-medium text-amber-900"
                         />
                         <span className="absolute right-3 top-3.5 text-xs text-amber-600 font-bold pointer-events-none">g</span>
                       </div>
                    </div>
                  </div>
                  
                  <button 
                    type="submit" 
                    className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2 transform ${
                      isSuccess 
                        ? 'bg-emerald-500 text-white shadow-emerald-200' 
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 hover:translate-y-[-1px]'
                    }`}
                  >
                    {isSuccess ? (
                       <> <Check className="w-5 h-5" /> Added! </>
                    ) : (
                       <> <Plus className="w-5 h-5" /> Add Log Entry </>
                    )}
                  </button>
                </form>
              )}
            </div>
        </div>

        {/* Log List */}
        <div className="space-y-4">
             <div className="flex items-center justify-between px-2">
               <h3 className="font-bold text-xl text-slate-800">Day {selectedDay} Meals</h3>
               <span className="text-xs font-bold text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-full shadow-sm">
                 {currentDayLogs.length} entries
               </span>
             </div>
             
             <div className="space-y-3">
               {currentDayLogs.length === 0 ? (
                 <div className="text-center py-12 text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200 shadow-sm">
                   <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                     <Search className="w-6 h-6 text-slate-300" />
                   </div>
                   <p className="font-medium text-slate-600">No meals logged for Day {selectedDay}</p>
                 </div>
               ) : (
                 currentDayLogs.map(log => (
                   <div key={log.id} className="flex items-center gap-5 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                     
                     <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                     {(log as any).image ? (
                        <img src={(log as any).image} alt={log.name} className="w-20 h-20 rounded-xl object-cover shadow-sm border border-slate-100" />
                     ) : (
                        <div className="w-20 h-20 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 border border-slate-100">
                          <Flame className="w-8 h-8 opacity-50" />
                        </div>
                     )}

                     <div className="flex-1 min-w-0">
                       <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-1 mb-2">
                          <h4 className="font-bold text-slate-800 text-lg truncate">{log.name}</h4>
                          <span className="font-mono font-bold text-emerald-700 text-sm bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100 inline-block md:inline">
                            {log.calories} kcal
                          </span>
                       </div>
                       
                       <div className="flex gap-4 text-xs font-medium text-slate-500">
                         <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> {log.macros?.protein || 0}g P</span>
                         <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> {log.macros?.carbs || 0}g C</span>
                         <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500"></div> {log.macros?.fats || 0}g F</span>
                       </div>
                     </div>

                     <button 
                        onClick={() => onRemoveLog(log.id)} 
                        className="text-slate-300 hover:text-red-500 p-3 rounded-full hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Delete entry"
                      >
                       <Trash2 className="w-5 h-5" />
                     </button>
                   </div>
                 ))
               )}
             </div>
        </div>
      </div>
    </div>
  );
};

export default MealLogger;