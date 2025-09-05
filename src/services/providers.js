function mockSendSMS(messageData) {
  console.log('📱 Sending SMS to provider:', {
    from: messageData.from,
    to: messageData.to,
    body: messageData.body
  });
  
  if (Math.random() < 0.05) {
    throw new Error('Provider returned 500 error');
  }
  if (Math.random() < 0.03) {
    throw new Error('Rate limit exceeded (429)');
  }
  
  return { success: true, providerId: `sms_${Date.now()}` };
}

function mockSendMMS(messageData) {
  console.log('📷 Sending MMS to provider:', {
    from: messageData.from,
    to: messageData.to,
    body: messageData.body,
    attachments: messageData.attachments
  });
  
  if (Math.random() < 0.05) {
    throw new Error('Provider returned 500 error');
  }
  if (Math.random() < 0.03) {
    throw new Error('Rate limit exceeded (429)');
  }
  
  return { success: true, providerId: `mms_${Date.now()}` };
}

function mockSendEmail(messageData) {
  console.log('📧 Sending Email to provider:', {
    from: messageData.from,
    to: messageData.to,
    body: messageData.body,
    attachments: messageData.attachments
  });
  
  if (Math.random() < 0.05) {
    throw new Error('Provider returned 500 error');
  }
  if (Math.random() < 0.03) {
    throw new Error('Rate limit exceeded (429)');
  }
  
  return { success: true, providerId: `email_${Date.now()}` };
}

async function sendToProvider(messageData) {
  const { type } = messageData;
  
  try {
    switch (type) {
      case 'sms':
        return await mockSendSMS(messageData);
      case 'mms':
        return await mockSendMMS(messageData);
      case 'email':
        return await mockSendEmail(messageData);
      default:
        throw new Error(`Unsupported message type: ${type}`);
    }
  } catch (error) {
    if (error.message.includes('429')) {
      throw { status: 429, message: 'Rate limit exceeded' };
    } else if (error.message.includes('500')) {
      throw { status: 500, message: 'Provider error' };
    }
    throw error;
  }
}

module.exports = {
  sendToProvider
};