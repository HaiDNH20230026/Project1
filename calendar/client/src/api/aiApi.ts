import { apiClient } from "api/apiClient"

// ========== INTERFACES ==========

export interface TimeSlot {
    startTime: string;
    endTime: string;
    durationMinutes: number;
}

export interface ScheduleProposal {
    taskId: number;
    taskTitle: string;
    proposedStartTime: string;
    proposedEndTime: string;
    explanation: string;
    score: number;
    sessionNumber: number;
    totalSessions: number;
}

export interface ScheduleResult {
    taskId: number;
    taskTitle: string;
    message: string;
    proposals: ScheduleProposal[];
    cycleStart?: string;
    cycleEnd?: string;
}

export interface ModelStatus {
    model: string;
    available: boolean;
    cooldownRemaining?: number;
}

export interface AcceptedSession {
    eventId: number;
    taskId: number;
    sessionNumber: number;
    startTime: string;
    endTime: string;
}

/**
 * Test Gemini API connection
 */
export const testGeminiApi = () =>
    apiClient.get<{ status: string; model: string; response: string }>(`/v1/ai/test`);

/**
 * Get Gemini models status
 */
export const getModelsStatusApi = () =>
    apiClient.get<{ models: ModelStatus[] }>(`/v1/ai/models`);

/**
 * Get AI schedule proposals for a task
 */
export const proposeScheduleApi = (taskId: number) =>
    apiClient.post<ScheduleResult>(`/v1/ai/schedule/propose/${taskId}`);

/**
 * Accept all proposals and create events
 */
export const acceptAllProposalsApi = (proposals: ScheduleProposal[]) =>
    apiClient.post<AcceptedSession[]>(`/v1/ai/schedule/accept-all`, proposals, {
        headers: { "Content-Type": "application/json" }
    });

/**
 * Accept single proposal
 */
export const acceptProposalApi = (proposal: ScheduleProposal) =>
    apiClient.post<AcceptedSession>(`/v1/ai/schedule/accept`, proposal, {
        headers: { "Content-Type": "application/json" }
    });

/**
 * Sync completed sessions for a task (based on current time)
 * Sessions are completed when their end time has passed
 */
export const syncCompletedSessionsApi = (taskId: number) =>
    apiClient.post(`/v1/ai/task/${taskId}/sync-sessions`);
