package com.leun.task.entity;

/**
 * Trạng thái của task trong workflow AI scheduling
 */
public enum TaskStatus {
    PENDING,     // Chưa được lên lịch - đang chờ AI đề xuất
    SCHEDULED,   // Đã được AI lên lịch - có event tương ứng
    IN_PROGRESS, // Đang thực hiện - đã hoàn thành ít nhất 1 session (cho task nhiều sessions)
    COMPLETED    // Đã hoàn thành tất cả sessions
}
