import { INotificationDocument, INotification } from "../models/notification_model";

export interface INotificationService {
  createNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    relatedRecipeId?: string,
    relatedMealPlanId?: string
  ): Promise<INotificationDocument>;

  getUserNotifications(userId: string): Promise<INotificationDocument[]>;
  getUnreadCount(userId: string): Promise<number>;
  markAsRead(id: string, userId: string): Promise<INotificationDocument | null>;
  markAllAsRead(userId: string): Promise<void>;
  deleteNotification(id: string, userId: string): Promise<boolean>;
}
