
import React from 'react';
import { MealItem } from '../types';
import { Heart, Trash2, PlusCircle, ArrowLeft, UtensilsCrossed } from 'lucide-react';

interface FavoritesListProps {
  favorites: MealItem[];
  onRemove: (item: MealItem) => void;
  onLog: (item: MealItem) => void;
  onBack: () => void;
}

const FavoritesList: React.FC<FavoritesListProps> = ({ favorites, onRemove, onLog, onBack }) => {
  return (
    <div className="max-w-4xl mx-auto pb-12 animate-fade-in">
       <div className="flex items-center justify-between mb-8">
        <button 
          onClick={onBack} 
          className="p-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center justify-center gap-2">
             My Favorites <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
          </h2>
          <p className="text-slate-500 text-xs">Saved meals for quick access and future plans</p>
        </div>
        <div className="w-10"></div> 
      </div>

      {favorites.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
           <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-300">
             <Heart className="w-10 h-10" />
           </div>
           <h3 className="text-lg font-semibold text-slate-700 mb-2">No favorites yet</h3>
           <p className="text-slate-500 max-w-xs mx-auto">
             Tap the heart icon on any meal in your plan to save it here.
           </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {favorites.map((meal, index) => (
            <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all group relative">
              <div className="flex justify-between items-start mb-3">
                 <h4 className="font-bold text-slate-800 text-lg leading-tight pr-8">{meal.name}</h4>
                 <div className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-xs font-bold">
                    {meal.calories} kcal
                 </div>
              </div>
              <p className="text-sm text-slate-500 line-clamp-2 mb-4 h-10">{meal.description}</p>
              
              <div className="flex gap-3 text-xs font-medium text-slate-400 mb-6">
                 <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> {meal.macros.protein}g P</span>
                 <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> {meal.macros.carbs}g C</span>
                 <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500"></div> {meal.macros.fats}g F</span>
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-100">
                <button 
                  onClick={() => onLog(meal)}
                  className="flex-1 py-2 bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" /> Log Meal
                </button>
                <button 
                  onClick={() => onRemove(meal)}
                  className="px-3 py-2 bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200 rounded-lg transition-colors"
                  title="Remove from favorites"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FavoritesList;
