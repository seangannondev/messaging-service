const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function initDatabase() {
  try {
    const client = await pool.connect();
    console.log('Connected to PostgreSQL database');
    client.release();
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}

async function getOrCreateConversation(from, to) {
  const query = 'SELECT get_or_create_conversation($1, $2) as id';
  const result = await pool.query(query, [from, to]);
  return result.rows[0].id;
}

async function saveMessage(messageData) {
  const {
    from,
    to,
    type,
    body,
    attachments,
    providerMessageId,
    providerName,
    timestamp,
    status = 'pending'
  } = messageData;

  const conversationId = await getOrCreateConversation(from, to);

  const query = `
    INSERT INTO messages (
      conversation_id, from_address, to_address, message_type, 
      body, attachments, provider_message_id, provider_name, 
      status, timestamp
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
  `;

  const values = [
    conversationId,
    from,
    to,
    type,
    body,
    attachments ? JSON.stringify(attachments) : null,
    providerMessageId,
    providerName,
    status,
    timestamp || new Date().toISOString()
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}

async function getMessages(from, to, limit = 10, offset = 0) {
  const conversationId = await getOrCreateConversation(from, to);
  
  const query = `
    SELECT * FROM messages 
    WHERE conversation_id = $1 
    ORDER BY timestamp DESC 
    LIMIT $2 OFFSET $3
  `;

  const result = await pool.query(query, [conversationId, limit, offset]);
  return result.rows;
}

async function updateMessageStatus(messageId, status) {
  const query = 'UPDATE messages SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *';
  const result = await pool.query(query, [status, messageId]);
  return result.rows[0];
}

module.exports = {
  pool,
  initDatabase,
  saveMessage,
  getMessages,
  updateMessageStatus,
  getOrCreateConversation
};