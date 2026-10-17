import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../api/client";
import { useEditorStore } from "../../store/editorStore";
import type { PdfFolder, QuestionDifficulty } from "../../types";
import {
  folderAncestorChain,
  findDuplicateBankQuestion,
  getQuestionImageBase64Raw,
  listAllFoldersAsOptions,
  listChildFolderOptions,
  resolveSourcePdfMeta,
} from "../../utils/bankQuestionUtils";
import {
  QUESTION_DIFFICULTIES,
  QUESTION_DIFFICULTY_LABEL,
} from "../../utils/questionDifficulty";
import ModalShell from "./ModalShell";

export default function SaveToBankModal({ onClose }: { onClose: () => void }) {
  const questionIds = useEditorStore((s) => s.saveToBankQuestionIds);
  const questions = useEditorStore((s) => s.questions);

  const targets = useMemo(
    () =>
      questions.filter(
        (q) => questionIds.includes(q.id) && !q.bankSourceId,
      ),
    [questions, questionIds],
  );

  const bankAlreadyCount = useMemo(
    () =>
      questions.filter(
        (q) => questionIds.includes(q.id) && !!q.bankSourceId,
      ).length,
    [questions, questionIds],
  );

  const [folders, setFolders] = useState<PdfFolder[]>([]);
  /** Ders hedef klasörü (kök veya alt klasör) */
  const [dersFolderId, setDersFolderId] = useState("");
  /** Konu = seçilen ders klasörünün alt klasörü; boş = ders klasörünün kendisi */
  const [konuFolderId, setKonuFolderId] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<QuestionDifficulty | null>(null);
  const [newDersOpen, setNewDersOpen] = useState(false);
  const [newDersName, setNewDersName] = useState("");
  const [newKonuOpen, setNewKonuOpen] = useState(false);
  const [newKonuName, setNewKonuName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState(0);
  const [duplicateHint, setDuplicateHint] = useState<string | null>(null);
  const [savedDersLabel, setSavedDersLabel] = useState("");
  const [savedKonuLabel, setSavedKonuLabel] = useState<string | null>(null);
  /** Zustand güncellemesi React state'ten önce re-render tetikleyebilir */
  const saveDoneRef = useRef(false);

  const dersFolderOptions = useMemo(
    () => listAllFoldersAsOptions(folders),
    [folders],
  );

  const konuFolderOptions = useMemo(
    () => listChildFolderOptions(dersFolderId || null, folders),
    [folders, dersFolderId],
  );

  const selectedDersFolder = useMemo(
    () => folders.find((f) => f.id === dersFolderId) ?? null,
    [folders, dersFolderId],
  );

  const selectedKonuFolder = useMemo(
    () =>
      konuFolderId
        ? folders.find((f) => f.id === konuFolderId) ?? null
        : null,
    [folders, konuFolderId],
  );

  /** Metadata: kök klasör adı = ders, seçilen konu klasörü = konu */
  const dersMetaName = useMemo(() => {
    if (!dersFolderId) return "";
    const chain = folderAncestorChain(dersFolderId, folders);
    return chain[0]?.name.trim() || selectedDersFolder?.name.trim() || "";
  }, [dersFolderId, folders, selectedDersFolder]);

  const konuMetaName = selectedKonuFolder?.name.trim() || null;

  const destinationLabel = useMemo(() => {
    const dersOpt = dersFolderOptions.find((o) => o.id === dersFolderId);
    const base = dersOpt?.label || selectedDersFolder?.name || "—";
    if (selectedKonuFolder) return `${base} / ${selectedKonuFolder.name}`;
    return base;
  }, [dersFolderOptions, dersFolderId, selectedDersFolder, selectedKonuFolder]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      setDuplicateHint(null);
      try {
        const [{ settings: s }, { folders: f }] = await Promise.all([
          api.bankQuestions.getSettings(),
          api.pdfs.folders.list(),
        ]);
        if (cancelled) return;
        setFolders(f);

        const options = listAllFoldersAsOptions(f);
        const first = targets[0];
        const fromDers = first?.ders?.trim() || "";
        const fromKonu = first?.konu?.trim() || first?.category?.trim() || "";

        let pickDersId = "";
        let pickKonuId: string | null = null;
        if (fromDers) {
          const rootMatch = f.find(
            (x) => (x.parent_id ?? null) === null && x.name.trim() === fromDers,
          );
          pickDersId = rootMatch?.id ?? "";
          if (pickDersId && fromKonu) {
            const child = f.find(
              (x) =>
                (x.parent_id ?? null) === pickDersId &&
                x.name.trim() === fromKonu,
            );
            if (child) pickKonuId = child.id;
          }
        }
        if (!pickDersId && s.defaultDers) {
          pickDersId =
            f.find(
              (x) =>
                (x.parent_id ?? null) === null &&
                x.name.trim() === s.defaultDers.trim(),
            )?.id ?? "";
        }
        if (!pickDersId && options.length > 0) {
          pickDersId = options[0]!.id;
        }
        setDersFolderId(pickDersId);
        setKonuFolderId(pickKonuId);
        setDifficulty(first?.difficulty ?? null);

        const dups: string[] = [];
        for (const q of targets) {
          const dup = await findDuplicateBankQuestion(q);
          if (dup) {
            dups.push(
              `s.${q.page_number} · ${dup.ders}${
                dup.konu ? ` / ${dup.konu}` : ""
              }`,
            );
          }
        }
        if (!cancelled && dups.length > 0) {
          setDuplicateHint(
            dups.length === 1
              ? `Bu soru zaten soru bankasında var (${dups[0]}).`
              : `Seçili sorulardan ${dups.length} tanesi zaten soru bankasında var.`,
          );
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Ayarlar yüklenemedi");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [targets]);

  if (questionIds.length === 0) return null;

  // Kayıt başarılıysa önce başarı ekranı (bankSourceId set edilince targets boşalır)
  if (saveDoneRef.current || savedCount > 0) {
    return (
      <ModalShell title="Soru Bankasına Kaydedildi" onClose={onClose}>
        <p className="text-sm text-slate-600">
          {savedCount > 0 ? savedCount : bankAlreadyCount} soru soru bankasına eklendi.
          <br />
          Klasör: <strong>{savedDersLabel}</strong>
          {savedKonuLabel ? null : (
            <> · Konu seçilmediği için ders klasörüne kaydedildi</>
          )}
        </p>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
            onClick={onClose}
          >
            Tamam
          </button>
        </div>
      </ModalShell>
    );
  }

  if (targets.length === 0) {
    return (
      <ModalShell title="Soru Bankasına Kaydet" onClose={onClose}>
        <p className="text-sm text-amber-800">
          {bankAlreadyCount > 0
            ? "Bu sorular zaten soru bankasına kayıtlı (bankadan geldi veya daha önce kaydedildi). Tekrar kaydedilemez."
            : "Kaydedilecek soru ana editörde bulunamadı. Önce kırpma ile editöre ekleyin, sonra kaydedin."}
        </p>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm text-white"
            onClick={onClose}
          >
            Tamam
          </button>
        </div>
      </ModalShell>
    );
  }

  const submitNewDers = async () => {
    const name = newDersName.trim();
    if (!name) return;
    // Üstte klasör seçiliyse onun altına; seçili değilse ana dizine
    const parentId = dersFolderId.trim() ? dersFolderId : null;
    try {
      if (!parentId) {
        await api.bankQuestions.addDers(name);
        await api.bankQuestions.updateSettings({ defaultDers: name });
      }
      const { folder } = await api.pdfs.folders.create(name, parentId);
      const { folders: f } = await api.pdfs.folders.list();
      setFolders(f);
      setDersFolderId(folder.id);
      setKonuFolderId(null);
      setNewDersName("");
      setNewDersOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ders klasörü eklenemedi");
    }
  };

  const submitNewKonu = async () => {
    const name = newKonuName.trim();
    if (!name) return;
    // Üstte konu seçiliyse onun altına; değilse ders klasörüne; ders de yoksa ana dizine
    const parentId = konuFolderId ?? (dersFolderId.trim() ? dersFolderId : null);
    const nestedUnderKonu = !!(konuFolderId && parentId === konuFolderId);
    try {
      const { folder } = await api.pdfs.folders.create(name, parentId);
      if (!parentId) {
        await api.bankQuestions.addDers(name);
        await api.bankQuestions.updateSettings({ defaultDers: name });
      } else {
        const rootName =
          folderAncestorChain(parentId, folders)[0]?.name.trim() || dersMetaName;
        if (rootName) await api.bankQuestions.addKonu(rootName, name);
      }
      const { folders: f } = await api.pdfs.folders.list();
      setFolders(f);
      if (!parentId) {
        setDersFolderId(folder.id);
        setKonuFolderId(null);
      } else if (nestedUnderKonu) {
        // Seçili konunun altına eklendi → o konu ders bağlamı olur, yeni klasör konu seçilir
        setDersFolderId(parentId);
        setKonuFolderId(folder.id);
      } else {
        setKonuFolderId(folder.id);
      }
      setNewKonuName("");
      setNewKonuOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Konu klasörü eklenemedi");
    }
  };

  const newDersParentHint = dersFolderId.trim()
    ? `Altına eklenecek: ${
        dersFolderOptions.find((o) => o.id === dersFolderId)?.label ?? "seçili klasör"
      }`
    : "Ana dizine eklenecek";

  const newKonuParentHint = konuFolderId
    ? `Altına eklenecek: ${selectedKonuFolder?.name ?? "seçili konu"}`
    : dersFolderId.trim()
      ? `Altına eklenecek: ${
          dersFolderOptions.find((o) => o.id === dersFolderId)?.label ?? "ders klasörü"
        }`
      : "Ana dizine eklenecek";

  const handleSave = async () => {
    if (!dersFolderId) {
      setError("Ders klasörü seçimi zorunludur.");
      return;
    }

    const folderId = konuFolderId ?? dersFolderId;
    const dersVal = dersMetaName || selectedDersFolder?.name.trim() || "";
    if (!dersVal) {
      setError("Ders adı çözülemedi.");
      return;
    }
    const konuVal = konuMetaName;

    setSaving(true);
    setError(null);
    try {
      const duplicateIds: string[] = [];
      for (const q of targets) {
        const dup = await findDuplicateBankQuestion(q);
        if (dup) duplicateIds.push(q.id);
      }
      if (duplicateIds.length > 0) {
        const msg =
          duplicateIds.length === targets.length
            ? "Bu soru zaten soru bankasında var. Yine de kaydetmek istiyor musunuz?"
            : `Seçili sorulardan ${duplicateIds.length} tanesi zaten soru bankasında var. Yine de kaydetmek istiyor musunuz?`;
        const ok = window.confirm(msg);
        if (!ok) {
          setDuplicateHint(
            duplicateIds.length === 1
              ? "Bu soru zaten soru bankasında var."
              : `${duplicateIds.length} soru zaten soru bankasında var.`,
          );
          setSaving(false);
          return;
        }
      }

      await api.bankQuestions.updateSettings({ defaultDers: dersVal });
      if (konuVal) {
        await api.bankQuestions.addKonu(dersVal, konuVal);
      }

      const savedMap = new Map<string, string>();
      let count = 0;
      for (const q of targets) {
        const imageBase64 = await getQuestionImageBase64Raw(q);
        const { sourcePdfId, sourcePdfFilename } = await resolveSourcePdfMeta(q);
        const created = await api.bankQuestions.create({
          ders: dersVal,
          konu: konuVal,
          difficulty,
          folder_id: folderId,
          source_pdf_id: sourcePdfId,
          source_pdf_filename: sourcePdfFilename,
          page_number: q.page_number,
          crop: q.crop,
          answer_key: q.answer_key,
          content_type: q.content_type,
          remove_background: q.remove_background,
          image_base64: imageBase64,
          layoutMode: q.layoutMode,
          manualScale: q.manualScale,
          normalizationScale: q.normalizationScale,
          capture: q.capture,
          fontReference: q.fontReference,
        });
        savedMap.set(q.id, created.id);
        count += 1;
      }

      // Önce başarı bayrağı — store güncellemesi targets'ı boşaltmadan önce
      saveDoneRef.current = true;
      setSavedDersLabel(destinationLabel);
      setSavedKonuLabel(konuVal);
      setSavedCount(count);

      useEditorStore.setState((s) => ({
        questions: s.questions.map((q) => {
          const bankId = savedMap.get(q.id);
          if (!bankId) return q;
          return {
            ...q,
            bankSourceId: bankId,
            ders: dersVal,
            konu: konuVal,
            category: konuVal,
            difficulty: difficulty ?? q.difficulty ?? null,
          };
        }),
        isDirty: true,
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Soru bankasına kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  const countLabel =
    targets.length === 1 ? "1 soru kaydedilecek" : `${targets.length} soru kaydedilecek`;

  return (
    <ModalShell title="Soru Bankasına Kaydet" onClose={onClose}>
      <p className="mb-4 text-sm text-slate-500">{countLabel}</p>
      {error && <p className="mb-3 text-sm text-rose-600">{error}</p>}
      {duplicateHint && (
        <p className="mb-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {duplicateHint}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Yükleniyor…</p>
      ) : (
        <div className="space-y-4">
          <section>
            <label className="mb-1.5 block text-sm font-semibold text-slate-800">
              Ders klasörü <span className="text-rose-500">*</span>
            </label>
            <select
              value={dersFolderId}
              onChange={(e) => {
                setDersFolderId(e.target.value);
                setKonuFolderId(null);
              }}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Seçilmedi — ana dizin</option>
              {dersFolderOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.depth > 0 ? `${"\u00A0".repeat(o.depth * 2)}${o.label}` : o.label}
                </option>
              ))}
            </select>
            {newDersOpen ? (
              <div className="mt-2 space-y-1.5">
                <p className="text-[11px] text-slate-500">{newDersParentHint}</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newDersName}
                    onChange={(e) => setNewDersName(e.target.value)}
                    placeholder="Yeni ders klasörü adı"
                    className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                  />
                  <button
                    type="button"
                    className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm text-white"
                    onClick={() => void submitNewDers()}
                  >
                    Ekle
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="mt-2 text-xs text-blue-600 hover:underline"
                onClick={() => setNewDersOpen(true)}
              >
                + Yeni ders klasörü ekle
              </button>
            )}
          </section>

          <section>
            <label className="mb-1.5 block text-sm font-semibold text-slate-800">
              Konu klasörü{" "}
              <span className="font-normal text-slate-500">(isteğe bağlı)</span>
            </label>
            <select
              value={konuFolderId ?? ""}
              onChange={(e) =>
                setKonuFolderId(e.target.value.trim() ? e.target.value : null)
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">
                {dersFolderId.trim()
                  ? "Seçilmedi — ders klasörüne kaydet"
                  : "Seçilmedi — ana dizin"}
              </option>
              {konuFolderOptions.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.name}
                </option>
              ))}
            </select>
            {newKonuOpen ? (
              <div className="mt-2 space-y-1.5">
                <p className="text-[11px] text-slate-500">{newKonuParentHint}</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newKonuName}
                    onChange={(e) => setNewKonuName(e.target.value)}
                    placeholder="Yeni konu klasörü adı"
                    className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                  />
                  <button
                    type="button"
                    className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm text-white"
                    onClick={() => void submitNewKonu()}
                  >
                    Ekle
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="mt-2 text-xs text-blue-600 hover:underline"
                onClick={() => setNewKonuOpen(true)}
              >
                + Yeni konu klasörü ekle
              </button>
            )}
          </section>

          <section>
            <h3 className="mb-2 text-sm font-semibold text-slate-800">Zorluk (isteğe bağlı)</h3>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setDifficulty(null)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  difficulty === null
                    ? "bg-slate-800 text-white"
                    : "border border-slate-300 text-slate-600"
                }`}
              >
                Seçilmedi
              </button>
              {QUESTION_DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficulty(d)}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    difficulty === d
                      ? "bg-blue-600 text-white"
                      : "border border-slate-300 text-slate-600"
                  }`}
                >
                  {QUESTION_DIFFICULTY_LABEL[d]}
                </button>
              ))}
            </div>
          </section>

          <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-800">
            Kayıt yeri: <strong>{destinationLabel}</strong>
            {!konuFolderId ? (
              <> — Konu seçmezseniz soru seçilen ders klasörünün içine kaydedilir.</>
            ) : null}
          </p>
        </div>
      )}

      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          onClick={onClose}
          disabled={saving}
        >
          İptal
        </button>
        <button
          type="button"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
          onClick={() => void handleSave()}
          disabled={loading || saving || !dersFolderId}
        >
          {saving ? "Kaydediliyor…" : "Soru Bankasına Kaydet"}
        </button>
      </div>
    </ModalShell>
  );
}
