import React from 'react';
import { motion } from 'motion/react';
import { User, X, Lock, Unlock } from 'lucide-react';
import { Seat } from '../types';

interface SeatCardProps {
  key?: any;
  seat: Seat;
  onClick: (id: number) => void;
  assigned: boolean;
  isFixMode: boolean;
}

export default function SeatCard({ seat, onClick, assigned, isFixMode }: SeatCardProps) {
  const { id, seatNumber, isX, studentName, fixedStudentName } = seat;

  // Determine styles and content based on current status
  let bgClass = 'bg-white border-slate-200 hover:border-slate-400 shadow-sm';
  let borderClass = 'border-2';
  
  if (isX) {
    // Blocked seat style
    bgClass = 'bg-slate-100/80 border-slate-300 hover:border-slate-400 text-rose-500';
    borderClass = 'border-2 border-dashed';
  } else if (fixedStudentName) {
    // Fixed seat style (beautiful warm amber style)
    bgClass = 'bg-[#fffbeb] border-amber-400 hover:border-amber-500 shadow-md text-[#b45309]';
    borderClass = 'border-2';
  } else if (studentName) {
    // Seated student style
    bgClass = 'bg-[#ecfdf5] border-emerald-500 hover:border-emerald-600 shadow-md text-[#065f46]';
    borderClass = 'border-2';
  } else {
    // Normal empty seat style
    bgClass = 'bg-white border-slate-200 hover:border-slate-400 text-slate-400';
    borderClass = 'border-2';
  }

  // Display name inside card
  const displayName = fixedStudentName || studentName;

  return (
    <motion.div
      layout
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(id)}
      className={`relative rounded-xl ${bgClass} ${borderClass} h-28 flex flex-col justify-between p-3 cursor-pointer transition-all duration-200 ease-out select-none overflow-hidden group`}
      id={`seat-card-${seatNumber}`}
    >
      {/* Decorative background symbol */}
      <div className="absolute right-2 top-2 opacity-5 group-hover:opacity-10 transition-opacity duration-200">
        {fixedStudentName && <Lock className="w-16 h-16 text-amber-600" />}
        {!fixedStudentName && studentName && <User className="w-16 h-16 text-[#065f46]" />}
        {isX && <X className="w-16 h-16 text-rose-900" />}
      </div>

      {/* Seat Number Header */}
      <div className="flex items-center justify-between w-full">
        <span className="text-[11px] font-black tracking-wider text-slate-400 flex items-center gap-1">
          {seatNumber}
          {fixedStudentName && <Lock className="w-3 h-3 text-amber-600 inline" />}
        </span>
        
        {/* Helper icon on hover based on mode */}
        <span className="text-[9px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200 font-bold">
          {isFixMode 
            ? (fixedStudentName ? '고정 해제' : '고정 지정')
            : (isX ? '해제' : 'X 설정')
          }
        </span>
      </div>

      {/* Seat Center (Name or Status) */}
      <div className="flex flex-col items-center justify-center flex-grow py-1">
        {isX ? (
          <div className="flex flex-col items-center justify-center text-rose-500 animate-fade-in">
            <span className="text-3xl font-light leading-none">×</span>
            <span className="text-[10px] font-bold mt-0.5 tracking-tight">지정 빈자리</span>
          </div>
        ) : displayName ? (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`text-center font-black tracking-tighter text-xl sm:text-2xl ${
              fixedStudentName ? 'text-[#b45309]' : 'text-[#065f46]'
            }`}
          >
            {displayName}
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-400">
            <span className="text-[11px] font-extrabold tracking-widest text-slate-400">EMPTY</span>
          </div>
        )}
      </div>

      {/* Sub status/helper bar */}
      <div className="text-[9px] text-right font-bold tracking-tighter">
        {fixedStudentName ? (
          <span className="text-amber-600 flex items-center justify-end gap-0.5">
            <Lock className="w-2.5 h-2.5" /> 고정석
          </span>
        ) : studentName ? (
          <span className="text-emerald-600">배치완료</span>
        ) : isX ? (
          <span className="text-rose-500">학생제외</span>
        ) : (
          <span className="text-slate-400">대기</span>
        )}
      </div>
    </motion.div>
  );
}

