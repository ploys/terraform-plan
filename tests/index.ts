import * as child from 'child_process'
import * as crypto from 'crypto'
import * as fs from 'fs'
import * as path from 'path'
import * as util from 'util'

import * as tmp from 'tmp-promise'

const exec = util.promisify(child.exec)

describe('Terraform Plan', () => {
  const sha = crypto.createHash('sha1').digest('hex')

  beforeAll(() => {
    process.env.GITHUB_ACTION = 'ployssha'
    process.env.GITHUB_ACTOR = 'ploys'
    process.env.GITHUB_EVENT_NAME = 'deployment'
    process.env.GITHUB_EVENT_PATH = path.join(__dirname, 'fixtures/payload.json')
    process.env.GITHUB_REF = sha
    process.env.GITHUB_REPOSITORY = 'ploys/tests'
    process.env.GITHUB_SHA = sha
    process.env.GITHUB_WORKFLOW = 'cd'

    process.env.INPUT_PREVIEW = 'color'
  })

  beforeEach(() => {
    jest.resetModules()
  })

  test('creates a terraform plan', async done => {
    const { path: cwd, cleanup } = await tmp.dir({ unsafeCleanup: true })

    const tfSrcFile = path.join(__dirname, 'fixtures/terraform.tf')
    const tfDstFile = path.join(cwd, 'terraform.tf')
    const planFile = path.join(cwd, 'tfplan')

    process.env.GITHUB_WORKSPACE = cwd

    try {
      await fs.promises.copyFile(tfSrcFile, tfDstFile)
      await exec('terraform init', { cwd })
      await import('../src')
      await new Promise(resolve => setTimeout(resolve, 5000))
      expect(fs.existsSync(planFile)).toBe(true)
      await cleanup()
    } catch (err) {
      await cleanup()
      throw err
    }

    done()
  }, 20000)

  test('creates a terraform plan with relative paths', async done => {
    const { path: cwd, cleanup } = await tmp.dir({ unsafeCleanup: true })

    const tfSrcFile = path.join(__dirname, 'fixtures/terraform.tf')
    const tfDstFile = path.join(cwd, 'terraform.tf')
    const planFile = path.join(cwd, 'plan.txt')

    process.env.GITHUB_WORKSPACE = cwd
    process.env.INPUT_DIR = '.'
    process.env.INPUT_OUT = 'plan.txt'

    try {
      await fs.promises.copyFile(tfSrcFile, tfDstFile)
      await exec('terraform init', { cwd })
      await import('../src')
      await new Promise(resolve => setTimeout(resolve, 5000))
      expect(fs.existsSync(planFile)).toBe(true)
      await cleanup()
    } catch (err) {
      await cleanup()
      throw err
    }

    done()
  }, 20000)

  test('creates a terraform plan with absolute paths', async done => {
    const { path: cwd, cleanup } = await tmp.dir({ unsafeCleanup: true })

    const tfSrcFile = path.join(__dirname, 'fixtures/terraform.tf')
    const tfDstFile = path.join(cwd, 'terraform.tf')
    const planFile = path.join(cwd, 'plan.txt')

    process.env.GITHUB_WORKSPACE = cwd
    process.env.INPUT_DIR = cwd
    process.env.INPUT_OUT = planFile

    try {
      await fs.promises.copyFile(tfSrcFile, tfDstFile)
      await exec('terraform init', { cwd })
      await import('../src')
      await new Promise(resolve => setTimeout(resolve, 5000))
      expect(fs.existsSync(planFile)).toBe(true)
      await cleanup()
    } catch (err) {
      await cleanup()
      throw err
    }

    done()
  }, 20000)
})
