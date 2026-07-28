const fs = require('fs');
const path = require('path');

class SkillLoaderService {
  constructor() {
    this.skillsDir = path.join(__dirname, '../skills');
  }

  /**
   * @param {string} skillName 
   * @returns {string} The markdown content of the skill
   */
  getSkillContent(skillName) {
    try {
      const skillPath = path.join(this.skillsDir, skillName, 'SKILL.md');
      if (fs.existsSync(skillPath)) {
        return fs.readFileSync(skillPath, 'utf8');
      }
      return '';
    } catch (error) {
      console.error(`Error loading skill ${skillName}:`, error);
      return '';
    }
  }

  /**
   * @param {string[]} skillNames 
   * @returns {string}
   */
  loadSkillsForAgent(skillNames) {
    let combinedContext = '\n--- REQUIRED METHODOLOGIES & SKILLS ---\n';
    skillNames.forEach(skill => {
      const content = this.getSkillContent(skill);
      if (content) {
        combinedContext += `\n# Skill: ${skill}\n${content}\n`;
      }
    });
    return combinedContext;
  }
}

module.exports = new SkillLoaderService();
