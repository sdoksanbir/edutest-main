import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useEditorStore, type AnswerKeyMode } from "../../store/editorStore";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: (mode: AnswerKeyMode) => void;
  currentMode: AnswerKeyMode;
  themeColor: string;
};

export default function AnswerKeyModeModal({ open, onClose, onConfirm, currentMode, themeColor }: Props) {
  const activeTab = useEditorStore((s) => s.activeTab);
  const writtenOnly = activeTab === "written-paper";

  const [selected, setSelected] = useState<AnswerKeyMode>(currentMode);

  useEffect(() => {
    if (!open) return;
    if (writtenOnly) {
      setSelected("separate_page");
      return;
    }
    // Eski "testin sonuna" seçimi kaldırıldı → ayrı sayfaya düş
    setSelected(currentMode === "end_of_test" ? "separate_page" : currentMode);
  }, [open, currentMode, writtenOnly]);

  if (!open) return null;

  const handleApply = () => {
    onConfirm(selected);
  };

  return createPortal(
    <div className="tq-popup-overlay z-[70]" onClick={onClose}>
      <div
        className="tq-popup-panel w-full max-w-md rounded-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="tq-popup-title mb-4 text-base font-bold">Cevap anahtarı nereye eklensin?</h3>
        {writtenOnly && (
          <p className="tq-popup-muted mb-3 text-xs">
            Yazılı kağıdında cevap anahtarı yalnızca ayrı sayfada yer alır.
          </p>
        )}
        <div className="space-y-2">
          {(writtenOnly
            ? ([{ value: "separate_page" as const, label: "Ayrı sayfaya ekle" }] as const)
            : ([
                { value: "per_page" as const, label: "Her sayfanın altına ekle" },
                { value: "separate_page" as const, label: "Ayrı sayfaya ekle" },
              ] as const)
          ).map((opt) => (
            <label
              key={opt.value}
              className="tq-popup-title flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-100"
            >
              <input
                type="radio"
                name="answerKeyMode"
                checked={selected === opt.value}
                onChange={() => setSelected(opt.value)}
                className="h-4 w-4"
              />
              {opt.label}
            </label>
          ))}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="tq-popup-btn-secondary"
          >
            İPTAL
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="rounded-lg px-4 py-2 text-sm font-bold text-white"
            style={{ backgroundColor: themeColor }}
          >
            UYGULA
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
