import type { ReactNode } from 'react'

function StreamPage({ children }: { children?: ReactNode }) {
  return (
    <>
      <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Navbar */}
      <header className="bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold">LiveKick ⚽</h1>
          <nav className="space-x-4">
            <a href="#" className="hover:text-gray-300">Home</a>
            <a href="#" className="hover:text-gray-300">Live Matches</a>
            <a href="#" className="hover:text-gray-300">Profile</a>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[80vh]">
          
          {/* Video Section */}
          <div className="lg:col-span-2 bg-black rounded-2xl overflow-hidden shadow">
            <video
              className="w-full h-full object-cover"
              controls
              autoPlay
            >
              <source src="https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" type="application/x-mpegURL" />
              Your browser does not support the video tag.
            </video>
          </div>

          {/* Chat Section */}
          <div className="bg-white rounded-2xl shadow flex flex-col">
            
            {/* Chat Header */}
            <div className="p-3 border-b font-semibold">
              Live Chat
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              <div className="text-sm">
                <span className="font-semibold">User1:</span> Goal 🔥
              </div>
              <div className="text-sm">
                <span className="font-semibold">User2:</span> What a match!
              </div>
            </div>

            {/* Input */}
            <div className="p-3 border-t flex gap-2">
              <input
                type="text"
                placeholder="Type a message..."
                className="flex-1 border rounded-lg px-3 py-2 outline-none"
              />
              <button className="bg-black text-white px-4 py-2 rounded-lg">
                Send
              </button>
            </div>
          </div>
        </div>

        {/* Extra Content */}
        <div className="mt-6">
          {children ? "hey":"you"}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-black text-white mt-4">
        <div className="max-w-7xl mx-auto px-4 py-3 text-center text-sm">
          © 2026 LiveKick. All rights reserved.
        </div>
      </footer>
    </div>
    </>
  )
}

export default StreamPage