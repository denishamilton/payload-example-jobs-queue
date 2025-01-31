// storage-adapter-import-placeholder
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { TaskGeneratePDF } from './payload-types'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Функция-обработчик для генерации PDF
async function generatePDFHandler({ input }: TaskGeneratePDF) {
  const { orderId } = input // Извлечение идентификатора заказа
  console.log(`Генерация PDF для заказа с ID: ${orderId}`)

  // Симуляция генерации PDF
  console.log(`Файл успешно сгенерирован для заказа с ID: ${orderId}`)

  // Логика сохранения результата (например, статус генерации) может быть добавлена здесь.
}

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
        cron: '* * * * *', // Запуск задач каждую минуту
        limit: 2, // Обработка двух задач одновременно
      },
    ],
    tasks: [
      {
        slug: 'generatePDF', // Уникальный идентификатор задачи
        retries: 2, // Количество попыток в случае ошибки
        inputSchema: [
          {
            name: 'orderId', // Ожидаемый входной параметр
            type: 'number', // Тип данных параметра
            required: true, // Параметр обязателен
          },
        ],
        outputSchema: [], // Пока без схемы результата
        handler: generatePDFHandler, // Обработчик задачи
        onSuccess: async () => {
          console.log('PDF успешно сгенерирован!')
        },
        label: 'Generate PDF', // Метка для UI
      },
    ],
  },

  collections: [
    Users,
    Media,

    {
      slug: 'orders',
      fields: [
        {
          name: 'pdfGenerated', // Поле для хранения информации о статусе генерации PDF
          type: 'checkbox',
          defaultValue: false, // По умолчанию PDF еще не сгенерирован
        },
      ],
      hooks: {
        afterChange: [
          async ({ doc, req: { payload } }) => {
            console.log('Постановка задачи в очередь для заказа: ', doc.id)
            const job = await payload.jobs.queue({
              task: 'generatePDF', // Указание задачи для генерации PDF
              input: { orderId: doc.id }, // Передача ID заказа в задачу
              queue: 'default', // Указание очереди
            })
            console.log('Задача поставлена в очередь: ', job.id)
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
