package com.leun.ai.service;

import com.leun.ai.dto.ScheduleProposal;
import com.leun.ai.dto.ScheduleResult;
import com.leun.ai.dto.TimeSlot;
import com.leun.event.entity.Event;
import com.leun.event.entity.Event.Color;
import com.leun.event.entity.EventType;
import com.leun.event.entity.RecurrenceType;
import com.leun.event.repository.EventRepository;
import com.leun.task.entity.Task;
import com.leun.task.entity.TaskStatus;
import com.leun.task.entity.TaskType;
import com.leun.task.repository.TaskRepository;
import com.leun.user.entity.User;
import com.leun.user.service.UserService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AISchedulingService {

    private final EventRepository eventRepository;
    private final TaskRepository taskRepository;
    private final UserService userService;
    private final GeminiService geminiService;
    private final com.leun.user.repository.UserSettingRepository userSettingRepository;

    // ========== CẤU HÌNH ==========
    private static final LocalTime WORK_START = LocalTime.of(8, 0);
    private static final LocalTime WORK_END = LocalTime.of(23, 0);
    private static final int MIN_SLOT_MINUTES = 30;
    
    // Khoảng nghỉ giữa các slot/event (phút)
    private static final int BREAK_BEFORE_EVENT = 10;
    private static final int BREAK_AFTER_EVENT = 5;
    private static final int MAX_SLOT_MINUTES = 150;
    
    // Default số ngày lên lịch trước (có thể override bởi user settings)
    private static final int DEFAULT_SCHEDULE_DAYS = 4;
    
    // Token optimization: giới hạn số slots tối đa gửi cho AI
    private static final int MAX_SLOTS_FOR_PROMPT = 25;
    
    // Ngưỡng deadline gấp: cho phép nhiều sessions/buổi
    private static final int URGENT_DEADLINE_DAYS = 3;
    
    // Định nghĩa ranh giới các buổi trong ngày
    private static final LocalTime MORNING_END = LocalTime.of(12, 0);
    private static final LocalTime AFTERNOON_END = LocalTime.of(18, 0);

    private static final String SYSTEM_PROMPT = """
        Bạn là AI trợ lý lập lịch thông minh cho sinh viên Việt Nam.
        Nhiệm vụ: Phân tích và đề xuất thời gian thực hiện công việc phù hợp nhất.
        
        Quy tắc quan trọng:
        1. Ưu tiên giờ tập trung cao: 8h-11h30 sáng, 14h-17h chiều, 19h-22h tối
        2. Tránh làm việc sau 23h (ảnh hưởng sức khỏe)
        3. Task ưu tiên HIGH cần được xếp sớm nhất có thể
        4. Mỗi phiên làm việc (session) không quá 2.5 tiếng
        5. Ưu tiên rải đều sessions: 1 session/ngày nếu có thể
        6. KHÔNG được xếp vào thời gian đã có sự kiện cố định
        
        Trả lời bằng tiếng Việt, thân thiện, ngắn gọn nhưng đầy đủ thông tin.
        
        QUAN TRỌNG: Trả lời theo format sau (mỗi đề xuất trên 1 dòng):
        SLOT_1: [số slot] | REASON: [lý do ngắn gọn 1-2 câu]
        SLOT_2: [số slot] | REASON: [lý do ngắn gọn 1-2 câu]
        (Tiếp tục nếu cần thêm slots)
        """;
    


    /**
     * Lấy số ngày lên lịch trước từ user settings
     */
    private int getScheduleDays(String email) {
        try {
            Integer days = userSettingRepository.findAiScheduleDaysByEmail(email);
            return days != null ? days : DEFAULT_SCHEDULE_DAYS;
        } catch (Exception e) {
            return DEFAULT_SCHEDULE_DAYS;
        }
    }

    /**
     * Lấy custom rules từ user settings
     */
    private String getCustomRules(String email) {
        try {
            String rules = userSettingRepository.findAiCustomRulesByEmail(email);
            return rules != null ? rules : "";
        } catch (Exception e) {
            return "";
        }
    }

    /**
     * Đề xuất sessions cho task - theo chu kỳ N ngày (có thể cấu hình)
     * Trả về danh sách proposals cho user confirm
     */
    public ScheduleResult proposeSessionsForNextCycle(String email, Long taskId) throws Exception {
        User user = userService.findUserByEmail(email);
        Task task = taskRepository.findById(taskId)
            .orElseThrow(() -> new RuntimeException("Task not found"));

        // Lấy số ngày lên lịch trước từ settings
        int scheduleDays = getScheduleDays(email);

        if (task.getTaskType() != TaskType.DEADLINE) {
            throw new RuntimeException("Chỉ hỗ trợ đề xuất cho task loại DEADLINE");
        }

        // Kiểm tra task đã hoàn thành chưa
        if (task.getStatus() == TaskStatus.COMPLETED) {
            return ScheduleResult.builder()
                .taskId(taskId)
                .taskTitle(task.getTitle())
                .message("Task đã hoàn thành!")
                .proposals(List.of())
                .build();
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime deadline = task.getDueDate();
        
        // Kiểm tra deadline đã qua
        if (deadline.isBefore(now)) {
            return ScheduleResult.builder()
                .taskId(taskId)
                .taskTitle(task.getTitle())
                .message("⚠️ Deadline đã qua! Không thể đề xuất lịch.")
                .proposals(List.of())
                .build();
        }

        // Xác định khoảng thời gian đề xuất: từ hôm nay đến N ngày sau
        LocalDate today = now.toLocalDate();
        LocalDate cycleEndDateMax = today.plusDays(scheduleDays - 1);
        LocalDate deadlineDate = deadline.toLocalDate();
        
        // Tính ngày kết thúc chu kỳ (min của N ngày sau và deadline)
        LocalDate cycleEndDate = cycleEndDateMax.isAfter(deadlineDate) ? deadlineDate : cycleEndDateMax;
        
        // Tìm slots trống trong chu kỳ N ngày
        LocalDateTime cycleStart = now;
        LocalDateTime cycleEnd = cycleEndDate.atTime(WORK_END);
        if (cycleEnd.isAfter(deadline)) {
            cycleEnd = deadline;
        }
        
        List<TimeSlot> freeSlots = findFreeSlots(user, cycleStart, cycleEnd);
        
        if (freeSlots.isEmpty()) {
            return ScheduleResult.builder()
                .taskId(taskId)
                .taskTitle(task.getTitle())
                .message("😅 Không còn thời gian trống trong " + scheduleDays + " ngày tới. Hãy dọn lịch hoặc chờ chu kỳ tiếp theo.")
                .proposals(List.of())
                .canScheduleMore(false)
                .build();
        }

        // Lấy các buổi đã có AI event của task này trong chu kỳ
        java.util.Set<String> existingAIPeriods = getExistingAIEventPeriods(user, task, cycleStart, cycleEnd);

        // Tính toán số sessions chưa được lên lịch
        int unscheduledSessions = task.getUnscheduledSessions();
        long daysUntilDeadline = java.time.temporal.ChronoUnit.DAYS.between(today, deadlineDate) + 1;
        
        // Mục tiêu: ít nhất 1 session/ngày
        int targetSessions = calculateTargetSessions(unscheduledSessions, daysUntilDeadline, today, cycleEndDate, scheduleDays);
        
        // Tạo proposals (truyền thêm existingAIPeriods và time range để tối ưu prompt)
        List<ScheduleProposal> proposals = createProposalsForCycle(
            task, user, freeSlots, targetSessions, existingAIPeriods, daysUntilDeadline, cycleStart, cycleEnd);
        
        // Tạo message thông báo
        String message = buildScheduleMessage(task, proposals, unscheduledSessions, daysUntilDeadline, scheduleDays);
        
        return ScheduleResult.builder()
            .taskId(taskId)
            .taskTitle(task.getTitle())
            .message(message)
            .proposals(proposals)
            .remainingSessions(unscheduledSessions)
            .scheduledInThisCycle(proposals.size())
            .canScheduleMore(unscheduledSessions > proposals.size())
            .nextCycleDate(proposals.isEmpty() ? null : cycleEndDate.plusDays(1))
            .build();
    }

    /**
     * Tính số sessions cần đề xuất trong chu kỳ này
     */
    private int calculateTargetSessions(int unscheduledSessions, long daysUntilDeadline, 
                                         LocalDate today, LocalDate cycleEndDate, int scheduleDays) {
        if (unscheduledSessions <= 0) return 0;
        
        // Số ngày trong chu kỳ này
        int daysInCycle = (int) java.time.temporal.ChronoUnit.DAYS.between(today, cycleEndDate) + 1;
        
        // Nếu deadline trong chu kỳ này → cố gắng xếp hết
        if (daysUntilDeadline <= scheduleDays) {
            return Math.min(unscheduledSessions, daysInCycle * 2); // Tối đa 2 sessions/ngày
        }
        
        // Deadline xa → rải đều, mục tiêu 1 session/ngày
        int idealSessionsPerCycle = daysInCycle;
        
        // Nhưng không quá số sessions chưa lên lịch
        return Math.min(idealSessionsPerCycle, unscheduledSessions);
    }

    /**
     * Lấy các buổi đã có AI event của task trong khoảng thời gian
     */
    private java.util.Set<String> getExistingAIEventPeriods(User user, Task task, 
            LocalDateTime from, LocalDateTime to) {
        java.util.Set<String> periods = new java.util.HashSet<>();
        
        // Lấy tất cả events của user trong khoảng thời gian
        List<Event> events = eventRepository.findEventsOverlappingPeriod(user, from, to);
        
        for (Event event : events) {
            // Chỉ xét AI events của task này
            if (event.getEventType() == EventType.AI_GENERATED 
                && event.getSourceTask() != null 
                && event.getSourceTask().getId().equals(task.getId())) {
                
                LocalDate date = event.getStartTime().toLocalDate();
                String period = getPeriodOfDay(event.getStartTime().toLocalTime());
                periods.add(date.toString() + "_" + period);
            }
        }
        
        return periods;
    }

    /**
     * Tạo tóm tắt các events bận - GOM RECURRING EVENTS
     * Thay vì liệt kê từng event, gom lại theo pattern để tiết kiệm token
     * 
     * Ví dụ output:
     * - "DAILY 08:00-09:30 Học tiếng Anh (x7)"
     * - "WEEKLY Mon,Wed,Fri 14:00-16:00 Lớp học (x3)"
     * - "12/01 S 10:00-11:30 Meeting"
     */
    private String buildBusyEventsSummary(User user, LocalDateTime from, LocalDateTime to) {
        List<Event> events = eventRepository.findEventsOverlappingPeriod(user, from, to);
        
        if (events.isEmpty()) {
            return "";
        }
        
        // Nhóm events theo pattern (recurring vs single)
        Map<String, List<Event>> eventGroups = new java.util.LinkedHashMap<>();
        List<Event> singleEvents = new ArrayList<>();
        
        for (Event event : events) {
            // Bỏ qua AI events (không cần báo cho AI biết)
            if (event.getEventType() == EventType.AI_GENERATED) {
                continue;
            }
            
            if (event.getRecurrenceType() != null && event.getRecurrenceType() != RecurrenceType.NONE) {
                // Recurring event - gom theo title + time pattern
                String key = buildRecurringKey(event);
                eventGroups.computeIfAbsent(key, k -> new ArrayList<>()).add(event);
            } else if (event.getParentEventId() != null) {
                // Instance của recurring - gom theo parent
                String key = "parent_" + event.getParentEventId() + "_" + 
                    event.getStartTime().toLocalTime() + "-" + event.getEndTime().toLocalTime();
                eventGroups.computeIfAbsent(key, k -> new ArrayList<>()).add(event);
            } else {
                // Single event
                singleEvents.add(event);
            }
        }
        
        StringBuilder sb = new StringBuilder();
        sb.append("BUSY:\n");
        
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM");
        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");
        
        // 1. Gom recurring events
        for (Map.Entry<String, List<Event>> entry : eventGroups.entrySet()) {
            List<Event> group = entry.getValue();
            if (group.isEmpty()) continue;
            
            Event first = group.get(0);
            String summary = buildRecurringSummary(first, group.size());
            sb.append(summary).append("\n");
        }
        
        // 2. Single events - compact format
        // Nếu quá nhiều single events, gom theo ngày
        if (singleEvents.size() > 10) {
            // Gom theo ngày
            Map<LocalDate, List<Event>> byDate = new java.util.LinkedHashMap<>();
            for (Event e : singleEvents) {
                byDate.computeIfAbsent(e.getStartTime().toLocalDate(), k -> new ArrayList<>()).add(e);
            }
            
            for (Map.Entry<LocalDate, List<Event>> entry : byDate.entrySet()) {
                LocalDate date = entry.getKey();
                List<Event> dayEvents = entry.getValue();
                
                // Format: 12/01: S 08-10, C 14-16, T 19-21
                sb.append(date.format(dateFormatter)).append(": ");
                List<String> slots = new ArrayList<>();
                for (Event e : dayEvents) {
                    String period = getPeriodCode(e.getStartTime().toLocalTime());
                    slots.add(period + " " + e.getStartTime().format(timeFormatter) + "-" + e.getEndTime().format(timeFormatter));
                }
                sb.append(String.join(", ", slots)).append("\n");
            }
        } else {
            // Liệt kê từng event - compact
            for (Event e : singleEvents) {
                String period = getPeriodCode(e.getStartTime().toLocalTime());
                // Format: 12/01 S 08:00-10:00 Meeting
                String title = e.getTitle().length() > 20 ? e.getTitle().substring(0, 17) + "..." : e.getTitle();
                sb.append(String.format("%s %s %s-%s %s\n",
                    e.getStartTime().format(dateFormatter),
                    period,
                    e.getStartTime().format(timeFormatter),
                    e.getEndTime().format(timeFormatter),
                    title));
            }
        }
        
        return sb.toString();
    }
    
    /**
     * Tạo key để nhóm recurring events
     */
    private String buildRecurringKey(Event event) {
        String timePattern = event.getStartTime().toLocalTime() + "-" + event.getEndTime().toLocalTime();
        return event.getRecurrenceType().name() + "_" + timePattern + "_" + event.getTitle();
    }
    
    /**
     * Tạo tóm tắt cho recurring event group
     * Format: "DAILY 08:00-09:30 Học tiếng Anh (x7)"
     */
    private String buildRecurringSummary(Event event, int occurrences) {
        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");
        
        String recurrenceLabel;
        switch (event.getRecurrenceType()) {
            case DAILY:
                recurrenceLabel = "DAILY";
                break;
            case WEEKLY:
                recurrenceLabel = "WEEKLY " + event.getStartTime().getDayOfWeek().toString().substring(0, 3);
                break;
            case WEEKDAYS:
                recurrenceLabel = "WEEKDAYS";
                break;
            case MONTHLY:
                recurrenceLabel = "MONTHLY d" + event.getStartTime().getDayOfMonth();
                break;
            case YEARLY:
                recurrenceLabel = "YEARLY";
                break;
            default:
                recurrenceLabel = "REPEAT";
        }
        
        String title = event.getTitle().length() > 15 ? event.getTitle().substring(0, 12) + "..." : event.getTitle();
        
        return String.format("%s %s-%s %s (x%d)",
            recurrenceLabel,
            event.getStartTime().format(timeFormatter),
            event.getEndTime().format(timeFormatter),
            title,
            occurrences);
    }

    /**
     * Tạo proposals cho chu kỳ hiện tại - SỬ DỤNG GEMINI AI
     */
    private List<ScheduleProposal> createProposalsForCycle(Task task, User user, 
            List<TimeSlot> freeSlots, int targetSessions, 
            java.util.Set<String> existingAIPeriods, long daysUntilDeadline,
            LocalDateTime cycleStart, LocalDateTime cycleEnd) {
        
        int sessionDuration = task.getEffectiveSessionDuration();
        // Session tiếp theo = số sessions đã lên lịch + 1
        int scheduledSessions = task.getScheduledSessions() != null ? task.getScheduledSessions() : 0;
        int currentSession = scheduledSessions + 1;
        int totalSessions = task.getRequiredSessions();
        boolean isUrgent = daysUntilDeadline <= URGENT_DEADLINE_DAYS;
        
        // Lấy custom rules từ user settings
        String customRules = getCustomRules(user.getEmail());
        
        // Tạo tóm tắt events bận (gom recurring events)
        String busySummary = buildBusyEventsSummary(user, cycleStart, cycleEnd);
        
        // Thử Gemini AI trước, fallback về heuristics nếu thất bại
        try {
            List<ScheduleProposal> aiProposals = createProposalsWithGemini(
                task, freeSlots, targetSessions, sessionDuration, currentSession, totalSessions,
                existingAIPeriods, isUrgent, customRules, busySummary);
            
            if (aiProposals != null && !aiProposals.isEmpty()) {
                log.info("✅ Gemini AI đề xuất {} sessions", aiProposals.size());
                return aiProposals;
            }
        } catch (Exception e) {
            log.warn("⚠️ Gemini AI thất bại, fallback về heuristics: {}", e.getMessage());
        }
        
        // Fallback về heuristics
        log.info("📊 Sử dụng heuristics để đề xuất");
        return createProposalsWithHeuristics(task, freeSlots, targetSessions, 
            sessionDuration, currentSession, totalSessions, existingAIPeriods, isUrgent);
    }

    /**
     * Tạo proposals sử dụng Gemini AI
     */
    private List<ScheduleProposal> createProposalsWithGemini(Task task, List<TimeSlot> freeSlots,
            int targetSessions, int sessionDuration, int currentSession, int totalSessions,
            java.util.Set<String> existingAIPeriods, boolean isUrgent, String customRules, String busySummary) {
        
        // Build prompt cho Gemini (đã tối ưu token)
        String userPrompt = buildGeminiPrompt(task, freeSlots, targetSessions, sessionDuration, existingAIPeriods, customRules, busySummary);
        
        // Gọi Gemini
        String response = geminiService.chatWithSystem(SYSTEM_PROMPT, userPrompt);
        
        if (response == null || response.isEmpty()) {
            log.warn("Gemini không trả về response");
            return null;
        }
        
        log.debug("Gemini response: {}", response);
        
        // Parse response và tạo proposals
        return parseGeminiResponse(response, task, freeSlots, sessionDuration, currentSession, totalSessions, 
            existingAIPeriods, isUrgent);
    }

    /**
     * Build prompt cho Gemini - TỐI ƯU TOKEN
     * - Format ngắn gọn (S=Sáng, C=Chiều, T=Tối)
     * - Gom recurring events thành 1 dòng
     * - Giới hạn max slots
     * - Gom slots cùng buổi/ngày
     */
    private String buildGeminiPrompt(Task task, List<TimeSlot> freeSlots, 
            int targetSessions, int sessionDuration, java.util.Set<String> existingAIPeriods,
            String customRules, String busySummary) {
        
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM");
        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");
        
        long daysUntilDeadline = java.time.temporal.ChronoUnit.DAYS.between(
            LocalDate.now(), task.getDueDate().toLocalDate()) + 1;
        boolean isUrgent = daysUntilDeadline <= URGENT_DEADLINE_DAYS;
        int remainingEffort = task.getRemainingEffortMinutes();
        
        StringBuilder sb = new StringBuilder();
        
        // === TASK INFO - Compact ===
        sb.append("TASK: ").append(task.getTitle());
        if (task.getDescription() != null && !task.getDescription().isEmpty()) {
            // Giới hạn mô tả 50 ký tự
            String desc = task.getDescription().length() > 50 
                ? task.getDescription().substring(0, 50) + "..." 
                : task.getDescription();
            sb.append(" | ").append(desc);
        }
        sb.append("\n");
        sb.append("P:").append(task.getPriority().toString().charAt(0))  // H/M/L
          .append(" DL:").append(task.getDueDate().format(dateFormatter))
          .append(" (").append(daysUntilDeadline).append("d)")
          .append(" Need:").append(remainingEffort).append("m")
          .append(" Pick:").append(targetSessions).append("\n\n");
        
        // === CUSTOM RULES - Compact ===
        if (customRules != null && !customRules.trim().isEmpty()) {
            sb.append("RULES: ").append(customRules.trim()).append("\n\n");
        }
        
        // === BUSY EVENTS SUMMARY - Gom recurring events ===
        if (busySummary != null && !busySummary.isEmpty()) {
            sb.append(busySummary).append("\n");
        }
        
        // === BLOCKED PERIODS - Compact ===
        if (!isUrgent && !existingAIPeriods.isEmpty()) {
            sb.append("BLOCKED: ").append(String.join(",", existingAIPeriods)).append("\n\n");
        }
        
        // === SLOTS - Optimized format ===
        // Gom slots theo ngày+buổi, chỉ hiển thị tổng hợp
        sb.append("SLOTS (").append(isUrgent ? "URGENT" : "max 1/period").append("):\n");
        
        List<TimeSlot> optimizedSlots = optimizeSlotsForPrompt(freeSlots, existingAIPeriods, isUrgent);
        
        for (int i = 0; i < optimizedSlots.size(); i++) {
            TimeSlot slot = optimizedSlots.get(i);
            String periodCode = getPeriodCode(slot.getStartTime().toLocalTime());
            String periodKey = slot.getStartTime().toLocalDate() + "_" + getPeriodOfDay(slot.getStartTime().toLocalTime());
            boolean isBlocked = !isUrgent && existingAIPeriods.contains(periodKey);
            
            // Format: 1. 08/01 S 08:00-11:30 90m [X=blocked]
            sb.append(String.format("%d. %s %s %s-%s %dm%s\n",
                i + 1,
                slot.getStartTime().format(dateFormatter),
                periodCode,
                slot.getStartTime().format(timeFormatter),
                slot.getEndTime().format(timeFormatter),
                slot.getDurationMinutes(),
                isBlocked ? " X" : ""));
        }
        
        sb.append("\nFormat: SLOT_X:[num]|D:[min]|R:[reason]\n");
        sb.append("(S=Morning C=Afternoon T=Evening, X=blocked)\n");
        
        return sb.toString();
    }
    
    /**
     * Tối ưu danh sách slots cho prompt:
     * 1. Giới hạn số lượng max
     * 2. Ưu tiên slots dài và điểm cao
     * 3. Phân bố đều các ngày
     */
    private List<TimeSlot> optimizeSlotsForPrompt(List<TimeSlot> allSlots, 
            java.util.Set<String> existingAIPeriods, boolean isUrgent) {
        
        if (allSlots.size() <= MAX_SLOTS_FOR_PROMPT) {
            return allSlots;
        }
        
        // Nhóm theo ngày
        Map<LocalDate, List<TimeSlot>> slotsByDate = new java.util.LinkedHashMap<>();
        for (TimeSlot slot : allSlots) {
            LocalDate date = slot.getStartTime().toLocalDate();
            slotsByDate.computeIfAbsent(date, k -> new ArrayList<>()).add(slot);
        }
        
        List<TimeSlot> optimized = new ArrayList<>();
        int slotsPerDay = Math.max(3, MAX_SLOTS_FOR_PROMPT / slotsByDate.size());
        
        for (Map.Entry<LocalDate, List<TimeSlot>> entry : slotsByDate.entrySet()) {
            List<TimeSlot> daySlots = entry.getValue();
            
            // Sắp xếp theo điểm (slot dài + giờ tốt)
            daySlots.sort((a, b) -> {
                int scoreA = calculateSlotScore(a) + (int)(a.getDurationMinutes() / 10);
                int scoreB = calculateSlotScore(b) + (int)(b.getDurationMinutes() / 10);
                return Integer.compare(scoreB, scoreA);
            });
            
            // Lấy top slots mỗi ngày
            for (int i = 0; i < Math.min(slotsPerDay, daySlots.size()); i++) {
                optimized.add(daySlots.get(i));
            }
            
            if (optimized.size() >= MAX_SLOTS_FOR_PROMPT) break;
        }
        
        // Sắp xếp lại theo thời gian
        optimized.sort(Comparator.comparing(TimeSlot::getStartTime));
        
        return optimized;
    }
    
    /**
     * Mã buổi ngắn gọn: S=Sáng, C=Chiều, T=Tối
     */
    private String getPeriodCode(LocalTime time) {
        if (time.isBefore(MORNING_END)) return "S";
        if (time.isBefore(AFTERNOON_END)) return "C";
        return "T";
    }

    /**
     * Parse response từ Gemini và tạo proposals
     * Format mới: SLOT_X: [số slot] | DURATION: [phút] | REASON: [lý do]
     */
    private List<ScheduleProposal> parseGeminiResponse(String response, Task task, 
            List<TimeSlot> freeSlots, int sessionDuration, int currentSession, int totalSessions,
            java.util.Set<String> existingAIPeriods, boolean isUrgent) {
        
        List<ScheduleProposal> proposals = new ArrayList<>();
        String[] lines = response.split("\n");
        
        // Track buổi đã dùng - khởi tạo từ existing periods
        java.util.Set<String> usedPeriods = new java.util.HashSet<>(existingAIPeriods);
        
        for (String line : lines) {
            if (line.contains("SLOT_") && line.contains("|")) {
                try {
                    // Parse: SLOT_1: 3 | DURATION: 90 | REASON: Buổi sáng tập trung cao
                    String[] parts = line.split("\\|");
                    if (parts.length >= 2) {
                        // Lấy số slot
                        String slotPart = parts[0].trim();
                        int colonIndex = slotPart.indexOf(":");
                        if (colonIndex > 0) {
                            String slotNumber = slotPart.substring(colonIndex + 1).trim().replaceAll("[^0-9]", "");
                            int slotIndex = Integer.parseInt(slotNumber) - 1;
                            
                            if (slotIndex >= 0 && slotIndex < freeSlots.size()) {
                                TimeSlot slot = freeSlots.get(slotIndex);
                                
                                // Kiểm tra rule 1 session/buổi
                                String periodKey = slot.getStartTime().toLocalDate() + "_" + 
                                    getPeriodOfDay(slot.getStartTime().toLocalTime());
                                if (!isUrgent && usedPeriods.contains(periodKey)) {
                                    continue; // Skip nếu buổi này đã có session
                                }
                                
                                // Parse duration (nếu có)
                                int duration = sessionDuration;
                                String reason = "";
                                
                                for (int i = 1; i < parts.length; i++) {
                                    String part = parts[i].trim().toUpperCase();
                                    if (part.startsWith("DURATION:")) {
                                        String durationStr = parts[i].substring(parts[i].indexOf(":") + 1)
                                            .trim().replaceAll("[^0-9]", "");
                                        if (!durationStr.isEmpty()) {
                                            duration = Integer.parseInt(durationStr);
                                        }
                                    } else if (part.startsWith("REASON:")) {
                                        reason = parts[i].substring(parts[i].indexOf(":") + 1).trim();
                                    } else if (reason.isEmpty()) {
                                        reason = parts[i].trim();
                                    }
                                }
                                
                                // Giới hạn duration
                                int actualDuration = Math.min(duration, MAX_SLOT_MINUTES);
                                actualDuration = Math.min(actualDuration, (int) slot.getDurationMinutes());
                                actualDuration = Math.max(actualDuration, MIN_SLOT_MINUTES);
                                
                                proposals.add(ScheduleProposal.builder()
                                    .taskId(task.getId())
                                    .taskTitle(task.getTitle())
                                    .proposedStartTime(slot.getStartTime())
                                    .proposedEndTime(slot.getStartTime().plusMinutes(actualDuration))
                                    .explanation(reason.isEmpty() ? "AI đề xuất" : reason)
                                    .score(calculateSlotScore(slot))
                                    .sessionNumber(currentSession + proposals.size())
                                    .totalSessions(totalSessions)
                                    .build());
                                
                                usedPeriods.add(periodKey);
                            }
                        }
                    }
                } catch (Exception e) {
                    log.warn("Không parse được dòng: {}", line);
                }
            }
        }
        
        // Sắp xếp theo thời gian
        proposals.sort(Comparator.comparing(ScheduleProposal::getProposedStartTime));
        
        return proposals;
    }

    /**
     * Tạo proposals sử dụng heuristics (fallback)
     * Logic mới: 
     * - Duration linh động (tối đa MAX_SLOT_MINUTES = 150p)
     * - Mỗi buổi (sáng/chiều/tối) chỉ 1 session, trừ khi deadline <= 3 ngày
     */
    private List<ScheduleProposal> createProposalsWithHeuristics(Task task, List<TimeSlot> freeSlots,
            int targetSessions, int sessionDuration, int currentSession, int totalSessions,
            java.util.Set<String> existingAIPeriods, boolean isUrgent) {
        
        List<ScheduleProposal> proposals = new ArrayList<>();
        
        // Tính remaining effort (phút) để linh động duration
        int remainingEffort = task.getRemainingEffortMinutes();
        
        // Edge case: nếu effort còn lại = 0 nhưng vẫn có sessions chưa lên lịch,
        // dùng sessionDuration * targetSessions làm ước lượng
        if (remainingEffort <= 0 && targetSessions > 0) {
            remainingEffort = sessionDuration * targetSessions;
        }
        
        // Nhóm slots theo ngày + buổi
        Map<String, List<TimeSlot>> slotsByDayPeriod = new java.util.LinkedHashMap<>();
        
        for (TimeSlot slot : freeSlots) {
            LocalDate date = slot.getStartTime().toLocalDate();
            String period = getPeriodOfDay(slot.getStartTime().toLocalTime());
            String key = date.toString() + "_" + period;
            slotsByDayPeriod.computeIfAbsent(key, k -> new ArrayList<>()).add(slot);
        }
        
        int sessionsCreated = 0;
        int effortScheduled = 0;
        
        // Track buổi đã dùng - khởi tạo từ existing periods
        java.util.Set<String> usedPeriods = new java.util.HashSet<>(existingAIPeriods);
        
        // Sắp xếp keys theo thời gian
        List<String> sortedKeys = new ArrayList<>(slotsByDayPeriod.keySet());
        sortedKeys.sort(Comparator.naturalOrder());
        
        for (String key : sortedKeys) {
            if (sessionsCreated >= targetSessions) break;
            if (effortScheduled >= remainingEffort) break;
            
            // Kiểm tra rule 1 session/buổi (trừ khi urgent)
            if (!isUrgent && usedPeriods.contains(key)) {
                continue;
            }
            
            List<TimeSlot> periodSlots = slotsByDayPeriod.get(key);
            
            // Gộp các slots trong cùng buổi thành 1 slot lớn nếu có thể
            TimeSlot bestSlot = findBestSlotInPeriod(periodSlots);
            
            if (bestSlot != null && bestSlot.getDurationMinutes() >= MIN_SLOT_MINUTES) {
                // Tính duration linh động
                int desiredDuration = calculateFlexibleDuration(
                    remainingEffort - effortScheduled, 
                    targetSessions - sessionsCreated,
                    (int) bestSlot.getDurationMinutes()
                );
                
                proposals.add(ScheduleProposal.builder()
                    .taskId(task.getId())
                    .taskTitle(task.getTitle())
                    .proposedStartTime(bestSlot.getStartTime())
                    .proposedEndTime(bestSlot.getStartTime().plusMinutes(desiredDuration))
                    .explanation(generateExplanation(bestSlot, task, currentSession + sessionsCreated, desiredDuration))
                    .score(calculateSlotScore(bestSlot))
                    .sessionNumber(currentSession + sessionsCreated)
                    .totalSessions(totalSessions)
                    .build());
                
                sessionsCreated++;
                effortScheduled += desiredDuration;
                usedPeriods.add(key);
            }
        }
        
        // Sắp xếp theo thời gian
        proposals.sort(Comparator.comparing(ScheduleProposal::getProposedStartTime));
        
        return proposals;
    }
    
    /**
     * Xác định buổi trong ngày (MORNING, AFTERNOON, EVENING)
     */
    private String getPeriodOfDay(LocalTime time) {
        if (time.isBefore(MORNING_END)) return "MORNING";
        if (time.isBefore(AFTERNOON_END)) return "AFTERNOON";
        return "EVENING";
    }
    
    /**
     * Tìm slot tốt nhất trong 1 buổi (ưu tiên slot dài nhất, điểm cao nhất)
     */
    private TimeSlot findBestSlotInPeriod(List<TimeSlot> slots) {
        return slots.stream()
            .filter(slot -> slot.getDurationMinutes() >= MIN_SLOT_MINUTES)
            .max(Comparator
                .comparingLong(TimeSlot::getDurationMinutes)
                .thenComparingInt(this::calculateSlotScore))
            .orElse(null);
    }
    
    /**
     * Tính duration linh động dựa trên effort còn lại
     * - Ưu tiên gộp thành session lớn (max 150p)
     * - Nếu effort còn ít thì session ngắn hơn
     */
    private int calculateFlexibleDuration(int remainingEffort, int remainingSessions, int availableSlotMinutes) {
        // Max duration là min(MAX_SLOT_MINUTES, slot có sẵn)
        int maxDuration = Math.min(MAX_SLOT_MINUTES, availableSlotMinutes);
        
        if (remainingSessions <= 0) return maxDuration;
        
        // Chia đều effort cho số sessions còn lại
        int idealDuration = remainingEffort / remainingSessions;
        
        // Làm tròn lên bội 15 phút
        idealDuration = ((idealDuration + 14) / 15) * 15;
        
        // Đảm bảo trong khoảng [MIN_SLOT_MINUTES, maxDuration]
        return Math.max(MIN_SLOT_MINUTES, Math.min(idealDuration, maxDuration));
    }

    /**
     * Tính điểm cho slot
     */
    private int calculateSlotScore(TimeSlot slot) {
        int score = 50;
        LocalTime time = slot.getStartTime().toLocalTime();
        
        // Buổi sáng tốt nhất (8:00-11:30)
        if (!time.isBefore(LocalTime.of(8, 0)) && time.isBefore(LocalTime.of(11, 30))) {
            score += 30;
        }
        // Giờ ăn trưa - trừ điểm (11:30-13:30)
        else if (!time.isBefore(LocalTime.of(11, 30)) && time.isBefore(LocalTime.of(13, 30))) {
            score -= 10;
        }
        // Buổi chiều cũng tốt (13:30-17:00)
        else if (!time.isBefore(LocalTime.of(13, 30)) && time.isBefore(LocalTime.of(17, 0))) {
            score += 20;
        }
        // Giờ ăn tối - trừ điểm nhẹ (17:00-19:00)
        else if (!time.isBefore(LocalTime.of(17, 0)) && time.isBefore(LocalTime.of(19, 0))) {
            score -= 5;
        }
        // Tối sớm ok (19:00-21:00)
        else if (!time.isBefore(LocalTime.of(19, 0)) && time.isBefore(LocalTime.of(21, 0))) {
            score += 10;
        }
        // Tối muộn trừ điểm (21:00+)
        else if (!time.isBefore(LocalTime.of(21, 0))) {
            score -= 15;
        }
        
        // Slot dài hơn được ưu tiên
        if (slot.getDurationMinutes() >= 90) {
            score += 10;
        }
        
        return Math.max(0, Math.min(100, score));
    }

    /**
     * Tạo message thông báo
     */
    private String buildScheduleMessage(Task task, List<ScheduleProposal> proposals, 
                                         int unscheduledSessions, long daysUntilDeadline, int scheduleDays) {
        StringBuilder sb = new StringBuilder();
        
        if (proposals.isEmpty()) {
            sb.append(String.format("😅 Không tìm được thời gian trống phù hợp trong %d ngày tới.", scheduleDays));
            return sb.toString();
        }
        
        sb.append(String.format("📋 Task: %s\n", task.getTitle()));
        sb.append(String.format("⏳ Còn %d ngày đến deadline\n", daysUntilDeadline));
        sb.append(String.format("📊 Sessions còn lại: %d\n\n", unscheduledSessions));
        sb.append(String.format("✨ Đề xuất %d session(s) cho %d ngày tới:\n", proposals.size(), scheduleDays));
        
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM (EEEE) HH:mm", 
            new java.util.Locale("vi", "VN"));
        
        for (int i = 0; i < proposals.size(); i++) {
            ScheduleProposal p = proposals.get(i);
            sb.append(String.format("  %d. %s - %s\n", 
                i + 1,
                p.getProposedStartTime().format(formatter),
                p.getProposedEndTime().format(DateTimeFormatter.ofPattern("HH:mm"))));
        }
        
        if (unscheduledSessions > proposals.size()) {
            sb.append(String.format("\n📅 Còn %d sessions sẽ được đề xuất trong các chu kỳ tiếp theo.",
                unscheduledSessions - proposals.size()));
        }
        
        return sb.toString();
    }

    /**
     * Tạo giải thích cho proposal
     */
    private String generateExplanation(TimeSlot slot, Task task, int sessionNumber, int durationMinutes) {
        LocalTime time = slot.getStartTime().toLocalTime();
        String timeDescription;
        
        if (!time.isBefore(LocalTime.of(8, 0)) && time.isBefore(LocalTime.of(11, 30))) {
            timeDescription = "Buổi sáng - thời điểm tập trung cao nhất";
        } else if (!time.isBefore(LocalTime.of(13, 30)) && time.isBefore(LocalTime.of(17, 0))) {
            timeDescription = "Buổi chiều - phù hợp cho công việc cần tập trung";
        } else if (!time.isBefore(LocalTime.of(19, 0)) && time.isBefore(LocalTime.of(21, 0))) {
            timeDescription = "Tối sớm - thời gian tự học hiệu quả";
        } else if (!time.isBefore(LocalTime.of(11, 30)) && time.isBefore(LocalTime.of(13, 30))) {
            timeDescription = "Giờ trưa - thời gian linh hoạt";
        } else {
            timeDescription = "Khoảng thời gian trống phù hợp";
        }
        
        return String.format("Session %d: %s. Thời lượng %d phút.", 
            sessionNumber, timeDescription, durationMinutes);
    }

    /**
     * Chấp nhận tất cả proposals trong một lần
     * Tạo events cho tất cả sessions được đề xuất
     */
    @Transactional
    public List<Event> acceptAllProposals(String email, List<ScheduleProposal> proposals) throws Exception {
        List<Event> createdEvents = new ArrayList<>();
        
        for (ScheduleProposal proposal : proposals) {
            Event event = acceptSingleProposal(email, proposal);
            createdEvents.add(event);
        }
        
        return createdEvents;
    }

    /**
     * Chấp nhận một proposal cụ thể
     */
    @Transactional
    public Event acceptSingleProposal(String email, ScheduleProposal proposal) throws Exception {
        User user = userService.findUserByEmail(email);
        Task task = taskRepository.findById(proposal.getTaskId())
            .orElseThrow(() -> new RuntimeException("Task not found"));

        // Kiểm tra conflict với events hiện có
        if (hasConflictWithExistingEvents(user, proposal.getProposedStartTime(), proposal.getProposedEndTime())) {
            throw new RuntimeException("Thời gian này đã có sự kiện khác!");
        }

        // Kiểm tra đã đạt giới hạn sessions chưa
        int currentScheduled = task.getScheduledSessions() != null ? task.getScheduledSessions() : 0;
        int totalSessions = task.getRequiredSessions();
        if (currentScheduled >= totalSessions) {
            throw new RuntimeException(
                String.format("Đã đạt giới hạn %d/%d sessions! Hãy tăng số sessions nếu muốn thêm.", 
                    currentScheduled, totalSessions));
        }

        // Tính session number THỰC TẾ dựa trên scheduledSessions hiện tại
        int actualSessionNumber = currentScheduled + 1;

        // Tạo event title với session number đúng
        String eventTitle = totalSessions > 1 
            ? String.format("[AI] %s (Session %d/%d)", task.getTitle(), 
                actualSessionNumber, totalSessions)
            : "[AI] " + task.getTitle();

        Event event = new Event();
        event.setUser(user);
        event.setTitle(eventTitle);
        event.setDescription(String.format(
            "📋 Task: %s\n⏱️ Session %d/%d\n\n %s",
            task.getTitle(),
            actualSessionNumber,
            totalSessions,
            proposal.getExplanation()
        ));
        event.setStartTime(proposal.getProposedStartTime());
        event.setEndTime(proposal.getProposedEndTime());
        event.setColor(Color.PEACOCK);
        event.setEventType(EventType.AI_GENERATED);
        event.setSourceTask(task);
        event.setAiExplanation(proposal.getExplanation());

        // Tăng số session đã lên lịch
        task.setScheduledSessions(actualSessionNumber);

        // Cập nhật task status
        if (task.getStatus() == TaskStatus.PENDING) {
            task.setStatus(TaskStatus.SCHEDULED);
        }
        taskRepository.save(task);

        return eventRepository.save(event);
    }

    /**
     * Kiểm tra conflict với events hiện có
     */
    private boolean hasConflictWithExistingEvents(User user, LocalDateTime start, LocalDateTime end) {
        List<Event> conflictingEvents = eventRepository.findEventsOverlappingPeriod(user, start, end);
        return !conflictingEvents.isEmpty();
    }

    /**
     * Đánh dấu task hoàn thành (user có thể hoàn thành bất kỳ lúc nào)
     */
    @Transactional
    public Task markTaskCompleted(String email, Long taskId) throws Exception {
        User user = userService.findUserByEmail(email);
        Task task = taskRepository.findById(taskId)
            .orElseThrow(() -> new RuntimeException("Task not found"));

        if (!task.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Không có quyền truy cập task này");
        }

        task.setStatus(TaskStatus.COMPLETED);
        task.setIsCompleted(true);
        
        return taskRepository.save(task);
    }

    /**
     * Tính số sessions đã hoàn thành dựa trên thời gian hiện tại
     * Session được tính là hoàn thành nếu thời gian kết thúc đã qua
     */
    public int calculateCompletedSessions(Task task) {
        List<Event> aiEvents = eventRepository.findEventsBySourceTask(task);
        LocalDateTime now = LocalDateTime.now();
        
        int completed = 0;
        for (Event event : aiEvents) {
            if (event.getEndTime() != null && event.getEndTime().isBefore(now)) {
                completed++;
            }
        }
        return completed;
    }

    /**
     * Cập nhật số sessions đã hoàn thành cho task (gọi khi cần sync)
     */
    @Transactional
    public void syncCompletedSessions(String email, Long taskId) throws Exception {
        User user = userService.findUserByEmail(email);
        Task task = taskRepository.findById(taskId)
            .orElseThrow(() -> new RuntimeException("Task not found"));

        if (!task.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Không có quyền truy cập task này");
        }

        int completed = calculateCompletedSessions(task);
        task.setCompletedSessions(completed);
        
        // Chỉ cập nhật status IN_PROGRESS, KHÔNG tự động đánh dấu COMPLETED
        // Task chỉ COMPLETED khi người dùng tick checkbox
        if (!Boolean.TRUE.equals(task.getIsCompleted()) && completed > 0) {
            task.setStatus(TaskStatus.IN_PROGRESS);
        }
        
        taskRepository.save(task);
    }

    /**
     * Tìm các khoảng thời gian trống
     */
    public List<TimeSlot> findFreeSlots(User user, LocalDateTime from, LocalDateTime to) {
        List<TimeSlot> freeSlots = new ArrayList<>();
        
        List<Event> events = eventRepository.findEventsOverlappingPeriod(user, from, to);
        events.sort(Comparator.comparing(Event::getStartTime));

        LocalDate currentDate = from.toLocalDate();
        LocalDate endDate = to.toLocalDate();

        while (!currentDate.isAfter(endDate)) {
            LocalDateTime dayStart = currentDate.atTime(WORK_START);
            LocalDateTime dayEnd = currentDate.atTime(WORK_END);

            if (currentDate.equals(from.toLocalDate()) && from.isAfter(dayStart)) {
                dayStart = from;
            }
            if (currentDate.equals(endDate) && to.isBefore(dayEnd)) {
                dayEnd = to;
            }

            List<TimeSlot> dailySlots = findFreeSlotsInDay(events, dayStart, dayEnd);
            freeSlots.addAll(dailySlots);

            currentDate = currentDate.plusDays(1);
        }

        return freeSlots;
    }

    private List<TimeSlot> findFreeSlotsInDay(List<Event> events, LocalDateTime dayStart, LocalDateTime dayEnd) {
        List<TimeSlot> slots = new ArrayList<>();
        LocalDateTime slotStart = dayStart;

        for (Event event : events) {
            if (event.getEndTime().isBefore(dayStart) || event.getStartTime().isAfter(dayEnd)) {
                continue;
            }

            if (event.getStartTime().isAfter(slotStart)) {
                LocalDateTime slotEnd = event.getStartTime().minusMinutes(BREAK_BEFORE_EVENT);
                if (slotEnd.isAfter(dayEnd)) {
                    slotEnd = dayEnd;
                }
                
                if (slotEnd.isAfter(slotStart)) {
                    List<TimeSlot> splitSlots = splitLongSlot(slotStart, slotEnd);
                    slots.addAll(splitSlots);
                }
            }

            if (event.getEndTime().isAfter(slotStart)) {
                slotStart = event.getEndTime().plusMinutes(BREAK_AFTER_EVENT);
            }
        }

        if (slotStart.isBefore(dayEnd)) {
            List<TimeSlot> splitSlots = splitLongSlot(slotStart, dayEnd);
            slots.addAll(splitSlots);
        }

        return slots;
    }

    /**
     * Chia nhỏ slot dài thành các slot nhỏ hơn
     */
    private List<TimeSlot> splitLongSlot(LocalDateTime start, LocalDateTime end) {
        List<TimeSlot> slots = new ArrayList<>();
        LocalDateTime currentStart = start;
        
        while (currentStart.isBefore(end)) {
            long remainingMinutes = java.time.Duration.between(currentStart, end).toMinutes();
            
            if (remainingMinutes <= MAX_SLOT_MINUTES) {
                if (remainingMinutes >= MIN_SLOT_MINUTES) {
                    slots.add(new TimeSlot(currentStart, end));
                }
                break;
            } else {
                LocalDateTime slotEnd = currentStart.plusMinutes(MAX_SLOT_MINUTES);
                slots.add(new TimeSlot(currentStart, slotEnd));
                currentStart = slotEnd.plusMinutes(BREAK_AFTER_EVENT);
            }
        }
        
        return slots;
    }

    /**
     * Lấy danh sách tasks cần được lên lịch
     */
    public List<Task> getPendingTasksForScheduling(String email) throws Exception {
        User user = userService.findUserByEmail(email);
        return taskRepository.findPendingDeadlineTasks(user);
    }
}
