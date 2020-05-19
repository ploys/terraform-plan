import * as path from 'path'

import * as core from '@actions/core'
import * as exec from '@actions/exec'

async function run(): Promise<void> {
  try {
    const dir = process.env.GITHUB_WORKSPACE as string
    const cwd = path.resolve(dir, core.getInput('path'))
    const out = path.resolve(cwd, core.getInput('plan') || 'terraform-plan.tfplan')

    await exec.exec('terraform', ['plan', '-input=false', `-out=${out}`], { cwd })

    core.setOutput('plan', path.resolve(out))
  } catch (error) {
    core.error(error)
    core.setFailed(error.message)
  }
}

run()
