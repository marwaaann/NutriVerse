import axiosInstance from "../api/axiosInstance";

export interface NotificationResponse {
  _id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  relatedRecipeId?: string;
  relatedMealPlanId?: string;
  createdAt: string;
  updatedAt: string;
}

export const notificationService = {
  async getNotifications(): Promise<NotificationResponse[]> {
    const response = await axiosInstance.get("/api/notifications");
    return response.data.data;
  },

  async getUnreadCount(): Promise<number> {
    const response = await axiosInstance.get("/api/notifications/unread-count");
    return response.data.data.count;
  },

  async markAsRead(id: string): Promise<NotificationResponse> {
    const response = await axiosInstance.put(`/api/notifications/${id}/read`);
    return response.data.data;
  },

  async markAllAsRead(): Promise<void> {
    await axiosInstance.put("/api/notifications/read-all");
  },

  async deleteNotification(id: string): Promise<void> {
    await axiosInstance.delete(`/api/notifications/${id}`);
  },
};
