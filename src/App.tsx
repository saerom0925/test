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
  CheckCircle2, 
  Grid3X3,
  Undo2,
  GraduationCap,
  Lock,
  Unlock,
  Plus,
  Trash2,
  Save,
  Download,
  Info,
  X,
  Sliders,
  Settings
} from 'lucide-react';

import { Seat, Student } from './types';
import StudentCountSelector from './components/StudentCountSelector';
import ClassroomGrid from './components/ClassroomGrid';
import { playClickSound, playToggleSound, playShuffleSound } from './utils/audio';

// ==========================================
// Firebase Firestore 데이터베이스 연동 영역
// ==========================================
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './utils/firebase';

// 단일 공유 교실 데이터로 영구 보존할 문서 레퍼런스 정의
const CLASSROOM_DOC_REF = doc(db, 'classroom_pro', 'data');

export default function App() {
  // 1. 상태 변수 선언
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true); // 처음 접속 시 Firebase 자동 데이터 로딩
  const [isSaving, setIsSaving] = useState<boolean>(false); // 저장 처리 중 상태
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false); // 불러오기 처리 중 상태

  const [studentCount, setStudentCount] = useState<number | null>(null); // 현재 설정된 학생 인원수
  const [students, setStudents] = useState<Student[]>([]); // 학생 목록
  const [seats, setSeats] = useState<Seat[]>([]); // 4x5 총 20개 자리 배열 상태
  const [assigned, setAssigned] = useState<boolean>(false); // 무작위 배정 완료 여부
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true); // 소리 활성화 상태
  const [warning, setWarning] = useState<string | null>(null); // 경고 배너용 메시지
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null); // 플로팅 안내 메시지
  const [shuffleCount, setShuffleCount] = useState<number>(0); // 섞은 횟수 카운터

  // 고정석 지정 관련 상태
  const [isFixMode, setIsFixMode] = useState<boolean>(false); // 고정석 지정 모드 (true면 클릭 시 고정석 팝업 생성)
  const [selectedSeatForFix, setSelectedSeatForFix] = useState<number | null>(null); // 고정석 지정 팝업을 띄운 좌석 ID

  // 왼쪽 사이드 패널 탭 설정 ("placement" = 자리배치/설정, "students" = 학생명단 편집)
  const [activeTab, setActiveTab] = useState<'placement' | 'students'>('placement');

  // 2. 초기 접속 시 데이터베이스(Firebase)로부터 저장된 데이터가 있는지 확인하고 자동 로딩
  useEffect(() => {
    const fetchSavedData = async () => {
      try {
        const docSnap = await getDoc(CLASSROOM_DOC_REF);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.students && Array.isArray(data.students) && data.students.length > 0) {
            setStudents(data.students);
            setStudentCount(data.students.length);
          }
          if (data.seats && Array.isArray(data.seats) && data.seats.length > 0) {
            setSeats(data.seats);
          }
          if (data.assigned !== undefined) {
            setAssigned(data.assigned);
          }
          if (data.shuffleCount !== undefined) {
            setShuffleCount(data.shuffleCount);
          }
        }
      } catch (err: any) {
        console.error("Firebase 자동 불러오기 실패:", err);
      } finally {
        setIsInitialLoading(false);
      }
    };
    fetchSavedData();
  }, []);

  // 3. 임시 안내 플로팅 메시지(Toast) 자동 소멸 타이머
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // 4. 경고 배너 자동 소멸 타이머
  useEffect(() => {
    if (warning) {
      const timer = setTimeout(() => setWarning(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [warning]);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
  };

  // 5. 학생 인원수를 선택하고 처음 시작할 때 초기 20개 빈좌석 및 기본 명단 생성
  const handleSelectCount = (count: number) => {
    setStudentCount(count);
    
    // 기본 이름 목록 생성 (학생 1, 학생 2...)
    const initialStudents: Student[] = Array.from({ length: count }, (_, i) => ({
      id: `student-${Date.now()}-${i}`,
      name: `학생 ${i + 1}`
    }));
    setStudents(initialStudents);

    // 4행 5열 빈좌석 기본 초기화
    const initialSeats: Seat[] = Array.from({ length: 20 }, (_, index) => ({
      id: index,
      seatNumber: index + 1,
      isX: false,
      studentName: null,
      fixedStudentName: null
    }));
    
    setSeats(initialSeats);
    setAssigned(false);
    setShuffleCount(0);
    setWarning(null);
  };

  // 6. 학생 추가 기능 (최대 20명 제한)
  const handleAddStudent = () => {
    if (students.length >= 20) {
      playClickSound(soundEnabled);
      setWarning("학생은 최대 20명까지만 추가할 수 있습니다. (교실 좌석 규격이 20석입니다)");
      return;
    }
    playClickSound(soundEnabled);
    
    // 미중복 이름 생성
    const nextNumber = students.length + 1;
    const newStudent: Student = {
      id: `student-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: `학생 ${nextNumber}`
    };

    setStudents(prev => [...prev, newStudent]);
    if (studentCount !== null) {
      setStudentCount(prev => (prev !== null ? prev + 1 : 1));
    }
    showToast('info', `새로운 학생 '${newStudent.name}'이 추가되었습니다.`);
  };

  // 7. 학생 삭제 기능 (최소 1명 유지)
  const handleDeleteStudent = (id: string) => {
    if (students.length <= 1) {
      playClickSound(soundEnabled);
      setWarning("최소 1명 이상의 학생은 유지해야 합니다.");
      return;
    }

    const targetStudent = students.find(s => s.id === id);
    if (!targetStudent) return;
    
    playClickSound(soundEnabled);
    const updatedStudents = students.filter(s => s.id !== id);
    setStudents(updatedStudents);
    if (studentCount !== null) {
      setStudentCount(updatedStudents.length);
    }

    // 중요 예외 처리: 삭제된 학생이 고정석으로 지정되어 있던 경우 고정석도 함께 해제
    setSeats(prevSeats => 
      prevSeats.map(seat => {
        let updated = { ...seat };
        if (seat.fixedStudentName === targetStudent.name) {
          updated.fixedStudentName = null;
        }
        if (seat.studentName === targetStudent.name) {
          updated.studentName = null;
        }
        return updated;
      })
    );

    showToast('info', `'${targetStudent.name}' 학생이 명단에서 제외되었고, 고정석이 있었다면 해제되었습니다.`);
  };

  // 8. 학생 이름 직접 수정 기능
  const handleUpdateStudentName = (id: string, newName: string) => {
    const trimmedName = newName.trim();
    if (!trimmedName) return;

    const oldStudent = students.find(s => s.id === id);
    if (!oldStudent) return;
    const oldName = oldStudent.name;

    // 명단 상태 갱신
    setStudents(prev => prev.map(s => s.id === id ? { ...s, name: trimmedName } : s));

    // 중요 예외 처리: 고정석 및 현재 배치 명단에도 수정된 이름을 즉시 동기화 반영
    setSeats(prevSeats => 
      prevSeats.map(seat => {
        let updated = { ...seat };
        if (seat.fixedStudentName === oldName) {
          updated.fixedStudentName = trimmedName;
        }
        if (seat.studentName === oldName) {
          updated.studentName = trimmedName;
        }
        return updated;
      })
    );
  };

  // 9. 학생 명단 저장 기능 (Firebase Firestore에 영구 기록)
  const handleSaveStudents = async () => {
    try {
      setIsSaving(true);
      playClickSound(soundEnabled);

      // 학생 명단 정보와 현재의 교실 상태를 하나의 데이터셋으로 결합하여 저장
      await setDoc(CLASSROOM_DOC_REF, {
        students,
        seats,
        assigned,
        shuffleCount,
        updatedAt: new Date().toISOString()
      });

      showToast('success', '학생 명단이 데이터베이스에 성공적으로 저장되었습니다.');
      playShuffleSound(soundEnabled);
    } catch (err: any) {
      console.error(err);
      showToast('error', `저장에 실패했습니다: ${err.message || err}`);
    } finally {
      setIsSaving(false);
    }
  };

  // 10. 현재 배치 저장 기능 (Firebase Firestore)
  const handleSavePlacements = async () => {
    try {
      setIsSaving(true);
      playClickSound(soundEnabled);

      await setDoc(CLASSROOM_DOC_REF, {
        students,
        seats,
        assigned,
        shuffleCount,
        updatedAt: new Date().toISOString()
      });

      showToast('success', '현재 자리배치 상태와 고정석 정보가 데이터베이스에 저장되었습니다.');
      playShuffleSound(soundEnabled);
    } catch (err: any) {
      console.error(err);
      showToast('error', `배치 저장 실패: ${err.message || err}`);
    } finally {
      setIsSaving(false);
    }
  };

  // 11. 저장된 자리배치 수동 불러오기 기능 (Firebase Firestore)
  const handleLoadDataManual = async () => {
    try {
      setIsLoadingData(true);
      playClickSound(soundEnabled);

      const docSnap = await getDoc(CLASSROOM_DOC_REF);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.students && Array.isArray(data.students)) {
          setStudents(data.students);
          setStudentCount(data.students.length);
        }
        if (data.seats && Array.isArray(data.seats)) {
          setSeats(data.seats);
        }
        if (data.assigned !== undefined) {
          setAssigned(data.assigned);
        }
        if (data.shuffleCount !== undefined) {
          setShuffleCount(data.shuffleCount);
        }
        showToast('success', '저장된 교실 데이터배치를 불러왔습니다.');
        playShuffleSound(soundEnabled);
      } else {
        showToast('info', '데이터베이스에 저장된 이전 배치 기록이 존재하지 않습니다.');
      }
    } catch (err: any) {
      console.error(err);
      showToast('error', `불러오기 실패: ${err.message || err}`);
    } finally {
      setIsLoadingData(false);
    }
  };

  // 12. 고정석 지정 처리 팝업 적용 함수
  const handleSelectFixedStudent = (seatId: number, studentName: string | null) => {
    // 팝업 닫기
    setSelectedSeatForFix(null);
    playToggleSound(soundEnabled, studentName !== null);

    setSeats(prevSeats => 
      prevSeats.map(seat => {
        if (seat.id === seatId) {
          // X 지정석이었던 경우에는 X를 자동 해제 처리 (충돌 방지 예외처리)
          return {
            ...seat,
            isX: false, 
            fixedStudentName: studentName,
            studentName: studentName // 고정석 설정 즉시 해당 학생을 시각적으로 배치
          };
        }
        
        // 중요 예외 처리: 동일 학생을 다른 자리에서 중복 고정하려던 경우 이전 자리 해제
        if (studentName && seat.fixedStudentName === studentName) {
          return {
            ...seat,
            fixedStudentName: null,
            studentName: seat.studentName === studentName ? null : seat.studentName
          };
        }
        return seat;
      })
    );

    if (studentName) {
      showToast('success', `'${studentName}' 고정석이 지정되었습니다.`);
    } else {
      showToast('info', '고정석 지정이 해제되었습니다.');
    }
  };

  // 13. 자리 클릭 통합 컨트롤러
  const handleSeatClick = (id: number) => {
    const targetSeat = seats.find(s => s.id === id);
    if (!targetSeat) return;

    if (isFixMode) {
      // 13.1 고정석 지정 모드인 경우
      if (targetSeat.isX) {
        setWarning("이 자리는 현재 '지정 빈자리(X)'입니다. 고정석으로 설정하려면 먼저 X 표시를 해제해야 합니다.");
        playClickSound(soundEnabled);
        return;
      }
      // 고정석 선택 팝업 오픈
      setSelectedSeatForFix(id);
    } else {
      // 13.2 일반 모드 (지정 빈자리 X 지정/해제)인 경우
      if (targetSeat.fixedStudentName) {
        setWarning("이 자리는 고정석으로 🔒 잠겨있습니다. 빈자리(X)로 만드려면 먼저 고정석 설정을 해제해 주세요.");
        playClickSound(soundEnabled);
        return;
      }

      const currentXCount = seats.filter(s => s.isX).length;

      if (!targetSeat.isX) {
        // X 전환 시 배치 가능한 자리 계산 체크 예외처리
        if (20 - (currentXCount + 1) < students.length) {
          playClickSound(soundEnabled);
          setWarning(`학생 수(${students.length}명)를 배치하기 위해 최소 ${students.length}개의 자리가 필요합니다. X를 추가할 수 없습니다.`);
          return;
        }
        playToggleSound(soundEnabled, true);
      } else {
        playToggleSound(soundEnabled, false);
      }

      setSeats(prev => 
        prev.map(seat => {
          if (seat.id === id) {
            return {
              ...seat,
              isX: !seat.isX,
              studentName: null
            };
          }
          return seat;
        })
      );
    }
  };

  // 14. 고정석 기반 무작위 자리배정 핵심 알고리즘
  const handleAssignSeats = () => {
    // 14.1 고정석 및 X 충돌을 감안한 배치 가능 슬롯 수 확인
    const totalStudents = students.length;
    const activeSeats = seats.filter(s => !s.isX);

    if (activeSeats.length < totalStudents) {
      setWarning(`배치 가능한 빈 자리(${activeSeats.length}개)가 학생 수(${totalStudents}명)보다 부족합니다. X 지정 빈자리를 더 해제해주세요.`);
      playClickSound(soundEnabled);
      return;
    }

    // 14.2 고정석으로 이미 지정된 학생들과, 해당 자리를 추출
    const fixedSeats = seats.filter(s => s.fixedStudentName !== null);
    const fixedStudentNames = fixedSeats.map(s => s.fixedStudentName) as string[];

    // 14.3 고정석에 지정된 학생이 실제 명단에 존재하는지 유효성 검사
    const studentNamesInRoster = students.map(s => s.name);
    const invalidFixedStudents = fixedStudentNames.filter(name => !studentNamesInRoster.includes(name));

    if (invalidFixedStudents.length > 0) {
      setWarning(`고정석에 지정된 학생(${invalidFixedStudents.join(', ')})이 현재 명단에 존재하지 않습니다. 먼저 고정석을 해제하거나 학생을 명단에 추가하세요.`);
      playClickSound(soundEnabled);
      return;
    }

    // 14.4 고정되지 않은 남은 학생들
    const remainingStudents = students.filter(s => !fixedStudentNames.includes(s.name));

    // 14.5 고정되지 않았고, X도 아닌 빈자리들
    const availableSeatIds = seats
      .filter(s => !s.isX && s.fixedStudentName === null)
      .map(s => s.id);

    if (availableSeatIds.length < remainingStudents.length) {
      setWarning("배치 알고리즘 오류: 사용 가능한 자리가 남은 무작위 학생 수보다 부족합니다.");
      playClickSound(soundEnabled);
      return;
    }

    // 14.6 Fisher-Yates 알고리즘으로 자리 인덱스 무작위 셔플
    const shuffledSeatIds = [...availableSeatIds];
    for (let i = shuffledSeatIds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledSeatIds[i], shuffledSeatIds[j]] = [shuffledSeatIds[j], shuffledSeatIds[i]];
    }

    // 14.7 셔플된 인덱스에 순차 매핑하여 새로운 좌석 배열 생성
    const updatedSeats = seats.map(seat => {
      // X 표시 빈자리는 비워둠
      if (seat.isX) {
        return { ...seat, studentName: null };
      }

      // 고정석은 고정된 학생으로 유지
      if (seat.fixedStudentName) {
        return { ...seat, studentName: seat.fixedStudentName };
      }

      // 셔플된 사용 가능 자리 배열에서 현재 자리의 매칭 순서 조회
      const matchIndex = shuffledSeatIds.indexOf(seat.id);
      if (matchIndex !== -1 && matchIndex < remainingStudents.length) {
        return { ...seat, studentName: remainingStudents[matchIndex].name };
      }

      // 배정 순위 밖의 자리는 공석 처리
      return { ...seat, studentName: null };
    });

    setSeats(updatedSeats);
    setAssigned(true);
    setShuffleCount(prev => prev + 1);
    setWarning(null);
    playShuffleSound(soundEnabled);
  };

  // 15. 고정석 전체 일괄 해제 기능
  const handleClearAllFixed = () => {
    playClickSound(soundEnabled);
    setSeats(prev => 
      prev.map(seat => ({
        ...seat,
        fixedStudentName: null,
        studentName: assigned ? seat.studentName : null
      }))
    );
    showToast('info', '모든 지정 고정석이 일괄 해제되었습니다.');
  };

  // 16. 지정 빈자리(X) 전체 일괄 해제 기능
  const handleClearAllX = () => {
    playClickSound(soundEnabled);
    setSeats(prev => 
      prev.map(seat => ({
        ...seat,
        isX: false,
        studentName: assigned ? seat.studentName : null
      }))
    );
    showToast('info', '모든 X 지정 빈자리가 일괄 해제되었습니다.');
  };

  // 17. 전체 초기화 후 첫 인원 설정 화면으로 복귀
  const handleResetAll = () => {
    playClickSound(soundEnabled);
    setStudentCount(null);
    setStudents([]);
    setSeats([]);
    setAssigned(false);
    setShuffleCount(0);
    setWarning(null);
    setIsFixMode(false);
  };

  // 18. 최초 로딩 중인 경우 로딩 백드롭 표시
  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center font-sans">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
          className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full mb-4"
        />
        <p className="text-slate-500 font-bold tracking-tight text-sm">
          데이터베이스로부터 최근 저장정보를 불러오는 중입니다...
        </p>
      </div>
    );
  }

  // 19. 초기 미선택 상태 시 셀렉터 화면 표시
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

  // 20. 특정 자리에 배치 가능한 고정 가능한 학생 추출 (고정 팝업용)
  const currentlyFixedNames = seats.map(s => s.fixedStudentName).filter(Boolean);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans selection:bg-indigo-500 selection:text-white pb-16">
      
      {/* 20.1 상단 GNB 영역 */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* 타이틀 로고 */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100">
              <GraduationCap className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="font-display font-black text-slate-900 text-xl tracking-tight flex items-center gap-2">
                교실 자리 바꾸기 <span className="text-indigo-600">PRO</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">
                스마트 좌석 배치 시스템 (Database 연동)
              </p>
            </div>
          </div>

          {/* 소리 및 초기화 */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                playClickSound(!soundEnabled);
              }}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-200 text-slate-500 hover:text-slate-800 flex items-center gap-1.5 text-xs font-bold cursor-pointer"
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
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:text-slate-950 flex items-center gap-1.5 transition-all duration-200 cursor-pointer"
            >
              <Undo2 className="w-3.5 h-3.5" />
              학급 재설정
            </button>
          </div>
        </div>
      </header>

      {/* 20.2 경고 메시지 배너 */}
      <AnimatePresence>
        {warning && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-rose-500 text-white font-bold text-xs text-center py-3.5 px-4 shadow-md sticky top-16 z-30 flex items-center justify-center gap-2"
          >
            <span>⚠️ {warning}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 20.3 플로팅 피드백 Toast 알림 (Framer Motion) */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm"
          >
            <div className={`p-4 rounded-2xl shadow-xl border flex items-center gap-3 ${
              toast.type === 'success' 
                ? 'bg-emerald-900 text-emerald-50 border-emerald-800' 
                : toast.type === 'error' 
                  ? 'bg-rose-900 text-rose-50 border-rose-800' 
                  : 'bg-slate-900 text-slate-50 border-slate-800'
            }`}>
              <CheckCircle2 className={`w-5 h-5 flex-shrink-0 ${toast.type === 'success' ? 'text-emerald-400' : 'text-indigo-400'}`} />
              <div className="text-xs font-bold leading-relaxed">{toast.message}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 20.4 메인 화면 레이아웃 (Cols: 12) */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* =======================================
              왼쪽 제어판 및 학생 명단 패널 (Cols: 4)
              ======================================= */}
          <section className="lg:col-span-4 space-y-6">
            
            {/* 데이터베이스 연동용 스티커 */}
            <div className="bg-indigo-900/5 border border-indigo-150 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-xs font-black text-slate-700">Firestore Cloud 연동 중</span>
              </div>
              <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-full px-2 py-0.5">
                실시간 저장 가능
              </span>
            </div>

            {/* 제어판 탭 바 */}
            <div className="bg-slate-200/50 p-1 rounded-xl flex gap-1">
              <button
                onClick={() => { playClickSound(soundEnabled); setActiveTab('placement'); }}
                className={`flex-1 py-2 text-xs font-extrabold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'placement'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                자리배치 및 제어
              </button>
              <button
                onClick={() => { playClickSound(soundEnabled); setActiveTab('students'); }}
                className={`flex-1 py-2 text-xs font-extrabold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'students'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                학생 명단 관리 ({students.length}명)
              </button>
            </div>

            {/* 탭 1: 자리배치 및 제어 패널 */}
            {activeTab === 'placement' && (
              <div className="space-y-6">
                
                {/* 실시간 자리 배치 현황판 */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6">
                  <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Grid3X3 className="w-4 h-4 text-slate-400" />
                    교실 배치 실시간 정보
                  </h2>

                  <div className="grid grid-cols-3 gap-3">
                    {/* 배정 인원 */}
                    <div className="bg-white p-3.5 rounded-2xl border border-slate-250 shadow-xs flex flex-col justify-center items-center text-center">
                      <span className="block text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">총 학생수</span>
                      <div className="text-xl sm:text-2xl font-black text-slate-900">{students.length}명</div>
                    </div>

                    {/* X 지정빈자리 */}
                    <div className="bg-white p-3.5 rounded-2xl border border-slate-250 shadow-xs flex flex-col justify-center items-center text-center">
                      <span className="block text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">제외 (X)</span>
                      <div className="text-xl sm:text-2xl font-black text-rose-500">{seats.filter(s => s.isX).length}석</div>
                    </div>

                    {/* 고정된 좌석 수 */}
                    <div className="bg-white p-3.5 rounded-2xl border border-slate-250 shadow-xs flex flex-col justify-center items-center text-center">
                      <span className="block text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">🔒 고정석</span>
                      <div className="text-xl sm:text-2xl font-black text-amber-500">{seats.filter(s => s.fixedStudentName).length}석</div>
                    </div>
                  </div>

                  <div className="mt-4 bg-indigo-50/50 border border-indigo-100/60 rounded-xl p-3 text-[11px] text-slate-600 space-y-1.5 leading-relaxed">
                    <div className="flex gap-1">
                      <span className="text-indigo-600 font-bold">💡</span>
                      <p>
                        <strong className="text-indigo-900">X (지정 빈자리) 설정:</strong> 아래 모드가 꺼진 일반 상태에서 배치도의 자리를 클릭해 제외시킬 수 있습니다.
                      </p>
                    </div>
                    <div className="flex gap-1 pt-1.5 border-t border-indigo-100">
                      <span className="text-indigo-600 font-bold">💡</span>
                      <p>
                        <strong className="text-indigo-900">고정석(🔒) 지정:</strong> 아래 <strong>'고정석 지정 모드'</strong>를 켠 뒤, 원하는 자리를 클릭하여 지정할 수 있습니다.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 무작위 자리 섞기 및 모드 기어 */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 space-y-5">
                  <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">자리 배치 제어</h2>

                  {/* 모드 전환 토글 (X 지정 vs 고정석 지정) */}
                  <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-3 flex items-center justify-between">
                    <div>
                      <span className="block text-xs font-black text-slate-800">🔒 고정석 지정 모드</span>
                      <span className="text-[10px] text-slate-400 font-bold">체크 시 자리를 클릭해 고정 학생 지정</span>
                    </div>
                    <button
                      onClick={() => {
                        playClickSound(soundEnabled);
                        setIsFixMode(!isFixMode);
                      }}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isFixMode ? 'bg-amber-500' : 'bg-slate-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          isFixMode ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* 무작위 자리배정 버튼 */}
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={handleAssignSeats}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-black py-4 px-6 rounded-2xl shadow-lg shadow-indigo-200 flex items-center justify-center gap-2.5 transition-all duration-200 text-base cursor-pointer"
                  >
                    <Shuffle className="w-5 h-5 stroke-[2.5]" />
                    <span>{assigned ? '다시 무작위 배정' : '무작위 배정 시작'}</span>
                  </motion.button>

                  {/* 데이터베이스 저장 및 불러오기 (보라색/피치 계열 등 다르게 강조된 색상 요구 만족) */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      onClick={handleSavePlacements}
                      disabled={isSaving}
                      className="py-3 px-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-indigo-100"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {isSaving ? '저장 중...' : '현재 자리 저장'}
                    </button>

                    <button
                      onClick={handleLoadDataManual}
                      disabled={isLoadingData}
                      className="py-3 px-3 bg-white border-2 border-violet-600 hover:bg-violet-50 text-violet-700 disabled:opacity-50 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      {isLoadingData ? '불러오는 중...' : '자리 불러오기'}
                    </button>
                  </div>

                  {/* 편리한 일괄 해제 단축키 모음 */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={handleClearAllX}
                      className="py-2 px-1 text-[10px] font-black text-slate-500 hover:text-rose-600 border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer"
                    >
                      ✖ X 지정 일괄 해제
                    </button>
                    <button
                      onClick={handleClearAllFixed}
                      className="py-2 px-1 text-[10px] font-black text-slate-500 hover:text-amber-600 border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer"
                    >
                      🔒 고정석 일괄 해제
                    </button>
                  </div>

                  {/* 섞은 횟수 피드백 배지 */}
                  {shuffleCount > 0 && (
                    <div className="text-center pt-1">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-full px-3 py-1">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                        현재 {shuffleCount}번째 자리 배치 완료!
                      </span>
                    </div>
                  )}
                </div>

                {/* 자리 안내 범례 */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-slate-400" />
                    좌석 상태 범례 안내
                  </h3>
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-[#ecfdf5] border-2 border-emerald-500 flex items-center justify-center font-black text-[#065f46] text-[10px]">
                        학생
                      </div>
                      <span className="text-slate-600 font-bold">무작위 배정 완료 석</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-[#fffbeb] border-2 border-amber-400 flex items-center justify-center text-[#b45309] font-black text-[10px]">
                        🔒
                      </div>
                      <span className="text-slate-600 font-bold">지정 고정석 (위치 보존 대상)</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center text-rose-500 font-black text-[12px]">
                        ×
                      </div>
                      <span className="text-slate-600 font-bold">지정 빈자리 (학생 배치 불가)</span>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* 탭 2: 학생 명단 관리 패널 */}
            {activeTab === 'students' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-black text-slate-900">학급 명단 상세 편집</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">이름 직접 수정 및 명단 추가/삭제</p>
                  </div>
                  <span className="text-xs font-black bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-100">
                    총 {students.length}명
                  </span>
                </div>

                {/* 학생 목록 리스트 스크롤 영역 */}
                <div className="max-h-[350px] overflow-y-auto pr-1 border border-slate-100 rounded-xl p-2 space-y-2.5 bg-slate-50/50">
                  {students.map((student, index) => (
                    <div key={student.id} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-xs">
                      <span className="text-xs font-black text-slate-400 w-6 text-center">
                        {index + 1}
                      </span>
                      <input
                        type="text"
                        value={student.name}
                        onChange={(e) => handleUpdateStudentName(student.id, e.target.value)}
                        className="flex-grow bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded px-2 py-1 text-xs font-bold text-slate-800 outline-none transition-all"
                        placeholder="이름 입력"
                      />
                      <button
                        onClick={() => handleDeleteStudent(student.id)}
                        className="p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                        title="명단에서 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* 제어 영역 */}
                <div className="space-y-2">
                  <button
                    onClick={handleAddStudent}
                    className="w-full py-3 border-2 border-dashed border-indigo-200 hover:border-indigo-400 text-indigo-600 hover:text-indigo-700 bg-white hover:bg-indigo-50/30 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    새로운 학생 추가하기
                  </button>

                  <button
                    onClick={handleSaveStudents}
                    disabled={isSaving}
                    className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-100 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? '저장 처리 중...' : '💾 학생 명단 저장'}
                  </button>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-[10px] text-slate-500 font-semibold space-y-1">
                  <p>• 학생 명단 정보를 수정한 뒤 <strong className="text-slate-800">학생 명단 저장</strong> 버튼을 누르면 Firebase에 안전하게 영구 저장됩니다.</p>
                  <p>• 이름 수정 시 설정되어 있던 고정석 정보도 자동 변경 적용됩니다.</p>
                </div>
              </div>
            )}

          </section>

          {/* =======================================
              오른쪽 교실 4x5 실시간 배치도 (Cols: 8)
              ======================================= */}
          <section className="lg:col-span-8">
            <ClassroomGrid
              seats={seats}
              onClickSeat={handleSeatClick}
              assigned={assigned}
              isFixMode={isFixMode}
            />
          </section>

        </div>
      </main>

      {/* =======================================
          고정석 지정 모달 팝업 레이어 (정밀 UI)
          ======================================= */}
      <AnimatePresence>
        {selectedSeatForFix !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            {/* 백드롭 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedSeatForFix(null)}
              className="absolute inset-0 bg-black"
            />

            {/* 다이얼로그 몸체 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 overflow-hidden z-10"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center border border-amber-100">
                    <Lock className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      {seats.find(s => s.id === selectedSeatForFix)?.seatNumber}번 좌석 고정석 지정
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold">이 자리에 상시 고정 배치할 학생을 선택해 주세요.</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSeatForFix(null)}
                  className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 현재 고정석 상태 브리핑 */}
              {seats.find(s => s.id === selectedSeatForFix)?.fixedStudentName && (
                <div className="bg-amber-50 border border-amber-150 rounded-xl p-3 mb-4 text-xs text-[#b45309] font-bold flex items-center justify-between">
                  <span>현재 지정 학생: {seats.find(s => s.id === selectedSeatForFix)?.fixedStudentName}</span>
                  <button
                    onClick={() => handleSelectFixedStudent(selectedSeatForFix, null)}
                    className="px-2.5 py-1 bg-white hover:bg-amber-100 border border-amber-200 text-[#b45309] rounded-lg text-[10px] font-black transition-colors cursor-pointer"
                  >
                    고정 해제
                  </button>
                </div>
              )}

              {/* 학생명단 선택 그리드 */}
              <div className="max-h-[220px] overflow-y-auto p-1 border border-slate-50 bg-slate-50/50 rounded-xl grid grid-cols-2 gap-2 mb-4">
                {students.map((student) => {
                  const isCurrentFixed = seats.find(s => s.id === selectedSeatForFix)?.fixedStudentName === student.name;
                  const isAlreadyFixedElsewhere = currentlyFixedNames.includes(student.name) && !isCurrentFixed;

                  return (
                    <button
                      key={student.id}
                      disabled={isAlreadyFixedElsewhere}
                      onClick={() => handleSelectFixedStudent(selectedSeatForFix, student.name)}
                      className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all text-left flex items-center justify-between ${
                        isCurrentFixed 
                          ? 'bg-amber-500 text-white border-amber-500'
                          : isAlreadyFixedElsewhere
                            ? 'bg-slate-100/80 border-slate-200 text-slate-350 cursor-not-allowed'
                            : 'bg-white border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-slate-700 cursor-pointer'
                      }`}
                    >
                      <span>{student.name}</span>
                      {isCurrentFixed && <Lock className="w-3 h-3 text-white" />}
                      {isAlreadyFixedElsewhere && <span className="text-[9px] text-slate-400 font-bold">타 석 고정됨</span>}
                    </button>
                  );
                })}
              </div>

              {/* 닫기 액션 */}
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedSeatForFix(null)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 text-center cursor-pointer"
                >
                  닫기
                </button>
                <button
                  onClick={() => handleSelectFixedStudent(selectedSeatForFix, null)}
                  className="flex-1 py-3 bg-rose-50 hover:bg-rose-100 rounded-xl text-xs font-black text-rose-600 text-center cursor-pointer"
                >
                  고정 해제
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
