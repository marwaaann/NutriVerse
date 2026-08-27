import { NotificationModel, INotificationDocument, INotification } from "../models/notification_model";
import { AppError } from "../utils/AppError";

export class NotificationRepository {
  async create(data: Partial<INotification>): Promise<INotificationDocument> {
    try {
      const notification = new NotificationModel(data);
      return await notification.save();
    } catch (error) {
      throw new AppError("Failed to create notification", 500);
    }
  }

  async findByUserId(userId: string): Promise<INotificationDocument[]> {
    try {
      return await NotificationModel.find({ userId })
        .sort({ createdAt: -1 })
        .limit(100);
    } catch (error) {
      throw new AppError("Failed to fetch notifications", 500);
    }
  }

  async countUnreadByUserId(userId: string): Promise<number> {
    try {
      return await NotificationModel.countDocuments({ userId, isRead: false });
    } catch (error) {
      throw new AppError("Failed to count unread notifications", 500);
    }
  }

  async markAsRead(id: string, userId: string): Promise<INotificationDocument | null> {
    try {
      return await NotificationModel.findOneAndUpdate(
        { _id: id, userId },
        { $set: { isRead: true } },
        { new: true }
      );
    } catch (error) {
      throw new AppError("Failed to mark notification as read", 500);
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    try {
      await NotificationModel.updateMany(
        { userId, isRead: false },
        { $set: { isRead: true } }
      );
    } catch (error) {
      throw new AppError("Failed to mark all notifications as read", 500);
    }
  }

  async delete(id: string, userId: string): Promise<boolean> {
    try {
      const result = await NotificationModel.deleteOne({ _id: id, userId });
      return result.deletedCount > 0;
    } catch (error) {
      throw new AppError("Failed to delete notification", 500);
    }
  }
}
