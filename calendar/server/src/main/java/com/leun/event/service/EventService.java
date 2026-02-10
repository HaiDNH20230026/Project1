package com.leun.event.service;

import com.leun.event.dto.EventDto;
import com.leun.event.entity.Event;
import com.leun.event.entity.Event.Color;
import com.leun.event.entity.EventType;
import com.leun.event.entity.RecurrenceType;
import com.leun.event.repository.EventRepository;
import com.leun.exception.UnauthorizedAccessException;
import com.leun.task.entity.Task;
import com.leun.task.entity.TaskStatus;
import com.leun.task.repository.TaskRepository;
import com.leun.task.service.TaskService;
import com.leun.user.entity.User;
import com.leun.user.service.UserService;
import jakarta.transaction.Transactional;
import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EventService {

    private final EventRepository eventRepository;
    private final UserService userService;
    private final TaskService taskService;
    private final TaskRepository taskRepository;

    @Transactional
    public void createEvent(String email, EventDto.Request request) throws Exception {

        User user = userService.findUserByEmail(email);

        Event event = new Event();
        event.setUser(user);
        event.setTitle(request.getTitle());
        event.setDescription(request.getDescription());
        event.setLocation(request.getLocation());
        event.setStartTime(request.getStartTime());
        event.setEndTime(request.getEndTime());
        event.setColor(parseColor(request.getColor(), Event.Color.PEACOCK));
        
        // Set các trường mới
        event.setEventType(request.getEventType() != null 
            ? EventType.valueOf(request.getEventType()) 
            : EventType.USER_CREATED);
        
        // Liên kết với task nguồn nếu có
        if (request.getSourceTaskId() != null) {
            Task sourceTask = taskService.findTaskById(request.getSourceTaskId());
            event.setSourceTask(sourceTask);
        }
        
        // Xử lý recurring
        RecurrenceType recurrenceType = RecurrenceType.NONE;
        if (request.getRecurrenceType() != null && !request.getRecurrenceType().isEmpty()) {
            try {
                recurrenceType = RecurrenceType.valueOf(request.getRecurrenceType());
            } catch (IllegalArgumentException e) {
                recurrenceType = RecurrenceType.NONE;
            }
        }
        event.setRecurrenceType(recurrenceType);
        event.setRecurrenceCount(request.getRecurrenceCount());
        event.setRecurrenceEndDate(request.getRecurrenceEndDate());

        // Lưu event gốc
        Event savedEvent = eventRepository.save(event);
        
        // Nếu có recurring, tạo các instance
        if (recurrenceType != RecurrenceType.NONE) {
            createRecurringInstances(user, savedEvent, request);
        }
    }
    
    /**
     * Tạo các event instances cho recurring event
     */
    private void createRecurringInstances(User user, Event parentEvent, EventDto.Request request) {
        RecurrenceType recurrenceType = parentEvent.getRecurrenceType();
        Integer recurrenceCount = request.getRecurrenceCount();
        LocalDateTime recurrenceEndDate = request.getRecurrenceEndDate();
        
        // Mặc định tạo tối đa 52 instances (1 năm cho weekly)
        int maxInstances = recurrenceCount != null ? recurrenceCount : 52;
        if (maxInstances > 100) maxInstances = 100; // Giới hạn tối đa
        
        LocalDateTime currentStart = parentEvent.getStartTime();
        LocalDateTime currentEnd = parentEvent.getEndTime();
        long durationMinutes = ChronoUnit.MINUTES.between(currentStart, currentEnd);
        
        List<Event> instances = new ArrayList<>();
        
        for (int i = 1; i < maxInstances; i++) {
            // Tính thời gian tiếp theo dựa trên loại lặp
            currentStart = calculateNextOccurrence(currentStart, recurrenceType);
            currentEnd = currentStart.plusMinutes(durationMinutes);
            
            // Kiểm tra ngày kết thúc
            if (recurrenceEndDate != null && currentStart.isAfter(recurrenceEndDate)) {
                break;
            }
            
            // Tạo event instance
            Event instance = new Event();
            instance.setUser(user);
            instance.setTitle(parentEvent.getTitle());
            instance.setDescription(parentEvent.getDescription());
            instance.setLocation(parentEvent.getLocation());
            instance.setStartTime(currentStart);
            instance.setEndTime(currentEnd);
            instance.setColor(parentEvent.getColor());
            instance.setEventType(parentEvent.getEventType());
            instance.setRecurrenceType(RecurrenceType.NONE); // Instance không cần recurring
            instance.setParentEventId(parentEvent.getId());
            
            instances.add(instance);
        }
        
        if (!instances.isEmpty()) {
            eventRepository.saveAll(instances);
        }
    }
    
    /**
     * Tính thời điểm xảy ra tiếp theo dựa trên loại lặp
     */
    private LocalDateTime calculateNextOccurrence(LocalDateTime current, RecurrenceType type) {
        switch (type) {
            case DAILY:
                return current.plusDays(1);
            case WEEKLY:
                return current.plusWeeks(1);
            case BIWEEKLY:
                return current.plusWeeks(2);
            case MONTHLY:
                return current.plusMonths(1);
            case YEARLY:
                return current.plusYears(1);
            case WEEKDAYS:
                LocalDateTime next = current.plusDays(1);
                while (next.getDayOfWeek() == DayOfWeek.SATURDAY || 
                       next.getDayOfWeek() == DayOfWeek.SUNDAY) {
                    next = next.plusDays(1);
                }
                return next;
            default:
                return current;
        }
    }

    public EventDto.Response getEventById(Long id, String email) throws Exception {

        Event event = findEventById(id);

        if (!event.getUser().getEmail().equals(email)) {
            throw new UnauthorizedAccessException("You are not authorized to view this event.");
        }

        return EventDto.Response.fromEntity(event);
    }

    @Transactional
    public void updateEventById(Long id, String email, EventDto.Request request) throws Exception {

        Event event = findEventById(id);

        if (!event.getUser().getEmail().equals(email)) {
            throw new UnauthorizedAccessException("You are not authorized to view this event.");
        }

        // Convert color - accept both enum name and hex code
        Color color = parseColor(request.getColor(), event.getColor());

        eventRepository.updateEvent(id,
            request.getTitle(),
            request.getDescription(),
            request.getLocation(),
            request.getStartTime(),
            request.getEndTime(),
            color,
            request.getEventType() != null ? EventType.valueOf(request.getEventType()) : event.getEventType());
    }

    /**
     * Parse color from string - accepts both enum name (e.g., "PEACOCK") and hex code (e.g., "#039BE5")
     */
    private Color parseColor(String colorStr, Color defaultColor) {
        if (colorStr == null || colorStr.isEmpty()) {
            return defaultColor;
        }
        
        // Try to parse as enum name first
        try {
            return Color.valueOf(colorStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            // Not an enum name, try to find by hex code
            for (Color c : Color.values()) {
                if (c.getHexCode().equalsIgnoreCase(colorStr)) {
                    return c;
                }
            }
        }
        
        return defaultColor;
    }

    @Transactional
    public void deleteEventById(Long id, String email) throws Exception {

        Event event = findEventById(id);

        if (!event.getUser().getEmail().equals(email)) {
            throw new UnauthorizedAccessException("You are not authorized to view this event.");
        }

        // Nếu là event AI đã tạo từ task, giảm scheduledSessions
        if (event.getEventType() == EventType.AI_GENERATED && event.getSourceTask() != null) {
            Task task = event.getSourceTask();
            int scheduled = task.getScheduledSessions() != null ? task.getScheduledSessions() : 0;
            if (scheduled > 0) {
                task.setScheduledSessions(scheduled - 1);
                // Cập nhật status nếu không còn session nào được lên lịch
                if (task.getScheduledSessions() == 0 && task.getCompletedSessions() == 0) {
                    task.setStatus(TaskStatus.PENDING);
                }
                taskRepository.save(task);
            }
        }

        eventRepository.deleteById(id);
    }

    public Event findEventById(Long id) throws Exception {
        return eventRepository.findById(id)
            .orElseThrow(() -> new NoSuchElementException("Event Does Not Exist"));
    }

    // ========== METHODS MỚI CHO AI SCHEDULING ==========

    /**
     * Lấy danh sách events cố định (FIXED) - làm constraint cho AI
     */
    public List<Event> getFixedEvents(String email) throws Exception {
        User user = userService.findUserByEmail(email);
        return eventRepository.findFixedEvents(user);
    }

    /**
     * Lấy events cố định trong khoảng thời gian
     */
    public List<Event> getFixedEventsInPeriod(String email, LocalDateTime start, LocalDateTime end) throws Exception {
        User user = userService.findUserByEmail(email);
        return eventRepository.findFixedEventsInPeriod(user, start, end);
    }

    /**
     * Lấy tất cả events trong khoảng thời gian (để tìm slot trống)
     */
    public List<Event> getEventsInPeriod(String email, LocalDateTime start, LocalDateTime end) throws Exception {
        User user = userService.findUserByEmail(email);
        return eventRepository.findEventsOverlappingPeriod(user, start, end);
    }

    /**
     * Tạo event từ AI scheduling
     */
    @Transactional
    public Event createAiGeneratedEvent(String email, Task sourceTask, 
        LocalDateTime startTime, LocalDateTime endTime, String aiExplanation) throws Exception {
        
        User user = userService.findUserByEmail(email);
        
        Event event = new Event();
        event.setUser(user);
        event.setTitle("[AI] " + sourceTask.getTitle());
        event.setDescription("Thực hiện: " + sourceTask.getTitle());
        event.setStartTime(startTime);
        event.setEndTime(endTime);
        event.setColor(Color.PEACOCK);  // Màu mặc định cho AI events
        event.setEventType(EventType.AI_GENERATED);
        event.setSourceTask(sourceTask);
        event.setAiExplanation(aiExplanation);
        
        return eventRepository.save(event);
    }

    /**
     * Xóa tất cả events do AI tạo cho một task (khi cần reschedule)
     */
    @Transactional
    public void deleteAiEventsForTask(Task task) {
        eventRepository.deleteAiGeneratedEventsForTask(task);
    }

    /**
     * Lấy events do AI tạo cho một task
     */
    public List<Event> getAiEventsForTask(Task task) {
        return eventRepository.findEventsBySourceTask(task);
    }
}
