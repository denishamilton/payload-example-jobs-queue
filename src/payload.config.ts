// storage-adapter-import-placeholder
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig, TaskConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp, { queue } from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { title } from 'process'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },

  jobs: {
    access: {
      run: () => true,
    },
    addParentToTaskLog: true,
    autoRun: [
      {
        queue: 'default',
        cron: '* * * * *',
        limit: 2,
      },
    ],
    tasks: [
      {
        slug: 'transcribeAudio',
        retries: 2,
        inputSchema: [
          {
            name: 'audioNodeId',
            type: 'number',
            required: true,
          },
        ],
        outputSchema: [],
        handler: transcribrAudioHandler,
        onSuccess: async () => {
          console.log('success')
        },
        label: 'Transcribe Audio',
      },
    ],
  },

  collections: [
    Users,
    Media,

    {
      slug: 'audioNotes',
      fields: [
        {
          name: 'transcriptionError',
          type: 'text',
        },
      ],
      hooks: {
        afterChange: [
          async ({ doc, req: { payload } }) => {
            console.log('Queueing task for doc: ', doc.id)
            const job = await payload.jobs.queue({
              task: 'transcribeAudio',
              input: { audioNoteId: doc.id },
              queue: 'default',
            })
            console.log('Job queued: ', job.id)
          },
        ],
      },
    },
  ],

  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URI || '',
    },
  }),
  sharp,
  plugins: [
    payloadCloudPlugin(),
    // storage-adapter-placeholder
  ],
})
