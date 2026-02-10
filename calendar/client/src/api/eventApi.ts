import { apiClient } from "api/apiClient"

interface EventRequestDto {
    title: string;
    description?: string;
    location?: string;
    startTime: string;
    endTime: string;
    color: string;
    eventType?: string;
    // Recurring event fields
    recurrenceType?: string;  // NONE, DAILY, WEEKLY, BIWEEKLY, MONTHLY, YEARLY, WEEKDAYS
    recurrenceCount?: number | null;  // Số lần lặp (null = vô hạn)
    recurrenceEndDate?: string;  // Ngày kết thúc lặp
}

export const createEventApi =
    ( values : EventRequestDto ) =>
        apiClient.post(
            `/v1/event`, 
            values, 
            { headers: { "Content-Type": "application/json" } }
        );

export const updateEventApi =
    (event_id: number, values: Partial<EventRequestDto>) =>
        apiClient.put(
            `/v1/event/${event_id}`,
            values,
            { headers: { "Content-Type": "application/json" } }
        );

export const deleteEventApi =
    (event_id : number) => 
        apiClient.delete(`/v1/event/${event_id}`)