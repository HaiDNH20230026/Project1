package com.leun.task.dto;

import com.leun.task.entity.Task;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

public class TaskDto {

    @Getter
    @Setter
    public static class Response {
        private Long id;
        private String title;
        private String description;
        private LocalDateTime dueDate;
        private Boolean isCompleted;
        // Trường cho AI scheduling
        private String taskType;
        private String priority;
        private String status;
        private String scale;
        private Integer totalEffortMinutes;
        private Integer sessionDuration;
        private Integer scheduledSessions;
        private Integer completedSessions;
        private Integer maxSessions;
        // Computed fields
        private Integer requiredSessions;
        private Integer remainingSessions;
        private Integer progressPercent;
        // Backward compatible
        @Deprecated
        private Integer estimatedDuration;

        // Constructor cũ (backward compatible)
        public Response(Long id, String title, String description, LocalDateTime dueDate,
            Boolean isCompleted) {
            this.id = id;
            this.title = title;
            this.description = description;
            this.dueDate = dueDate;
            this.isCompleted = isCompleted;
        }

        // Constructor mới với đầy đủ trường
        public Response(Long id, String title, String description, LocalDateTime dueDate,
            Boolean isCompleted, String taskType, String priority, String status,
            String scale, Integer totalEffortMinutes, Integer sessionDuration,
            Integer scheduledSessions, Integer completedSessions, Integer maxSessions,
            Integer requiredSessions, 
            Integer remainingSessions, Integer progressPercent, Integer estimatedDuration) {
            this.id = id;
            this.title = title;
            this.description = description;
            this.dueDate = dueDate;
            this.isCompleted = isCompleted;
            this.taskType = taskType;
            this.priority = priority;
            this.status = status;
            this.scale = scale;
            this.totalEffortMinutes = totalEffortMinutes;
            this.sessionDuration = sessionDuration;
            this.scheduledSessions = scheduledSessions;
            this.completedSessions = completedSessions;
            this.maxSessions = maxSessions;
            this.requiredSessions = requiredSessions;
            this.remainingSessions = remainingSessions;
            this.progressPercent = progressPercent;
            this.estimatedDuration = estimatedDuration;
        }

        public static Response fromEntity(Task task) {
            return new Response(
                task.getId(),
                task.getTitle(),
                task.getDescription(),
                task.getDueDate(),
                task.getIsCompleted(),
                task.getTaskType() != null ? task.getTaskType().name() : null,
                task.getPriority() != null ? task.getPriority().name() : null,
                task.getStatus() != null ? task.getStatus().name() : null,
                task.getScale() != null ? task.getScale().name() : null,
                task.getTotalEffortMinutes(),
                task.getSessionDuration(),
                task.getScheduledSessions(),
                task.getCompletedSessions(),
                task.getMaxSessions(),
                task.getRequiredSessions(),
                task.getRemainingSessions(),
                task.getProgressPercent(),
                task.getEstimatedDuration()
            );
        }
    }

    @Getter
    @Setter
    public static class Request {
        private String title;
        private String description;
        private LocalDateTime dueDate;
        private Boolean isCompleted;
        // Trường cho AI scheduling
        private String taskType;          // SIMPLE / DEADLINE
        private String priority;          // HIGH / MEDIUM / LOW
        private String scale;             // QUICK / REGULAR / PROJECT
        private Integer totalEffortMinutes;   // Tổng thời gian cần (phút)
        private Integer sessionDuration;      // Thời lượng mỗi session (phút)
        private Integer maxSessions;             // Số sessions tối đa (override computed)
        // Backward compatible
        @Deprecated
        private Integer estimatedDuration;
    }
}
