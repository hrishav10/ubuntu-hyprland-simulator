import type { ComponentType } from 'react'
import TerminalApp from './TerminalApp'
import FilesApp from './FilesApp'
import EditorApp from './EditorApp'
import SettingsApp from './SettingsApp'
import MonitorApp from './MonitorApp'
import { BrowserApp, TorBrowserApp } from './BrowserApps'
import {
  ArchiveApp, CalculatorApp, CalendarApp, HelpApp, ImageViewerApp, MediaApp,
  NetworkApp, NotesApp, PdfViewerApp, SoftwareApp,
} from './SimpleApps'

export const APP_COMPONENTS: Record<string, ComponentType<{ windowId: string }>> = {
  terminal: TerminalApp,
  files: FilesApp,
  editor: (p) => <EditorApp {...p} />,
  'code-editor': (p) => <EditorApp {...p} codeMode />,
  browser: () => <BrowserApp />,
  'tor-browser': () => <TorBrowserApp />,
  software: () => <SoftwareApp />,
  settings: () => <SettingsApp />,
  monitor: () => <MonitorApp />,
  network: () => <NetworkApp />,
  media: (p) => <MediaApp {...p} />,
  music: (p) => <MediaApp {...p} musicOnly />,
  'image-viewer': ImageViewerApp,
  'pdf-viewer': PdfViewerApp,
  calculator: () => <CalculatorApp />,
  calendar: () => <CalendarApp />,
  notes: () => <NotesApp />,
  archive: ArchiveApp,
  help: () => <HelpApp />,
}
