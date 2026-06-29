/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Student {
  id: string; // 고유 ID
  name: string; // 학생 이름
}

export interface Seat {
  id: number; // 0-based index (0 to 19)
  seatNumber: number; // 1-based display number (1 to 20)
  isX: boolean; // 교사가 지정한 빈자리 여부
  studentName: string | null; // 현재 배치된 학생 이름 (없으면 null)
  fixedStudentName: string | null; // 이 자리에 고정된 학생 이름 (없으면 null)
}

