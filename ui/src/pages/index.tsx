import io, { Socket } from "socket.io-client"
import { FormEvent, useEffect, useRef, useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"


const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'ws://127.0.0.1'
const CONNECTION_COUNT_UPDATED_CHANNEL = "chit-chat:connection-count-updated";
const NEW_MESSAGE_CHANNEL = "chit-chat:new-message";

type Message = {
  message: string
  id: string
  createdAt: string
  port: string
}


function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null)
  useEffect(() => {
    const socketIo = io(SOCKET_URL, {
      reconnection: true,
      upgrade: true,
      transports: [
        "websocket",
        "polling"
      ]
    })
    setSocket(socketIo)
    return () => {
      socketIo.disconnect()
    }
  }, [])

  return socket
}

export default function Home() {
  const socket = useSocket()
  const [newMessage, setNewMessage] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const messageListRef = useRef<HTMLOListElement | null>(null)
  const [connectionCount, setConnectionCount] = useState(0)
  useEffect(() => {
    socket?.on('connect', () => {
      console.log("Connected to socket")
    })
    socket?.on(NEW_MESSAGE_CHANNEL, (message: Message) => {
      setMessages((prevMessages) => [...prevMessages, message])
      setTimeout(() => {
        scrollToBottom()
      }, 0)
    })
    socket?.on(
      CONNECTION_COUNT_UPDATED_CHANNEL,
      ({ count }: { count: number }) => {
        setConnectionCount(count);
      }
    );
  }, [socket])
  function scrollToBottom() {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight + 1000
    }
  }
  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    socket?.emit(NEW_MESSAGE_CHANNEL, {
      message: newMessage
    })
    
    
    setNewMessage('')
  }
  return (
   <main className="flex flex-col p-4 w-full max-w-3xl m-auto">
    <h1 className="text-4xl font-bold text-center mb-4">Chat ({connectionCount})</h1>
    <ol className="flex-1 overflow-y-scroll overflow-x-hidden" ref={messageListRef}>
      {messages.map(item => {
        return (
        <li 
          className="bg-gray-100 rounded-lg p-4 my-2 break-all" 
          key={item.id}>
            <p className="text-small text-gray-500">{item.createdAt}</p>
            <p className="text-small text-gray-500">{item.port}</p>
            <p>{item.message}</p>
        </li>)
      })}
    </ol>
    <form onSubmit={handleSubmit} className="flex items-center">
      <Textarea
      className="rounded-lg mr-4"
      placeholder="Tell us what is on your mind.."
      value={newMessage}
      onChange={(e) => setNewMessage(e.target.value)}
      maxLength={255}
      >
      </Textarea>
      <Button className="h-full">Send message</Button>
    </form>
   </main>
  )
}
