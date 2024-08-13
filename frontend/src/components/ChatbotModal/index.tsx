import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useIsMobile } from '../../hooks/windowsize'
import { IoSend } from 'react-icons/io5'
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

const initialMessages: Message[] = [
  {
    index: 0,
    senderType: MessageSenderType.bot,
    text: 'Heyy, how can I help you today?'
  }
]

const Typing = () => {
  return (
    <div className="ml-9 mt-2.5 flex h-10 w-20 items-center justify-center space-x-1 rounded-full bg-gray-100 p-1.5 px-4">
      <div className="size-2 animate-bounce rounded-full bg-gray-500 delay-0"></div>
      <div className="size-2 animate-bounce rounded-full bg-gray-500 delay-200"></div>
      <div className="delay-400 size-2 animate-bounce rounded-full bg-gray-500"></div>
    </div>
  )
}

const Spinner = () => (
  <div role="status" className="flex h-[70%] items-center justify-center">
    <svg
      aria-hidden="true"
      className="size-8 animate-spin fill-blue-600 text-gray-200 dark:text-gray-600"
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [messages, setMessages] = useState<Message[]>([...initialMessages])
  const [isMessagesLoading, setIsMessagesLoading] = useState<boolean>(false)
  const [isTyping, setIsTyping] = useState<boolean>(true)

  useEffect(() => {
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

          setMessages([...initialMessages, ...orderedMessages])
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        return null
      }
    }
    setIsMessagesLoading(true)
    fetchData()
    setIsMessagesLoading(false)
  }, [showModal])

  const sendMessage = async () => {
    try {
      setIsTyping(true)
      const response = await axios.get(
        `${import.meta.env.VITE_serverBaseUrl}/prompt`,
        {
          params: { prompt, user_id: auth.currentUser?.uid }
        }
      )
      if (response.status === 200) {
        console.log('response.data:', response.data)
        setMessages([...initialMessages, response.data.messages])
      }
      setPrompt('')
    } catch (error) {
      console.error('Error sending prompt:', error)
      return null
    }
    setIsTyping(false)
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
              className={`mx-auto my-6 flex h-full items-center ${
                isMobile ? 'size-full' : 'w-[35%] max-w-lg'
              }`}
            >
              {/*content*/}
              <div
                className={`${
                  isMobile ? 'h-full' : 'h-[90%]'
                } relative flex w-full flex-col rounded-lg border-0 bg-white shadow-lg outline-none focus:outline-none`}
              >
                {/*header*/}
                <div className="border-blueGray-200 flex items-center justify-between rounded-t p-5">
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
                {isMessagesLoading ? (
                  <Spinner />
                ) : (
                  <div className="relative flex-auto flex-col gap-2 overflow-scroll p-6">
                    {messages.map((message) => {
                      if (message.senderType === 'bot') {
                        return (
                          <div key={message.index} className="flex">
                            <div className="flex w-1/2 gap-2">
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
                        return (
                          <div key={message.index} className="flex justify-end">
                            <div className="flex w-1/2 justify-end gap-2">
                              <div className="flex flex-col gap-1">
                                <span className="text-end text-xs text-[#bbbbbb]">
                                  {auth.currentUser?.displayName}
                                </span>
                                <p className="rounded-lg bg-[#7C37FE] p-2 text-white">
                                  {message.text}
                                </p>
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
                {/*footer*/}
                <div className="flex items-center justify-center gap-2 rounded-b border-t border-solid p-6">
                  <input
                    type="text"
                    value={prompt}
                    id="prompt"
                    onChange={(e) => setPrompt(e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 p-2.5 text-sm"
                    placeholder="Enter your query!"
                    required
                  />
                  <button
                    className="border-0"
                    type="button"
                    onClick={() => sendMessage()}
                  >
                    <IoSend height={5} width={5} />
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="fixed inset-0 z-40 bg-black opacity-25"></div>
        </>
      ) : null}
    </>
  )
}
