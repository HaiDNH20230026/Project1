package com.leun.user.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
public class UserSetting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    private String language;

    private String country;

    private String timezone;

    // AI scheduling settings
    private Integer aiScheduleDays = 4; // Số ngày AI có thể lên lịch trước (mặc định 4)

    @jakarta.persistence.Column(columnDefinition = "TEXT")
    private String aiCustomRules; // Custom rules/preferences cho AI scheduling

    public UserSetting(User user, String language, String country, String timezone) {
        this.user = user;
        this.language = language;
        this.country = country;
        this.timezone = timezone;
        this.aiScheduleDays = 4;
        this.aiCustomRules = "";
    }
}
