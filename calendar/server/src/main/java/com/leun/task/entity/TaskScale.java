package com.leun.task.entity;

/**
 * Quy mô của task - giúp AI ước tính thời gian và số sessions cần thiết
 */
public enum TaskScale {
    
    /**
     * Task nhanh: 15-60 phút, làm 1 lần là xong
     * VD: Trả lời email, gọi điện, đọc tài liệu ngắn, nộp bài
     */
    QUICK,
    
    /**
     * Task bình thường: 1-4 tiếng, có thể chia 1-2 sessions
     * VD: Làm bài tập, viết báo cáo ngắn, họp, ôn bài
     */
    REGULAR,
    
    /**
     * Dự án lớn: Nhiều tiếng, cần chia thành nhiều sessions trong nhiều ngày
     * VD: Bài tập lớn, Project cá nhân, Ôn thi, Nghiên cứu, Luận văn
     */
    PROJECT
}
