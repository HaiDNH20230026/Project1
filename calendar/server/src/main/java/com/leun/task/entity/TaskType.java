package com.leun.task.entity;

/**
 * Phân loại task theo mục đích sử dụng
 * 
 * SIMPLE: Task đơn giản (uống nước, nghỉ ngơi...) - người dùng tự chọn thời gian
 * DEADLINE: Task có deadline (bài tập, công việc lớn) - AI sẽ đề xuất lịch thực hiện
 */
public enum TaskType {
    SIMPLE,     // Task đơn giản, người dùng tự chọn thời gian
    DEADLINE    // Task có deadline, AI sẽ đề xuất lịch thực hiện
}
