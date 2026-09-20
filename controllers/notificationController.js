const db = require('../config/db');

exports.getMyNotifications =
  async (req, res) => {
    try {
      const userId = req.user.id;

      const requestedLimit =
        Number(req.query.limit || 30);

      const limit = Math.min(
        Math.max(
          Number.isFinite(
            requestedLimit
          )
            ? requestedLimit
            : 30,
          1
        ),
        100
      );

      const [rows] =
        await db.query(
          `
            SELECT
              id,
              module_code,
              entity_type,
              entity_id,
              notification_type,
              priority,
              title,
              message,
              action_url,
              is_read,
              read_at,
              due_at,
              created_at

            FROM notifications

            WHERE user_id = ?

            ORDER BY
              is_read ASC,

              CASE priority
                WHEN 'URGENT' THEN 1
                WHEN 'HIGH' THEN 2
                ELSE 3
              END ASC,

              created_at DESC

            LIMIT ?
          `,
          [
            userId,
            limit,
          ]
        );

      const [countRows] =
        await db.query(
          `
            SELECT
              COUNT(*) AS unread_count

            FROM notifications

            WHERE user_id = ?
              AND is_read = 0
          `,
          [userId]
        );

      return res.json({
        data: rows,
        unread_count:
          Number(
            countRows[0]
              ?.unread_count || 0
          ),
      });
    } catch (error) {
      console.error(
        'GET NOTIFICATIONS ERROR:',
        error
      );

      return res.status(500).json({
        message:
          'Gagal mengambil notifikasi.',
      });
    }
  };

exports.markAsRead =
  async (req, res) => {
    try {
      const userId = req.user.id;

      const notificationId =
        Number(req.params.id);

      if (
        !Number.isInteger(
          notificationId
        ) ||
        notificationId <= 0
      ) {
        return res
          .status(400)
          .json({
            message:
              'ID notifikasi tidak valid.',
          });
      }

      const [result] =
        await db.query(
          `
            UPDATE notifications

            SET
              is_read = 1,
              read_at = COALESCE(
                read_at,
                NOW()
              )

            WHERE id = ?
              AND user_id = ?
          `,
          [
            notificationId,
            userId,
          ]
        );

      if (
        result.affectedRows === 0
      ) {
        return res
          .status(404)
          .json({
            message:
              'Notifikasi tidak ditemukan.',
          });
      }

      return res.json({
        message:
          'Notifikasi ditandai sudah dibaca.',
      });
    } catch (error) {
      console.error(
        'MARK NOTIFICATION READ ERROR:',
        error
      );

      return res.status(500).json({
        message:
          'Gagal memperbarui notifikasi.',
      });
    }
  };

exports.markAllAsRead =
  async (req, res) => {
    try {
      const userId = req.user.id;

      await db.query(
        `
          UPDATE notifications

          SET
            is_read = 1,
            read_at = COALESCE(
              read_at,
              NOW()
            )

          WHERE user_id = ?
            AND is_read = 0
        `,
        [userId]
      );

      return res.json({
        message:
          'Semua notifikasi ditandai sudah dibaca.',
      });
    } catch (error) {
      console.error(
        'MARK ALL NOTIFICATIONS READ ERROR:',
        error
      );

      return res.status(500).json({
        message:
          'Gagal memperbarui notifikasi.',
      });
    }
  };