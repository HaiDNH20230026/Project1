package com.leun.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

/**
 * Kết quả đề xuất lịch cho một chu kỳ (2 ngày)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleResult {
    
    private Long taskId;
    private String taskTitle;
    
    /**
     * Thông điệp mô tả kết quả
     */
    private String message;
    
    /**
     * Danh sách proposals cho chu kỳ này
     */
    private List<ScheduleProposal> proposals;
    
    /**
     * Tổng số sessions còn lại cần làm
     */
    private Integer remainingSessions;
    
    /**
     * Số sessions được đề xuất trong chu kỳ này
     */
    private Integer scheduledInThisCycle;
    
    /**
     * Có thể lên lịch thêm sessions không (còn sessions chưa được schedule)
     */
    private Boolean canScheduleMore;
    
    /**
     * Ngày bắt đầu chu kỳ tiếp theo (null nếu không còn)
     */
    private LocalDate nextCycleDate;
}
