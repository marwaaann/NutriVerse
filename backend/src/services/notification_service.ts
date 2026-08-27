import { INotificationService } from "../interface/INotificationService";
import { NotificationRepository } from "../repository/notification_repository";
import { INotificationDocument, INotification } from "../models/notification_model";

export class NotificationService implements INotificationService {
  constructor(private notificationRepository: NotificationRepository) {}

  async createNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    relatedRecipeId?: string,
    relatedMealPlanId?: string
  ): Promise<INotificationDocument> {
    return await this.notificationRepository.create({
      userId,
      type,
      title,
      message,
      isRead: false,
      relatedRecipeId,
      relatedMealPlanId,
    });
  }

  async getUserNotifications(userId: string): Promise<INotificationDocument[]> {
    return await this.notificationRepository.findByUserId(userId);
  }

  async getUnreadCount(userId: string): Promise<number> {
    return await this.notificationRepository.countUnreadByUserId(userId);
  }

  async markAsRead(id: string, userId: string): Promise<INotificationDocument | null> {
    return await this.notificationRepository.markAsRead(id, userId);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.markAllAsRead(userId);
  }

  async deleteNotification(id: string, userId: string): Promise<boolean> {
    return await this.notificationRepository.delete(id, userId);
  }
}
