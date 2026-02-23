import { MemoryGraph, type DocumentWithMemories } from "@supermemory/memory-graph";
import {
  McpUseProvider,
  useWidget,
  type WidgetMetadata,
} from "mcp-use/react";
import React from "react";
import "../styles.css";
import { propSchema, type MemoryGraphWidgetProps } from "./types";

export const widgetMetadata: WidgetMetadata = {
  description:
    "Render Supermemory documents and memories as an interactive graph.",
  props: propSchema,
  exposeAsTool: false,
  metadata: {
    prefersBorder: false,
    invoking: "Loading memory graph...",
    invoked: "Memory graph loaded",
    csp: {
      resourceDomains: ["https://cdn.openai.com"],
    },
  },
};

const MemoryGraphWidget: React.FC = () => {
  const { props, isPending } = useWidget<MemoryGraphWidgetProps>();

  const nowIso = new Date().toISOString();
  const documents = (props.documents ?? []).map((document, docIndex) => {
    const docId = document.id || `doc-${docIndex + 1}`;
    const rawMemories = Array.isArray((document as Record<string, unknown>).memoryEntries)
      ? ((document as Record<string, unknown>).memoryEntries as Array<Record<string, unknown>>)
      : Array.isArray((document as Record<string, unknown>).memories)
        ? ((document as Record<string, unknown>).memories as Array<Record<string, unknown>>)
        : [];

    const memoryEntries = rawMemories.map((entry, entryIndex) => ({
      id:
        typeof entry.id === "string" && entry.id.length > 0
          ? entry.id
          : `${docId}-memory-${entryIndex + 1}`,
      documentId: docId,
      content:
        typeof entry.content === "string"
          ? entry.content
          : typeof entry.summary === "string"
            ? entry.summary
            : null,
      summary: typeof entry.summary === "string" ? entry.summary : null,
      title: typeof entry.title === "string" ? entry.title : null,
      type: typeof entry.type === "string" ? entry.type : null,
      createdAt:
        typeof entry.createdAt === "string" ? entry.createdAt : nowIso,
      updatedAt:
        typeof entry.updatedAt === "string" ? entry.updatedAt : nowIso,
      relation:
        entry.relation === "updates" ||
        entry.relation === "extends" ||
        entry.relation === "derives"
          ? entry.relation
          : null,
      spaceId: typeof entry.spaceId === "string" ? entry.spaceId : null,
    }));

    // Ensure at least one renderable memory node per document.
    if (memoryEntries.length === 0) {
      memoryEntries.push({
        id: `${docId}-memory-1`,
        documentId: docId,
        content:
          typeof document.summary === "string"
            ? document.summary
            : typeof document.content === "string"
              ? document.content
              : typeof document.title === "string"
                ? document.title
                : "Memory node",
        summary:
          typeof document.summary === "string" ? document.summary : null,
        title: typeof document.title === "string" ? document.title : null,
        type: typeof document.type === "string" ? document.type : null,
        createdAt:
          typeof document.createdAt === "string" ? document.createdAt : nowIso,
        updatedAt:
          typeof document.updatedAt === "string" ? document.updatedAt : nowIso,
        relation: null,
        spaceId: null,
      });
    }

    return {
      ...document,
      id: docId,
      status:
        document.status === "pending" ||
        document.status === "processing" ||
        document.status === "done" ||
        document.status === "failed"
          ? document.status
          : "done",
      createdAt: typeof document.createdAt === "string" ? document.createdAt : nowIso,
      updatedAt: typeof document.updatedAt === "string" ? document.updatedAt : nowIso,
      memoryEntries,
    } as DocumentWithMemories;
  });
  const variant = props.variant ?? "consumer";
  const totalDocuments = props.totalDocuments ?? documents.length;
  const totalMemories = documents.reduce(
    (count, document) => count + (document.memoryEntries?.length ?? 0),
    0
  );
  const error = props.errorMessage ? new Error(props.errorMessage) : null;

  return (
    <McpUseProvider autoSize>
      <div className="memory-graph-shell">
        <div className="memory-graph-header">
          <div className="memory-graph-heading">
            <p className="memory-graph-kicker">Knowledge View</p>
            <h2 className="memory-graph-title">Supermemory Graph</h2>
            <p className="memory-graph-subtitle">
              {error
                ? "Unable to load documents from Supermemory."
                : `Loaded ${documents.length} document${
                    documents.length === 1 ? "" : "s"
                  }${totalDocuments ? ` of ${totalDocuments}` : ""}.`}
            </p>
            {!error && (
              <div className="memory-graph-stats">
                <span className="memory-graph-stat">
                  <strong>{documents.length}</strong> docs
                </span>
                <span className="memory-graph-stat">
                  <strong>{totalMemories}</strong> memories
                </span>
              </div>
            )}
          </div>
          <span className="memory-graph-variant">
            <span className="memory-graph-variant-dot" />
            {variant}
          </span>
        </div>

        <div className="memory-graph-canvas">
          <MemoryGraph
            documents={documents}
            isLoading={isPending}
            error={error}
            variant={variant}
            showSpacesSelector={props.showSpacesSelector}
          />
        </div>
      </div>
    </McpUseProvider>
  );
};

export default MemoryGraphWidget;
