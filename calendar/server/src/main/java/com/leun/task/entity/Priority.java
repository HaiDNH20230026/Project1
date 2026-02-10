package com.leun.task.entity;

/**
 * Mức độ ưu tiên của task
 * Dùng cho AI scheduling để xếp hạng và xử lý xung đột
 */
public enum Priority {
    HIGH,       // Ưu tiên cao - cần làm ngay, gần deadline
    MEDIUM,     // Ưu tiên trung bình - mặc định
    LOW         // Ưu tiên thấp - có thể dời lịch khi cần
}
