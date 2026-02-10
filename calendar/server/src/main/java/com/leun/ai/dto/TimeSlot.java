package com.leun.ai.dto;

import java.time.LocalDateTime;
import java.time.Duration;
import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

/**
 * Đại diện một khoảng thời gian trống có thể sử dụng
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class TimeSlot {
    
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    
    public long getDurationMinutes() {
        return Duration.between(startTime, endTime).toMinutes();
    }
    
    public boolean canFit(int requiredMinutes) {
        return getDurationMinutes() >= requiredMinutes;
    }
}
