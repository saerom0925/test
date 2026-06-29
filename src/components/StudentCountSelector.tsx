import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Users, GraduationCap, ArrowRight, Volume2, VolumeX } from 'lucide-react';
import { playClickSound } from '../utils/audio';

interface StudentCountSelectorProps {
  onSelect: (count: number) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
}

export default function StudentCountSelector({
  onSelect,
  soundEnabled,
  setSoundEnabled,
}: StudentCountSelectorProps) {
  const [selectedCount, setSelectedCount] = useState<number>(15); // Default to a middle value like 15

  const handleStart = () => {
    playClickSound(soundEnabled);
    onSelect(selectedCount);
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 100 }}
        className="w-full max-w-md bg-white rounded-3xl border border-slate-200/80 shadow-2xl p-8 relative overflow-hidden"
      >
        {/* Decorative ambient background blur */}
        <div className="absolute -right-12 -top-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-32 h-32 bg-slate-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Audio Toggle on Top Right */}
        <div className="absolute right-4 top-4">
          <button
            onClick={() => {
              const nextVal = !soundEnabled;
              setSoundEnabled(nextVal);
              playClickSound(nextVal);
            }}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors duration-200 text-slate-500 hover:text-slate-800"
            title={soundEnabled ? "소리 켜짐" : "소리 꺼짐"}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5 text-indigo-600" /> : <VolumeX className="w-5 h-5 text-slate-400" />}
          </button>
        </div>

        {/* Welcome Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4 border border-indigo-100 shadow-sm">
            <GraduationCap className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight text-slate-900">
            교실 자리 바꾸기 <span className="text-indigo-600">PRO</span>
          </h1>
          <p className="text-slate-500 text-sm mt-2 max-w-xs">
            선생님을 위한 스마트 좌석 배치 시스템
          </p>
        </div>

        {/* Select Dropdown Card */}
        <div className="space-y-6">
          <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-5">
            <label htmlFor="student-count-select" className="block text-xs font-semibold tracking-wider uppercase text-slate-500 mb-3 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-500" />
              학급 학생 인원수 선택
            </label>
            <div className="relative">
              <select
                id="student-count-select"
                value={selectedCount}
                onChange={(e) => {
                  setSelectedCount(Number(e.target.value));
                  playClickSound(soundEnabled);
                }}
                className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-slate-800 font-semibold py-3 px-4 rounded-xl shadow-xs transition-all duration-200 cursor-pointer text-base appearance-none outline-none"
              >
                {Array.from({ length: 20 }, (_, i) => i + 1).map((val) => (
                  <option key={val} value={val} className="text-slate-800 font-medium">
                    {val}명 (학생 1 ~ 학생 {val})
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Guidelines / Tips */}
          <div className="bg-indigo-50/50 border border-indigo-100/60 rounded-2xl p-4 text-xs text-slate-600 space-y-2">
            <h3 className="font-bold text-indigo-800 flex items-center gap-1">
              ✨ 주요 사용법 안내
            </h3>
            <ul className="list-disc pl-4 space-y-1 text-slate-600">
              <li>선택한 명수만큼 <strong className="text-slate-900">학생1, 학생2...</strong>로 자동 생성됩니다.</li>
              <li>배치 시작 전 원하는 자리를 클릭해 <strong className="text-slate-950 font-semibold">지정 빈자리(X)</strong>를 미리 정할 수 있습니다.</li>
              <li>언제든 버튼 하나로 무작위 자리를 다시 섞을 수 있습니다.</li>
            </ul>
          </div>

          {/* Action Button */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleStart}
            className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-indigo-600/25 hover:shadow-indigo-700/35 flex items-center justify-center gap-2 transition-all duration-200 text-base"
          >
            <span>교실 들어가기</span>
            <ArrowRight className="w-5 h-5 stroke-[2.5]" />
          </motion.button>
        </div>

        {/* Footer info */}
        <div className="text-center mt-6 text-[11px] text-slate-400 font-medium">
          데이터는 브라우저 메모리에만 저장되며, 새로고침 시 초기화됩니다.
        </div>
      </motion.div>
    </div>
  );
}
