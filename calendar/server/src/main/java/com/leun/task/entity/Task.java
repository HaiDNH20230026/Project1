package com.leun.task.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.leun.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Transient;
import java.time.LocalDateTime;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private String title;

    private String description;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm")
    private LocalDateTime dueDate;

    // ========== TRƯỜNG CHO AI SCHEDULING ==========

    /**
     * Loại task: SIMPLE (đơn giản) hoặc DEADLINE (có deadline, AI sẽ lên lịch)
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TaskType taskType = TaskType.SIMPLE;

    /**
     * Mức độ ưu tiên: HIGH, MEDIUM, LOW
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Priority priority = Priority.MEDIUM;

    /**
     * Trạng thái: PENDING, SCHEDULED, IN_PROGRESS, COMPLETED
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TaskStatus status = TaskStatus.PENDING;

    /**
     * Quy mô task: QUICK (nhanh), REGULAR (bình thường), PROJECT (dự án lớn)
     * Giúp AI ước tính thời gian và số sessions cần thiết
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TaskScale scale = TaskScale.REGULAR;

    /**
     * Tổng thời gian cần để hoàn thành (phút)
     * - QUICK: 15-60 phút (1 session)
     * - REGULAR: 60-240 phút (1-2 sessions)
     * - PROJECT: nhiều tiếng (nhiều sessions trong nhiều ngày)
     */
    private Integer totalEffortMinutes;

    /**
     * Thời lượng mỗi session làm việc (phút)
     * AI sẽ tạo nhiều events, mỗi event có độ dài này
     * Mặc định: 60 phút
     */
    private Integer sessionDuration;

    /**
     * Số sessions tối đa mà user muốn tạo (override computed value)
     * Nếu null → tính tự động từ totalEffortMinutes / sessionDuration
     */
    private Integer maxSessions;

    /**
     * Số sessions đã được lập lịch (AI đã tạo event)
     */
    private Integer scheduledSessions = 0;

    /**
     * Số sessions đã hoàn thành
     */
    private Integer completedSessions = 0;

    /**
     * @deprecated Dùng totalEffortMinutes thay thế. Giữ lại để backward compatible.
     */
    @Deprecated
    private Integer estimatedDuration;

    // ========== GIỮ LẠI ĐỂ BACKWARD COMPATIBLE ==========
    private Boolean isCompleted;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        // Đồng bộ status với isCompleted
        if (this.isCompleted != null && this.isCompleted) {
            this.status = TaskStatus.COMPLETED;
        }
        // Migrate estimatedDuration -> totalEffortMinutes (backward compatible)
        if (this.totalEffortMinutes == null && this.estimatedDuration != null) {
            this.totalEffortMinutes = this.estimatedDuration;
        }
        // Set default totalEffort based on scale nếu chưa có
        if (this.totalEffortMinutes == null) {
            this.totalEffortMinutes = getDefaultEffortForScale();
        }
        // Set default sessionDuration based on scale nếu chưa có
        if (this.sessionDuration == null) {
            this.sessionDuration = getDefaultSessionForScale();
        }
    }

    // ========== HELPER METHODS ==========

    /**
     * Lấy tổng thời gian cần thiết (phút), dùng default nếu chưa set
     */
    @Transient
    public Integer getEffectiveTotalEffort() {
        if (this.totalEffortMinutes != null && this.totalEffortMinutes > 0) {
            return this.totalEffortMinutes;
        }
        // Fallback to estimatedDuration for backward compatible
        if (this.estimatedDuration != null && this.estimatedDuration > 0) {
            return this.estimatedDuration;
        }
        return getDefaultEffortForScale();
    }

    /**
     * Lấy thời lượng mỗi session, dùng default nếu chưa set
     */
    @Transient
    public Integer getEffectiveSessionDuration() {
        if (this.sessionDuration != null && this.sessionDuration > 0) {
            return Math.min(this.sessionDuration, 150); // Max 2.5 tiếng/session
        }
        return getDefaultSessionForScale();
    }

    /**
     * Tính số sessions cần thiết để hoàn thành task
     * Nếu user đã set maxSessions → dùng giá trị đó
     * Nếu không → tính tự động từ totalEffort / sessionDuration
     */
    @Transient
    public int getRequiredSessions() {
        if (this.maxSessions != null && this.maxSessions > 0) {
            return this.maxSessions;
        }
        int total = getEffectiveTotalEffort();
        int session = getEffectiveSessionDuration();
        return (int) Math.ceil((double) total / session);
    }

    /**
     * Tính số sessions còn lại cần làm (dựa trên completed)
     */
    @Transient
    public int getRemainingSessions() {
        int completed = completedSessions != null ? completedSessions : 0;
        return Math.max(0, getRequiredSessions() - completed);
    }

    /**
     * Tính số sessions chưa được lên lịch (dùng cho AI scheduling)
     */
    @Transient
    public int getUnscheduledSessions() {
        int scheduled = scheduledSessions != null ? scheduledSessions : 0;
        return Math.max(0, getRequiredSessions() - scheduled);
    }

    /**
     * Tính thời gian còn lại cần làm (phút)
     */
    @Transient
    public int getRemainingEffortMinutes() {
        int completed = (completedSessions != null ? completedSessions : 0) * getEffectiveSessionDuration();
        return Math.max(0, getEffectiveTotalEffort() - completed);
    }

    /**
     * Kiểm tra task đã hoàn thành tất cả sessions chưa
     */
    @Transient
    public boolean isAllSessionsCompleted() {
        return getRemainingSessions() <= 0;
    }

    /**
     * Tính % hoàn thành dựa trên sessions
     */
    @Transient
    public int getProgressPercent() {
        int required = getRequiredSessions();
        if (required <= 0) return 100;
        int completed = completedSessions != null ? completedSessions : 0;
        return Math.min(100, (completed * 100) / required);
    }

    private Integer getDefaultEffortForScale() {
        if (this.scale == null) return 60;
        return switch (this.scale) {
            case QUICK -> 30;      // 30 phút
            case REGULAR -> 120;   // 2 tiếng
            case PROJECT -> 600;   // 10 tiếng (cần nhiều sessions)
        };
    }

    private Integer getDefaultSessionForScale() {
        if (this.scale == null) return 60;
        return switch (this.scale) {
            case QUICK -> 30;      // 30 phút/session
            case REGULAR -> 60;    // 1 tiếng/session
            case PROJECT -> 90;    // 1.5 tiếng/session
        };
    }

    // ========== CONSTRUCTORS ==========

    // Constructor cũ (backward compatible)
    public Task(User user, String title, String description, LocalDateTime dueDate,
        Boolean isCompleted) {
        this.user = user;
        this.title = title;
        this.description = description;
        this.dueDate = dueDate;
        this.isCompleted = isCompleted;
        this.taskType = TaskType.SIMPLE;
        this.priority = Priority.MEDIUM;
        this.scale = TaskScale.REGULAR;
        this.status = isCompleted != null && isCompleted ? TaskStatus.COMPLETED : TaskStatus.PENDING;
        this.completedSessions = 0;
    }

    // Constructor mới với đầy đủ trường
    public Task(User user, String title, String description, LocalDateTime dueDate,
        TaskType taskType, Priority priority, TaskScale scale,
        Integer totalEffortMinutes, Integer sessionDuration) {
        this.user = user;
        this.title = title;
        this.description = description;
        this.dueDate = dueDate;
        this.taskType = taskType;
        this.priority = priority;
        this.scale = scale != null ? scale : TaskScale.REGULAR;
        this.totalEffortMinutes = totalEffortMinutes;
        this.sessionDuration = sessionDuration;
        this.status = TaskStatus.PENDING;
        this.isCompleted = false;
        this.completedSessions = 0;
    }

    // Constructor backward compatible với estimatedDuration
    @Deprecated
    public Task(User user, String title, String description, LocalDateTime dueDate,
        TaskType taskType, Priority priority, Integer estimatedDuration) {
        this.user = user;
        this.title = title;
        this.description = description;
        this.dueDate = dueDate;
        this.taskType = taskType;
        this.priority = priority;
        this.scale = TaskScale.REGULAR;
        this.estimatedDuration = estimatedDuration;
        this.totalEffortMinutes = estimatedDuration;
        this.status = TaskStatus.PENDING;
        this.isCompleted = false;
        this.completedSessions = 0;
    }
}
