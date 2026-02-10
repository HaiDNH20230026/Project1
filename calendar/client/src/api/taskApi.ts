import { apiClient } from "api/apiClient"

export interface TaskRequestDto {
    title: string;
    description?: string;
    dueDate: string;  // ISO format: "2026-01-10T23:45:00"
    isCompleted?: boolean;
    taskType?: string;  // "SIMPLE" | "DEADLINE"
    priority?: string;  // "LOW" | "MEDIUM" | "HIGH"
    scale?: string;     // "QUICK" | "REGULAR" | "PROJECT"
    maxSessions?: number; // Số sessions tối đa (override computed)
    estimatedDuration?: number;  // in minutes
}

export interface TaskResponseDto {
    id: number;
    title: string;
    description?: string;
    dueDate: string;
    isCompleted: boolean;
    taskType?: string;
    priority?: string;
    scale?: string;
    scheduledSessions?: number;
    completedSessions?: number;
    requiredSessions?: number;
    maxSessions?: number;
}

/**
 * Create a new task
 */
export const createTaskApi = (task: TaskRequestDto) =>
    apiClient.post<TaskResponseDto>('/v1/task', task, {
        headers: { "Content-Type": "application/json" }
    });

/**
 * Get task by ID
 */
export const getTaskByIdApi = (taskId: number) =>
    apiClient.get<TaskResponseDto>(`/v1/task/${taskId}`);

/**
 * Update task
 */
export const updateTaskApi = (taskId: number, task: Partial<TaskRequestDto>) =>
    apiClient.put<TaskResponseDto>(`/v1/task/${taskId}`, task, {
        headers: { "Content-Type": "application/json" }
    });

/**
 * Delete task
 */
export const deleteTaskApi = (taskId: number) =>
    apiClient.delete(`/v1/task/${taskId}`);

/**
 * Toggle task completion (tick/untick checkbox)
 * Đây là cách DUY NHẤT để đánh dấu task hoàn thành
 */
export const toggleTaskCompletionApi = (taskId: number, isCompleted: boolean) =>
    apiClient.put(`/v1/task/${taskId}/completion`, { isCompleted }, {
        headers: { "Content-Type": "application/json" }
    });

/**
 * Get all tasks for current user
 */
export const getAllTasksApi = () =>
    apiClient.get<TaskResponseDto[]>('/v1/task');
