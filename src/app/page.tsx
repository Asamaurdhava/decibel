'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
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
        <div className="mb-8 sm:mb-10 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-primary text-xs sm:text-sm font-mono tracking-wide">
            Cloud sync paused — local monitoring active
          </span>
        </div>

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

