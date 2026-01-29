"use client";

// src/components/AltTextGenerator.tsx
import { useState as useState3, useEffect as useEffect2, useCallback } from "react";
import { Button as Button3 } from "@payloadcms/ui";

// src/components/AltTextModal.tsx
import { useState as useState2, useEffect, useRef as useRef2 } from "react";
import { Button as Button2 } from "@payloadcms/ui";

// src/components/ImageRow.tsx
import { useState, useRef } from "react";
import { Button } from "@payloadcms/ui";
import { jsx, jsxs } from "react/jsx-runtime";
var ImageRow = ({
  image,
  suggestion,
  onGenerate,
  onUpdate,
  onSave
}) => {
  const status = suggestion?.status || "pending";
  const [isSaving, setIsSaving] = useState(false);
  const originalValueRef = useRef(suggestion?.suggestedAlt || "");
  const statusColors = {
    pending: "var(--theme-elevation-400)",
    generating: "var(--theme-warning-500)",
    ready: "var(--theme-success-500)",
    saved: "var(--theme-success-700)",
    error: "var(--theme-error-500)"
  };
  return /* @__PURE__ */ jsxs(
    "div",
    {
      style: {
        display: "grid",
        gridTemplateColumns: "80px 1fr auto",
        gap: "1rem",
        padding: "1rem",
        borderBottom: "1px solid var(--theme-elevation-100)",
        alignItems: "center",
        opacity: status === "generating" ? 0.7 : 1
      },
      children: [
        /* @__PURE__ */ jsx(
          "div",
          {
            style: {
              width: "80px",
              height: "60px",
              backgroundColor: "var(--theme-elevation-50)",
              borderRadius: "4px",
              overflow: "hidden"
            },
            children: /* @__PURE__ */ jsx(
              "img",
              {
                src: image.url,
                alt: "",
                width: 80,
                height: 60,
                loading: "lazy",
                decoding: "async",
                style: {
                  width: "100%",
                  height: "100%",
                  objectFit: "cover"
                }
              }
            )
          }
        ),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(
            "div",
            {
              style: {
                fontSize: "0.75rem",
                color: "var(--theme-elevation-500)",
                marginBottom: "0.25rem"
              },
              children: image.filename
            }
          ),
          status === "generating" ? /* @__PURE__ */ jsxs(
            "div",
            {
              role: "status",
              "aria-label": `Generating alt text for ${image.filename}`,
              style: {
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                color: "var(--theme-warning-500)",
                fontSize: "0.875rem"
              },
              children: [
                /* @__PURE__ */ jsx(
                  "span",
                  {
                    "aria-hidden": "true",
                    className: "alt-spinner",
                    style: {
                      display: "inline-block",
                      width: "14px",
                      height: "14px",
                      border: "2px solid var(--theme-warning-500)",
                      borderTopColor: "transparent",
                      borderRadius: "50%"
                    }
                  }
                ),
                "Generating alt text..."
              ]
            }
          ) : status === "error" ? /* @__PURE__ */ jsx(
            "div",
            {
              role: "alert",
              "aria-label": `Error for ${image.filename}`,
              style: {
                width: "100%",
                padding: "0.5rem",
                border: "1px solid var(--theme-error-500)",
                borderRadius: "4px",
                fontSize: "0.875rem",
                backgroundColor: "var(--theme-error-50)",
                color: "var(--theme-error-500)"
              },
              children: suggestion?.error || "Failed to generate alt text"
            }
          ) : suggestion && (status === "ready" || status === "saved") ? /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: suggestion.suggestedAlt,
              onChange: (e) => {
                onUpdate(e.target.value);
              },
              onFocus: () => {
                originalValueRef.current = suggestion.suggestedAlt;
              },
              onBlur: async (e) => {
                const newValue = e.target.value;
                if (newValue !== originalValueRef.current) {
                  setIsSaving(true);
                  await onSave(newValue);
                  setIsSaving(false);
                  originalValueRef.current = newValue;
                }
              },
              disabled: isSaving,
              placeholder: "Alt text...",
              "aria-label": `Alt text for ${image.filename}`,
              style: {
                width: "100%",
                padding: "0.5rem",
                border: `1px solid ${status === "saved" ? "var(--theme-success-500)" : "var(--theme-elevation-150)"}`,
                borderRadius: "4px",
                fontSize: "0.875rem",
                backgroundColor: status === "saved" ? "var(--theme-success-50)" : void 0
              }
            }
          ) : /* @__PURE__ */ jsx(
            "span",
            {
              style: { color: "var(--theme-elevation-400)", fontSize: "0.875rem" },
              children: "Click Generate to create alt text"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: "0.5rem" }, children: [
          /* @__PURE__ */ jsx(
            "span",
            {
              role: "status",
              "aria-label": `Status: ${status}`,
              style: {
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: statusColors[status]
              }
            }
          ),
          status === "pending" && /* @__PURE__ */ jsx(Button, { onClick: onGenerate, buttonStyle: "secondary", size: "small", children: "Generate" }),
          status === "generating" && /* @__PURE__ */ jsx("span", { style: { fontSize: "0.75rem", color: "var(--theme-warning-500)" }, children: "Loading..." }),
          status === "error" && /* @__PURE__ */ jsx(Button, { onClick: onGenerate, buttonStyle: "secondary", size: "small", children: "Retry" }),
          status === "saved" && /* @__PURE__ */ jsx(
            "span",
            {
              style: { fontSize: "0.75rem", color: "var(--theme-success-500)" },
              children: "Saved"
            }
          )
        ] }),
        /* @__PURE__ */ jsx("style", { children: `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .alt-spinner {
          animation: spin 1s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .alt-spinner {
            animation: none;
            opacity: 0.7;
          }
        }
      ` })
      ]
    }
  );
};

// src/components/AltTextModal.tsx
import { jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
var AltTextModal = ({
  images = [],
  collectionSlug,
  batchSize,
  onComplete,
  onClose
}) => {
  const safeImages = images ?? [];
  const [suggestions, setSuggestions] = useState2(
    /* @__PURE__ */ new Map()
  );
  const [isGenerating, setIsGenerating] = useState2(false);
  const [progress, setProgress] = useState2({ current: 0, total: 0 });
  const cancelRef = useRef2(false);
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);
  const generateAltText = async (image) => {
    setSuggestions((prev) => {
      const next = new Map(prev);
      next.set(image.id, {
        id: image.id,
        filename: image.filename,
        imageUrl: image.url,
        suggestedAlt: "",
        status: "generating"
      });
      return next;
    });
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12e4);
      const response = await fetch(`/api/${collectionSlug}/generate-alt`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageId: image.id,
          imageUrl: image.url,
          filename: image.filename
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.details || data.error || "Failed to generate");
      }
      const suggestion = {
        id: image.id,
        filename: image.filename,
        imageUrl: image.url,
        suggestedAlt: data.suggestedAlt,
        status: "ready"
      };
      setSuggestions((prev) => {
        const next = new Map(prev);
        next.set(image.id, suggestion);
        return next;
      });
      return suggestion;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.name === "AbortError" ? "Request timed out" : error.message : String(error);
      const errorSuggestion = {
        id: image.id,
        filename: image.filename,
        imageUrl: image.url,
        suggestedAlt: "",
        status: "error",
        error: `Error: ${errorMessage}`
      };
      setSuggestions((prev) => {
        const next = new Map(prev);
        next.set(image.id, errorSuggestion);
        return next;
      });
      return errorSuggestion;
    }
  };
  const saveBatch = async (results) => {
    const toSave = results.filter((r) => r.status === "ready" && r.suggestedAlt);
    if (toSave.length === 0) return;
    try {
      const response = await fetch(`/api/${collectionSlug}/save-bulk-alt`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updates: toSave.map((s) => ({ id: s.id, alt: s.suggestedAlt })),
          collectionSlug
        })
      });
      const data = await response.json();
      if (response.ok) {
        setSuggestions((prev) => {
          const next = new Map(prev);
          for (const id of data.success || []) {
            const existing = next.get(id);
            if (existing) {
              next.set(id, { ...existing, status: "saved" });
            }
          }
          return next;
        });
      }
    } catch {
    }
  };
  const generateAndSave = async (image) => {
    const result = await generateAltText(image);
    if (result.status === "ready" && result.suggestedAlt) {
      await saveBatch([result]);
    }
    return result;
  };
  const handleGenerateAll = async () => {
    cancelRef.current = false;
    setIsGenerating(true);
    setProgress({ current: 0, total: safeImages.length });
    for (let i = 0; i < safeImages.length; i += batchSize) {
      if (cancelRef.current) {
        break;
      }
      const batch = safeImages.slice(i, i + batchSize);
      await Promise.all(batch.map(generateAndSave));
      setProgress((prev) => ({
        ...prev,
        current: Math.min(i + batchSize, safeImages.length)
      }));
    }
    setIsGenerating(false);
  };
  const handleCancel = () => {
    cancelRef.current = true;
  };
  const handleUpdateSuggestion = (id, newAlt) => {
    setSuggestions((prev) => {
      const next = new Map(prev);
      const existing = next.get(id);
      if (existing) {
        next.set(id, { ...existing, suggestedAlt: newAlt });
      }
      return next;
    });
  };
  const handleSaveAlt = async (id, newAlt) => {
    const response = await fetch(`/api/${collectionSlug}/save-alt`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageId: id,
        altText: newAlt,
        collectionSlug
      })
    });
    if (response.ok) {
      setSuggestions((prev) => {
        const next = new Map(prev);
        const existing = next.get(id);
        if (existing) {
          next.set(id, { ...existing, suggestedAlt: newAlt, status: "saved" });
        }
        return next;
      });
    }
  };
  const savedCount = Array.from(suggestions.values()).filter(
    (s) => s.status === "saved"
  ).length;
  return /* @__PURE__ */ jsxs2(
    "div",
    {
      style: {
        position: "fixed",
        inset: 0,
        zIndex: 1e4,
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      },
      children: [
        /* @__PURE__ */ jsx2(
          "button",
          {
            type: "button",
            onClick: onClose,
            "aria-label": "Close modal",
            style: {
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              border: "none",
              cursor: "pointer"
            }
          }
        ),
        /* @__PURE__ */ jsxs2(
          "div",
          {
            style: {
              position: "relative",
              backgroundColor: "var(--theme-elevation-0)",
              borderRadius: "8px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              width: "90vw",
              maxWidth: "900px",
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column"
            },
            children: [
              /* @__PURE__ */ jsxs2(
                "div",
                {
                  style: {
                    padding: "1.25rem 1.5rem",
                    borderBottom: "1px solid var(--theme-elevation-100)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  },
                  children: [
                    /* @__PURE__ */ jsx2("h2", { style: { margin: 0, fontSize: "1.25rem" }, children: "Generate Alt Texts" }),
                    /* @__PURE__ */ jsx2(
                      "button",
                      {
                        type: "button",
                        onClick: onClose,
                        "aria-label": "Close",
                        style: {
                          background: "none",
                          border: "none",
                          fontSize: "1.5rem",
                          cursor: "pointer",
                          color: "var(--theme-elevation-500)",
                          lineHeight: 1
                        },
                        children: "\xD7"
                      }
                    )
                  ]
                }
              ),
              /* @__PURE__ */ jsxs2("div", { style: { padding: "1.5rem", flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }, children: [
                /* @__PURE__ */ jsxs2("p", { style: { color: "var(--theme-elevation-500)", margin: "0 0 1rem" }, children: [
                  safeImages.length,
                  " images missing alt text"
                ] }),
                /* @__PURE__ */ jsxs2("div", { style: { display: "flex", gap: "0.5rem", marginBottom: "1rem", alignItems: "center" }, children: [
                  /* @__PURE__ */ jsx2(
                    Button2,
                    {
                      onClick: handleGenerateAll,
                      disabled: isGenerating || safeImages.length === 0,
                      children: isGenerating ? `Generating & saving... (${progress.current}/${progress.total})` : "Generate All"
                    }
                  ),
                  isGenerating && /* @__PURE__ */ jsx2(
                    Button2,
                    {
                      onClick: handleCancel,
                      buttonStyle: "secondary",
                      children: "Cancel"
                    }
                  ),
                  savedCount > 0 && /* @__PURE__ */ jsxs2("span", { style: { fontSize: "0.875rem", color: "var(--theme-success-500)" }, children: [
                    savedCount,
                    " saved"
                  ] })
                ] }),
                /* @__PURE__ */ jsx2(
                  "div",
                  {
                    style: {
                      flex: 1,
                      overflow: "auto",
                      border: "1px solid var(--theme-elevation-150)",
                      borderRadius: "4px"
                    },
                    children: safeImages.map((image) => /* @__PURE__ */ jsx2(
                      ImageRow,
                      {
                        image,
                        suggestion: suggestions.get(image.id),
                        collectionSlug,
                        onGenerate: () => generateAndSave(image),
                        onUpdate: (newAlt) => handleUpdateSuggestion(image.id, newAlt),
                        onSave: (newAlt) => handleSaveAlt(image.id, newAlt)
                      },
                      image.id
                    ))
                  }
                )
              ] })
            ]
          }
        )
      ]
    }
  );
};

// src/components/AltTextGenerator.tsx
import { jsx as jsx3, jsxs as jsxs3 } from "react/jsx-runtime";
var AltTextGenerator = ({
  collectionSlug,
  options
}) => {
  const [missingCount, setMissingCount] = useState3(0);
  const [isLoading, setIsLoading] = useState3(true);
  const [images, setImages] = useState3([]);
  const [isOpen, setIsOpen] = useState3(false);
  const fetchCount = useCallback(async () => {
    try {
      const response = await fetch(`/api/${collectionSlug}/missing-alt?countOnly=true`, {
        credentials: "include"
      });
      const data = await response.json();
      if (data.error) {
        console.error("API error:", data.error);
        setMissingCount(0);
      } else {
        setMissingCount(data.totalDocs ?? 0);
      }
    } catch (error) {
      console.error("Failed to fetch missing alt count:", error);
      setMissingCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [collectionSlug]);
  const fetchImages = useCallback(async () => {
    try {
      const response = await fetch(`/api/${collectionSlug}/missing-alt`, {
        credentials: "include"
      });
      const data = await response.json();
      if (data.error) {
        console.error("API error:", data.error);
        setMissingCount(0);
        setImages([]);
        return;
      }
      setMissingCount(data.totalDocs ?? 0);
      setImages(data.docs ?? []);
    } catch (error) {
      console.error("Failed to fetch images:", error);
      setMissingCount(0);
      setImages([]);
    }
  }, [collectionSlug]);
  useEffect2(() => {
    fetchCount();
  }, [fetchCount]);
  const handleClose = () => {
    setIsOpen(false);
    fetchCount();
  };
  return /* @__PURE__ */ jsxs3("div", { style: { marginBottom: "1rem" }, children: [
    /* @__PURE__ */ jsxs3(
      Button3,
      {
        onClick: async () => {
          await fetchImages();
          setIsOpen(true);
        },
        buttonStyle: "secondary",
        disabled: isLoading || missingCount === 0,
        children: [
          "Generate Missing Alt Texts",
          !isLoading && missingCount > 0 && /* @__PURE__ */ jsx3(
            "span",
            {
              style: {
                marginLeft: "0.5rem",
                padding: "0.125rem 0.5rem",
                backgroundColor: "var(--theme-error-500)",
                color: "white",
                borderRadius: "999px",
                fontSize: "0.75rem"
              },
              children: missingCount
            }
          )
        ]
      }
    ),
    isOpen && /* @__PURE__ */ jsx3(
      AltTextModal,
      {
        images,
        collectionSlug,
        batchSize: options.batchSize,
        onComplete: handleClose,
        onClose: handleClose
      }
    )
  ] });
};

// src/components/GenerateAltButton.tsx
import { useState as useState4, useRef as useRef3 } from "react";
import { useDocumentInfo } from "@payloadcms/ui";
import { useParams } from "next/navigation";
import { jsx as jsx4, jsxs as jsxs4 } from "react/jsx-runtime";
var GenerateAltButton = ({
  collectionSlug,
  altFieldName
}) => {
  const [isGenerating, setIsGenerating] = useState4(false);
  const documentInfo = useDocumentInfo();
  const params = useParams();
  const buttonRef = useRef3(null);
  const id = documentInfo?.id || params?.segments?.at(-1);
  const isNewDocument = !id || id === "create";
  if (isNewDocument) {
    return null;
  }
  const updateFieldValue = (value) => {
    const input = document.querySelector(
      `input[name="${altFieldName}"], textarea[name="${altFieldName}"]`
    );
    if (input) {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value"
      )?.set;
      const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        "value"
      )?.set;
      const setter = input.tagName === "TEXTAREA" ? nativeTextAreaValueSetter : nativeInputValueSetter;
      setter?.call(input, value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
  };
  const handleGenerate = async () => {
    if (!id) return;
    setIsGenerating(true);
    try {
      const docResponse = await fetch(`/api/${collectionSlug}/${id}`, {
        credentials: "include"
      });
      const doc = await docResponse.json();
      if (!doc.url || !doc.filename) {
        console.error("No image URL or filename found");
        return;
      }
      const response = await fetch(`/api/${collectionSlug}/generate-alt`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageId: id,
          imageUrl: doc.url,
          filename: doc.filename
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate");
      }
      if (data.suggestedAlt) {
        updateFieldValue(data.suggestedAlt);
      }
    } catch (error) {
      console.error("Failed to generate alt text:", error);
    } finally {
      setIsGenerating(false);
    }
  };
  return /* @__PURE__ */ jsxs4(
    "button",
    {
      ref: buttonRef,
      type: "button",
      onClick: handleGenerate,
      disabled: isGenerating || !id,
      className: "generate-alt-btn",
      style: {
        marginTop: "0.5rem",
        padding: "0.4rem 0.75rem",
        backgroundColor: "transparent",
        border: "1px solid var(--theme-elevation-250)",
        borderRadius: "4px",
        cursor: isGenerating || !id ? "not-allowed" : "pointer",
        fontSize: "0.8rem",
        color: "var(--theme-elevation-800)",
        display: "inline-flex",
        alignItems: "center",
        gap: "0.4rem",
        opacity: isGenerating || !id ? 0.6 : 1
      },
      children: [
        isGenerating && /* @__PURE__ */ jsx4(
          "span",
          {
            "aria-hidden": "true",
            className: "generate-spinner",
            style: {
              display: "inline-block",
              width: "12px",
              height: "12px",
              border: "2px solid var(--theme-elevation-400)",
              borderTopColor: "transparent",
              borderRadius: "50%"
            }
          }
        ),
        isGenerating ? "Generating..." : "Generate with AI",
        /* @__PURE__ */ jsx4("style", { children: `
        @keyframes spin { to { transform: rotate(360deg); } }
        .generate-spinner {
          animation: spin 1s linear infinite;
        }
        .generate-alt-btn:focus-visible {
          outline: 2px solid var(--theme-elevation-500);
          outline-offset: 2px;
        }
        @media (prefers-reduced-motion: reduce) {
          .generate-spinner {
            animation: none;
            opacity: 0.7;
          }
        }
      ` })
      ]
    }
  );
};
export {
  AltTextGenerator,
  AltTextModal,
  GenerateAltButton,
  ImageRow
};
//# sourceMappingURL=index.mjs.map