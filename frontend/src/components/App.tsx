import Avatar from 'components/Avatar'
import logo from 'assets/logo.svg'
import { signInWithPopup, signOut } from 'firebase/auth'
import { auth, provider } from '../firebase/firebase'
import { useState } from 'react'
import ChatbotModal from './ChatbotModal'

const randoms = [
  [1, 2],
  [3, 4, 5],
  [6, 7]
]

function App() {
  const [isSignedIn, setIsSignedIn] = useState<boolean>(
    auth.currentUser ? true : false
  )
  const [showModal, setShowModal] = useState(false)

  const googlePopUp = async () => {
    try {
      await signInWithPopup(auth, provider)
      setIsSignedIn(true)
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert(error.message)
      }
    }
  }

  const signOutOfApp = () => {
    signOut(auth)
      .then(() => {
        window.location.reload()
      })
      .catch((error) => {
        if (error instanceof Error) {
          alert(error.message)
        }
      })
  }

  return (
    <div className="relative overflow-hidden bg-white">
      <ChatbotModal showModal={showModal} setShowModal={setShowModal} />
      <div className="h-screen sm:pb-40 sm:pt-24 lg:pb-48 lg:pt-40">
        <div className="relative mx-auto max-w-7xl px-4 sm:static sm:px-6 lg:px-8">
          <div className="sm:max-w-lg">
            <div className="my-4">
              <Avatar size="large" src={logo} />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Welcome!
            </h1>
            <p className="mt-4 text-xl text-gray-500">
              {isSignedIn
                ? 'Thanks for signing in!'
                : 'Sign in to use chatbot!'}
            </p>
          </div>
          <div className="my-10">
            {isSignedIn ? (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowModal(true)}
                  className="inline-block rounded-md border border-transparent bg-indigo-600 px-8 py-3 text-center font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-700 focus:ring-offset-2"
                >
                  Talk to chat bot
                </button>
                <button
                  onClick={signOutOfApp}
                  className="inline-block rounded-md border border-transparent bg-indigo-600 px-8 py-3 text-center font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-700 focus:ring-offset-2"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <button
                onClick={googlePopUp}
                className="inline-block rounded-md border border-transparent bg-indigo-600 px-8 py-3 text-center font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-700 focus:ring-offset-2"
              >
                Sign in with google
              </button>
            )}
            <div
              aria-hidden="true"
              className="pointer-events-none mt-10 md:mt-0 lg:absolute lg:inset-y-0 lg:mx-auto lg:w-full lg:max-w-7xl"
            >
              <div className="absolute sm:left-1/2 sm:top-0 sm:translate-x-8 lg:left-1/2 lg:top-1/2 lg:-translate-y-1/2 lg:translate-x-8">
                <div className="flex items-center space-x-6 lg:space-x-8">
                  {randoms.map((random, number) => (
                    <div
                      key={`random-${random[number]}`}
                      className="grid shrink-0 grid-cols-1 gap-y-6 lg:gap-y-8"
                    >
                      {random.map((number) => (
                        <div
                          key={`random-${number}`}
                          className="h-64 w-44 overflow-hidden rounded-lg sm:opacity-0 lg:opacity-100"
                        >
                          <img
                            src={`https://picsum.photos/600?random=${number}`}
                            alt=""
                            className="size-full bg-indigo-100 object-cover object-center"
                          />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
