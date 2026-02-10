package com.leun.ai.service;

import com.google.genai.Client;
import com.google.genai.types.GenerateContentResponse;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@Slf4j
public class GeminiService {

    @Value("${gemini.api-key}")
    private String apiKey;

    private Client client;
    
    // Danh sách models theo thứ tự ưu tiên
    private static final List<String> MODELS = List.of(
        "gemini-2.5-flash",
        "gemini-2.5-flash-lite", 
        "gemini-2.0-flash",
        "gemma-3-27b-it"  // Fallback cuối cùng
    );
    
    // Theo dõi model hiện tại đang dùng
    private final AtomicInteger currentModelIndex = new AtomicInteger(0);
    
    // Cache thời gian cooldown cho mỗi model bị rate limit
    private final ConcurrentHashMap<String, Long> modelCooldowns = new ConcurrentHashMap<>();
    
    // Thời gian cooldown: 30 giây
    private static final long COOLDOWN_MS = 30_000;

    @PostConstruct
    public void init() {
        this.client = Client.builder()
            .apiKey(apiKey)
            .build();
        log.info("Gemini Client initialized with {} models: {}", MODELS.size(), MODELS);
    }

    /**
     * Lấy model có thể dùng được (không bị cooldown)
     */
    private String getAvailableModel() {
        long now = System.currentTimeMillis();
        
        // Thử từ model ưu tiên nhất
        for (int i = 0; i < MODELS.size(); i++) {
            String model = MODELS.get(i);
            Long cooldownUntil = modelCooldowns.get(model);
            
            if (cooldownUntil == null || now >= cooldownUntil) {
                currentModelIndex.set(i);
                return model;
            }
        }
        
        // Tất cả đều đang cooldown -> dùng model cuối (gemma) và đợi
        return MODELS.get(MODELS.size() - 1);
    }

    /**
     * Đánh dấu model bị rate limit
     */
    private void markModelRateLimited(String model) {
        long cooldownUntil = System.currentTimeMillis() + COOLDOWN_MS;
        modelCooldowns.put(model, cooldownUntil);
        log.warn("Model {} bị rate limit, cooldown đến {}", model, cooldownUntil);
    }

    /**
     * Gửi prompt đến Gemini với auto-fallback
     */
    public String chat(String prompt) {
        Exception lastException = null;
        
        // Thử tất cả models
        for (int attempt = 0; attempt < MODELS.size(); attempt++) {
            String model = getAvailableModel();
            
            try {
                log.debug("Calling model: {} (attempt {})", model, attempt + 1);
                
                GenerateContentResponse response = client.models.generateContent(
                    model,
                    prompt,
                    null
                );

                String text = response.text();
                
                if (text != null && !text.isEmpty()) {
                    log.info("✅ Success with model: {}", model);
                    return text;
                }
                
            } catch (Exception e) {
                lastException = e;
                String errorMsg = e.getMessage();
                
                // Kiểm tra nếu là lỗi rate limit (429)
                if (errorMsg != null && (errorMsg.contains("429") || 
                    errorMsg.contains("quota") || 
                    errorMsg.contains("Too Many Requests"))) {
                    
                    log.warn("⚠️ Model {} rate limited, switching to next...", model);
                    markModelRateLimited(model);
                    
                } else {
                    // Lỗi khác - log và thử model tiếp theo
                    log.error("❌ Model {} error: {}", model, errorMsg);
                    markModelRateLimited(model); // Tạm thời bỏ qua model này
                }
            }
        }
        
        // Tất cả đều thất bại
        log.error("❌ Tất cả {} models đều thất bại!", MODELS.size());
        if (lastException != null) {
            log.error("Last error: {}", lastException.getMessage());
        }
        return null;
    }

    /**
     * Gọi Gemini với system prompt và user prompt
     */
    public String chatWithSystem(String systemPrompt, String userPrompt) {
        String fullPrompt = systemPrompt + "\n\n" + userPrompt;
        return chat(fullPrompt);
    }

    /**
     * Kiểm tra API có hoạt động không
     */
    public boolean testConnection() {
        try {
            String response = chat("Xin chào! Trả lời ngắn gọn: OK");
            return response != null && !response.isEmpty();
        } catch (Exception e) {
            log.error("Test connection failed: {}", e.getMessage());
            return false;
        }
    }
    
    /**
     * Lấy thông tin models và trạng thái (dạng List - cho API)
     */
    public java.util.List<java.util.Map<String, Object>> getModelsStatus() {
        java.util.List<java.util.Map<String, Object>> result = new java.util.ArrayList<>();
        long now = System.currentTimeMillis();
        
        for (String model : MODELS) {
            java.util.Map<String, Object> modelInfo = new java.util.HashMap<>();
            modelInfo.put("model", model);
            
            Long cooldownUntil = modelCooldowns.get(model);
            if (cooldownUntil == null || now >= cooldownUntil) {
                modelInfo.put("available", true);
                modelInfo.put("cooldownRemaining", 0);
            } else {
                modelInfo.put("available", false);
                modelInfo.put("cooldownRemaining", (cooldownUntil - now) / 1000);
            }
            
            result.add(modelInfo);
        }
        
        return result;
    }
}
