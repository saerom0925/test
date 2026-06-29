import React from 'react';
import { motion } from 'motion/react';
import { User, X, PlusCircle } from 'lucide-react';
import { Seat } from '../types';

interface SeatCardProps {
  key?: any;
  seat: Seat;
  onToggleX: (id: number) => void;
  assigned: boolean;
}

export default function SeatCard({ seat, onToggleX, assigned }: SeatCardProps) {
  const { id, seatNumber, isX, studentName } = seat;

  // Determine styles and content based on current status
  let bgClass = 'bg-white border-slate-200 hover:border-slate-400 shadow-sm';
  let borderClass = 'border-2';
  let textClass = 'text-slate-700';

  if (isX) {
    // Blocked seat style from Bento Grid (.seat-card.blocked)
    bgClass = 'bg-slate-100/80 border-slate-300 hover:border-slate-400 text-rose-500';
    borderClass = 'border-2 border-dashed';
  } else if (studentName) {
    // Seated student style from Bento Grid (.seat-card.assigned)
    bgClass = 'bg-[#ecfdf5] border-emerald-500 hover:border-emerald-600 shadow-md text-[#065f46]';
    borderClass = 'border-2';
  } else {
    // Normal empty seat style
    bgClass = 'bg-white border-slate-200 hover:border-slate-400 text-slate-400';
    borderClass = 'border-2';
  }

  return (
    <motion.div
      layout
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onToggleX(id)}
      className={`relative rounded-xl ${bgClass} ${borderClass} h-28 flex flex-col justify-between p-3 cursor-pointer transition-all duration-200 ease-out select-none overflow-hidden group`}
      id={`seat-card-${seatNumber}`}
    >
      {/* Decorative top-right element or subtle background symbol */}
      <div className="absolute right-2 top-2 opacity-5 group-hover:opacity-10 transition-opacity duration-200">
        {studentName && <User className="w-16 h-16 text-[#065f46]" />}
        {isX && <X className="w-16 h-16 text-rose-900" />}
      </div>

      {/* Seat Number Header */}
      <div className="flex items-center justify-between w-full">
        <span className="text-[11px] font-black tracking-wider text-slate-400">
          {seatNumber}
        </span>
        
        {/* Subtle helper icon on hover */}
        {!assigned && (
          <span className="text-[9px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200 font-bold">
            {isX ? '해제' : 'X 설정'}
          </span>
        )}
      </div>

      {/* Seat Center (Name or Status) */}
      <div className="flex flex-col items-center justify-center flex-grow py-1">
        {isX ? (
          <div className="flex flex-col items-center justify-center text-rose-500 animate-fade-in">
            <span className="text-3xl font-light leading-none">×</span>
            <span className="text-[10px] font-bold mt-0.5 tracking-tight">지정 빈자리</span>
          </div>
        ) : studentName ? (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center font-black tracking-tighter text-[#065f46] text-xl sm:text-2xl"
          >
            {studentName}
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-400">
            <span className="text-[11px] font-extrabold tracking-widest text-slate-400">EMPTY</span>
          </div>
        )}
      </div>

      {/* Sub status/helper bar */}
      <div className="text-[9px] text-right font-bold text-slate-400 tracking-tighter">
        {studentName ? '배치완료' : isX ? '학생제외' : '대기'}
      </div>
    </motion.div>
  );
}
