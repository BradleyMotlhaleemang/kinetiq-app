import {
  Layers, Dumbbell, MessageSquare, Brain, TrendingUp, RefreshCw,
} from 'lucide-react';

export const ONBOARDING_STEPS = [
  {
    icon: Layers,
    title: 'Build your training block',
    description: 'Create a mesocycle and choose a structure that fits your schedule and goals. The system recommends a template based on your experience and goal.',
  },
  {
    icon: Dumbbell,
    title: 'Train with guidance',
    description: 'Follow structured workouts, log every set, and hit your targets. Each session adapts based on how your body has been recovering.',
  },
  {
    icon: MessageSquare,
    title: 'Give feedback',
    description: 'Log soreness, pump quality, and joint pain after every session. This takes under a minute and is the core signal the engine reads.',
  },
  {
    icon: Brain,
    title: 'Get smarter programming',
    description: 'The system reads your feedback and adjusts volume, intensity, and frequency automatically. No coach required.',
  },
  {
    icon: TrendingUp,
    title: 'Progress over time',
    description: 'Track PRs, e1RM trends, and volume progression across every block. See exactly where you are improving and where you are stalling.',
  },
  {
    icon: RefreshCw,
    title: 'Recover and repeat',
    description: 'Deload weeks are triggered automatically when fatigue accumulates. The system protects you from overreaching without you having to manage it.',
  },
];