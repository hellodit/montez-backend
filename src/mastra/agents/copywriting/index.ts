import { writeHooksSkill } from './hooks-writer'
import { writeCopySkill } from './copy-writer'
import { writeScriptShortvidSkill } from './shortvid-script-writer'
import { writeScriptLongvidSkill } from './longvid-script-writer'
import { writeScriptCarouselSkill } from './carousel-script-writer'

export const copywritingSkills = [
  writeHooksSkill,
  writeCopySkill,
  writeScriptShortvidSkill,
  writeScriptLongvidSkill,
  writeScriptCarouselSkill,
]
