import React, { FormEvent, useEffect, useState } from 'react'
import axios from 'axios'
import { useIsMobile } from '../../hooks/windowsize'
import { IoSend } from 'react-icons/io5'
import { MdEdit } from 'react-icons/md'
import { RiDeleteBin7Fill } from 'react-icons/ri'
import { RxCross1 } from 'react-icons/rx'
import { auth } from '../../firebase/firebase'

interface ChatbotModalProps {
  showModal: boolean
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>
}

enum MessageSenderType {
  user = 'user',
  bot = 'bot'
}

const BOTNAME = 'Ava'
const BOTIMAGE = 'https://i.ibb.co/Kh6rVrK/bot-woman.jpg'

type Message = {
  index: number
  senderType: MessageSenderType
  text: string
}

const initialMessage: Message[] = [
  {
    index: -10,
    senderType: MessageSenderType.bot,
    text: 'Heyy, how can I help you today?'
  }
]

type MessagePayloadType = {
  user_id: string | undefined
  prompt: string
  index?: number
}

const Typing = () => {
  return (
    <div className="ml-9 flex h-10 min-h-10 w-16 items-center justify-center space-x-1 rounded-full bg-gray-100 p-1.5 px-4 last:mb-6 last:pb-3">
      <div className="size-2 animate-bounce rounded-full bg-gray-500 delay-0"></div>
      <div className="size-2 animate-bounce rounded-full bg-gray-500 delay-200"></div>
      <div className="delay-400 size-2 animate-bounce rounded-full bg-gray-500"></div>
    </div>
  )
}

const Spinner = () => (
  <div
    role="status"
    className="flex h-[70%] w-full items-center justify-center"
  >
    <svg
      aria-hidden="true"
      className="size-8 animate-spin fill-blue-600 text-gray-200"
      viewBox="0 0 100 101"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
        fill="#dfdfdf"
      />
      <path
        d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
        fill="black"
      />
    </svg>
    <span className="sr-only">Loading...</span>
  </div>
)

export default function ChatbotModal({
  showModal,
  setShowModal
}: ChatbotModalProps) {
  const isMobile = useIsMobile()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [prompt, setPrompt] = useState<string>('')
  const [editMessageText, setEditMessageText] = useState<string>('')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [messages, setMessages] = useState<Message[]>([...initialMessage])
  const [isMessagesLoading, setIsMessagesLoading] = useState<boolean>(false)
  const [isTyping, setIsTyping] = useState<boolean>(false)
  const [isEditMessageTyping, setIsEditMessageTyping] = useState<boolean>(false)
  const [editMessageIndex, setEditMessageIndex] = useState<number>(-20)
  const chatBody = document.getElementById('chatbot-body')

  useEffect(() => {
    if (!showModal) return
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_serverBaseUrl}/chats`,
          {
            params: { user_id: auth.currentUser?.uid }
          }
        )
        if (response.status === 200) {
          const orderedMessages = response.data.messages.sort(
            (a: { index: number }, b: { index: number }) => a.index - b.index
          )

          setMessages([...initialMessage, ...orderedMessages])
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        return null
      } finally {
        setIsMessagesLoading(false)
        setTimeout(() => {
          if (chatBody) {
            chatBody.scrollTop = chatBody.scrollHeight + 24
          }
        }, 100)
      }
    }
    setIsMessagesLoading(true)
    fetchData()
  }, [showModal])

  const sendMessage = async () => {
    if (editMessageIndex === -20 && (!prompt || prompt.length === 0)) {
      alert('Prompt cannot be empty!')
      return
    } else if (
      editMessageIndex !== -20 &&
      (!editMessageText || editMessageText.length === 0)
    ) {
      alert('Edited message cannot be empty!')
      return
    }
    try {
      if (editMessageIndex === -20) {
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            index: prevMessages.length,
            senderType: MessageSenderType.user,
            text: prompt
          }
        ])
        setIsTyping(true)
        setTimeout(() => {
          if (chatBody) {
            chatBody.scrollTop = chatBody.scrollHeight + 24
          }
        }, 100)
      } else {
        setIsEditMessageTyping(true)
      }

      const payload: MessagePayloadType = {
        prompt,
        user_id: auth.currentUser?.uid
      }
      if (editMessageIndex !== -20) {
        payload['prompt'] = editMessageText
        payload['index'] = editMessageIndex
      }

      const response = await axios.get(
        `${import.meta.env.VITE_serverBaseUrl}/prompt`,
        {
          params: payload
        }
      )
      if (response.status === 200) {
        const orderedMessages = response.data.data.messages.sort(
          (a: { index: number }, b: { index: number }) => a.index - b.index
        )
        setMessages([...initialMessage, ...orderedMessages])
      }
    } catch (error) {
      console.error('Error sending prompt:', error)
      return null
    } finally {
      setPrompt('')
      setIsTyping(false)
      setIsEditMessageTyping(false)
      if (editMessageIndex === -20) {
        setTimeout(() => {
          if (chatBody) {
            chatBody.scrollTop = chatBody.scrollHeight + 24
          }
        }, 100)
      }
      setEditMessageIndex(-20)
    }
  }
  const deleteMessage = async (index: number) => {
    try {
      const filteredMessages = messages.filter(
        (message) => message.index != index
      )
      setMessages(filteredMessages)

      const response = await axios.delete(
        `${import.meta.env.VITE_serverBaseUrl}/chats`,
        {
          params: { user_id: auth.currentUser?.uid, index }
        }
      )
      if (response.status === 200) {
        const orderedMessages = response.data.data.messages.sort(
          (a: { index: number }, b: { index: number }) => a.index - b.index
        )
        setMessages([...initialMessage, ...orderedMessages])
      }
    } catch (error) {
      console.error('Error sending prompt:', error)
      return null
    }
  }

  const editMessage = (index: number) => {
    setEditMessageIndex(index)
    const message = messages.find((message) => message.index === index)
    if (message) {
      setEditMessageText(message?.text)
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault() // Prevent page reload
    sendMessage()
  }

  return (
    <>
      {showModal ? (
        <>
          <div
            className={`${
              showModal && isMobile ? 'overflow-y-hidden' : 'overflow-y-auto'
            } fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden outline-none focus:outline-none`}
          >
            <div
              className={`mx-auto mb-0 flex h-full items-center ${
                isMobile ? 'size-full' : 'w-[35%] max-w-lg'
              }`}
            >
              {/*content*/}
              <div
                className={`${
                  isMobile ? 'h-full' : 'h-[90%]'
                } relative grid w-full grid-flow-col	 grid-cols-1 grid-rows-9 rounded-lg border-0 bg-white shadow-lg outline-none focus:outline-none`}
              >
                {/*header*/}
                <div className="border-blueGray-200 row-span-2 flex items-center justify-between rounded-t p-5">
                  <div className="flex w-full flex-col">
                    <div className="w-full">
                      <button
                        className="float-right ml-auto border-0"
                        onClick={() => setShowModal(false)}
                      >
                        <RxCross1 height={10} width={10} />
                      </button>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <img
                        className="size-12 rounded-full"
                        src="https://i.ibb.co/Kh6rVrK/bot-woman.jpg"
                      />
                      <span>Hey 👋, I&apos;m Ava</span>
                      <span className="text-xs text-[#bbbbbb]">
                        Ask my anything or pick a place to start
                      </span>
                    </div>
                  </div>
                </div>
                {/*body*/}
                <div className="row-span-6 flex w-full">
                  {isMessagesLoading ? (
                    <Spinner />
                  ) : (
                    <div
                      id="chatbot-body"
                      className="relative flex w-full flex-col gap-6 overflow-scroll px-6 pt-4"
                    >
                      {messages.map((message, index) => {
                        if (message.senderType === 'bot') {
                          if (
                            editMessageIndex + 1 === message.index &&
                            isEditMessageTyping
                          ) {
                            return (
                              <>
                                <Typing />
                              </>
                            )
                          }
                          return (
                            <div key={index} className="flex last:mb-6">
                              <div className="flex w-fit max-w-[75%] gap-2">
                                <img
                                  src={BOTIMAGE}
                                  className="size-8 rounded-full"
                                />
                                <div className="flex flex-col gap-1">
                                  <span className="text-xs text-[#bbbbbb]">
                                    {BOTNAME}
                                  </span>
                                  <p className="rounded-lg bg-[#F9FAFB] p-2">
                                    {message.text}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )
                        } else {
                          if (editMessageIndex === message.index) {
                            return (
                              <div key={index} className="flex">
                                <form
                                  onSubmit={handleSubmit}
                                  className="flex w-full flex-col items-end"
                                >
                                  <div className="mb-4 w-3/4 justify-end rounded-lg border border-gray-200 bg-gray-50">
                                    <div className="rounded-b-lg bg-white px-4 py-2">
                                      <textarea
                                        id="editor"
                                        rows={4}
                                        value={editMessageText}
                                        onChange={(e) =>
                                          setEditMessageText(e.target.value)
                                        }
                                        className="block w-full border-0 bg-white px-0 text-sm text-gray-800 outline-none"
                                        placeholder="Enter text..."
                                        required
                                      ></textarea>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      type="submit"
                                      className="inline-flex items-center rounded-lg bg-blue-700 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-blue-800 focus:ring-4 focus:ring-blue-200"
                                    >
                                      Send
                                    </button>
                                    <button
                                      onClick={() => setEditMessageIndex(-20)}
                                      className="inline-flex items-center rounded-lg bg-red-600 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-red-800 focus:ring-4 focus:ring-blue-200"
                                    >
                                      cancel
                                    </button>
                                  </div>
                                </form>
                              </div>
                            )
                          }
                          return (
                            <div
                              key={index}
                              className="relative flex justify-end"
                            >
                              <div className="relative flex min-w-[30%] max-w-[75%] justify-end gap-2">
                                <div className="group flex w-full flex-col items-end gap-1">
                                  <div className="flex w-full items-end justify-end group-hover:justify-between">
                                    {/* Icons container */}
                                    <div className="hidden gap-0.5 group-hover:flex">
                                      <button
                                        onClick={() =>
                                          editMessage(message.index)
                                        }
                                      >
                                        <MdEdit className="size-4 text-[#b4b4b4]" />
                                      </button>
                                      <button
                                        onClick={() =>
                                          deleteMessage(message.index)
                                        }
                                      >
                                        <RiDeleteBin7Fill className="size-4	text-red-700" />
                                      </button>
                                    </div>
                                    <span className="text-end text-xs text-[#bbbbbb]">
                                      {auth.currentUser?.displayName?.slice(
                                        0,
                                        3
                                      )}
                                    </span>
                                  </div>
                                  <div className=" relative flex min-h-[35px] w-full min-w-[10%] items-center justify-center rounded-lg bg-[#7C37FE] p-2 transition-transform duration-300 hover:scale-105">
                                    <p className="text-white">{message.text}</p>
                                  </div>
                                </div>
                                <img
                                  src={
                                    auth.currentUser?.photoURL ||
                                    'https://i.ibb.co/cNXwPMf/placeholder.png'
                                  }
                                  className="size-8 rounded-full"
                                />
                              </div>
                            </div>
                          )
                        }
                      })}
                      {isTyping && <Typing />}
                    </div>
                  )}
                </div>
                {/*footer*/}
                <>
                  <form
                    onSubmit={handleSubmit}
                    className="row-span-1 flex items-center justify-center gap-2 rounded-b border-t border-solid p-6"
                  >
                    <input
                      type="text"
                      value={prompt}
                      id="prompt"
                      onChange={(e) => setPrompt(e.target.value)}
                      className="block w-full rounded-lg border border-gray-300 p-2.5 text-sm"
                      placeholder="Enter your query!"
                      required
                      autoComplete="off"
                    />
                    <button className="border-0" type="submit">
                      <IoSend height={5} width={5} />
                    </button>
                  </form>
                </>
              </div>
            </div>
          </div>
          <div className="fixed inset-0 z-40 bg-black opacity-25"></div>
        </>
      ) : null}
    </>
  )
}
