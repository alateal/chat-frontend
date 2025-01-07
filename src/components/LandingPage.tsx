import { SignInButton } from "@clerk/clerk-react";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-black/80 backdrop-blur-sm z-50 border-b border-gray-800">
        <div className="container mx-auto px-8 py-6 flex justify-between items-center">
          <div className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">Slack AI</div>
          <SignInButton mode="modal" />
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-8 pt-40 pb-32">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-8">
            <div className="inline-block px-4 py-2 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-full border border-purple-500/20">
              <span className="bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
                Powered by AI Technology
              </span>
            </div>
            <h1 className="text-7xl font-bold leading-tight">
              The Future of
              <span className="block bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
                Team Communication
              </span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl leading-relaxed">
              Experience seamless collaboration enhanced by AI. Connect, communicate, and create with intelligent features that adapt to your team's needs.
            </p>
            <div className="flex gap-4 pt-8">
              <button className="px-8 py-4 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 hover:opacity-90 transition-opacity text-lg font-medium">
                Get Started Free
              </button>
              <button className="px-8 py-4 rounded-full border border-gray-700 hover:border-purple-500 transition-colors text-lg font-medium">
                Watch Demo
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="container mx-auto px-8 py-32">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              title: "AI-Powered Channels",
              description: "Smart organization of conversations with AI-driven topic suggestions and automated threading.",
              gradient: "from-purple-500 to-blue-500"
            },
            {
              title: "Smart Sync",
              description: "Real-time collaboration with AI-enhanced notifications and priority management.",
              gradient: "from-blue-500 to-cyan-500"
            },
            {
              title: "Secure Platform",
              description: "Enterprise-grade security with AI monitoring and threat detection.",
              gradient: "from-cyan-500 to-purple-500"
            }
          ].map((feature, index) => (
            <div key={index} className="p-8 rounded-3xl bg-gradient-to-br from-gray-900 to-black border border-gray-800 hover:border-purple-500/50 transition-colors">
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.gradient} mb-8 flex items-center justify-center`}>
                <div className="w-8 h-8 bg-black rounded-lg"></div>
              </div>
              <h3 className="text-2xl font-semibold mb-4">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Section */}
      <div className="border-y border-gray-800 bg-gradient-to-b from-black to-gray-900">
        <div className="container mx-auto px-8 py-24">
          <div className="grid md:grid-cols-4 gap-12 text-center">
            {[
              { number: "10M+", label: "Active Users" },
              { number: "150+", label: "Countries" },
              { number: "99.9%", label: "Uptime" },
              { number: "24/7", label: "Support" }
            ].map((stat, index) => (
              <div key={index} className="space-y-2">
                <div className="text-4xl font-bold bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
                  {stat.number}
                </div>
                <div className="text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-8 py-32">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-5xl font-bold">
            Ready to experience the
            <span className="block bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
              future of collaboration?
            </span>
          </h2>
          <p className="text-xl text-gray-400">Join millions of teams already using our AI-powered platform</p>
          <div className="pt-8">
            <button className="px-12 py-4 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 hover:opacity-90 transition-opacity text-lg font-medium">
              Start for Free
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;