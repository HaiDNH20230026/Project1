import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserSettingsApi, updateAiScheduleDaysApi, updateAiCustomRulesApi, UserSettingResponse } from 'api/settingsApi';
import { useTheme } from 'contexts/ThemeContext';
import { logout } from 'utils/logout';
import 'styles/styles.css';

function Settings() {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const [settings, setSettings] = useState<UserSettingResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savingRules, setSavingRules] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Local state for form inputs
    const [aiScheduleDays, setAiScheduleDays] = useState(4);
    const [aiCustomRules, setAiCustomRules] = useState('');

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const response = await getUserSettingsApi();
            setSettings(response.data);
            setAiScheduleDays(response.data.aiScheduleDays || 4);
            setAiCustomRules(response.data.aiCustomRules || '');
        } catch (error) {
            console.error('Failed to load settings:', error);
            setMessage({ type: 'error', text: 'Không thể tải cài đặt' });
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAiScheduleDays = async () => {
        try {
            setSaving(true);
            const response = await updateAiScheduleDaysApi(aiScheduleDays);
            setSettings(response.data);
            setMessage({ type: 'success', text: 'Đã lưu cài đặt thành công!' });
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            console.error('Failed to save settings:', error);
            setMessage({ type: 'error', text: 'Không thể lưu cài đặt' });
        } finally {
            setSaving(false);
        }
    };

    const handleSaveAiCustomRules = async () => {
        try {
            setSavingRules(true);
            const response = await updateAiCustomRulesApi(aiCustomRules);
            setSettings(response.data);
            setMessage({ type: 'success', text: 'Đã lưu quy tắc AI thành công!' });
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            console.error('Failed to save AI rules:', error);
            setMessage({ type: 'error', text: 'Không thể lưu quy tắc AI' });
        } finally {
            setSavingRules(false);
        }
    };

    const handleLogout = () => {
        logout(navigate);
    };

    if (loading) {
        return (
            <div className="settings">
                <div className="settings-loading">Đang tải...</div>
            </div>
        );
    }

    return (
        <div className="settings">
            <div className="settings-container">
                <div className="settings-header">
                    <button className="settings-back-btn" onClick={() => navigate(-1)} title="Quay lại">
                        <i className="material-icons">arrow_back</i>
                    </button>
                    <h1 className="settings-title">Cài đặt</h1>
                </div>

                {message && (
                    <div className={`settings-message ${message.type}`}>
                        {message.text}
                    </div>
                )}

                {/* Appearance Settings */}
                <div className="settings-section">
                    <h2 className="settings-section-title">
                        <i className="material-icons">palette</i>
                        Giao diện
                    </h2>
                    
                    <div className="settings-item">
                        <div className="settings-item-info">
                            <label className="settings-item-label">Chế độ tối</label>
                            <p className="settings-item-description">
                                Thay đổi giao diện ứng dụng sang chế độ tối để giảm mỏi mắt.
                            </p>
                        </div>
                        <div className="settings-item-control">
                            <label className="settings-toggle">
                                <input
                                    type="checkbox"
                                    checked={theme === 'dark'}
                                    onChange={toggleTheme}
                                />
                                <span className="settings-toggle-slider"></span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* AI Scheduling Settings */}
                <div className="settings-section">
                    <h2 className="settings-section-title">
                        <i className="material-icons">smart_toy</i>
                        AI Lập lịch
                    </h2>
                    
                    <div className="settings-item">
                        <div className="settings-item-info">
                            <label className="settings-item-label">Số ngày lên lịch trước</label>
                            <p className="settings-item-description">
                                AI sẽ đề xuất lịch học trong khoảng thời gian này. 
                                Giá trị cao hơn giúp lên kế hoạch dài hạn hơn.
                            </p>
                        </div>
                        <div className="settings-item-control">
                            <div className="settings-slider-container">
                                <input
                                    type="range"
                                    min="1"
                                    max="14"
                                    value={aiScheduleDays}
                                    onChange={(e) => setAiScheduleDays(Number(e.target.value))}
                                    className="settings-slider"
                                />
                                <span className="settings-slider-value">{aiScheduleDays} ngày</span>
                            </div>
                            <button 
                                className="settings-save-btn"
                                onClick={handleSaveAiScheduleDays}
                                disabled={saving || aiScheduleDays === settings?.aiScheduleDays}
                            >
                                {saving ? 'Đang lưu...' : 'Lưu'}
                            </button>
                        </div>
                    </div>

                    {/* AI Custom Rules */}
                    <div className="settings-item settings-item-vertical">
                        <div className="settings-item-info">
                            <label className="settings-item-label">Quy tắc tùy chỉnh cho AI</label>
                            <p className="settings-item-description">
                                Thêm các quy tắc hoặc yêu cầu riêng cho AI khi lập lịch. 
                                Ví dụ: "Không lên lịch buổi sáng trước 9h", "Ưu tiên học vào buổi tối"...
                            </p>
                        </div>
                        <div className="settings-textarea-container">
                            <textarea
                                className="settings-textarea"
                                value={aiCustomRules}
                                onChange={(e) => setAiCustomRules(e.target.value)}
                                placeholder="Nhập các quy tắc tùy chỉnh cho AI..."
                                rows={4}
                            />
                            <button 
                                className="settings-save-btn"
                                onClick={handleSaveAiCustomRules}
                                disabled={savingRules || aiCustomRules === (settings?.aiCustomRules || '')}
                            >
                                {savingRules ? 'Đang lưu...' : 'Lưu quy tắc'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Account Section */}
                <div className="settings-section">
                    <h2 className="settings-section-title">
                        <i className="material-icons">account_circle</i>
                        Tài khoản
                    </h2>
                    
                    <div className="settings-item">
                        <div className="settings-item-info">
                            <label className="settings-item-label">Đăng xuất</label>
                            <p className="settings-item-description">
                                Đăng xuất khỏi tài khoản hiện tại.
                            </p>
                        </div>
                        <div className="settings-item-control">
                            <button 
                                className="settings-logout-btn"
                                onClick={handleLogout}
                            >
                                <i className="material-icons">logout</i>
                                Đăng xuất
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Settings;
