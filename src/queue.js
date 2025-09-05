const { EventEmitter } = require('events');
const { saveMessage } = require('./database');

class MessageQueue extends EventEmitter {
  constructor() {
    super();
    this.queue = [];
    this.processing = false;
    
    this.on('message', this.processMessage.bind(this));
  }

  enqueue(message) {
    this.queue.push(message);
    this.emit('message');
    console.log(`Message enqueued. Queue size: ${this.queue.length}`);
  }

  async processMessage() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const message = this.queue.shift();
      try {
        await this.handleMessage(message);
        console.log('Message processed successfully');
      } catch (error) {
        console.error('Failed to process message:', error);
        this.queue.unshift(message);
        break;
      }
    }

    this.processing = false;
  }

  async handleMessage(message) {
    try {
      const savedMessage = await saveMessage({
        from: message.from,
        to: message.to,
        type: message.type,
        body: message.body,
        attachments: message.attachments,
        providerMessageId: message.messaging_provider_id || message.xillio_id,
        providerName: this.getProviderName(message),
        timestamp: message.timestamp,
        status: 'delivered'
      });

      console.log('Message saved to database:', savedMessage.id);
      return savedMessage;
    } catch (error) {
      console.error('Error saving message to database:', error);
      throw error;
    }
  }

  getProviderName(message) {
    if (message.messaging_provider_id) {
      return 'messaging_provider';
    } else if (message.xillio_id) {
      return 'xillio_email';
    }
    return 'unknown';
  }

  getQueueStatus() {
    return {
      queueLength: this.queue.length,
      processing: this.processing
    };
  }
}

let messageQueue;

function initQueue() {
  messageQueue = new MessageQueue();
  console.log('Message queue initialized');
  return messageQueue;
}

function getQueue() {
  return messageQueue;
}

module.exports = {
  initQueue,
  getQueue,
  MessageQueue
};