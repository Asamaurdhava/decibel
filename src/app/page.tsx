'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import BorderGlow from '@/components/ui/border-glow';
import LightRays from '@/components/ui/light-rays';
import FuzzyText from '@/components/ui/fuzzy-text';

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
        {/* Title */}
        <h1 className="mb-5 sm:mb-6 flex justify-center">
          <FuzzyText
            fontSize="clamp(3.5rem, 10vw, 7rem)"
            fontWeight={700}
            fontFamily="'Space Mono', monospace"
            color="#ffffff"
            baseIntensity={0.15}
            hoverIntensity={0.4}
            enableHover
            fuzzRange={20}
            fps={30}
            direction="horizontal"
            letterSpacing={12}
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
        <div className="w-16 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent mx-auto mb-8 sm:mb-10" />

        {/* Description */}
        <p className="text-muted-foreground text-base sm:text-lg leading-relaxed mb-10 sm:mb-12 max-w-lg mx-auto">
          Turn your phone into a sound level monitor. Track noise exposure in real time.
          Get a personalized hearing risk profile backed by WHO safety thresholds.
        </p>

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
          <Stat value="1.1B" label="At risk" />
          <div className="w-px h-8 bg-border" />
          <Stat value="85dB" label="WHO limit" gold />
          <div className="w-px h-8 bg-border" />
          <Stat value="0%" label="Recovery" />
        </motion.div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-24 md:bottom-8 text-muted-foreground/40 text-[10px] sm:text-xs text-center px-4 max-w-md font-mono"
      >
        Awareness tool only. Not a medical device.
      </motion.p>
    </div>
  );
}

function Stat({ value, label, gold }: { value: string; label: string; gold?: boolean }) {
  return (
    <div className="text-center">
      <p className={`text-lg sm:text-xl font-mono font-bold ${gold ? 'text-primary' : 'text-foreground'}`}>{value}</p>
      <p className="text-muted-foreground text-[10px] sm:text-xs mt-1 font-mono uppercase tracking-wider">{label}</p>
    </div>
  );
}
