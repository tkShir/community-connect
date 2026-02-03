import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Users, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";

export default function Landing() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div className="min-h-screen bg-background flex items-center justify-center text-primary">Loading...</div>;

  if (user) {
    // Redirect logic handled in App.tsx usually, but safe to show a button here just in case
    window.location.href = "/discover"; 
    return null; 
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden font-sans">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 px-6 py-6 flex justify-between items-center bg-background/80 backdrop-blur-md border-b border-white/5">
        <div className="text-2xl font-display font-bold text-primary tracking-tighter">ONYX</div>
        <a href="/api/login">
          <Button variant="outline" className="border-primary/20 hover:bg-primary/10 hover:text-primary transition-colors">
            Member Login
          </Button>
        </a>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        
        {/* Abstract Background Decoration */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 max-w-3xl"
        >
          <div className="inline-block mb-6 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-medium tracking-wide uppercase">
            Exclusive Invitation Only
          </div>
          <h1 className="text-5xl md:text-7xl font-display font-bold leading-tight mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
            Connect with the <br/>
            <span className="text-primary italic">Exceptional</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            A curated community for professionals, mentors, and peers. 
            Maintain your anonymity while finding meaningful connections based on shared goals and interests.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/api/login">
              <Button size="lg" className="h-14 px-8 text-lg rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl shadow-primary/20">
                Join the Inner Circle <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </a>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 relative z-10">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Shield,
              title: "Privacy First",
              desc: "Your identity remains hidden until you decide to reveal it. Connect based on substance, not status."
            },
            {
              icon: Sparkles,
              title: "Curated Matches",
              desc: "Our algorithm connects you with people who share your professional goals and personal interests."
            },
            {
              icon: Users,
              title: "Exclusive Network",
              desc: "Access a verified community of driven individuals seeking genuine mentorship and friendship."
            }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
              className="p-8 rounded-3xl bg-card border border-white/5 hover:border-primary/20 transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-display font-bold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Onyx Community. All rights reserved.</p>
      </footer>
    </div>
  );
}
