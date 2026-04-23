import type { ThemeMode } from '@/app/store'

export function applyThemeMode(mode: ThemeMode) {
  const root = document.documentElement
  if (mode === 'dark') root.classList.add('dark')
  else root.classList.remove('dark')
}
