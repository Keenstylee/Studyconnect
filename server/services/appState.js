import { pool } from '../db.js';
import { fromCycle, groupMode } from '../utils/formatters.js';

export async function getAppState(userId) {
  const [
    userResult,
    coursesResult,
    groupsResult,
    membershipsResult,
    messagesResult,
    notificationsResult,
    pendingRequestsResult,
    sentRequestsResult,
    receivedRequestsResult,
  ] = await Promise.all([
    pool.query('SELECT * FROM users WHERE id = $1', [userId]),
    pool.query('SELECT course FROM user_courses WHERE user_id = $1 ORDER BY course', [userId]),
    pool.query(`
      SELECT g.*, COALESCE(json_agg(gm.user_id ORDER BY gm.user_id) FILTER (WHERE gm.user_id IS NOT NULL), '[]') AS members
      FROM study_groups g
      LEFT JOIN group_members gm ON gm.group_id = g.id AND gm.user_id <> $1
      GROUP BY g.id
      ORDER BY g.id
    `, [userId]),
    pool.query('SELECT group_id, role FROM group_members WHERE user_id = $1', [userId]),
    pool.query(`
      SELECT m.group_id, m.sender_id AS uid, COALESCE(u.name, 'Usuario') AS name, m.content AS text,
             to_char(m.sent_at, 'HH24:MI') AS t
      FROM messages m
      JOIN users u ON u.id = m.sender_id
      WHERE m.is_deleted = FALSE
      ORDER BY m.sent_at ASC
    `),
    pool.query('SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC', [userId]),
    pool.query("SELECT group_id FROM join_requests WHERE user_id = $1 AND status = 'pending'", [userId]),
    pool.query(`
      SELECT jr.id, jr.group_id, jr.status, jr.message, jr.created_at, jr.updated_at,
             g.name AS group_name, g.course, g.schedule
      FROM join_requests jr
      JOIN study_groups g ON g.id = jr.group_id
      WHERE jr.user_id = $1
      ORDER BY jr.updated_at DESC, jr.created_at DESC
    `, [userId]),
    pool.query(`
      SELECT jr.id, jr.group_id, jr.user_id AS requester_id, jr.status, jr.message, jr.created_at, jr.updated_at,
             g.name AS group_name, g.course, g.schedule,
             u.name AS requester_name, u.email AS requester_email, u.career AS requester_career
      FROM join_requests jr
      JOIN study_groups g ON g.id = jr.group_id
      JOIN users u ON u.id = jr.user_id
      WHERE g.owner_id = $1
      ORDER BY jr.updated_at DESC, jr.created_at DESC
    `, [userId]),
  ]);

  const user = userResult.rows[0];
  if (!user) throw new Error('Usuario no encontrado');

  const messagesByGroup = new Map();
  for (const message of messagesResult.rows) {
    const list = messagesByGroup.get(message.group_id) || [];
    list.push({ uid: message.uid, name: message.uid === userId ? 'Tu' : message.name, text: message.text, t: message.t });
    messagesByGroup.set(message.group_id, list);
  }

  const memberships = membershipsResult.rows;
  const joined = memberships.filter((row) => row.role !== 'owner').map((row) => row.group_id);
  const created = memberships.filter((row) => row.role === 'owner').map((row) => row.group_id);

  return {
    user: {
      id: user.id,
      name: user.name,
      career: user.career || '',
      cycle: fromCycle(user.cycle),
      university: user.university || '',
      courses: coursesResult.rows.map((row) => row.course),
      availability: user.availability || '',
      bio: user.bio || '',
    },
    joined,
    created,
    pendingRequests: pendingRequestsResult.rows.map((row) => row.group_id),
    requests: {
      sent: sentRequestsResult.rows.map((request) => ({
        id: request.id,
        groupId: request.group_id,
        groupName: request.group_name,
        course: request.course,
        schedule: request.schedule || 'Por coordinar',
        message: request.message || '',
        status: request.status,
        createdAt: request.created_at,
        updatedAt: request.updated_at,
      })),
      received: receivedRequestsResult.rows.map((request) => ({
        id: request.id,
        groupId: request.group_id,
        requesterId: request.requester_id,
        requesterName: request.requester_name,
        requesterEmail: request.requester_email,
        requesterCareer: request.requester_career || '',
        groupName: request.group_name,
        course: request.course,
        schedule: request.schedule || 'Por coordinar',
        message: request.message || '',
        status: request.status,
        createdAt: request.created_at,
        updatedAt: request.updated_at,
      })),
    },
    msgcount: messagesResult.rows.filter((row) => row.uid === userId).length,
    notifications: notificationsResult.rows.map((row) => ({
      id: row.id,
      type: row.type,
      icon: row.type === 'message' ? 'MSG' : row.type === 'accepted' ? 'OK' : 'INFO',
      title: row.title || 'Notificacion',
      msg: row.message || '',
      data: row.data || {},
      time: 'reciente',
      read: row.is_read,
    })),
    groups: groupsResult.rows.map((group) => ({
      id: group.id,
      name: group.name,
      course: group.course,
      desc: group.description || 'Sin descripcion.',
      schedule: group.schedule || 'Por coordinar',
      max: group.max_members,
      members: group.members,
      owner: group.owner_id,
      uni: group.university || '',
      mode: group.modality || groupMode(group),
      image: group.image_url || '',
      msgs: messagesByGroup.get(group.id) || [],
    })),
  };
}
