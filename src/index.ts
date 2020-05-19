import * as path from 'path'

import * as core from '@actions/core'
import * as exec from '@actions/exec'

async function run(): Promise<void> {
  try {
    const cwd = process.env.GITHUB_WORKSPACE as string

    const dir = path.resolve(cwd, core.getInput('dir'))
    const out = path.resolve(dir, core.getInput('out') || 'tfplan')

    await exec.exec('terraform', ['plan', '-input=false', `-out=${out}`], {
      cwd: dir,
    })

    core.setOutput('out', out)

    if (core.getInput('preview') === 'true') {
      let preview = ''

      await exec.exec('terraform', ['show', '-no-color', out], {
        cwd: dir,
        listeners: {
          stdout: (data: Buffer) => {
            preview += data.toString()
          },
        },
      })

      core.setOutput('preview', `# Plan\n\n\`\`\`\n${preview.trim()}\n\`\`\``)
    }
  } catch (error) {
    core.error(error)
    core.setFailed(error.message)
  }
}

run()
