package com.leun.event.entity;

/**
 * Loại lặp lại của event
 */
public enum RecurrenceType {
    NONE,           // Không lặp lại
    DAILY,          // Hàng ngày
    WEEKLY,         // Hàng tuần
    BIWEEKLY,       // 2 tuần một lần
    MONTHLY,        // Hàng tháng
    YEARLY,         // Hàng năm
    WEEKDAYS        // Các ngày trong tuần (Thứ 2 - Thứ 6)
}
