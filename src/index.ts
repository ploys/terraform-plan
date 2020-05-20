import * as crypto from 'crypto'
import * as fs from 'fs'
import * as path from 'path'

import * as artifact from '@actions/artifact'
import * as core from '@actions/core'
import * as exec from '@actions/exec'

import AnsiUp from 'ansi_up'

async function run(): Promise<void> {
  try {
    const cwd = process.env.GITHUB_WORKSPACE as string

    const dir = path.resolve(cwd, core.getInput('dir'))
    const out = path.resolve(dir, core.getInput('out') || 'tfplan')

    await exec.exec('terraform', ['plan', '-input=false', `-out=${out}`], {
      cwd: dir,
    })

    core.setOutput('out', out)

    const preview = core.getInput('preview')

    if (preview && preview !== 'off') {
      const args = preview === 'color' ? ['show', out] : ['show', '-no-color', out]

      let markup = ''

      await exec.exec('terraform', args, {
        cwd: dir,
        listeners: {
          stdout: (data: Buffer) => {
            markup += data.toString()
          },
        },
      })

      markup = markup.trim()

      if (preview === 'color') {
        const ansi = new AnsiUp()

        markup = ansi.ansi_to_html(markup)
      }

      markup = `# Plan\n\n<pre>\n${markup}\n</pre>`

      core.setOutput('preview', markup)
    }

    const encrypt = core.getInput('encrypt')

    if (encrypt && (encrypt === 'true' || encrypt === 'on')) {
      const secret = process.env.SECRET

      if (secret) {
        const key = Buffer.alloc(32, secret, 'utf-8')
        const iv = crypto.randomBytes(16)
        const buffer = await fs.promises.readFile(out)
        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
        const result = Buffer.concat([cipher.update(buffer), cipher.final()])
        const output = `${iv.toString('hex')}:${result.toString('hex')}`

        await fs.promises.writeFile(out, output)
      } else {
        throw new Error("Expected environment variable 'SECRET' with utf-8 encoding")
      }
    }

    const art = core.getInput('artifact')

    if (art && (art === 'true' || art === 'on')) {
      const client = artifact.create()
      const root = path.dirname(out)
      const res = await client.uploadArtifact('tfplan', [out], root)

      core.setOutput('artifact', res.artifactName)
    }
  } catch (error) {
    core.error(error)
    core.setFailed(error.message)
  }
}

run()
