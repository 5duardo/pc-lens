import React from 'react';
import {
  Cpu,
  MonitorSpeaker,
  MemoryStick,
  HardDrive,
  Monitor,
  Usb,
  CircuitBoard,
  Wifi,
  List,
  Settings,
  ChevronDown,
  Eye,
  EyeOff,
  Zap,
  ArrowDown,
  ArrowUp,
  Sun,
  Moon,
  RefreshCw,
  Globe,
  Gauge,
  Shield,
  RotateCcw,
  Activity,
  Home,
  Laptop,
  PcCase,
  Headphones,
  Bluetooth
} from 'lucide-react';

// Mapeo de nombres internos a componentes Lucide
const ICON_MAP = {
  cpu: Cpu,
  gpu: MonitorSpeaker,
  ram: MemoryStick,
  storage: HardDrive,
  display: Monitor,
  device: Usb,
  board: CircuitBoard,
  net: Wifi,
  proc: List,
  settings: Settings,
  chevron: ChevronDown,
  eye: Eye,
  eyeOff: EyeOff,
  bolt: Zap,
  down: ArrowDown,
  up: ArrowUp,
  sun: Sun,
  moon: Moon,
  refresh: RefreshCw,
  globe: Globe,
  gauge: Gauge,
  shield: Shield,
  resetDns: RotateCcw,
  activity: Activity,
  home: Home,
  laptop: Laptop,
  desktop: PcCase,
  headphones: Headphones,
  bluetooth: Bluetooth
};

export function Icon({ name, className = 'w-[18px] h-[18px]', strokeWidth = 2 }) {
  const LucideIcon = ICON_MAP[name];
  if (!LucideIcon) return null;
  return <LucideIcon className={className} strokeWidth={strokeWidth} />;
}
