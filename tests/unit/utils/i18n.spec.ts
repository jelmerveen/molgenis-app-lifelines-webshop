const path = require('path')
const util = require('util')

const glob = util.promisify(require('glob'))
const readFile = util.promisify(require('fs').readFile)

const i18nSchema = require('../../../i18n.schemas.js')

// Detectable formats are:
// - $t('some key')
// - $t('some key', {some: var})
const translationMatch = /\$t\([\s]*'([a-zA-Z0-9_\s{}.,!?%\-:;"]+)'[(),)?]/g
// Tags that are in use, but not in the detectable format.
// Please try to keep this list empty.
const translationUnmatchable = [
  'ui-form:form_file_browse',
  'ui-form:form_file_change',
  'lifelines-webshop-sidebar-gwas-info',
  'lifelines-webshop-sidebar-gwas-link',
  'lifelines-webshop-sidebar-ugli-info',
  'lifelines-webshop-sidebar-ugli-link',
  'lifelines-webshop-sidebar-deep-info',
  'lifelines-webshop-sidebar-deep-link',
  'lifelines-webshop-sidebar-dag3-info',
  'lifelines-webshop-sidebar-dag3-link',
  'lifelines-webshop-sidebar-child-info',
  'lifelines-webshop-sidebar-child-link',
  'lifelines-webshop-sidebar-adult-info',
  'lifelines-webshop-sidebar-adult-link',
  'lifelines-webshop-sidebar-elderly-info',
  'lifelines-webshop-sidebar-elderly-link'
]

// Keep unique translation tags as key here.
let translations:any = {}

beforeAll(async function getTranslations () {
  const unescape = /\\/g
  const baseDir = path.join(__dirname, '../../../')
  let globPattern = `{${path.join(baseDir, 'src', '**', '{*.js,*.ts,*.vue}')}`
  // Relevant npm packages that may contain i18n tags.
  const i18nModules = [
    '@molgenis/molgenis-ui-context',
    '@molgenis/molgenis-ui-form'
  ]
  for (const i18nModule of i18nModules) {
    globPattern += `,${path.join(baseDir, 'node_modules', i18nModule, 'src', '**', '{*.js,*.ts,*.vue}')}`
  }

  globPattern += '}'

  const files = await glob(globPattern)

  for (const filename of files) {
    const data = (await readFile(filename)).toString('utf8')
    data.replace(translationMatch, function (pattern:any, $t:string) {
      $t = $t.replace(unescape, '')
      translations[$t] = 1
    })
  }

  translations = Object.keys(translations).concat(translationUnmatchable)
})

describe('i18n schema is up-to-date', () => {
  test('missing translation tags in i18n schema', async () => {
    const missing = []
    for (const translation of translations) {
      if (!(translation in i18nSchema.en)) {
        missing.push(translation)
      }
    }

    expect(missing).toEqual([])
  })

  test('redundant translations in i18n schema', async () => {
    const redundant = []
    for (let translationKey of Object.keys(i18nSchema.en)) {
      if (translationKey.endsWith('_plural')) {
        expect(i18nSchema.en[translationKey]).toContain('{{count}}')
        const singularKey = translationKey.replace('_plural', '')
        expect(i18nSchema.en[singularKey]).toContain('{{count}}')
        translationKey = singularKey
      }

      if (!(translations.includes(translationKey))) {
        redundant.push(translationKey)
      }
    }

    expect(redundant).toEqual([])
  })
})
