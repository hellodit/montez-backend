import { describe, expect, it } from 'bun:test'
import { copywritingSkills } from '../../../agents/copywriting'

const EXPECTED_NAMES = [
  'write-hooks',
  'write-copy',
  'write-script-shortvid',
  'write-script-longvid',
  'write-script-carousel',
]

describe('copywritingSkills', () => {
  it('exposes exactly the 5 copywriting SOPs as skills', () => {
    expect(copywritingSkills.map((skill) => skill.name).sort()).toEqual(
      [...EXPECTED_NAMES].sort(),
    )
  })

  it.each(EXPECTED_NAMES)('%s has a non-empty description and at least one reference file', (name) => {
    const skill = copywritingSkills.find((s) => s.name === name)
    expect(skill).toBeDefined()
    expect(skill!.description.length).toBeGreaterThan(0)
    expect(skill!.references.length).toBeGreaterThan(0)
  })

  it.each(EXPECTED_NAMES)('%s instructions do not inline the knowledge reference', (name) => {
    const skill = copywritingSkills.find((s) => s.name === name)
    expect(skill!.instructions).not.toContain('## Knowledge Reference')
  })
})
