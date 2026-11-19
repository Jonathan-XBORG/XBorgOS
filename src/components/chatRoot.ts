import { createContext, type RefObject } from 'react'

// The chat window body is the scroll root for message reveals.
export const ChatRootContext = createContext<RefObject<HTMLDivElement | null> | null>(null)
