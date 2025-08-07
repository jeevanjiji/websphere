// backend/utils/skillExtractor.js

/**
 * Comprehensive skill extraction utility for freelancer bios
 * Extracts technical skills, programming languages, frameworks, and tools
 */

// Comprehensive skill database organized by categories
const SKILL_DATABASE = {
  // Programming Languages
  programming: [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'C', 'PHP', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin', 'Scala', 'R', 'MATLAB', 'Perl', 'Lua', 'Dart', 'Elixir', 'Haskell', 'Clojure', 'F#', 'VB.NET', 'Objective-C', 'Assembly', 'COBOL', 'Fortran', 'Pascal', 'Delphi'
  ],
  
  // Frontend Technologies
  frontend: [
    'React', 'Vue.js', 'Angular', 'Svelte', 'Next.js', 'Nuxt.js', 'Gatsby', 'HTML', 'CSS', 'SCSS', 'SASS', 'Less', 'Stylus', 'Bootstrap', 'Tailwind CSS', 'Material-UI', 'Ant Design', 'Chakra UI', 'Bulma', 'Foundation', 'Semantic UI', 'jQuery', 'Alpine.js', 'Stimulus', 'Ember.js', 'Backbone.js', 'Knockout.js', 'Polymer', 'Lit', 'Stencil', 'Web Components'
  ],
  
  // Backend Technologies
  backend: [
    'Node.js', 'Express.js', 'Django', 'Flask', 'FastAPI', 'Spring Boot', 'Spring', 'Laravel', 'Symfony', 'CodeIgniter', 'Ruby on Rails', 'Sinatra', 'ASP.NET', '.NET Core', 'Gin', 'Echo', 'Fiber', 'Actix', 'Rocket', 'Warp', 'Koa.js', 'Hapi.js', 'Nest.js', 'Adonis.js', 'Sails.js', 'Meteor.js', 'Strapi', 'Prisma', 'GraphQL', 'Apollo', 'Relay'
  ],
  
  // Databases
  databases: [
    'MySQL', 'PostgreSQL', 'MongoDB', 'SQLite', 'Redis', 'Elasticsearch', 'Cassandra', 'DynamoDB', 'Firebase', 'Supabase', 'Oracle', 'SQL Server', 'MariaDB', 'CouchDB', 'Neo4j', 'InfluxDB', 'TimescaleDB', 'ClickHouse', 'Amazon RDS', 'Google Cloud SQL', 'Azure SQL', 'PlanetScale', 'Neon', 'Xata'
  ],
  
  // Cloud & DevOps
  cloud: [
    'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'Jenkins', 'GitLab CI', 'GitHub Actions', 'CircleCI', 'Travis CI', 'Terraform', 'Ansible', 'Chef', 'Puppet', 'Vagrant', 'Nginx', 'Apache', 'Linux', 'Ubuntu', 'CentOS', 'RHEL', 'Debian', 'Alpine', 'Heroku', 'Vercel', 'Netlify', 'DigitalOcean', 'Linode', 'Vultr'
  ],
  
  // Mobile Development
  mobile: [
    'React Native', 'Flutter', 'Ionic', 'Xamarin', 'Cordova', 'PhoneGap', 'NativeScript', 'Unity', 'Android', 'iOS', 'Swift UI', 'Jetpack Compose', 'Kotlin Multiplatform', 'Expo', 'Capacitor'
  ],
  
  // Design & UI/UX
  design: [
    'Figma', 'Adobe XD', 'Sketch', 'InVision', 'Photoshop', 'Illustrator', 'After Effects', 'Premiere Pro', 'Canva', 'Framer', 'Principle', 'ProtoPie', 'Zeplin', 'Marvel', 'Balsamiq', 'Wireframing', 'Prototyping', 'User Research', 'Usability Testing', 'Information Architecture'
  ],
  
  // Data Science & AI
  datascience: [
    'TensorFlow', 'PyTorch', 'Scikit-learn', 'Pandas', 'NumPy', 'Matplotlib', 'Seaborn', 'Plotly', 'Jupyter', 'Anaconda', 'Keras', 'OpenCV', 'NLTK', 'spaCy', 'Hugging Face', 'Apache Spark', 'Hadoop', 'Tableau', 'Power BI', 'D3.js', 'Machine Learning', 'Deep Learning', 'Natural Language Processing', 'Computer Vision', 'Data Analysis', 'Data Visualization', 'Statistical Analysis'
  ],
  
  // Testing
  testing: [
    'Jest', 'Mocha', 'Chai', 'Jasmine', 'Cypress', 'Selenium', 'Playwright', 'Puppeteer', 'TestCafe', 'WebdriverIO', 'Karma', 'Protractor', 'Enzyme', 'React Testing Library', 'Vue Test Utils', 'PyTest', 'unittest', 'JUnit', 'TestNG', 'Mockito', 'Sinon', 'MSW', 'Postman', 'Insomnia', 'Unit Testing', 'Integration Testing', 'E2E Testing', 'API Testing', 'Performance Testing'
  ],
  
  // Version Control & Collaboration
  tools: [
    'Git', 'GitHub', 'GitLab', 'Bitbucket', 'SVN', 'Mercurial', 'Jira', 'Confluence', 'Trello', 'Asana', 'Notion', 'Slack', 'Discord', 'Microsoft Teams', 'Zoom', 'VS Code', 'IntelliJ IDEA', 'WebStorm', 'PyCharm', 'Sublime Text', 'Atom', 'Vim', 'Emacs'
  ],
  
  // Methodologies & Concepts
  methodologies: [
    'Agile', 'Scrum', 'Kanban', 'DevOps', 'CI/CD', 'TDD', 'BDD', 'DDD', 'SOLID', 'Clean Code', 'Design Patterns', 'Microservices', 'Serverless', 'JAMstack', 'Progressive Web Apps', 'Single Page Applications', 'Responsive Design', 'Mobile First', 'Accessibility', 'SEO', 'Performance Optimization', 'Security', 'Authentication', 'Authorization', 'OAuth', 'JWT', 'REST API', 'GraphQL API', 'WebSockets', 'Real-time Applications'
  ]
};

// Create a flat array of all skills for easier searching
const ALL_SKILLS = Object.values(SKILL_DATABASE).flat();

// Create a map for case-insensitive matching
const SKILL_MAP = new Map();
ALL_SKILLS.forEach(skill => {
  SKILL_MAP.set(skill.toLowerCase(), skill);
});

// Common skill aliases and variations
const SKILL_ALIASES = {
  'js': 'JavaScript',
  'ts': 'TypeScript',
  'py': 'Python',
  'reactjs': 'React',
  'vuejs': 'Vue.js',
  'angularjs': 'Angular',
  'nodejs': 'Node.js',
  'expressjs': 'Express.js',
  'nextjs': 'Next.js',
  'nuxtjs': 'Nuxt.js',
  'tailwindcss': 'Tailwind CSS',
  'materialui': 'Material-UI',
  'mui': 'Material-UI',
  'postgresql': 'PostgreSQL',
  'postgres': 'PostgreSQL',
  'mongo': 'MongoDB',
  'aws': 'AWS',
  'gcp': 'Google Cloud',
  'k8s': 'Kubernetes',
  'tf': 'TensorFlow',
  'sklearn': 'Scikit-learn',
  'cv': 'Computer Vision',
  'nlp': 'Natural Language Processing',
  'ml': 'Machine Learning',
  'dl': 'Deep Learning',
  'ai': 'Artificial Intelligence',
  'ui': 'UI Design',
  'ux': 'UX Design',
  'frontend': 'Frontend Development',
  'backend': 'Backend Development',
  'fullstack': 'Full Stack Development',
  'devops': 'DevOps',
  'cicd': 'CI/CD',
  'api': 'API Development',
  'rest': 'REST API',
  'graphql': 'GraphQL API',
  'spa': 'Single Page Applications',
  'pwa': 'Progressive Web Apps'
};

/**
 * Extract skills from bio text using pattern matching and keyword detection
 * @param {string} bioText - The freelancer's bio text
 * @returns {Array} - Array of detected skills
 */
function extractSkillsFromBio(bioText) {
  if (!bioText || typeof bioText !== 'string') {
    return [];
  }

  const detectedSkills = new Set();
  const normalizedBio = bioText.toLowerCase();

  // Direct skill matching
  SKILL_MAP.forEach((originalSkill, lowerSkill) => {
    // Use word boundaries to avoid partial matches
    const regex = new RegExp(`\\b${lowerSkill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    if (regex.test(normalizedBio)) {
      detectedSkills.add(originalSkill);
    }
  });

  // Alias matching
  Object.entries(SKILL_ALIASES).forEach(([alias, skill]) => {
    const regex = new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    if (regex.test(normalizedBio)) {
      detectedSkills.add(skill);
    }
  });

  // Pattern-based detection for common phrases
  const patterns = [
    { pattern: /\b(?:experienced|expert|proficient|skilled)\s+(?:in|with)\s+([^,.!?]+)/gi, group: 1 },
    { pattern: /\b(?:using|with|including)\s+([^,.!?]+)/gi, group: 1 },
    { pattern: /\b(?:technologies|tools|frameworks|languages):\s*([^,.!?]+)/gi, group: 1 },
    { pattern: /\b(?:stack|tech stack):\s*([^,.!?]+)/gi, group: 1 }
  ];

  patterns.forEach(({ pattern, group }) => {
    let match;
    while ((match = pattern.exec(bioText)) !== null) {
      const skillText = match[group].trim();
      extractSkillsFromText(skillText).forEach(skill => detectedSkills.add(skill));
    }
  });

  return Array.from(detectedSkills).slice(0, 20); // Limit to 20 skills
}

/**
 * Extract skills from a specific text fragment
 * @param {string} text - Text fragment to analyze
 * @returns {Array} - Array of detected skills
 */
function extractSkillsFromText(text) {
  const skills = new Set();
  const normalizedText = text.toLowerCase();

  // Split by common separators
  const fragments = text.split(/[,;|&+\n\r]+/).map(f => f.trim());

  fragments.forEach(fragment => {
    const normalizedFragment = fragment.toLowerCase().trim();
    
    // Check if fragment matches any skill
    if (SKILL_MAP.has(normalizedFragment)) {
      skills.add(SKILL_MAP.get(normalizedFragment));
    }
    
    // Check aliases
    if (SKILL_ALIASES[normalizedFragment]) {
      skills.add(SKILL_ALIASES[normalizedFragment]);
    }
    
    // Check for partial matches within the fragment
    SKILL_MAP.forEach((originalSkill, lowerSkill) => {
      if (normalizedFragment.includes(lowerSkill)) {
        skills.add(originalSkill);
      }
    });
  });

  return Array.from(skills);
}

/**
 * Get skill suggestions based on detected skills
 * @param {Array} detectedSkills - Already detected skills
 * @returns {Array} - Suggested related skills
 */
function getSkillSuggestions(detectedSkills) {
  const suggestions = new Set();
  
  // Skill relationship mapping
  const relationships = {
    'React': ['Next.js', 'Redux', 'React Router', 'Material-UI', 'Styled Components'],
    'Vue.js': ['Nuxt.js', 'Vuex', 'Vue Router', 'Vuetify'],
    'Angular': ['TypeScript', 'RxJS', 'Angular Material', 'NgRx'],
    'Node.js': ['Express.js', 'MongoDB', 'PostgreSQL', 'JWT', 'REST API'],
    'Python': ['Django', 'Flask', 'FastAPI', 'Pandas', 'NumPy'],
    'JavaScript': ['TypeScript', 'Node.js', 'React', 'Vue.js', 'Angular'],
    'TypeScript': ['JavaScript', 'React', 'Angular', 'Node.js'],
    'MongoDB': ['Node.js', 'Express.js', 'Mongoose'],
    'PostgreSQL': ['SQL', 'Node.js', 'Django', 'Rails'],
    'AWS': ['Docker', 'Kubernetes', 'Terraform', 'CI/CD'],
    'Docker': ['Kubernetes', 'AWS', 'DevOps', 'CI/CD']
  };

  detectedSkills.forEach(skill => {
    if (relationships[skill]) {
      relationships[skill].forEach(related => {
        if (!detectedSkills.includes(related)) {
          suggestions.add(related);
        }
      });
    }
  });

  return Array.from(suggestions).slice(0, 10); // Limit suggestions
}

module.exports = {
  extractSkillsFromBio,
  getSkillSuggestions,
  SKILL_DATABASE,
  ALL_SKILLS
};
