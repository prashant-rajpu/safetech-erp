import {
  Wrench, Ruler, Package, HardHat, Construction, Bandage, Receipt, Blocks,
  TestTube, Handshake, Disc, Truck, CalendarDays, Archive, Cog, Pin,
  BarChart3, Building2, Globe, Repeat, CheckCircle2, AlertTriangle, Settings,
  Box, Briefcase, Calculator, FlaskConical, UserCog, ShieldCheck, Beaker,
  Route, Shield, Siren, Map, MessageSquare, Trash2, FolderOpen, Paintbrush,
  PenLine, Clock, Link, Unlock, KeyRound, Lock, Search, Shuffle, Inbox,
  Upload, FileEdit, ScrollText, ClipboardList, Calendar, FileText, Folder,
  Droplet, ShieldAlert, Factory, Home, Target, Drama, GraduationCap,
  HelpCircle, Fuel, CheckSquare, Hourglass, Hammer,
  Menu, Check, X, XCircle, Printer, TrendingUp, Save, Ticket,
  Eye, Pencil, Zap, MapPin, Camera, Flag, Link2, Plus, Timer,
  type LucideIcon,
} from 'lucide-react'

/** Emoji-keyed map — the registry's icon: fields keep their original emoji
    string values (safer than rewriting 127 field literals); this is the one
    place that decides what Lucide icon each glyph renders as. Unmapped
    glyphs fall back to HelpCircle via getIcon() rather than crashing. */
export const ICON_MAP: Record<string, LucideIcon> = {
  '🔧': Wrench, '📐': Ruler, '📦': Package, '📏': Ruler, '👷': HardHat,
  '🏗️': Construction, '🩹': Bandage, '🧾': Receipt, '🧱': Blocks,
  '🧪': TestTube, '🤝': Handshake, '🛠️': Hammer, '🛞': Disc, '🚚': Truck,
  '🗓️': CalendarDays, '🗄️': Archive, '🔩': Cog, '📌': Pin, '📊': BarChart3,
  '🏢': Building2, '🌍': Globe, '➰': Repeat, '✅': CheckCircle2,
  '⚠️': AlertTriangle, '⚙️': Settings, '🪣': Box, '🪚': Hammer,
  '🧰': Briefcase, '🧮': Calculator, '🧫': FlaskConical, '🧑‍💼': UserCog,
  '🦺': ShieldCheck, '🥣': Beaker, '🛣️': Route, '🛡️': Shield, '🚨': Siren,
  '🚛': Truck, '🗺️': Map, '🗣️': MessageSquare, '🗑️': Trash2,
  '🗃️': Archive, '🗂️': FolderOpen, '🖌️': Paintbrush, '🖊️': PenLine,
  '🕐': Clock, '🔗': Link, '🔓': Unlock, '🔑': KeyRound, '🔐': Lock,
  '🔎': Search, '🔍': Search, '🔁': Repeat, '🔀': Shuffle, '📥': Inbox,
  '📤': Upload, '📝': FileEdit, '📜': ScrollText, '📋': ClipboardList,
  '📆': Calendar, '📅': Calendar, '📄': FileText, '📃': FileText,
  '📁': Folder, '💧': Droplet, '👮': ShieldAlert, '🏭': Factory,
  '🏠': Home, '🎯': Target, '🎭': Drama, '🎓': GraduationCap,
  '❓': HelpCircle, '✍️': PenLine, '⛽': Fuel, '☑️': CheckSquare,
  '⏳': Hourglass,
  // Extended for the app-wide inline-emoji cleanup (Phase 7 §2c)
  '☰': Menu, '✓': Check, '✔️': CheckCircle2,
  '✕': X, '❌': XCircle,
  '🖨️': Printer, '🖨': Printer, '📈': TrendingUp, '💾': Save,
  '🎫': Ticket, '👁': Eye, '✏️': Pencil, '⚡': Zap, '📍': MapPin,
  '📷': Camera, '🏁': Flag, '⛓️': Link2, '⛓': Link2, '＋': Plus,
  '⏱️': Timer, '⏱': Timer,
}

export function getIcon(glyph: string): LucideIcon {
  return ICON_MAP[glyph] || HelpCircle
}
