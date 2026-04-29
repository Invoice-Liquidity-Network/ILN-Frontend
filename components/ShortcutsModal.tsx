"use client";

type Shortcut = {
  keys: string[];
  description: string;
};

type ShortcutGroup = {
  title: string;
  items: Shortcut[];
};

const GROUPS: ShortcutGroup[] = [
  {
    title: "Navigation",
    items: [
      { keys: ["Cmd", "K"], description: "Command palette" },
      { keys: ["G", "D"], description: "Go to Dashboard" },
      { keys: ["G", "L"], description: "Go to LP" },
      { keys: ["G", "A"], description: "Go to Analytics" },
    ],
  },
  {
    title: "Tables",
    items: [
      { keys: ["↑", "↓"], description: "Navigate rows" },
      { keys: ["Enter"], description: "Open detail" },
      { keys: ["F"], description: "Fund invoice" },
      { keys: ["C"], description: "Cancel invoice" },
    ],
  },
  {
    title: "General",
    items: [
      { keys: ["?"], description: "Show shortcuts" },
      { keys: ["Esc"], description: "Close modal/drawer" },
      { keys: ["D"], description: "Toggle dark mode" },
    ],
  },
  {
    title: "Invoice Detail",
    items: [
      { keys: ["E"], description: "Edit invoice (Pending only)" },
      { keys: ["P"], description: "Print/export PDF" },
      { keys: ["Q"], description: "Show QR code" },
    ],
  },
];

function KeyBadge({ keyLabel }: { keyLabel: string }) {
  return (
    <kbd className="inline-flex min-w-7 items-center justify-center rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-bold text-gray-800 shadow-[0_1px_0_0_rgba(0,0,0,0.08)] dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100">
      {keyLabel}
    </kbd>
  );
}

export default function ShortcutsModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 p-4" onClick={onClose}>
      <div
        className="w-full max-w-4xl rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Keyboard shortcuts</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            Esc
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {GROUPS.map((group) => (
            <section key={group.title} className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                {group.title}
              </h3>
              <div className="space-y-2.5">
                {group.items.map((item) => (
                  <div key={`${group.title}-${item.description}`} className="flex items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {item.keys.map((k) => (
                        <KeyBadge keyLabel={k} key={`${item.description}-${k}`} />
                      ))}
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-200">{item.description}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          These shortcuts work everywhere except inside text inputs.
        </p>
      </div>
    </div>
  );
}
