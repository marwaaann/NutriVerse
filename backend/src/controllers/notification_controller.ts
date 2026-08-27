import { NextFunction, Request, Response } from "express";
import { INotificationService } from "../interface/INotificationService";
import { apiResponse } from "../helpers/apiResponse";
import { AppError } from "../utils/AppError";
import logger from "../config/logger";

export class NotificationController {
  constructor(private notificationService: INotificationService) {}

  getNotifications = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.user_Id;
      if (!userId) {
        throw new AppError("UNAUTHORIZED", 401);
      }

      const notifications = await this.notificationService.getUserNotifications(userId);
      apiResponse(res, 200, true, "Notifications retrieved successfully", notifications);
    } catch (error) {
      logger.error("Error retrieving notifications:", error);
      next(error);
    }
  };

  getUnreadCount = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.user_Id;
      if (!userId) {
        throw new AppError("UNAUTHORIZED", 401);
      }

      const count = await this.notificationService.getUnreadCount(userId);
      apiResponse(res, 200, true, "Unread count retrieved successfully", { count });
    } catch (error) {
      logger.error("Error retrieving unread count:", error);
      next(error);
    }
  };

  markAsRead = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.user_Id;
      if (!userId) {
        throw new AppError("UNAUTHORIZED", 401);
      }

      const { id } = req.params as { id: string };
      const updated = await this.notificationService.markAsRead(id, userId);

      if (!updated) {
        throw new AppError("Notification not found or access denied", 404);
      }

      apiResponse(res, 200, true, "Notification marked as read", updated);
    } catch (error) {
      logger.error("Error marking notification as read:", error);
      next(error);
    }
  };

  markAllAsRead = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.user_Id;
      if (!userId) {
        throw new AppError("UNAUTHORIZED", 401);
      }

      await this.notificationService.markAllAsRead(userId);
      apiResponse(res, 200, true, "All notifications marked as read", null);
    } catch (error) {
      logger.error("Error marking all notifications as read:", error);
      next(error);
    }
  };

  deleteNotification = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.user_Id;
      if (!userId) {
        throw new AppError("UNAUTHORIZED", 401);
      }

      const { id } = req.params as { id: string };
      const deleted = await this.notificationService.deleteNotification(id, userId);

      if (!deleted) {
        throw new AppError("Notification not found or access denied", 404);
      }

      apiResponse(res, 200, true, "Notification deleted successfully", null);
    } catch (error) {
      logger.error("Error deleting notification:", error);
      next(error);
    }
  };
}
