package com.leun.task.service;

import com.leun.exception.UnauthorizedAccessException;
import com.leun.task.dto.TaskDto;
import com.leun.task.entity.Priority;
import com.leun.task.entity.Task;
import com.leun.task.entity.TaskScale;
import com.leun.task.entity.TaskStatus;
import com.leun.task.entity.TaskType;
import com.leun.task.repository.TaskRepository;
import com.leun.event.repository.EventRepository;
import com.leun.user.entity.User;
import com.leun.user.service.UserService;
import jakarta.transaction.Transactional;
import java.util.List;
import java.util.NoSuchElementException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final EventRepository eventRepository;
    private final UserService userService;

    @Transactional
    public void createTask(String email, TaskDto.Request request) throws Exception {

        User user = userService.findUserByEmail(email);

        Task task = new Task();
        task.setUser(user);
        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setDueDate(request.getDueDate());
        task.setIsCompleted(request.getIsCompleted() != null ? request.getIsCompleted() : false);
        
        // Set các trường cho AI scheduling
        task.setTaskType(request.getTaskType() != null 
            ? TaskType.valueOf(request.getTaskType()) 
            : TaskType.SIMPLE);
        task.setPriority(request.getPriority() != null 
            ? Priority.valueOf(request.getPriority()) 
            : Priority.MEDIUM);
        task.setScale(request.getScale() != null
            ? TaskScale.valueOf(request.getScale())
            : TaskScale.REGULAR);
        task.setTotalEffortMinutes(request.getTotalEffortMinutes());
        task.setSessionDuration(request.getSessionDuration());
        task.setCompletedSessions(0);
        task.setStatus(TaskStatus.PENDING);
        
        // Backward compatible: nếu có estimatedDuration thì migrate sang totalEffortMinutes
        if (task.getTotalEffortMinutes() == null && request.getEstimatedDuration() != null) {
            task.setTotalEffortMinutes(request.getEstimatedDuration());
            task.setEstimatedDuration(request.getEstimatedDuration());
        }

        taskRepository.save(task);
    }

    public TaskDto.Response getTaskById(Long id, String email) throws Exception {

        Task task = findTaskById(id);

        if (!task.getUser().getEmail().equals(email)) {
            throw new UnauthorizedAccessException("Access Authority Does Not Exist");
        }

        return TaskDto.Response.fromEntity(task);
    }

    @Transactional
    public void updateTaskById(Long id, String email, TaskDto.Request request) throws Exception {

        Task task = findTaskById(id);

        if (!task.getUser().getEmail().equals(email)) {
            throw new UnauthorizedAccessException("Access Authority Does Not Exist");
        }

        // Update các trường cơ bản
        if (request.getTitle() != null) task.setTitle(request.getTitle());
        if (request.getDescription() != null) task.setDescription(request.getDescription());
        if (request.getDueDate() != null) task.setDueDate(request.getDueDate());
        if (request.getIsCompleted() != null) {
            task.setIsCompleted(request.getIsCompleted());
            if (request.getIsCompleted()) {
                task.setStatus(TaskStatus.COMPLETED);
            }
        }
        
        // Update các trường AI scheduling
        if (request.getTaskType() != null) {
            task.setTaskType(TaskType.valueOf(request.getTaskType()));
        }
        if (request.getPriority() != null) {
            task.setPriority(Priority.valueOf(request.getPriority()));
        }
        if (request.getScale() != null) {
            task.setScale(TaskScale.valueOf(request.getScale()));
        }
        if (request.getTotalEffortMinutes() != null) {
            task.setTotalEffortMinutes(request.getTotalEffortMinutes());
        }
        if (request.getSessionDuration() != null) {
            task.setSessionDuration(request.getSessionDuration());
        }
        if (request.getMaxSessions() != null) {
            task.setMaxSessions(request.getMaxSessions() > 0 ? request.getMaxSessions() : null);
        }
        
        // Backward compatible
        if (request.getEstimatedDuration() != null) {
            task.setEstimatedDuration(request.getEstimatedDuration());
            if (task.getTotalEffortMinutes() == null) {
                task.setTotalEffortMinutes(request.getEstimatedDuration());
            }
        }

        taskRepository.save(task);
    }

    @Transactional
    public void deleteTaskById(Long id, String email) throws Exception {
        Task task = findTaskById(id);

        if (!task.getUser().getEmail().equals(email)) {
            throw new UnauthorizedAccessException("Access Authority Does Not Exist");
        }

        // Delete all events associated with this task (includes AI generated and any other linked events)
        eventRepository.deleteAllEventsForTask(task);

        taskRepository.deleteById(id);
    }

    public Task findTaskById(Long id) throws Exception {
        return taskRepository.findById(id)
            .orElseThrow(() -> new NoSuchElementException("Task Does Not Exist"));
    }

    // ========== METHODS CHO AI SCHEDULING ==========

    /**
     * Lấy danh sách tasks DEADLINE đang PENDING cần AI lên lịch
     */
    public List<Task> getPendingDeadlineTasks(String email) throws Exception {
        User user = userService.findUserByEmail(email);
        return taskRepository.findPendingDeadlineTasks(user);
    }

    /**
     * Cập nhật status của task
     */
    @Transactional
    public void updateTaskStatus(Long id, String email, TaskStatus newStatus) throws Exception {
        Task task = findTaskById(id);

        if (!task.getUser().getEmail().equals(email)) {
            throw new UnauthorizedAccessException("Access Authority Does Not Exist");
        }

        task.setStatus(newStatus);
        if (newStatus == TaskStatus.COMPLETED) {
            task.setIsCompleted(true);
        }
        taskRepository.save(task);
    }

    /**
     * Tăng số sessions đã hoàn thành
     */
    @Transactional
    public void incrementCompletedSessions(Long id, String email) throws Exception {
        Task task = findTaskById(id);

        if (!task.getUser().getEmail().equals(email)) {
            throw new UnauthorizedAccessException("Access Authority Does Not Exist");
        }

        int completed = (task.getCompletedSessions() != null ? task.getCompletedSessions() : 0) + 1;
        task.setCompletedSessions(completed);
        
        // Chỉ cập nhật status IN_PROGRESS, KHÔNG tự động đánh dấu COMPLETED
        // Task chỉ COMPLETED khi người dùng tick checkbox
        if (!Boolean.TRUE.equals(task.getIsCompleted()) && 
            (task.getStatus() == TaskStatus.PENDING || task.getStatus() == TaskStatus.SCHEDULED)) {
            task.setStatus(TaskStatus.IN_PROGRESS);
        }
        
        taskRepository.save(task);
    }

    /**
     * Toggle task completion status (tick/untick checkbox)
     * Đây là cách DUY NHẤT để đánh dấu task hoàn thành
     */
    @Transactional
    public void toggleTaskCompletion(Long id, String email, boolean isCompleted) throws Exception {
        Task task = findTaskById(id);

        if (!task.getUser().getEmail().equals(email)) {
            throw new UnauthorizedAccessException("Access Authority Does Not Exist");
        }

        task.setIsCompleted(isCompleted);
        if (isCompleted) {
            task.setStatus(TaskStatus.COMPLETED);
        } else {
            // Khi untick, quay lại status dựa trên sessions
            int completed = task.getCompletedSessions() != null ? task.getCompletedSessions() : 0;
            int scheduled = task.getScheduledSessions() != null ? task.getScheduledSessions() : 0;
            
            if (completed > 0) {
                task.setStatus(TaskStatus.IN_PROGRESS);
            } else if (scheduled > 0) {
                task.setStatus(TaskStatus.SCHEDULED);
            } else {
                task.setStatus(TaskStatus.PENDING);
            }
        }
        
        taskRepository.save(task);
    }

    /**
     * Lấy tasks chưa hoàn thành, sắp xếp theo priority và deadline
     */
    public List<Task> getUncompletedDeadlineTasksSorted(String email) throws Exception {
        User user = userService.findUserByEmail(email);
        return taskRepository.findUncompletedDeadlineTasksSorted(user);
    }

    /**
     * Lấy tasks còn sessions chưa scheduled
     */
    public List<Task> getTasksNeedingMoreSessions(String email) throws Exception {
        User user = userService.findUserByEmail(email);
        return taskRepository.findTasksWithRemainingSessions(user);
    }
}
