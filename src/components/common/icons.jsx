
import React from "react";
import {
  Sun,
  Moon,
  Monitor,
  Maximize,
  Minimize,
  PanelLeft,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Plus,
  Search,
  ZoomIn,
  ZoomOut,
  MoveHorizontal,
  MoveVertical,
  Menu,
  X,
  Home,
  HelpCircle,
  List,
  LayoutGrid,
  Settings,
  Maximize2,
  Minimize2,
  Trash2,
  CloudOff,
  Zap,
  UserX,
  BookOpen,
  PanelTop,
  Gauge,
  Focus as FocusIconL,
} from "lucide-react";

// Unified icon layer — all icons come from lucide-react (outlined style).
// Keeps the same export names as the previous hand-rolled set so call sites
// don't need to change.

export const SunIcon = (p) => <Sun {...p} />;
export const MoonIcon = (p) => <Moon {...p} />;
export const MonitorIcon = (p) => <Monitor {...p} />;
export const MaximizeIcon = (p) => <Maximize {...p} />;
export const MinimizeIcon = (p) => <Minimize {...p} />;
export const SidebarIcon = (p) => <PanelLeft {...p} />;
export const ChevronLeftIcon = (p) => <ChevronLeft {...p} />;
export const ChevronRightIcon = (p) => <ChevronRight {...p} />;
export const ChevronDownIcon = (p) => <ChevronDown {...p} />;
export const PlusIcon = (p) => <Plus {...p} />;
export const SearchIcon = (p) => <Search {...p} />;
export const ZoomInIcon = (p) => <ZoomIn {...p} />;
export const ZoomOutIcon = (p) => <ZoomOut {...p} />;
export const FitWidthIcon = (p) => <MoveHorizontal {...p} />;
export const FitPageIcon = (p) => <MoveVertical {...p} />;
export const MenuIcon = (p) => <Menu {...p} />;
export const XIcon = (p) => <X {...p} />;
export const HomeIcon = (p) => <Home {...p} />;
export const HelpIcon = (p) => <HelpCircle {...p} />;
export const ListIcon = (p) => <List {...p} />;
export const GridIcon = (p) => <LayoutGrid {...p} />;
export const SettingsIcon = (p) => <Settings {...p} />;
export const FullscreenIcon = (p) => <Maximize2 {...p} />;
export const FullscreenExitIcon = (p) => <Minimize2 {...p} />;
export const TrashIcon = (p) => <Trash2 {...p} />;
export const OfflineIcon = (p) => <CloudOff {...p} />;
export const NoAccountIcon = (p) => <UserX {...p} />;
export const InstantIcon = (p) => <Zap {...p} />;
export const MinimalIcon = (p) => <BookOpen {...p} />;
export const SpeedIcon = (p) => <Gauge {...p} />;
export const FocusIcon = (p) => <FocusIconL {...p} />;
export const CloudOffIcon = (p) => <CloudOff {...p} />;