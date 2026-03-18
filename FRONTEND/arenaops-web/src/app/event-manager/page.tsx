import Link from "next/link";
import { PlayCircle, Grid, TrendingUp, Radio, Quote } from "lucide-react";

export default function EventManagerLandingPage() {
  return (
    <>

      {/* Hero Section */}
      <section className="relative flex min-h-[85vh] items-center px-6 py-20 lg:px-20">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-center">
          <div className="flex flex-col gap-8">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1 text-xs font-bold uppercase tracking-widest text-primary">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
              </span>
              v4.0 Live Now
            </div>
            <h1 className="text-5xl font-bold leading-[1.1] tracking-tight text-white md:text-7xl">
              The Future of <span className="text-primary italic">Arena Management</span> is Here.
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-slate-400 md:text-xl">
              Experience the industry&apos;s first dashboard-driven event management platform. Precision planning meets real-time execution in a single glass-pane view.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/register-event-manager" className="rounded-lg bg-primary px-8 py-4 text-lg font-bold text-background-dark hover:shadow-[0_0_20px_rgba(71,244,37,0.4)] transition-all">
                Start Free Trial
              </Link>
              <button className="flex items-center gap-2 rounded-lg px-8 py-4 text-lg font-bold text-white transition-all bg-surface-dark/70 backdrop-blur-md border border-primary/10 hover:bg-primary/5 hover:border-primary/30">
                <PlayCircle className="w-5 h-5" /> Watch Demo
              </button>
            </div>
          </div>
          <div className="relative group">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[primary]/50 to-transparent opacity-20 blur group-hover:opacity-40 transition duration-1000"></div>
            <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-surface-dark shadow-2xl">
              <img 
                alt="Dashboard Preview" 
                className="w-full object-cover" 
                data-alt="Detailed dark mode analytics dashboard showing event metrics" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBCbRhCTcI-TbKQD8TbEF6PyR0JNzLBQhk8iVCuafQPx6Jw_nr7dbJAgQU1qoDNqk8wSke7JPHqyNzVSmNMdW1zLFWiJIuhT5WJl09LnXh6Aayqkr0u2wBzSy4oxMII3BMYl2sCHNrfl-P5qqbW13gTkpR14Leg3xZ5djrhEtwdXQj7jisnxCXpwrEJnEYsiiVUYHP9PhC_isxUfyp93k5XHvXFclDPJuQN_6Ewlvs6dRhyGeeZUL6RUluWWon_5ELaJu8S24KWFLEG"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Manager's Toolkit Section */}
      <section className="bg-background-dark/50 px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 flex flex-col items-center text-center">
            <h2 className="mb-4 text-3xl font-bold text-white md:text-5xl">The Manager&apos;s Toolkit</h2>
            <div className="h-1.5 w-24 rounded-full bg-primary"></div>
            <p className="mt-6 max-w-2xl text-slate-400">Everything you need to orchestrate world-class events, from seat selection to revenue optimization.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {/* Card 1 */}
            <div className="flex flex-col gap-6 rounded-2xl p-8 bg-surface-dark/70 backdrop-blur-md border border-primary/10 hover:bg-primary/5 hover:border-primary/30 transition-all duration-300 group">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/20 text-primary">
                <Grid className="w-8 h-8" />
              </div>
              <div>
                <h3 className="mb-2 text-xl font-bold text-white">Layout Customization</h3>
                <p className="text-slate-400 leading-relaxed">Drag-and-drop seating charts with glassmorphism UI. Preview sightlines and accessibility in real-time 3D.</p>
              </div>
              <img alt="Layout Tool" className="mt-auto rounded-lg grayscale opacity-50 group-hover:grayscale-0 transition-all" data-alt="Digital seating chart plan for a stadium" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAsfYksZ-09If9y1JQz1_voRFy5XxscAE8PV1ULs_N013tnL6V5auxvE58TXAAFFaBQ9Tp-Uhld1vlG2xBN0QmGYGdevIrfQ4uCVApIKt2wDUhfaNOXxtAOc534HHeYleQgKNAz7y5e_QGSIe15wYSvWneowYUR8NPvXAI7xt_PiwzehSiGFLW52bJEk8KXf1iTyQvmHYCvPastkBx8HqfQ48Bpih0gHMFl2Iz2eFS5-y6kgA4Kp9riTuZYSvHq8UfCrVIf6sOaOg1Q"/>
            </div>
            {/* Card 2 */}
            <div className="flex flex-col gap-6 rounded-2xl p-8 border-t-2 border-t-[primary]/50 bg-surface-dark/70 backdrop-blur-md border-x border-b border-primary/10 hover:bg-primary/5 hover:border-primary/30 transition-all duration-300 group">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-background-dark">
                <TrendingUp className="w-8 h-8" />
              </div>
              <div>
                <h3 className="mb-2 text-xl font-bold text-white">Dynamic Pricing</h3>
                <p className="text-slate-400 leading-relaxed">AI-driven algorithms to maximize revenue per seat. Automatically adjust prices based on demand velocity and inventory.</p>
              </div>
              <img alt="Pricing Tool" className="mt-auto rounded-lg grayscale opacity-50 group-hover:grayscale-0 transition-all" data-alt="Financial data charts showing price trends" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDyDS2gN2A7u69bgSQgTsTXHfSGbmVqpMjJu371EP0fzzxAKPTu5yVbmV3J21dxseB4TI_-p_YFjcdxVVZrxRwzEwRWZeJRLOQ8Trh3Gu6FblTrSbT_T301XcJsKKdSoM-g-OE3yEKiY95G2-5NwOzD_r-XNlZajriCCdeVlMEhdg9Oh4NrI-fnUUZzoZKHxqujxLdmUqkBYTX0SB_90dqJNXk1ArbUJpymhPXu6kBhceVbHXI0rJsL0HgwS-n9Nz52OhxoeFWYIZvk"/>
            </div>
            {/* Card 3 */}
            <div className="flex flex-col gap-6 rounded-2xl p-8 bg-surface-dark/70 backdrop-blur-md border border-primary/10 hover:bg-primary/5 hover:border-primary/30 transition-all duration-300 group">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/20 text-primary">
                <Radio className="w-8 h-8" />
              </div>
              <div>
                <h3 className="mb-2 text-xl font-bold text-white">Real-time Monitoring</h3>
                <p className="text-slate-400 leading-relaxed">Live heatmaps and entry flow analytics. Monitor gate congestion and VIP arrival alerts instantly.</p>
              </div>
              <img alt="Monitoring Tool" className="mt-auto rounded-lg grayscale opacity-50 group-hover:grayscale-0 transition-all" data-alt="Abstract heatmap visualization of crowd flow" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCt_xF94TvVlE7kd2kYElIS7vroE5TK8MFh_n-bhOOYvs0gL31emkzeYFVVmbl743pzuTuW0tz_mfBOkdJriyPqMnV6XQ3J5InjtPCwD1YOKNS4ukPccr6GhdSamx8AANeZZ-6M-egcxgR-MD-pA1bj0agn0psAIbY06abIv_VG1kaZkqHZ2jyjWf4mWm43O4B6eBp_H3nffUEf5T7X3WTBw_0WZoA2jbM9BUwDUNKqk1_w0GGz9BzHMvc14rKBmleLrK1QL_WhSqc4"/>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Walkthrough: How it Works */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-20 text-left">
            <h2 className="text-4xl font-bold text-white">How it works</h2>
            <p className="mt-4 text-slate-400">Streamline your workflow from initial concept to grand opening.</p>
          </div>
          <div className="space-y-24">
            {/* Step 1 */}
            <div className="flex flex-col items-center gap-12 lg:flex-row">
              <div className="flex-1 space-y-6">
                <div className="text-6xl font-black text-primary/10">01</div>
                <h3 className="text-3xl font-bold text-white">Plan</h3>
                <p className="text-lg text-slate-400 leading-relaxed">Import your venue blueprints or use our template library. Define zones, security perimeters, and concession hubs in minutes.</p>
              </div>
              <div className="flex-1 rounded-2xl bg-surface-dark p-2 border border-primary/10">
                <img alt="Planning Step" className="rounded-xl w-full" data-alt="Project planning interface with stadium grid" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCnqJmYW7acJLJAnVD5AULoxTya3P2qb6MoH1w8ze0aUTcpPuZd9dxVRiiKXBpLbBDtFWxJ6fsyAlQKTJhuisnwCaYQszYo0ICOPcc6W0nwMwKh7-qQx8knNSCw0BAu4CpXGWicRkSHkJ22c5EEuyKfNbAjmkFvS4-Ca_7EVPhbPNDtwkKc5dyI-qPQP4LkXnXWTdyMSxbRcLx0ccFajTeLQSCLdyv749CWD40Cwpm8eXI9ZW27W-jgwJnufoi48bF0Fpl8EBy4ldA9"/>
              </div>
            </div>
            {/* Step 2 */}
            <div className="flex flex-col items-center gap-12 lg:flex-row-reverse">
              <div className="flex-1 space-y-6">
                <div className="text-6xl font-black text-primary/10">02</div>
                <h3 className="text-3xl font-bold text-white">Customize</h3>
                <p className="text-lg text-slate-400 leading-relaxed">Set up tiered ticketing, dynamic pricing rules, and branded landing pages. Integrate with your favorite CRM and marketing tools.</p>
              </div>
              <div className="flex-1 rounded-2xl bg-surface-dark p-2 border border-primary/10">
                <img alt="Customize Step" className="rounded-xl w-full" data-alt="Customization settings menu in the software" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBrU5TbX7HY8awrzXN1jYDm2yfbwlDEmo7Lww3PZbX7rEbFF6JcIDMwqO9T814U8E5bYwMa-B3eqOduaTFQhfPOlYN6TXeWhV9G3uJ6j8Y6bkOQuGEpHHnWebQwB6vCbO0wivITbFyxu_eTqLkBpqBS9saBLK9qpwlRaBpYCDzB4WI6tv9SIgQAngG0quDEecxLde647FsEcUrcU0V3m7I1JtbIbz606Xzzb8AvfaC8CR54SYhV4XTSkyOMlrrw8lA9ngrs3BqkTCN3"/>
              </div>
            </div>
            {/* Step 3 */}
            <div className="flex flex-col items-center gap-12 lg:flex-row">
              <div className="flex-1 space-y-6">
                <div className="text-6xl font-black text-primary/10">03</div>
                <h3 className="text-3xl font-bold text-white">Launch</h3>
                <p className="text-lg text-slate-400 leading-relaxed">Go live and watch the data flow. Your dashboard becomes the command center for the entire event lifecycle.</p>
              </div>
              <div className="flex-1 rounded-2xl bg-surface-dark p-2 border border-primary/10">
                <img alt="Launch Step" className="rounded-xl w-full" data-alt="Crowd at a live stadium event" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC7bREV7ZJZU3PHiXMYlEikxA2miImBTeCR3WGZYBDUFDtXmYhTkvMQR2EzWFvUC19Bnf3VLel45ZgLb1G7K6MuqESwt7yXLZOZgnERZtyt7GkgSCiC0pX3ZHpyxqpcrlM54heFIs_18vajc6s01cNa2ytfeThRTA1c3fSywqpC6vsZkIDevqyFPAU09IBk-rxHO4bOBGkpgco81s92H-ev-QLmBg0qsxdMriqwsxCnNCP85WblWm07KhPmd8W5odW_ibZOOEPuDUyb"/>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="bg-primary/5 px-6 py-24">
        <div className="mx-auto max-w-4xl text-center">
          <Quote className="w-16 h-16 text-primary mb-8 mx-auto" />
          <blockquote className="text-2xl font-medium italic text-white md:text-4xl leading-snug">
            &quot;ArenaManager didn&apos;t just change how we sell tickets; it changed how we understand our fans. The real-time heatmaps are a game-changer for stadium logistics.&quot;
          </blockquote>
          <div className="mt-10 flex flex-col items-center gap-4">
            <img alt="Testimonial Author" className="h-16 w-16 rounded-full object-cover border-2 border-primary" data-alt="Professional portrait of a stadium manager" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD9btHGBZxNeiRIlTaCi7e0jj89DRUPfx0Z-3ZZMw8De0Co7PYtvzEzgN8Uiv8dk4-xfwUZPjso5EicnGGNexsqnEav8Scp3SbzYJlIQZPd6_hyU5F2Z84WV1rTZIhgmsIVtRzrsG3jWxId4_9Sjf8q1iy1N-G6w6vJoigV1UEos-vs6Pragsarsw8RQmSDKcd-f5jPStKS4ogJaCoswJwAvuosaQJqPUeI5citMJsyvk5CRakjOU0SypV-URwS2I0SRl8Pa-IyLuUN"/>
            <div>
              <p className="font-bold text-white">Marcus Thorne</p>
              <p className="text-sm text-primary uppercase tracking-widest font-bold">Director of Operations, Global Sphere Arena</p>
            </div>
          </div>
        </div>
      </section>

    </>
  );
}
