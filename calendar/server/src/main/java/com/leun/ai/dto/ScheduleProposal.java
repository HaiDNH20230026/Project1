package com.leun.ai.dto;

import java.time.LocalDateTime;
import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Builder;

/**
 * Đề xuất lịch từ AI cho một task
 * Mỗi proposal = 1 event được đề xuất (1 session)
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ScheduleProposal {
    
    private Long taskId;
    private String taskTitle;
    private LocalDateTime proposedStartTime;
    private LocalDateTime proposedEndTime;
    private String explanation; 
    private int score;
    
    // ========== THÔNG TIN BỔ SUNG ==========
    
    /**
     * Session number (1-based) trong tổng số sessions
     * VD: session 3/14
     */
    private int sessionNumber;
    
    /**
     * Tổng số sessions cần thiết cho task
     */
    private int totalSessions;
}
