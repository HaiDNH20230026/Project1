package com.leun.event.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.leun.task.entity.Task;
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
import java.time.LocalDateTime;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
public class Event {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private String title;

    private String description;

    private String location;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm")
    private LocalDateTime startTime;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm")
    private LocalDateTime endTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Color color;

    // ========== TRƯỜNG CHO RECURRING EVENTS ==========
    
    /**
     * Loại lặp lại: NONE, DAILY, WEEKLY, MONTHLY, YEARLY, CUSTOM
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RecurrenceType recurrenceType = RecurrenceType.NONE;
    
    /**
     * Số lần lặp lại (null = vô hạn, 0 = không lặp)
     */
    private Integer recurrenceCount;
    
    /**
     * Ngày kết thúc lặp lại (null = không có ngày kết thúc)
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm")
    private LocalDateTime recurrenceEndDate;
    
    /**
     * ID của event gốc (nếu event này là bản sao từ recurring)
     */
    private Long parentEventId;

    // ========== TRƯỜNG MỚI CHO AI SCHEDULING ==========

    /**
     * Loại event: FIXED (cố định), USER_CREATED (người dùng tạo), AI_GENERATED (AI tạo)
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EventType eventType = EventType.USER_CREATED;

    /**
     * Task nguồn - liên kết với task nếu event được tạo từ AI scheduling
     * null nếu không phải AI_GENERATED
     */
    @ManyToOne
    @JoinColumn(name = "source_task_id", foreignKey = @jakarta.persistence.ForeignKey(name = "fk_event_source_task"))
    private Task sourceTask;

    /**
     * Lý do AI chọn slot này (Explainable AI)
     * Giúp người dùng hiểu tại sao AI đề xuất thời gian này
     */
    @Column(length = 1000)
    private String aiExplanation;

    // ========================================

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    @Getter
    public enum Color {
        TOMATO("#FF6347"),
        LIGHT_PINK("#E67C73"),
        TANGERINE("#FFA500"),
        BANANA("#FFE135"),
        SAGE("#BCB88A"),
        BASIL("#0B8043"),
        PEACOCK("#039BE5"),
        BLUEBERRY("#4F86C6"),
        LAVENDER("#E6E6FA"),
        GRAPE("#8E24AA");

        private final String hexCode;

        Color(String hexCode) {
            this.hexCode = hexCode;
        }
    }

    // Constructor cũ (backward compatible)
    public Event(User user, String title, String description, String location,
        LocalDateTime startTime,
        LocalDateTime endTime, Color color) {
        this.user = user;
        this.title = title;
        this.description = description;
        this.location = location;
        this.startTime = startTime;
        this.endTime = endTime;
        this.color = color;
        this.eventType = EventType.USER_CREATED;
    }

    // Constructor mới cho AI-generated events
    public Event(User user, String title, String description, String location,
        LocalDateTime startTime, LocalDateTime endTime, Color color,
        EventType eventType, Task sourceTask, String aiExplanation) {
        this.user = user;
        this.title = title;
        this.description = description;
        this.location = location;
        this.startTime = startTime;
        this.endTime = endTime;
        this.color = color;
        this.eventType = eventType;
        this.sourceTask = sourceTask;
        this.aiExplanation = aiExplanation;
    }
}
