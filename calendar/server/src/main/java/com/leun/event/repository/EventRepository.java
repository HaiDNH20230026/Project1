package com.leun.event.repository;

import com.leun.event.entity.Event;
import com.leun.event.entity.Event.Color;
import com.leun.event.entity.EventType;
import com.leun.task.entity.Task;
import com.leun.user.entity.User;
import jakarta.transaction.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {

    @Modifying
    @Transactional
    @Query("UPDATE Event e SET e.title = :title, e.description = :description, e.location = :location, e.startTime = :startTime, e.endTime = :endTime, e.color = :color, e.eventType = :eventType WHERE e.id = :id")
    void updateEvent(@Param("id") Long id,
        @Param("title") String title,
        @Param("description") String description,
        @Param("location") String location,
        @Param("startTime") LocalDateTime startTime,
        @Param("endTime") LocalDateTime endTime,
        @Param("color") Color color,
        @Param("eventType") EventType eventType);

    // Giữ method cũ để backward compatible
    @Modifying
    @Transactional
    @Query("UPDATE Event e SET e.title = :title, e.description = :description, e.location = :location, e.startTime = :startTime, e.endTime = :endTime, e.color = :color WHERE e.id = :id")
    void updateEventBasic(@Param("id") Long id,
        @Param("title") String title,
        @Param("description") String description,
        @Param("location") String location,
        @Param("startTime") LocalDateTime startTime,
        @Param("endTime") LocalDateTime endTime,
        @Param("color") Color color);

    @Query("SELECT e FROM Event e WHERE e.user = :user")
    List<Event> findEventsByUser(@Param("user") User user);

    @Query("SELECT e FROM Event e WHERE e.user = :user AND e.startTime >= :start AND e.endTime < :end")
    List<Event> findEventsByUserAndPeriod(@Param("user") User user, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    // ========== QUERY MỚI CHO AI SCHEDULING ==========

    /**
     * Lấy events cố định (FIXED) - AI không được thay đổi
     */
    @Query("SELECT e FROM Event e WHERE e.user = :user AND e.eventType = 'FIXED'")
    List<Event> findFixedEvents(@Param("user") User user);

    /**
     * Lấy events cố định trong khoảng thời gian
     */
    @Query("SELECT e FROM Event e WHERE e.user = :user AND e.eventType = 'FIXED' AND e.startTime >= :start AND e.endTime <= :end")
    List<Event> findFixedEventsInPeriod(@Param("user") User user, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    /**
     * Lấy events do AI tạo
     */
    @Query("SELECT e FROM Event e WHERE e.user = :user AND e.eventType = 'AI_GENERATED'")
    List<Event> findAiGeneratedEvents(@Param("user") User user);

    /**
     * Lấy events liên kết với một task cụ thể
     */
    @Query("SELECT e FROM Event e WHERE e.sourceTask = :task")
    List<Event> findEventsBySourceTask(@Param("task") Task task);

    /**
     * Lấy tất cả events trong khoảng thời gian (để tìm slot trống)
     */
    @Query("SELECT e FROM Event e WHERE e.user = :user AND ((e.startTime >= :start AND e.startTime < :end) OR (e.endTime > :start AND e.endTime <= :end) OR (e.startTime <= :start AND e.endTime >= :end)) ORDER BY e.startTime ASC")
    List<Event> findEventsOverlappingPeriod(@Param("user") User user, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    /**
     * Kiểm tra xung đột với events cố định trong khoảng thời gian (cho creative AI)
     */
    @Query("SELECT e FROM Event e WHERE e.user = :user AND e.eventType = 'FIXED' AND e.startTime < :end AND e.endTime > :start")
    List<Event> findFixedEventsInRange(@Param("user") User user, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    /**
     * Xóa events do AI tạo cho một task
     */
    @Modifying
    @Transactional
    @Query("DELETE FROM Event e WHERE e.sourceTask = :task AND e.eventType = 'AI_GENERATED'")
    void deleteAiGeneratedEventsForTask(@Param("task") Task task);

    /**
     * Xóa tất cả events liên kết với một task (dùng khi xóa task)
     */
    @Modifying
    @Transactional
    @Query("DELETE FROM Event e WHERE e.sourceTask = :task")
    void deleteAllEventsForTask(@Param("task") Task task);
}
