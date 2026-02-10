package com.leun.event.entity;

/**
 * Phân loại event theo nguồn gốc
 * Dùng cho AI scheduling để xác định event nào có thể thay đổi
 */
public enum EventType {
    FIXED,          // Lịch cố định (thời khóa biểu, họp) - AI KHÔNG được thay đổi
    USER_CREATED,   // Người dùng tự tạo - có thể điều chỉnh nếu cần
    AI_GENERATED    // AI tạo từ task deadline - có thể reschedule
}
