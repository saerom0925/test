/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shuffle, 
  RotateCcw, 
  Sparkles, 
  HelpCircle, 
  Volume2, 
  VolumeX, 
  Users, 
  XSquare, 
  CheckCircle2, 
  Grid3X3,
  Undo2,
  GraduationCap
} from 'lucide-react';

import { Seat } from './types';
import StudentCountSelector from './components/StudentCountSelector';
import ClassroomGrid from './components/ClassroomGrid';
import { playClickSound, playToggleSound, playShuffleSound } from './utils/audio';

export default function App() {
  // 1. 상태 선언
  const [studentCount, setStudentCount] = useState<number | null>(null); // 선택한 학생 수 (처음에는 null)
  const [seats, setSeats] = useState<Seat[]>([]); // 4행 5열 (총 20개 자리) 상태
  const [assigned, setAssigned] = useState<boolean>(false); // 자리 배정 여부
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true); // 오디오 활성화 여부
  const [warning, setWarning] = useState<string | null>(null); // 경고 메시지 상태
  const [shuffleCount, setShuffleCount] = useState<number>(0); // 섞은 횟수 (피드백용)

  // 2. 초기 20개 빈자리 생성
  const initializeSeats = (count: number) => {
    const initialSeats: Seat[] = Array.from({ length: 20 }, (_, index) => ({
      id: index,
      seatNumber: index + 1,
      isX: false,
      studentName: null,
    }));
    setSeats(initialSeats);
    setAssigned(false);
    setShuffleCount(0);
    setWarning(null);
  };

  // 3. 학생 인원수를 선택했을 때 호출
  const handleSelectCount = (count: number) => {
    setStudentCount(count);
    initializeSeats(count);
  };

  // 4. 특정 자리를 클릭했을 때 빈자리(X) 토글 처리
  const handleToggleX = (id: number) => {
    if (studentCount === null) return;

    const targetSeat = seats.find(s => s.id === id);
    if (!targetSeat) return;

    // 현재 지정된 X 개수 계산
    const currentXCount = seats.filter(s => s.isX).length;

    // 비활성화(X) 상태로 변경하려는 경우
    if (!targetSeat.isX) {
      // 20자리 중 (X 개수 + 1)을 뺀 자리가 학생 수보다 작아지면 지정 불가
      if (20 - (currentXCount + 1) < studentCount) {
        playClickSound(soundEnabled);
        setWarning(`학생 수(${studentCount}명)를 배치하기 위해 최소 ${studentCount}개의 자리가 필요합니다. 더 이상 X를 지정할 수 없습니다.`);
        return;
      }
      playToggleSound(soundEnabled, true);
    } else {
      // 해제하는 경우
      playToggleSound(soundEnabled, false);
    }

    setWarning(null); // 경고 메시지 초기화

    // 자리 상태 갱신
    setSeats(prevSeats => 
      prevSeats.map(seat => {
        if (seat.id === id) {
          // X로 전환 시 기존 배치되었던 학생 이름은 지워짐 (다시 배정 시 신규 배치)
          return {
            ...seat,
            isX: !seat.isX,
            studentName: null
          };
        }
        return seat;
      })
    );
  };

  // 5. 자리 무작위 배정 핵심 알고리즘 (Fisher-Yates Shuffle 기반)
  const handleAssignSeats = () => {
    if (studentCount === null) return;

    // X로 지정되지 않은 배치 가능한 자리를 필터링
    const availableSeats = seats.filter(seat => !seat.isX);
    
    // 유효성 체크
    if (availableSeats.length < studentCount) {
      setWarning(`배치 가능한 자리(${availableSeats.length}개)가 학생 수(${studentCount}명)보다 부족합니다. X 지정을 일부 해제해 주세요.`);
      return;
    }

    // 학생 목록 생성: ["학생 1", "학생 2", ..., "학생 N"]
    const students = Array.from({ length: studentCount }, (_, i) => `학생 ${i + 1}`);

    // 배치 가능 자리들의 인덱스 목록
    const availableIndices = availableSeats.map(seat => seat.id);

    // Fisher-Yates 셔플 알고리즘으로 자리 인덱스 섞기
    for (let i = availableIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availableIndices[i], availableIndices[j]] = [availableIndices[j], availableIndices[i]];
    }

    // 새로운 전체 자리 배열 맵핑 생성
    const updatedSeats = seats.map(seat => {
      // 만약 X로 지정된 자리라면 학생이 타지 않음 (기존 X 상태 유지 및 이름 null)
      if (seat.isX) {
        return { ...seat, studentName: null };
      }

      // 섞인 사용 가능 자리 인덱스 중에서 이 자리의 인덱스가 몇 번째인지 확인
      const studentIndex = availableIndices.indexOf(seat.id);

      // 만약 섞은 결과에서 학생 수 이내에 드는 위치라면 해당 학생 배치
      if (studentIndex !== -1 && studentIndex < studentCount) {
        return { ...seat, studentName: students[studentIndex] };
      }

      // 학생 수 범위를 초과하는 남는 자리는 자동으로 일반 "빈자리"가 됨
      return { ...seat, studentName: null };
    });

    setSeats(updatedSeats);
    setAssigned(true);
    setShuffleCount(prev => prev + 1);
    setWarning(null);
    playShuffleSound(soundEnabled);
  };

  // 6. 모든 지정 빈자리(X) 일괄 해제 기능 (선생님 편의 기능)
  const handleClearAllX = () => {
    playClickSound(soundEnabled);
    setWarning(null);
    setSeats(prevSeats => 
      prevSeats.map(seat => ({
        ...seat,
        isX: false,
        studentName: assigned ? seat.studentName : null // 배정이 완료된 상태면 배치 유지를 시도하나 가급적 다시 배정을 누르도록 유도
      }))
    );
  };

  // 7. 초기화 후 인원수 선택 화면으로 돌아가기
  const handleResetAll = () => {
    playClickSound(soundEnabled);
    setStudentCount(null);
    setSeats([]);
    setAssigned(false);
    setShuffleCount(0);
    setWarning(null);
  };

  // 경고 메시지 발생 시 4초 뒤 자동 소멸
  useEffect(() => {
    if (warning) {
      const timer = setTimeout(() => {
        setWarning(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [warning]);

  // 통계 계산
  const xCount = seats.filter(s => s.isX).length;
  const placeableCount = 20 - xCount;

  // 학생 수 미선택 상태이면 셀렉터 화면 렌더링
  if (studentCount === null) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans selection:bg-indigo-500 selection:text-white">
        <StudentCountSelector
          onSelect={handleSelectCount}
          soundEnabled={soundEnabled}
          setSoundEnabled={setSoundEnabled}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans selection:bg-indigo-500 selection:text-white pb-12">
      {/* 1. 상단 내비게이션 바 */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100">
              <GraduationCap className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="font-display font-black text-slate-900 text-xl tracking-tight flex items-center gap-2">
                교실 자리 바꾸기 <span className="text-indigo-600">PRO</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">
                스마트 좌석 배치 시스템
              </p>
            </div>
          </div>

          {/* 소리 토글 버튼 및 현재 정보 */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                playClickSound(!soundEnabled);
              }}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-200 text-slate-500 hover:text-slate-800 flex items-center gap-1.5 text-xs font-bold"
              title={soundEnabled ? "효과음 끄기" : "효과음 켜기"}
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-4 h-4 text-indigo-600 animate-pulse" />
                  <span className="hidden sm:inline">소리 켬</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 text-slate-400" />
                  <span className="hidden sm:inline text-slate-400">소리 끔</span>
                </>
              )}
            </button>

            <button
              onClick={handleResetAll}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:text-slate-950 flex items-center gap-1.5 transition-all duration-200"
            >
              <Undo2 className="w-3.5 h-3.5" />
              처음으로
            </button>
          </div>
        </div>
      </header>

      {/* 2. 경고 팝업 레이어 (부드러운 애니메이션 적용) */}
      <AnimatePresence>
        {warning && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-rose-500 text-white font-medium text-sm text-center py-3 px-4 shadow-md sticky top-16 z-30 flex items-center justify-center gap-2"
          >
            <span>⚠️ {warning}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. 메인 콘텐츠 그리드 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* 왼쪽 제어판 카드 (Cols: 4) */}
          <section className="lg:col-span-4 space-y-6">
            
            {/* 3.1 현황판 대시보드 - Bento Grid 스타일 */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Grid3X3 className="w-4 h-4 text-slate-400" />
                현황 대시보드
              </h2>

              <div className="grid grid-cols-3 gap-3">
                {/* 학생 수 */}
                <div className="bg-white p-3.5 rounded-2xl border border-slate-150 shadow-sm flex flex-col justify-center items-center text-center">
                  <span className="block text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">배정 학생</span>
                  <div className="text-xl sm:text-2xl font-black text-slate-900">{studentCount}명</div>
                </div>

                {/* X 지정빈자리 */}
                <div className="bg-white p-3.5 rounded-2xl border border-slate-150 shadow-sm flex flex-col justify-center items-center text-center">
                  <span className="block text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">제외 자리(X)</span>
                  <div className="text-xl sm:text-2xl font-black text-rose-500">{xCount}</div>
                </div>

                {/* 배치 가능 자리 */}
                <div className="bg-white p-3.5 rounded-2xl border border-slate-150 shadow-sm flex flex-col justify-center items-center text-center">
                  <span className="block text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">가용 좌석</span>
                  <div className="text-xl sm:text-2xl font-black text-indigo-600">{placeableCount}</div>
                </div>
              </div>

              {/* 추가 디테일 알림 */}
              <div className="mt-4 bg-indigo-50/50 border border-indigo-100/60 rounded-xl p-3 text-[11px] text-slate-600 flex items-start gap-2 leading-relaxed">
                <span className="text-indigo-600 font-bold">ℹ️</span>
                <p>
                  자리를 클릭하면 해당 위치를 <strong className="text-rose-600">지정 빈자리(X)</strong>로 설정하거나 해제할 수 있습니다.
                </p>
              </div>
            </div>

            {/* 3.2 핵심 컨트롤 버튼 모음 */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 space-y-4">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">배정 제어판</h2>

              {/* 대망의 자리배정 버튼 */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleAssignSeats}
                className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-black py-4 px-6 rounded-2xl shadow-lg shadow-indigo-200 flex items-center justify-center gap-2.5 transition-all duration-200 text-base cursor-pointer"
                id="assign-seats-btn"
              >
                <Shuffle className="w-5 h-5 stroke-[2.5]" />
                <span>{assigned ? '다시 자리 배정' : '자리 배정 시작'}</span>
              </motion.button>

              <div className="grid grid-cols-2 gap-3">
                {/* X 전체 해제 버튼 */}
                <button
                  onClick={handleClearAllX}
                  disabled={xCount === 0}
                  className="py-2.5 px-3 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-xs font-bold text-slate-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  title="지정된 모든 X 상태를 해제합니다."
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  X 지정 전체 해제
                </button>

                {/* 학생 수 변경 */}
                <button
                  onClick={handleResetAll}
                  className="py-2.5 px-3 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  인원 재설정
                </button>
              </div>

              {/* 섞은 횟수 배지 */}
              {shuffleCount > 0 && (
                <div className="text-center pt-1">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-full px-3 py-1">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                    현재 {shuffleCount}번째 배치 중!
                  </span>
                </div>
              )}
            </div>

            {/* 3.3 도움말 & 범례 카드 */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-slate-400" />
                자리 안내 범례
              </h3>
              <div className="space-y-3 text-xs">
                {/* 1. 배정 완료 */}
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-[#ecfdf5] border-2 border-emerald-500 flex items-center justify-center font-black text-[#065f46] text-[10px]">
                    학생
                  </div>
                  <span className="text-slate-600 font-bold">배정 완료 상태 (.assigned)</span>
                </div>

                {/* 2. 지정 빈자리 */}
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center text-rose-500 font-black text-[12px]">
                    ×
                  </div>
                  <span className="text-slate-600 font-bold">지정 빈자리 상태 (.blocked)</span>
                </div>

                {/* 3. 자동 빈자리 */}
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-white border-2 border-slate-200 flex items-center justify-center text-slate-400 font-black text-[10px]">
                    EMPTY
                  </div>
                  <span className="text-slate-600 font-bold">대기 / 일반 빈자리 상태</span>
                </div>
              </div>
            </div>

          </section>

          {/* 오른쪽 교실 배치도 판넬 (Cols: 8) */}
          <section className="lg:col-span-8">
            <ClassroomGrid
              seats={seats}
              onToggleX={handleToggleX}
              assigned={assigned}
            />
          </section>

        </div>
      </main>
    </div>
  );
}
