import { z } from "zod";

const memoryEntrySchema = z.object({
  id: z.string(),
  documentId: z.string().optional(),
  content: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  type: z.string().nullable().optional(),
  createdAt: z.union([z.string(), z.date()]).optional(),
  updatedAt: z.union([z.string(), z.date()]).optional(),
  spaceContainerTag: z.string().nullable().optional(),
  relation: z.string().nullable().optional(),
  isLatest: z.boolean().optional(),
  spaceId: z.string().nullable().optional(),
});

const documentWithMemoriesSchema = z.object({
  id: z.string(),
  customId: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  source: z.string().nullable().optional(),
  type: z.string().nullable().optional(),
  status: z.string().optional(),
  createdAt: z.union([z.string(), z.date()]).optional(),
  updatedAt: z.union([z.string(), z.date()]).optional(),
  memoryEntries: z.array(memoryEntrySchema).optional().default([]),
});

export const propSchema = z.object({
  documents: z.array(documentWithMemoriesSchema),
  variant: z.enum(["console", "consumer"]).optional(),
  showSpacesSelector: z.boolean().optional(),
  errorMessage: z.string().optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().optional(),
  totalDocuments: z.number().int().nonnegative().optional(),
});

export type MemoryGraphWidgetProps = z.infer<typeof propSchema>;
