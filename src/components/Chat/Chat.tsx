import { ChangeEvent, useEffect, useRef, useState, useCallback } from 'react';
import {
  Room,
  RoomMember,
  MatrixClient,
  MatrixEvent,
  EventType,
  RoomEvent,
  ClientEvent,
  SyncState,
} from 'matrix-js-sdk';
import { ISyncStateData } from 'matrix-js-sdk/lib/sync';
import { toast } from 'react-toastify';
import styles from './Chat.module.scss';
import { formatTimestamp } from '../../utils/utils';

interface IMessage {
  eventId: string;
  sender: string;
  content: { body: string };
  timestamp: number;
}

interface IProps {
  matrixClient: MatrixClient;
  initialRoomId?: string | null;
  onRoomIdChange: (roomId: string | null) => void;
}

export const Chat = ({ matrixClient, initialRoomId = null, onRoomIdChange }: IProps) => {
  const [roomId, setRoomId] = useState<string | null>(initialRoomId);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentUserId = matrixClient.getUserId();

  const handleSync = useCallback(
    (state: SyncState, _prevState: SyncState | null, res?: ISyncStateData) => {
      console.log('Matrix sync state:', state);
      if (state === 'ERROR') {
        console.error('Sync error:', res);
        toast.error('Sync error occurred. Please try again.');
      } else if (state === 'PREPARED') {
        fetchJoinedRooms();
      }
    },
    [matrixClient],
  );

  useEffect(() => {
    matrixClient.on(ClientEvent.Sync, handleSync);
    matrixClient.startClient({ initialSyncLimit: 100 });

    return () => {
      matrixClient.removeListener(ClientEvent.Sync, handleSync);
      matrixClient.stopClient();
    };
  }, [matrixClient, handleSync]);

  const fetchJoinedRooms = useCallback(() => {
    setIsLoadingRooms(true);
    const currentRooms = matrixClient.getRooms();
    setRooms(currentRooms);
    setIsLoadingRooms(false);
  }, [matrixClient]);

  useEffect(() => {
    const handleRoomMembership = fetchJoinedRooms;
    matrixClient.on(RoomEvent.MyMembership, handleRoomMembership);

    return () => {
      matrixClient.off(RoomEvent.MyMembership, handleRoomMembership);
    };
  }, [matrixClient, fetchJoinedRooms]);

  useEffect(() => {
    if (!roomId) return;

    const fetchMembers = async () => {
      setIsLoadingMembers(true);
      const room = matrixClient.getRoom(roomId);
      if (room) {
        setMembers(room.getJoinedMembers());
        setIsLoadingMembers(false);
      }
    };

    fetchMembers();
  }, [matrixClient, roomId]);

  useEffect(() => {
    if (!roomId) return;

    const room = matrixClient.getRoom(roomId);
    if (!room) return;

    setIsLoadingMessages(true);
    const timelineSet = room.getUnfilteredTimelineSet();

    const mapEventsToMessages = (events: MatrixEvent[]): IMessage[] =>
      events
        .filter((event) => event.getType() === EventType.RoomMessage)
        .map((event) => ({
          eventId: event.getId() || '',
          sender: event.getSender() || '',
          content: { body: event.getContent().body || '' },
          timestamp: event.getTs(),
        }))
        .sort((a, b) => a.timestamp - b.timestamp);

    const loadMessages = async () => {
      try {
        const initialMessages = mapEventsToMessages(timelineSet.getLiveTimeline().getEvents());
        setMessages(initialMessages);
      } catch (error) {
        console.error('Error loading messages:', error);
        toast.error('Error loading messages');
      } finally {
        setIsLoadingMessages(false);
      }
    };

    const onRoomTimeline = (event: MatrixEvent) => {
      if (event.getType() === EventType.RoomMessage) {
        const newMsg: IMessage = {
          eventId: event.getId() || '',
          sender: event.getSender() || '',
          content: { body: event.getContent().body || '' },
          timestamp: event.getTs(),
        };
        setMessages((prev) => [...prev, newMsg]);
        setIsLoadingMessages(false);
      }
    };

    room.on(RoomEvent.Timeline, onRoomTimeline);
    loadMessages();

    return () => {
      room.off(RoomEvent.Timeline, onRoomTimeline);
    };
  }, [matrixClient, roomId]);

  // Auto-scroll to the last message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !roomId) return;

    try {
      await matrixClient.sendTextMessage(roomId, newMessage);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Error sending message');
    }
  }, [matrixClient, newMessage, roomId]);

  const handleRoomChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const selectedRoomId = event.target.value;
      setRoomId(selectedRoomId || null);
      setMessages([]);
      onRoomIdChange(selectedRoomId || null);
    },
    [onRoomIdChange],
  );

  const displayedMembers = members.slice(0, 3);
  const totalMembers = members.length;

  return (
    <div className={styles.chatContainer}>
      <h2 className={styles.chatTitle}>Matrix Chat</h2>

      {/* Room Selector */}
      <div className={styles.chatRoomSelect}>
        {isLoadingRooms ? (
          <div>Loading rooms...</div>
        ) : (
          <select
            value={roomId || ''}
            onChange={handleRoomChange}
            className={styles.chatRoomSelectSelect}
            aria-label="Select chat room"
          >
            <option value="">Select a room</option>
            {rooms.map((room) => (
              <option key={room.roomId} value={room.roomId}>
                {room.name || room.roomId}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Members List */}
      {roomId && (
        <div className={styles.chatMembersList}>
          <div className={styles.chatMembersList__header}>
            <h3>Members</h3>
            {isLoadingMembers && <span className="loading">(Loading...)</span>}
          </div>
          <ul className={styles.chatMembersList__list}>
            {/* Display current user */}
            <li key={currentUserId} className={`${styles.memberItem} ${styles.currentUser}`}>
              You: {currentUserId}
            </li>
            {/* Display up to 3 other members */}
            {displayedMembers.map((member) =>
              member.userId !== currentUserId ? (
                <li key={member.userId} className={`${styles.memberItem} ${styles.member}`}>
                  {member.name || member.userId}
                </li>
              ) : null,
            )}
          </ul>
          {/* Show total number of members */}
          {totalMembers > 3 && <p className={styles.chatMembersList__total}>And {totalMembers - 3} more members...</p>}
          <p className={styles.chatMembersList__total}>Total members: {totalMembers}</p>
        </div>
      )}

      {/* Messages */}
      <div className={styles.chatMessages}>
        {isLoadingMessages && roomId ? (
          <div>Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className={styles.noMessages}>No messages</div>
        ) : (
          messages.map((msg) => (
            <div key={msg.eventId} className={styles.message}>
              <div className={styles.messageContent}>
                <span className={styles.sender}>{msg.sender}</span>
                <span className={styles.text}>{msg.content.body}</span>
              </div>
              <span className={styles.timestamp}>{formatTimestamp(msg.timestamp)}</span>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      {roomId && (
        <div className={styles.chatInputArea}>
          <input
            type="text"
            placeholder="Enter message"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            className={styles.messageInput}
            aria-label="Enter message"
          />
          <button
            onClick={sendMessage}
            className={styles.sendButton}
            disabled={!newMessage.trim()}
            aria-label="Send message"
          >
            Send
          </button>
        </div>
      )}
    </div>
  );
};
