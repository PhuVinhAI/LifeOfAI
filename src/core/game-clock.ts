import type { GameTimeData } from '../types/index.js';

const DAYS_OF_WEEK = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
const MONTHS = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export class GameClock {
  minute: number;
  hour: number;
  day: number;
  month: number;
  year: number;

  constructor(data?: Partial<GameTimeData>) {
    const now = new Date();
    this.year = data?.year ?? now.getFullYear();
    this.month = data?.month ?? now.getMonth() + 1;
    this.day = data?.day ?? now.getDate();
    this.hour = data?.hour ?? 7;  // Start at 7am
    this.minute = data?.minute ?? 0;
  }

  get dayOfWeek(): string {
    // Zeller-ish: use a reference point. 2026-01-05 is a Monday (Thứ 2)
    const ref = new Date(2026, 0, 5);
    const cur = new Date(this.year, this.month - 1, this.day);
    const diffDays = Math.floor((cur.getTime() - ref.getTime()) / 86400000);
    return DAYS_OF_WEEK[((diffDays % 7) + 7) % 7]!;
  }

  advance(minutes: number): number {
    if (minutes <= 0) return 0;
    let total = this.minute + minutes;
    this.minute = total % 60;
    let extraHours = Math.floor(total / 60);
    if (extraHours > 0) {
      total = this.hour + extraHours;
      this.hour = total % 24;
      let extraDays = Math.floor(total / 24);
      while (extraDays > 0) {
        this.day++;
        const maxDays = this.daysInMonth();
        if (this.day > maxDays) {
          this.day = 1;
          this.month++;
          if (this.month > 12) {
            this.month = 1;
            this.year++;
          }
        }
        extraDays--;
      }
    }
    return minutes;
  }

  /** Total absolute minute count since year 0 — monotonic, useful for caches. */
  toTotalMinutes(): number {
    return ((this.year * 12 + (this.month - 1)) * 31 + (this.day - 1)) * 24 * 60
      + this.hour * 60 + this.minute;
  }

  formatTime(): string {
    const h = String(this.hour).padStart(2, '0');
    const m = String(this.minute).padStart(2, '0');
    return `${h}:${m}`;
  }

  formatFull(): string {
    return `${this.dayOfWeek}, ${this.formatTime()}, ngày ${this.day}/${this.month}/${this.year}`;
  }

  formatDisplay(): string {
    const h = String(this.hour).padStart(2, '0');
    const m = String(this.minute).padStart(2, '0');
    return `${this.dayOfWeek} ${h}:${m} — ${this.day}/${this.month}/${this.year}`;
  }

  toJSON(): GameTimeData {
    return {
      minute: this.minute,
      hour: this.hour,
      day: this.day,
      month: this.month,
      year: this.year,
    };
  }

  static fromJSON(data: GameTimeData): GameClock {
    return new GameClock(data);
  }

  private daysInMonth(): number {
    const d = DAYS_IN_MONTH[this.month - 1] ?? 31;
    if (this.month === 2 && this.isLeapYear()) return 29;
    return d;
  }

  private isLeapYear(): boolean {
    return (this.year % 4 === 0 && this.year % 100 !== 0) || (this.year % 400 === 0);
  }
}
