import { Seat } from '../types';
import SeatCard from './SeatCard';
import { Presentation } from 'lucide-react';

interface ClassroomGridProps {
  seats: Seat[];
  onClickSeat: (id: number) => void;
  assigned: boolean;
  isFixMode: boolean;
}

export default function ClassroomGrid({ seats, onClickSeat, assigned, isFixMode }: ClassroomGridProps) {
  return (
    <div className="bg-[#f8fafc] rounded-3xl border-2 border-slate-200 p-8 shadow-xs relative">
      {/* Front of the Classroom / Teacher Desk */}
      <div className="flex flex-col items-center justify-center mb-8 relative">
        <div className="w-full max-w-sm bg-slate-900 text-slate-100 rounded-2xl py-3 px-6 shadow-md flex items-center justify-center gap-3 border-b-4 border-indigo-600">
          <Presentation className="w-5 h-5 text-indigo-400 animate-pulse" />
          <span className="font-display font-black tracking-widest text-xs uppercase">
            [ 앞 ] 교 탁 · 칠 판
          </span>
        </div>
        <div className="w-16 h-1.5 bg-slate-300 rounded-full mt-2"></div>
      </div>

      {/* 4 rows x 5 columns Seating Grid */}
      <div className="grid grid-cols-5 gap-3.5" id="classroom-grid">
        {seats.map((seat) => (
          <SeatCard
            key={seat.id}
            seat={seat}
            onClick={onClickSeat}
            assigned={assigned}
            isFixMode={isFixMode}
          />
        ))}
      </div>

      {/* Desk spacing details / Back of the room decoration */}
      <div className="mt-8 flex justify-between items-center text-xs font-bold text-slate-400 border-t-2 border-slate-100 pt-4">
        <span>⬅️ 창측 (왼쪽)</span>
        <span className="font-black text-[11px] bg-slate-200/60 px-3 py-1 rounded-full text-slate-600">
          CLASSROOM (4 × 5)
        </span>
        <span>복도측 (오른쪽) ➡️</span>
      </div>
    </div>
  );
}

