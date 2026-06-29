/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Seat {
  id: number; // 0-based index (0 to 19)
  seatNumber: number; // 1-based display number (1 to 20)
  isX: boolean; // Teacher designated empty seat
  studentName: string | null; // Student name assigned (e.g., "학생 1") or null
}
