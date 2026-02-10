package com.leun.task.repository;

import com.leun.task.entity.Priority;
import com.leun.task.entity.Task;
import com.leun.task.entity.TaskStatus;
import com.leun.task.entity.TaskType;
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
public interface TaskRepository extends JpaRepository<Task, Long> {

    @Query("SELECT t FROM Task t WHERE t.user = :user")
    List<Task> findTasksByUser(@Param("user") User user);

    @Query("SELECT t FROM Task t WHERE t.user = :user AND t.dueDate >= :start AND t.dueDate < :end")
    List<Task> findTasksByUserAndPeriod(@Param("user") User user, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    // ========== QUERY CHO AI SCHEDULING ==========

    /**
     * Lấy tasks PENDING cần được AI lên lịch
     */
    @Query("SELECT t FROM Task t WHERE t.user = :user AND t.status = 'PENDING' AND t.taskType = 'DEADLINE' ORDER BY t.priority DESC, t.dueDate ASC")
    List<Task> findPendingDeadlineTasks(@Param("user") User user);

    /**
     * Lấy tasks theo status
     */
    @Query("SELECT t FROM Task t WHERE t.user = :user AND t.status = :status")
    List<Task> findTasksByUserAndStatus(@Param("user") User user, @Param("status") TaskStatus status);

    /**
     * Lấy tasks theo priority, sắp xếp theo deadline
     */
    @Query("SELECT t FROM Task t WHERE t.user = :user AND t.priority = :priority ORDER BY t.dueDate ASC")
    List<Task> findTasksByUserAndPriority(@Param("user") User user, @Param("priority") Priority priority);

    /**
     * Lấy tasks DEADLINE chưa hoàn thành, sắp xếp theo priority và deadline
     */
    @Query("SELECT t FROM Task t WHERE t.user = :user AND t.taskType = 'DEADLINE' AND t.status != 'COMPLETED' ORDER BY t.priority DESC, t.dueDate ASC")
    List<Task> findUncompletedDeadlineTasksSorted(@Param("user") User user);

    /**
     * Lấy tasks còn sessions chưa được schedule
     * Task cần thêm sessions khi: status != COMPLETED và còn sessions chưa làm
     */
    @Query("SELECT t FROM Task t WHERE t.user = :user AND t.taskType = 'DEADLINE' AND t.status != 'COMPLETED' " +
           "ORDER BY t.priority DESC, t.dueDate ASC")
    List<Task> findTasksWithRemainingSessions(@Param("user") User user);

    /**
     * Lấy tasks theo scale
     */
    @Query("SELECT t FROM Task t WHERE t.user = :user AND t.scale = :scale AND t.status != 'COMPLETED'")
    List<Task> findTasksByScale(@Param("user") User user, @Param("scale") String scale);
}
