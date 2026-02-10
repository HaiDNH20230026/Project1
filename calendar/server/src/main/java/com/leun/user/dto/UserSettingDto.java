package com.leun.user.dto;

import lombok.Getter;
import lombok.Setter;

public class UserSettingDto {

    @Getter
    @Setter
    public static class Response {
        private String language;
        private String country;
        private String timezone;
        private Integer aiScheduleDays;
        private String aiCustomRules;

        public Response(String language, String country, String timezone) {
            this.language = language;
            this.country = country;
            this.timezone = timezone;
            this.aiScheduleDays = 4; // default
            this.aiCustomRules = "";
        }

        public Response(String language, String country, String timezone, Integer aiScheduleDays) {
            this.language = language;
            this.country = country;
            this.timezone = timezone;
            this.aiScheduleDays = aiScheduleDays != null ? aiScheduleDays : 4;
            this.aiCustomRules = "";
        }

        public Response(String language, String country, String timezone, Integer aiScheduleDays, String aiCustomRules) {
            this.language = language;
            this.country = country;
            this.timezone = timezone;
            this.aiScheduleDays = aiScheduleDays != null ? aiScheduleDays : 4;
            this.aiCustomRules = aiCustomRules != null ? aiCustomRules : "";
        }
    }

    public static class Request {

        @Getter
        @Setter
        public static class Language {
            private String language;
        }

        @Getter
        @Setter
        public static class Country {
            private String country;
        }

        @Getter
        @Setter
        public static class Timezone {
            private String timezone;
        }

        @Getter
        @Setter
        public static class AiScheduleDays {
            private Integer aiScheduleDays;
        }

        @Getter
        @Setter
        public static class AiCustomRules {
            private String aiCustomRules;
        }
    }
}
