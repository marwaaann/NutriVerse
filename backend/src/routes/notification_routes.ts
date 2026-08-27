import { Router } from "express";
import { NotificationController } from "../controllers/notification_controller";
import { authMiddleware } from "../middlewares/authMiddleware";

export const createNotificationRoutes = (
  notificationController: NotificationController
): Router => {
  const router = Router();

  router.use(authMiddleware);

  router.get("/", notificationController.getNotifications);
  router.get("/unread-count", notificationController.getUnreadCount);
  router.put("/read-all", notificationController.markAllAsRead);
  router.put("/:id/read", notificationController.markAsRead);
  router.delete("/:id", notificationController.deleteNotification);

  return router;
};
export default createNotificationRoutes;
