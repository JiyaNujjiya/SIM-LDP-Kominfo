const db = require('../config/db');

const createNotification = async ({
  userId,
  moduleCode,
  entityType = null,
  entityId = null,
  notificationType = 'INFO',
  priority = 'NORMAL',
  title,
  message,
  actionUrl = null,
  dueAt = null,
  createdBy = null,
}) => {
  const [result] = await db.query(
    `
      INSERT INTO notifications (
        user_id,
        module_code,
        entity_type,
        entity_id,
        notification_type,
        priority,
        title,
        message,
        action_url,
        due_at,
        created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      userId,
      moduleCode,
      entityType,
      entityId,
      notificationType,
      priority,
      title,
      message,
      actionUrl,
      dueAt,
      createdBy,
    ]
  );

  return result.insertId;
};

const getPimpinanUsers = async () => {
  const [rows] = await db.query(
    `
      SELECT DISTINCT u.id, u.nama
      FROM users u
      LEFT JOIN roles r ON r.id = u.role_id
      WHERE
        u.role = 'pimpinan'
        OR LOWER(COALESCE(r.nama_role, '')) = 'pimpinan'
      ORDER BY u.id ASC
    `
  );

  return rows;
};

const notifyPimpinanChangeSubmitted = async (perubahan, actorId) => {
  const pimpinanUsers = await getPimpinanUsers();

  const dueAt = new Date();
  dueAt.setDate(dueAt.getDate() + 2);

  for (const pimpinan of pimpinanUsers) {
    const [existingRows] = await db.query(
      `
        SELECT id
        FROM notifications
        WHERE user_id = ?
          AND module_code = 'PERUBAHAN'
          AND entity_type = 'change'
          AND entity_id = ?
          AND notification_type = 'APPROVAL'
          AND is_read = 0
        LIMIT 1
      `,
      [pimpinan.id, Number(perubahan.id)]
    );

    if (existingRows.length > 0) continue;

    await createNotification({
      userId: pimpinan.id,
      moduleCode: 'PERUBAHAN',
      entityType: 'change',
      entityId: Number(perubahan.id),
      notificationType: 'APPROVAL',
      priority: 'HIGH',
      title: `Persetujuan Perubahan ${perubahan.kode_perubahan}`,
      message: `${perubahan.kode_perubahan} berada pada tahap analisis dan memerlukan keputusan pimpinan.`,
      actionUrl: '/perubahan/analisis',
      dueAt,
      createdBy: actorId,
    });
  }
};

const resolveChangeApprovalNotifications = async (perubahanId) => {
  await db.query(
    `
      UPDATE notifications
      SET
        is_read = 1,
        read_at = COALESCE(read_at, NOW())
      WHERE module_code = 'PERUBAHAN'
        AND entity_type = 'change'
        AND entity_id = ?
        AND notification_type = 'APPROVAL'
        AND is_read = 0
    `,
    [Number(perubahanId)]
  );
};

const notifyChangeDecision = async ({
  userId,
  perubahan,
  tahap,
  decision,
  actorId,
}) => {
  if (!userId) return;

  const approved = decision === 'Disetujui';

  await createNotification({
    userId,
    moduleCode: 'PERUBAHAN',
    entityType: 'change',
    entityId: Number(perubahan.id),
    notificationType: 'STATUS',
    priority: approved ? 'NORMAL' : 'HIGH',
    title: approved
      ? `${tahap} ${perubahan.kode_perubahan} disetujui`
      : `${tahap} ${perubahan.kode_perubahan} ditolak`,
    message: approved
      ? `${tahap} pada ${perubahan.kode_perubahan} telah disetujui oleh pimpinan.`
      : `${tahap} pada ${perubahan.kode_perubahan} ditolak oleh pimpinan dan perlu diperbaiki.`,
    actionUrl: '/perubahan/analisis',
    createdBy: actorId,
  });
};

module.exports = {
  createNotification,
  notifyPimpinanChangeSubmitted,
  resolveChangeApprovalNotifications,
  notifyChangeDecision,
};