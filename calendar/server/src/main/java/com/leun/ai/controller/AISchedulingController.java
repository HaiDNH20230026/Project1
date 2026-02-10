package com.leun.ai.controller;

import com.leun.ai.dto.ScheduleProposal;
import com.leun.ai.dto.ScheduleResult;
import com.leun.ai.service.AISchedulingService;
import com.leun.ai.service.GeminiService;
import com.leun.event.dto.EventDto;
import com.leun.event.entity.Event;
import com.leun.task.entity.Task;
import com.leun.task.dto.TaskDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/v1/ai")
@RequiredArgsConstructor
@Slf4j
public class AISchedulingController {

    private final AISchedulingService aiSchedulingService;
    private final GeminiService geminiService;

    // ========== TEST GEMINI API ==========

    /**
     * Kiểm tra Gemini API có hoạt động không (không cần auth)
     * GET /v1/ai/test
     */
    @GetMapping("/test")
    public ResponseEntity<Map<String, Object>> testGeminiConnection() {
        log.info("Testing Gemini API connection...");
        
        try {
            boolean isWorking = geminiService.testConnection();
            
            if (isWorking) {
                return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "message", "✅ Gemini API hoạt động tốt!",
                    "models", geminiService.getModelsStatus()
                ));
            } else {
                return ResponseEntity.status(503).body(Map.of(
                    "status", "error",
                    "message", "❌ Gemini API không phản hồi",
                    "models", geminiService.getModelsStatus()
                ));
            }
        } catch (Exception e) {
            log.error("Lỗi test Gemini: {}", e.getMessage());
            return ResponseEntity.status(500).body(Map.of(
                "status", "error",
                "message", "❌ Lỗi: " + e.getMessage()
            ));
        }
    }

    /**
     * Xem trạng thái các models (không cần auth)
     * GET /v1/ai/models
     */
    @GetMapping("/models")
    public ResponseEntity<Map<String, Object>> getModelsStatus() {
        return ResponseEntity.ok(Map.of(
            "status", "success",
            "models", geminiService.getModelsStatus()
        ));
    }

    /**
     * Test chat với Gemini (không cần auth)
     * POST /v1/ai/test/chat
     * Body: { "prompt": "Xin chào" }
     */
    @PostMapping("/test/chat")
    public ResponseEntity<Map<String, Object>> testChat(@RequestBody Map<String, String> request) {
        String prompt = request.get("prompt");
        
        if (prompt == null || prompt.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                "status", "error",
                "message", "Thiếu 'prompt' trong body"
            ));
        }
        
        log.info("Testing Gemini chat với prompt: {}", prompt);
        
        try {
            String response = geminiService.chat(prompt);
            
            if (response != null) {
                return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "prompt", prompt,
                    "response", response
                ));
            } else {
                return ResponseEntity.status(503).body(Map.of(
                    "status", "error",
                    "message", "Tất cả models đều hết quota, vui lòng thử lại sau 30s"
                ));
            }
        } catch (Exception e) {
            log.error("Lỗi chat Gemini: {}", e.getMessage());
            return ResponseEntity.status(500).body(Map.of(
                "status", "error",
                "message", e.getMessage()
            ));
        }
    }

    // ========== AI SCHEDULING ENDPOINTS ==========

    /**
     * Đề xuất sessions cho chu kỳ 2 ngày tiếp theo (hôm nay + ngày mai)
     * POST /v1/ai/schedule/propose/{taskId}
     * 
     * Flow: User tạo task → Gọi API này → Nhận proposals → Accept/Reject
     */
    @PostMapping("/schedule/propose/{taskId}")
    public ResponseEntity<ScheduleResult> proposeSessionsForCycle(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long taskId) throws Exception {
        
        ScheduleResult result = aiSchedulingService.proposeSessionsForNextCycle(
            userDetails.getUsername(), taskId);
        
        return ResponseEntity.ok(result);
    }

    /**
     * Chấp nhận tất cả proposals trong một lần
     * POST /v1/ai/schedule/accept-all
     * Body: List<ScheduleProposal>
     */
    @PostMapping("/schedule/accept-all")
    public ResponseEntity<Map<String, Object>> acceptAllProposals(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody List<ScheduleProposal> proposals) throws Exception {
        
        List<Event> events = aiSchedulingService.acceptAllProposals(
            userDetails.getUsername(), proposals);
        
        List<EventDto.Response> eventDtos = events.stream()
            .map(EventDto.Response::fromEntity)
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(Map.of(
            "status", "success",
            "message", String.format("Đã tạo %d session(s)", events.size()),
            "events", eventDtos
        ));
    }

    /**
     * Chấp nhận một proposal cụ thể
     * POST /v1/ai/schedule/accept
     */
    @PostMapping("/schedule/accept")
    public ResponseEntity<EventDto.Response> acceptProposal(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody ScheduleProposal proposal) throws Exception {
        
        Event event = aiSchedulingService.acceptSingleProposal(
            userDetails.getUsername(), proposal);
        
        return ResponseEntity.ok(EventDto.Response.fromEntity(event));
    }

    /**
     * Đánh dấu task hoàn thành (user có thể hoàn thành bất kỳ lúc nào)
     * POST /v1/ai/task/{taskId}/complete
     */
    @PostMapping("/task/{taskId}/complete")
    public ResponseEntity<Map<String, Object>> markTaskCompleted(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long taskId) throws Exception {
        
        Task task = aiSchedulingService.markTaskCompleted(
            userDetails.getUsername(), taskId);
        
        return ResponseEntity.ok(Map.of(
            "status", "success",
            "message", "Task đã được đánh dấu hoàn thành!",
            "task", TaskDto.Response.fromEntity(task)
        ));
    }

    /**
     * Sync số sessions đã hoàn thành cho task (dựa trên thời gian hiện tại)
     * POST /v1/ai/task/{taskId}/sync-sessions
     */
    @PostMapping("/task/{taskId}/sync-sessions")
    public ResponseEntity<Map<String, Object>> syncCompletedSessions(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long taskId) throws Exception {
        
        aiSchedulingService.syncCompletedSessions(
            userDetails.getUsername(), taskId);
        
        return ResponseEntity.ok(Map.of(
            "status", "success",
            "message", "Đã cập nhật số sessions hoàn thành!"
        ));
    }

    /**
     * Lấy danh sách tasks đang chờ được lên lịch
     * GET /v1/ai/pending-tasks
     */
    @GetMapping("/pending-tasks")
    public ResponseEntity<List<TaskDto.Response>> getPendingTasks(
            @AuthenticationPrincipal UserDetails userDetails) throws Exception {
        
        List<Task> tasks = aiSchedulingService.getPendingTasksForScheduling(
            userDetails.getUsername());
        
        List<TaskDto.Response> taskDtos = tasks.stream()
            .map(TaskDto.Response::fromEntity)
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(taskDtos);
    }
}
