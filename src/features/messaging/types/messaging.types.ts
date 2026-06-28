export interface Conversation {
  id: string
  organization_id: string
  title: string | null
  is_group: boolean
  property_id: string | null
  created_by: string
  created_at: string
}

export interface ConversationMember {
  id: string
  conversation_id: string
  profile_id: string
  joined_at: string
  created_at: string
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  body: string
  is_read: boolean
  created_at: string
}

export interface MessageWithSender extends Message {
  sender?: {
    id: string
    full_name: string | null
    avatar_url: string | null
  }
}

export interface CreateConversationInput {
  title?: string
  memberIds: string[]
  organizationId: string
  isGroup?: boolean
}

export interface SendMessageInput {
  conversationId: string
  senderId: string
  body: string
}
