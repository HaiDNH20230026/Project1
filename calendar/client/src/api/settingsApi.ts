import { apiClient } from "api/apiClient"

export interface UserSettingResponse {
    language: string;
    country: string;
    timezone: string;
    aiScheduleDays: number;
    aiCustomRules: string;
}

/**
 * Get user settings
 */
export const getUserSettingsApi = () =>
    apiClient.get<UserSettingResponse>('/v1/user/setting');

/**
 * Update AI schedule days
 */
export const updateAiScheduleDaysApi = (aiScheduleDays: number) =>
    apiClient.patch<UserSettingResponse>('/v1/user/setting/ai-schedule-days', 
        { aiScheduleDays },
        { headers: { "Content-Type": "application/json" } }
    );

/**
 * Update AI custom rules
 */
export const updateAiCustomRulesApi = (aiCustomRules: string) =>
    apiClient.patch<UserSettingResponse>('/v1/user/setting/ai-custom-rules', 
        { aiCustomRules },
        { headers: { "Content-Type": "application/json" } }
    );

/**
 * Update language
 */
export const updateLanguageApi = (language: string) =>
    apiClient.patch<UserSettingResponse>('/v1/user/setting/language',
        { language },
        { headers: { "Content-Type": "application/json" } }
    );

/**
 * Update country
 */
export const updateCountryApi = (country: string) =>
    apiClient.patch<UserSettingResponse>('/v1/user/setting/country',
        { country },
        { headers: { "Content-Type": "application/json" } }
    );

/**
 * Update timezone
 */
export const updateTimezoneApi = (timezone: string) =>
    apiClient.patch<UserSettingResponse>('/v1/user/setting/timezone',
        { timezone },
        { headers: { "Content-Type": "application/json" } }
    );
