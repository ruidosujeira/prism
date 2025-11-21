import { z } from 'zod'

const SizeInfoSchema = z.object({
  rawBytes: z.number().nonnegative(),
  gzipBytes: z.number().nonnegative(),
})

const FileNodeBaseSchema = z.object({
  path: z.string(),
  relativePath: z.string(),
  depth: z.number().int().nonnegative(),
  size: SizeInfoSchema,
})

const FileLeafSchema = FileNodeBaseSchema.extend({
  type: z.literal('file'),
  extension: z.string(),
  executable: z.boolean().default(false),
})

export type FileLeafNode = z.infer<typeof FileLeafSchema>
export type DirectoryNode = z.infer<typeof FileNodeBaseSchema> & {
  type: 'directory'
  children: FileTreeNode[]
  extension?: undefined
}
export type FileTreeNode = FileLeafNode | DirectoryNode

const DirectoryNodeSchema: z.ZodType<DirectoryNode> = z.lazy(() =>
  FileNodeBaseSchema.extend({
    type: z.literal('directory'),
    children: z.array(FileTreeNodeSchema),
    extension: z.undefined().optional(),
  }),
)

export const FileTreeNodeSchema: z.ZodType<FileTreeNode> = z.lazy(() =>
  z.union([FileLeafSchema, DirectoryNodeSchema]),
)

export const FileTreeSchema = z.array(FileTreeNodeSchema)
