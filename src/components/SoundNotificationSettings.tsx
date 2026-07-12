'use client';

import { useSoundNotifications } from '@/hooks/useSoundNotifications';

export default function SoundNotificationSettings() {
  const { enabled, volume, muted, setEnabled, setVolume, setMuted, playSound } =
    useSoundNotifications();

  return (
    <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-5 space-y-5">
      <h3 className="text-sm font-bold text-on-surface">Sound Notifications</h3>

      {/* Enable toggle */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-on-surface">Enable sounds</p>
          <p className="text-xs text-on-surface-variant">Play audio cues for invoice events</p>
        </div>
        <button
          role="switch"
          aria-checked={enabled}
          onClick={() => setEnabled(!enabled)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
            enabled ? 'bg-primary' : 'bg-surface-variant'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-surface-container-lowest shadow transition-transform ${
              enabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Mute toggle */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-on-surface">Mute</p>
          <p className="text-xs text-on-surface-variant">Silence without disabling</p>
        </div>
        <button
          role="switch"
          aria-checked={muted}
          disabled={!enabled}
          onClick={() => setMuted(!muted)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
            muted ? 'bg-primary' : 'bg-surface-variant'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-surface-container-lowest shadow transition-transform ${
              muted ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Volume slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="sound-volume" className="text-sm font-medium text-on-surface">
            Volume
          </label>
          <span className="text-xs text-on-surface-variant tabular-nums">{volume}%</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
            volume_down
          </span>
          <input
            id="sound-volume"
            type="range"
            min={0}
            max={100}
            step={1}
            value={volume}
            disabled={!enabled || muted}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="flex-1 accent-primary disabled:opacity-40 disabled:cursor-not-allowed"
          />
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
            volume_up
          </span>
        </div>
      </div>

      {/* Preview buttons */}
      <div className="flex gap-2">
        <button
          disabled={!enabled || muted}
          onClick={() => playSound('success')}
          className="flex items-center gap-1.5 rounded-xl border border-outline-variant/30 px-3 py-2 text-xs font-bold text-on-surface hover:bg-surface-variant/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-[14px] text-green-600">check_circle</span>
          Preview success
        </button>
        <button
          disabled={!enabled || muted}
          onClick={() => playSound('alert')}
          className="flex items-center gap-1.5 rounded-xl border border-outline-variant/30 px-3 py-2 text-xs font-bold text-on-surface hover:bg-surface-variant/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-[14px] text-amber-500">warning</span>
          Preview alert
        </button>
      </div>
    </div>
  );
}
