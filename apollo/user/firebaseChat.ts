import { gql } from '@apollo/client';

export const CREATE_FIREBASE_CHAT_TOKEN = gql`mutation CreateFirebaseChatToken { createFirebaseChatToken }`;
export const CREATE_FIREBASE_CONVERSATION = gql`
 mutation CreateFirebaseConversation($input: FirebaseConversationInput!) {
  createFirebaseConversation(input: $input) { conversationId customerId agentId createdAt }
 }
`;
export const GET_FIREBASE_CONVERSATION = gql`
 query GetFirebaseConversation($conversationId: String!) {
  getFirebaseConversation(conversationId: $conversationId) { conversationId customerId agentId createdAt }
 }
`;
export const CHAT_AGENTS = gql`
 query ChatAgents($input: AgentsInquiry!) {
  getAgents(input: $input) { list { _id memberNick } metaCounter { total } }
 }
`;
