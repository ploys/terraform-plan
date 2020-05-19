import * as path from 'path'

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
  } catch (error) {
    core.error(error)
    core.setFailed(error.message)
  }
}

run()
