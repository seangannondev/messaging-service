-- Create conversations table to group messages by participants
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_one VARCHAR(255) NOT NULL,
    participant_two VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(participant_one, participant_two)
);

-- Create messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id),
    from_address VARCHAR(255) NOT NULL,
    to_address VARCHAR(255) NOT NULL,
    message_type VARCHAR(10) NOT NULL CHECK (message_type IN ('sms', 'mms', 'email')),
    body TEXT NOT NULL,
    attachments JSONB DEFAULT NULL,
    provider_message_id VARCHAR(255),
    provider_name VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for efficient querying
CREATE INDEX idx_conversations_participants ON conversations(participant_one, participant_two);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_timestamp ON messages(timestamp DESC);
CREATE INDEX idx_messages_from_to ON messages(from_address, to_address);

-- Function to get or create conversation
CREATE OR REPLACE FUNCTION get_or_create_conversation(p1 VARCHAR(255), p2 VARCHAR(255))
RETURNS UUID AS $$
DECLARE
    conv_id UUID;
    participant_one VARCHAR(255);
    participant_two VARCHAR(255);
BEGIN
    -- Ensure consistent ordering of participants (lexicographic)
    IF p1 < p2 THEN
        participant_one := p1;
        participant_two := p2;
    ELSE
        participant_one := p2;
        participant_two := p1;
    END IF;
    
    -- Try to find existing conversation
    SELECT id INTO conv_id 
    FROM conversations 
    WHERE conversations.participant_one = get_or_create_conversation.participant_one 
    AND conversations.participant_two = get_or_create_conversation.participant_two;
    
    -- If not found, create new conversation
    IF conv_id IS NULL THEN
        INSERT INTO conversations (participant_one, participant_two) 
        VALUES (participant_one, participant_two) 
        RETURNING id INTO conv_id;
    ELSE
        -- Update the updated_at timestamp
        UPDATE conversations 
        SET updated_at = CURRENT_TIMESTAMP 
        WHERE id = conv_id;
    END IF;
    
    RETURN conv_id;
END;
$$ LANGUAGE plpgsql;