'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import BorderGlow from '@/components/ui/border-glow';
import LightRays from '@/components/ui/light-rays';
import FuzzyText from '@/components/ui/fuzzy-text';
import TextType from '@/components/ui/text-type';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] px-4 sm:px-6 md:px-8 relative overflow-hidden">
      <LightRays
        raysOrigin="top-center"
        raysColor="#ffffff"
        raysSpeed={0.3}
        lightSpread={0.5}
        rayLength={3}
        followMouse
        mouseInfluence={0.06}
        noiseAmount={0}
        distortion={0}
        pulsating={false}
        fadeDistance={1.5}
        saturation={0.4}
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-3xl mx-auto relative z-10"
      >
        {/* Database paused notice — remove when Supabase is unpaused */}
        <StatusNotice />

        {/* Title */}
        <h1 className="mb-5 sm:mb-6 flex justify-center">
          <FuzzyText
            fontSize="clamp(3.2rem, 13vw, 7rem)"
            fontWeight={700}
            fontFamily="'Space Mono', monospace"
            color="#ffffff"
            baseIntensity={0.15}
            hoverIntensity={0.4}
            enableHover
            fuzzRange={20}
            fps={30}
            direction="horizontal"
            letterSpacing={6}
            transitionDuration={500}
          >
            DECIBEL
          </FuzzyText>
        </h1>

        {/* Tagline */}
        <p className="text-muted-foreground text-xs sm:text-sm font-mono tracking-[0.3em] lowercase mb-8 sm:mb-10">
          your ears don&apos;t get second chances
        </p>

        {/* Divider */}
        <div className="w-16 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent mx-auto mb-6 sm:mb-8" />

        {/* WHO Source */}
        <p className="text-muted-foreground/60 text-[10px] sm:text-xs font-mono tracking-wider mb-4">
          backed by{' '}
          <a
            href="https://www.who.int/news-room/fact-sheets/detail/deafness-and-hearing-loss"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary/80 hover:text-primary underline underline-offset-2 transition-colors"
          >
            World Health Organization
          </a>
        </p>

        {/* Typing WHO facts */}
        <div className="h-12 sm:h-14 flex items-center justify-center mb-10 sm:mb-12">
          <TextType
            text={[
              "1.1 billion young people risk hearing loss",
              "85 dB for 8 hours causes permanent damage",
              "A nightclub hits 100–112 dB",
              "Earbuds at 70% volume reach 85 dB",
              "Every 3 dB doubles the damage rate",
              "Noise-induced hearing loss is irreversible",
              "A subway platform averages 95 dB",
            ]}
            typingSpeed={40}
            deletingSpeed={25}
            pauseDuration={2500}
            showCursor
            cursorCharacter="_"
            cursorBlinkDuration={0.5}
            loop
            className="text-muted-foreground text-sm sm:text-base font-mono tracking-wide"
          />
        </div>

        {/* CTA */}
        <Link href="/monitor">
          <BorderGlow
            borderRadius={9999}
            glowColor="43 100 55"
            backgroundColor="#080808"
            glowRadius={50}
            glowIntensity={0.6}
            coneSpread={20}
            edgeSensitivity={15}
            colors={['#FFAA00', '#CC8800', '#FFCC44']}
            fillOpacity={0.15}
            className="inline-block"
          >
            <span className="px-12 sm:px-16 py-5 sm:py-6 text-base sm:text-lg font-mono tracking-[0.2em] uppercase text-white font-normal block">
              start monitoring
            </span>
          </BorderGlow>
        </Link>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-16 sm:mt-20 flex items-center justify-center gap-8 sm:gap-12"
        >
          <div className="text-center">
            <div className="text-lg sm:text-xl font-mono font-bold text-foreground h-7 flex items-center justify-center">
              <TextType text={["1.1B"]} typingSpeed={200} initialDelay={1000} loop={false} showCursor cursorCharacter="_" cursorBlinkDuration={0.4} className="inline" />
            </div>
            <p className="text-muted-foreground text-[10px] sm:text-xs mt-1 font-mono uppercase tracking-wider">At risk</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <div className="text-lg sm:text-xl font-mono font-bold text-primary h-7 flex items-center justify-center">
              <TextType text={["85dB"]} typingSpeed={200} initialDelay={2000} loop={false} showCursor cursorCharacter="_" cursorBlinkDuration={0.4} className="inline" />
            </div>
            <p className="text-muted-foreground text-[10px] sm:text-xs mt-1 font-mono uppercase tracking-wider">WHO limit</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <div className="text-lg sm:text-xl font-mono font-bold text-foreground h-7 flex items-center justify-center">
              <TextType text={["0%"]} typingSpeed={200} initialDelay={3000} loop={false} showCursor cursorCharacter="_" cursorBlinkDuration={0.4} className="inline" />
            </div>
            <p className="text-muted-foreground text-[10px] sm:text-xs mt-1 font-mono uppercase tracking-wider">Recovery</p>
          </div>
        </motion.div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-20 md:bottom-6 text-muted-foreground/40 text-[10px] sm:text-xs text-center px-4 max-w-md font-mono"
      >
        Awareness tool only. Not a medical device.
      </motion.p>
    </div>
  );
}

function StatusNotice() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-8 sm:mb-10 relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer"
      >
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <span className="text-primary text-xs sm:text-sm font-mono tracking-wide">
          Cloud sync paused — local monitoring active
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center px-4"
              onClick={() => setOpen(false)}
            >
              <div
                className="w-full max-w-sm rounded-xl border border-border bg-card p-5 sm:p-6 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-foreground">Service Status</h3>
                  <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors p-1">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-3 text-xs font-mono">
                  <div className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-foreground">Live monitoring</span>
                    </div>
                    <span className="text-green-500">Active</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-foreground">AI analysis (Claude)</span>
                    </div>
                    <span className="text-green-500">Active</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-foreground">Noise map (Mapbox)</span>
                    </div>
                    <span className="text-green-500">Active</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      <span className="text-foreground">Cloud sync (Supabase)</span>
                    </div>
                    <span className="text-primary">Paused</span>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-border">
                  <p className="text-muted-foreground text-[11px] font-mono leading-relaxed">
                    This project was built during the Claude Builder Club Hackathon at ASU. The cloud database runs on Supabase&apos;s free tier, which auto-pauses after 7 days of inactivity. Session history, map pins, and cross-device sync are temporarily unavailable. Core features — live monitoring, AI analysis, and noise mapping — work normally.
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

