package com.leun.event.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.leun.event.entity.Event;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

public class EventDto {

    @Getter
    @Setter
    public static class Response {
        private Long id;
        private String title;
        private String description;
        private String location;
        private LocalDateTime startTime;
        private LocalDateTime endTime;
        private String color;
        // Trường mới cho AI scheduling
        private String eventType;      // FIXED / USER_CREATED / AI_GENERATED
        private Long sourceTaskId;     // ID task nguồn (nếu AI_GENERATED)
        private String aiExplanation;  // Lý do AI chọn slot này
        // Trường cho recurring events
        private String recurrenceType; // NONE, DAILY, WEEKLY, MONTHLY, YEARLY, WEEKDAYS
        private Integer recurrenceCount; // Số lần lặp (null = vô hạn)
        private LocalDateTime recurrenceEndDate;
        private Long parentEventId;    // ID event gốc nếu là recurring instance

        // Constructor cũ (backward compatible)
        public Response(Long id, String title, String description, String location,
            LocalDateTime startTime,
            LocalDateTime endTime, String color) {
            this.id = id;
            this.title = title;
            this.description = description;
            this.location = location;
            this.startTime = startTime;
            this.endTime = endTime;
            this.color = color;
        }

        // Constructor mới với đầy đủ trường
        public Response(Long id, String title, String description, String location,
            LocalDateTime startTime, LocalDateTime endTime, String color,
            String eventType, Long sourceTaskId, String aiExplanation) {
            this.id = id;
            this.title = title;
            this.description = description;
            this.location = location;
            this.startTime = startTime;
            this.endTime = endTime;
            this.color = color;
            this.eventType = eventType;
            this.sourceTaskId = sourceTaskId;
            this.aiExplanation = aiExplanation;
        }

        public static Response fromEntity(Event event) {
            Response response = new Response(
                event.getId(),
                event.getTitle(),
                event.getDescription(),
                event.getLocation(),
                event.getStartTime(),
                event.getEndTime(),
                event.getColor() != null ? event.getColor().getHexCode() : null,
                event.getEventType() != null ? event.getEventType().name() : null,
                event.getSourceTask() != null ? event.getSourceTask().getId() : null,
                event.getAiExplanation()
            );
            // Add recurrence info
            response.setRecurrenceType(event.getRecurrenceType() != null ? event.getRecurrenceType().name() : "NONE");
            response.setRecurrenceCount(event.getRecurrenceCount());
            response.setRecurrenceEndDate(event.getRecurrenceEndDate());
            response.setParentEventId(event.getParentEventId());
            return response;
        }
    }

    @Getter
    @Setter
    public static class Request {
        private String title;
        private String description;
        private String location;
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm")
        private LocalDateTime startTime;
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm")
        private LocalDateTime endTime;
        private String color;
        // Trường mới cho AI scheduling
        private String eventType;      // FIXED / USER_CREATED / AI_GENERATED
        private Long sourceTaskId;     // ID task nguồn (nếu AI_GENERATED)
        // Trường cho recurring events
        private String recurrenceType; // NONE, DAILY, WEEKLY, MONTHLY, YEARLY, WEEKDAYS
        private Integer recurrenceCount; // Số lần lặp (null = vô hạn)
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm")
        private LocalDateTime recurrenceEndDate;
    }
}