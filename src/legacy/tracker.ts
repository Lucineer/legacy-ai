// Legacy AI — Family Historian Domain Models & Seed Data
// After years of interviews, this repo becomes an irreplaceable family heirloom.

export interface Person {
  id: string;
  name: string;
  birthYear?: number;
  deathYear?: number;
  relationships: string[];
  occupation?: string;
  hometown?: string;
  photoDescription?: string;
  bio?: string;
}

export interface Story {
  id: string;
  title: string;
  narratorId: string;
  dateOfEvent?: string;
  text: string;
  tags: string[];
  emotionalTone: string;
  createdAt: string;
}

export interface TimelineEvent {
  id: string;
  year: number;
  title: string;
  description: string;
  peopleIds: string[];
  type: 'birth' | 'marriage' | 'move' | 'career' | 'milestone' | 'death' | 'education' | 'travel';
}

export interface Recipe {
  id: string;
  name: string;
  originatorId: string;
  ingredients: string[];
  instructions: string;
  backstory: string;
  occasion?: string;
}

export interface PhotoEntry {
  id: string;
  description: string;
  date?: string;
  peopleIds: string[];
  backStory: string;
}

export interface Interview {
  id: string;
  date: string;
  intervieweeId: string;
  topics: string[];
  keyStories: string[];
  duration?: string;
  notes?: string;
}

export interface PromptSuggestion {
  id: string;
  prompt: string;
  category: string;
  priority: number;
}

// ── Family Tree ──────────────────────────────────────────────────────────────

export class FamilyTree {
  private members: Map<string, Person> = new Map();

  add(person: Person): void {
    this.members.set(person.id, person);
  }

  get(id: string): Person | undefined {
    return this.members.get(id);
  }

  getAll(): Person[] {
    return Array.from(this.members.values());
  }

  update(id: string, updates: Partial<Person>): Person | undefined {
    const person = this.members.get(id);
    if (!person) return undefined;
    Object.assign(person, updates);
    return person;
  }

  count(): number {
    return this.members.size;
  }
}

// ── Story Archive ────────────────────────────────────────────────────────────

export class StoryArchive {
  private stories: Map<string, Story> = new Map();

  add(story: Story): void {
    this.stories.set(story.id, story);
  }

  get(id: string): Story | undefined {
    return this.stories.get(id);
  }

  getAll(): Story[] {
    return Array.from(this.stories.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  count(): number {
    return this.stories.size;
  }

  findByNarrator(narratorId: string): Story[] {
    return this.getAll().filter((s) => s.narratorId === narratorId);
  }

  findByTag(tag: string): Story[] {
    return this.getAll().filter((s) => s.tags.includes(tag));
  }
}

// ── Timeline Builder ─────────────────────────────────────────────────────────

export class TimelineBuilder {
  private events: Map<string, TimelineEvent> = new Map();

  add(event: TimelineEvent): void {
    this.events.set(event.id, event);
  }

  getAll(): TimelineEvent[] {
    return Array.from(this.events.values()).sort((a, b) => a.year - b.year);
  }

  getRange(): string {
    const events = this.getAll();
    if (events.length === 0) return '';
    return `${events[0].year}–${events[events.length - 1].year}`;
  }

  count(): number {
    return this.events.size;
  }
}

// ── Recipe Keeper ─────────────────────────────────────────────────────────────

export class RecipeKeeper {
  private recipes: Map<string, Recipe> = new Map();

  add(recipe: Recipe): void {
    this.recipes.set(recipe.id, recipe);
  }

  getAll(): Recipe[] {
    return Array.from(this.recipes.values());
  }

  count(): number {
    return this.recipes.size;
  }
}

// ── Photo Archive ─────────────────────────────────────────────────────────────

export class PhotoArchive {
  private photos: Map<string, PhotoEntry> = new Map();

  add(photo: PhotoEntry): void {
    this.photos.set(photo.id, photo);
  }

  getAll(): PhotoEntry[] {
    return Array.from(this.photos.values());
  }

  count(): number {
    return this.photos.size;
  }
}

// ── Interview Manager ─────────────────────────────────────────────────────────

export class InterviewManager {
  private interviews: Map<string, Interview> = new Map();

  add(interview: Interview): void {
    this.interviews.set(interview.id, interview);
  }

  getAll(): Interview[] {
    return Array.from(this.interviews.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  count(): number {
    return this.interviews.size;
  }

  findByInterviewee(personId: string): Interview[] {
    return this.getAll().filter((i) => i.intervieweeId === personId);
  }
}

// ── Legacy Insights ──────────────────────────────────────────────────────────

export class LegacyInsights {
  constructor(
    private familyTree: FamilyTree,
    private stories: StoryArchive,
    private timeline: TimelineBuilder,
    private recipes: RecipeKeeper,
    private interviews: InterviewManager
  ) {}

  generatePrompts(): PromptSuggestion[] {
    const prompts: PromptSuggestion[] = [];
    const people = this.familyTree.getAll();
    const allStories = this.stories.getAll();
    const allInterviews = this.interviews.getAll();

    // Find people with no stories
    for (const person of people) {
      const personStories = this.stories.findByNarrator(person.id);
      const mentionedInStories = allStories.filter((s) =>
        s.text.toLowerCase().includes(person.name.toLowerCase().split(' ')[0])
      );

      if (personStories.length === 0 && mentionedInStories.length === 0) {
        prompts.push({
          id: `prompt-no-stories-${person.id}`,
          prompt: `We don't have any stories about ${person.name} yet. What memories come to mind when you think of them?`,
          category: 'gap',
          priority: 10,
        });
      }

      if (personStories.length === 0 && mentionedInStories.length > 0) {
        prompts.push({
          id: `prompt-mentioned-${person.id}`,
          prompt: `${person.name} has been mentioned in ${mentionedInStories.length} stories but hasn't been the focus. What was a typical day like for them?`,
          category: 'depth',
          priority: 7,
        });
      }
    }

    // Find gaps in timeline (gaps > 10 years)
    const events = this.timeline.getAll();
    for (let i = 1; i < events.length; i++) {
      const gap = events[i].year - events[i - 1].year;
      if (gap > 10) {
        prompts.push({
          id: `prompt-timeline-gap-${i}`,
          prompt: `There's a ${gap}-year gap in the family timeline between ${events[i - 1].year} and ${events[i].year}. What was happening in the family during those years?`,
          category: 'timeline',
          priority: 8,
        });
      }
    }

    // People not yet interviewed
    const interviewedIds = new Set(allInterviews.map((i) => i.intervieweeId));
    for (const person of people) {
      if (!interviewedIds.has(person.id) && !person.deathYear) {
        prompts.push({
          id: `prompt-interview-${person.id}`,
          prompt: `${person.name} hasn't been interviewed yet. Scheduling a conversation with them could uncover stories no one else knows.`,
          category: 'interview',
          priority: 6,
        });
      }
    }

    // Emotional range — look for untapped tones
    const tones = new Set(allStories.map((s) => s.emotionalTone));
    const missingTones: string[] = [];
    for (const expected of ['joyful', 'bittersweet', 'funny', 'triumphant', 'reflective']) {
      if (!tones.has(expected)) missingTones.push(expected);
    }
    if (missingTones.length > 0) {
      prompts.push({
        id: 'prompt-emotional-range',
        prompt: `The archive is missing ${missingTones.join(', ')} stories. Can you think of a memory that fits one of those feelings?`,
        category: 'depth',
        priority: 5,
      });
    }

    // Recipe gaps
    if (this.recipes.count() < 5) {
      prompts.push({
        id: 'prompt-recipes',
        prompt: `Only ${this.recipes.count()} recipes have been captured so far. What dish always reminds you of family gatherings?`,
        category: 'recipes',
        priority: 4,
      });
    }

    return prompts.sort((a, b) => b.priority - a.priority);
  }

  getGaps(): string[] {
    const prompts = this.generatePrompts();
    return prompts.filter((p) => p.category === 'gap' || p.category === 'timeline').map((p) => p.prompt);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// SEED DATA — The Morrison Family
// ══════════════════════════════════════════════════════════════════════════════

export function seedDatabase(): {
  familyTree: FamilyTree;
  stories: StoryArchive;
  timeline: TimelineBuilder;
  recipes: RecipeKeeper;
  photos: PhotoArchive;
  interviews: InterviewManager;
  insights: LegacyInsights;
} {
  const familyTree = new FamilyTree();
  const stories = new StoryArchive();
  const timeline = new TimelineBuilder();
  const recipes = new RecipeKeeper();
  const photos = new PhotoArchive();
  const interviews = new InterviewManager();

  // ── Grandparents ───────────────────────────────────────────────────────

  familyTree.add({
    id: 'harold-morrison',
    name: 'Harold Morrison',
    birthYear: 1928,
    deathYear: 2015,
    relationships: ['Husband of Eleanor Morrison', 'Father of David and Sarah'],
    occupation: 'Railroad engineer, Pennsylvania Railroad then Amtrak',
    hometown: 'Altoona, Pennsylvania',
    photoDescription: 'Tall, broad-shouldered man with kind eyes, always wearing suspenders and a slight smile. Silver hair combed neatly to one side.',
    bio: 'Harold spent 42 years working the rails, first with Pennsylvania Railroad and later Amtrak. He was known for his steady hands and the way he could calm any crisis with a quiet word and a cup of coffee.',
  });

  familyTree.add({
    id: 'eleanor-morrison',
    name: 'Eleanor Morrison (née Walsh)',
    birthYear: 1932,
    deathYear: 2020,
    relationships: ['Wife of Harold Morrison', 'Mother of David and Sarah', 'Sister of Thomas Walsh'],
    occupation: 'School teacher, Altoona Elementary District',
    hometown: 'Johnstown, Pennsylvania',
    photoDescription: 'Small woman with bright blue eyes and white hair pinned in a loose bun. Laugh lines around her eyes that deepened whenever she smiled, which was often.',
    bio: 'Eleanor taught third grade for 35 years and never forgot a single student. She kept a garden that was the envy of the neighborhood and wrote poems she never showed anyone until her granddaughter found them after she passed.',
  });

  // ── Parents ────────────────────────────────────────────────────────────

  familyTree.add({
    id: 'david-morrison',
    name: 'David Morrison',
    birthYear: 1955,
    relationships: ['Son of Harold and Eleanor', 'Husband of Linda Morrison', 'Father of Ryan, Emma, and Caleb', 'Brother of Sarah'],
    occupation: 'Civil engineer, PennDOT',
    hometown: 'Altoona, Pennsylvania',
    photoDescription: 'Medium build with his father\'s broad shoulders and his mother\'s kind eyes. Wears wire-rimmed glasses and has calloused hands from decades of drawing blueprints.',
    bio: 'David followed his father into a life of infrastructure — not rails, but roads and bridges. He oversaw the renovation of three major highway interchanges in Pennsylvania.',
  });

  familyTree.add({
    id: 'linda-morrison',
    name: 'Linda Morrison (née Chen)',
    birthYear: 1958,
    relationships: ['Wife of David Morrison', 'Mother of Ryan, Emma, and Caleb', 'Daughter of immigrants from Guangzhou'],
    occupation: 'Nurse practitioner, Altoona Regional Hospital',
    hometown: 'Pittsburgh, Pennsylvania',
    photoDescription: 'Warm smile, dark hair streaked with grey, always carrying a tote bag with a novel and knitting needles inside.',
    bio: 'Linda moved to Altoona after nursing school and fell in love with both David and the mountains. She brought her family\'s Cantonese cooking traditions into the Morrison household, creating a beautiful fusion at every holiday table.',
  });

  familyTree.add({
    id: 'sarah-morrison',
    name: 'Sarah Mitchell (née Morrison)',
    birthYear: 1958,
    relationships: ['Daughter of Harold and Eleanor', 'Wife of James Mitchell', 'Mother of Sophie and Olivia', 'Sister of David'],
    occupation: 'Librarian, Altoona Public Library',
    hometown: 'Altoona, Pennsylvania',
    photoDescription: 'Round face with her mother\'s bright blue eyes, hair always in a practical braid. Usually wearing a cardigan and an enigmatic smile, as if she knows a secret.',
    bio: 'Sarah has spent her life surrounded by stories — first as a voracious reader, then as the head librarian who knows every patron by name and reading taste.',
  });

  familyTree.add({
    id: 'james-mitchell',
    name: 'James Mitchell',
    birthYear: 1956,
    relationships: ['Husband of Sarah Mitchell', 'Father of Sophie and Olivia'],
    occupation: 'History professor, Penn State Altoona',
    hometown: 'Philadelphia, Pennsylvania',
    photoDescription: 'Lean, bespectacled, with a neatly trimmed beard going grey. Always has a book under his arm and a faraway look, as if mentally time-traveling.',
    bio: 'James married into the Morrison family and became its unofficial historian long before Legacy AI existed. He has boxes of old photographs and letters in his study that he\'s been meaning to organize for twenty years.',
  });

  // ── Grandchildren ──────────────────────────────────────────────────────

  familyTree.add({
    id: 'ryan-morrison',
    name: 'Ryan Morrison',
    birthYear: 1984,
    relationships: ['Son of David and Linda', 'Grandson of Harold and Eleanor', 'Brother of Emma and Caleb'],
    occupation: 'Software engineer',
    hometown: 'Altoona, Pennsylvania (now lives in Pittsburgh)',
    photoDescription: 'Athletic build, dark hair like his mother, with an easy laugh. Usually in a hoodie and jeans.',
    bio: 'Ryan is the one who started this project — he wanted to capture his grandparents\' stories before they were lost. He remembers his grandfather\'s stories about the railroad and his grandmother\'s secret poems.',
  });

  familyTree.add({
    id: 'emma-morrison',
    name: 'Emma Morrison',
    birthYear: 1987,
    relationships: ['Daughter of David and Linda', 'Granddaughter of Harold and Eleanor', 'Sister of Ryan and Caleb'],
    occupation: 'Pediatrician',
    hometown: 'Altoona, Pennsylvania (now lives in Baltimore)',
    photoDescription: 'Bright eyes behind round glasses, long dark hair, gentle demeanor. Often photographed with a child on her hip or a stethoscope around her neck.',
    bio: 'Emma inherited her mother\'s calling for caregiving. She specializes in pediatric care and volunteers at free clinics on weekends.',
  });

  familyTree.add({
    id: 'caleb-morrison',
    name: 'Caleb Morrison',
    birthYear: 1991,
    relationships: ['Son of David and Linda', 'Grandson of Harold and Eleanor', 'Brother of Ryan and Emma'],
    occupation: 'Chef and restaurant owner',
    hometown: 'Altoona, Pennsylvania (now lives in Philadelphia)',
    photoDescription: 'Stocky like his grandfather Harold, with his mother\'s dark hair and a perpetually flour-dusted apron.',
    bio: 'Caleb grew up in his mother\'s kitchen and his grandmother Eleanor\'s garden. He owns a small restaurant in Philly called "Morrison Table" that serves dishes inspired by both Pennsylvania Dutch and Cantonese traditions.',
  });

  familyTree.add({
    id: 'sophie-mitchell',
    name: 'Sophie Mitchell',
    birthYear: 1986,
    relationships: ['Daughter of James and Sarah', 'Granddaughter of Harold and Eleanor', 'Sister of Olivia'],
    occupation: 'Journalist, Philadelphia Inquirer',
    hometown: 'Altoona, Pennsylvania (now lives in Philadelphia)',
    photoDescription: 'Sharp features, her mother\'s blue eyes, always carrying a reporter\'s notebook. Quick smile, intense gaze.',
    bio: 'Sophie inherited her father\'s love of stories and her Aunt Linda\'s directness. She covers human interest stories and has won two regional press awards.',
  });

  familyTree.add({
    id: 'olivia-mitchell',
    name: 'Olivia Mitchell',
    birthYear: 1990,
    relationships: ['Daughter of James and Sarah', 'Granddaughter of Harold and Eleanor', 'Sister of Sophie'],
    occupation: 'Botanist, Longwood Gardens',
    hometown: 'Altoona, Pennsylvania (now lives in Kennett Square, PA)',
    photoDescription: 'Freckled, sun-kissed, perpetually outdoorsy. Usually photographed among plants, dirt under her fingernails, utterly content.',
    bio: 'Olivia traces her love of plants directly to her grandmother Eleanor\'s garden. She now works at one of the premier botanical gardens in the country.',
  });

  familyTree.add({
    id: 'mia-morrison',
    name: 'Mia Morrison',
    birthYear: 2018,
    relationships: ['Daughter of Ryan Morrison', 'Great-granddaughter of Harold and Eleanor'],
    occupation: 'Preschooler and aspiring dinosaur expert',
    hometown: 'Pittsburgh, Pennsylvania',
    photoDescription: 'Bright-eyed, curly-haired, almost always mid-laugh in photographs. Missing a front tooth in the most recent picture.',
    bio: 'The youngest Morrison. She loves hearing stories about "Grandpa Harold\'s big trains" and wants to be a paleontologist when she grows up. Or a princess. It depends on the day.',
  });

  // ── Stories ────────────────────────────────────────────────────────────

  stories.add({
    id: 'story-railroad-1',
    title: 'The Night the Snow Stopped the World',
    narratorId: 'david-morrison',
    dateOfEvent: '1966',
    text: 'Dad came home late on a January night in \'66. The blizzard of \'66 had shut down the entire rail line between Altoona and Harrisburg. He\'d been stuck in the engine for fourteen hours with nothing but a thermos of Mom\'s coffee and a box of saltines. He walked three miles through chest-high snow to get home. When he opened the back door, the whole kitchen was glowing warm — Mom had kept the stove burning all night. She didn\'t even say anything. Just poured him a bowl of soup and sat across from him while he ate. I was eight years old, watching from the stairs. That\'s when I understood what love looked like. Not words. Just soup and a warm fire when the world outside had frozen solid.',
    tags: ['blizzard', 'railroad', 'Harold', 'Eleanor', 'winter', 'love'],
    emotionalTone: 'warm',
    createdAt: '2025-11-15T10:30:00Z',
  });

  stories.add({
    id: 'story-garden-1',
    title: 'Eleanor\'s Victory Garden',
    narratorId: 'sarah-morrison',
    dateOfEvent: '1960',
    text: 'Mom always said the garden was her therapist. She started it in 1960 — the same year Sputnik\'s shock was still rippling through everything. She planted tomatoes, beans, marigolds to keep the pests away, and a row of sunflowers along the back fence because she said every yard needed something that looked up. By July, it was magnificent. Dad would come home from the yards and find her out there in a wide-brimmed hat, talking to her tomatoes. He never interrupted. He\'d just sit on the porch steps and watch. I think that garden was where Mom kept her poems — not on paper, but in the arrangement of every bed. Each flower was a word she\'d never say out loud.',
    tags: ['garden', 'Eleanor', 'Harold', 'Altoona', '1960s'],
    emotionalTone: 'tender',
    createdAt: '2025-11-18T14:00:00Z',
  });

  stories.add({
    id: 'story-cooking-1',
    title: 'When Linda Brought Wontons to Thanksgiving',
    narratorId: 'david-morrison',
    dateOfEvent: '1979',
    text: 'The first Thanksgiving after I brought Linda home, Mom was — polite. She made her usual spread: turkey, stuffing, cranberry sauce from a can (she always said fresh was overrated), pumpkin pie. And then Linda pulled out a bamboo steamer and made wonton soup from scratch. The whole kitchen smelled like ginger and sesame. Mom watched her fold those dumplings with the precision of a surgeon and something shifted. She didn\'t say anything at dinner, but after Linda went to bed, Mom came into the kitchen where I was drying dishes and said, "She folds those like she\'s folding prayers." That was high praise from Eleanor Morrison. The next year, Mom asked Linda to teach her. They made wontons together every Thanksgiving after that, for thirty-six years.',
    tags: ['Thanksgiving', 'Linda', 'Eleanor', 'cooking', 'wontons', 'family tradition'],
    emotionalTone: 'bittersweet',
    createdAt: '2025-12-01T09:15:00Z',
  });

  stories.add({
    id: 'story-railroad-2',
    title: 'Harold\'s Last Run',
    narratorId: 'ryan-morrison',
    dateOfEvent: '1993',
    text: 'I was nine when Grandpa Harold retired. He took me on his very last run — Altoona to Harrisburg and back. He let me sit in the engineer\'s seat (with him right behind me, hands hovering). The rhythm of the train was like a heartbeat. He pointed out every landmark: the horseshoe curve, the river bend where he once saw a bald eagle, the tunnel where he proposed to Grandma by shouting over the engine noise because he was too nervous to do it in silence. When we pulled back into Altoona, the whole crew was on the platform. Forty-two years, and they gave him a hand-made lantern. He didn\'t cry. But he held that lantern like it was made of glass for the rest of his life.',
    tags: ['railroad', 'Harold', 'Ryan', 'retirement', 'Altoona', 'trains'],
    emotionalTone: 'proud',
    createdAt: '2025-12-05T16:45:00Z',
  });

  stories.add({
    id: 'story-poems-1',
    title: 'The Box Under the Bed',
    narratorId: 'emma-morrison',
    dateOfEvent: '2020',
    text: 'When Grandma Eleanor passed, we cleaned out the house. Mom found a shoebox under the bed — the kind that held dress shoes, the nice kind with the tissue paper still inside. It was full of poems. Hundreds of them, written on napkins, church bulletins, the backs of envelopes, notebook paper yellowed with age. The earliest was dated 1954. The last was written three days before she died. It was about the sunflowers in her garden and how they always knew which way to face. I sat on her bed and read every single one. Grandma — who never raised her voice, who taught third graders their times tables, who made the best apple butter in Blair County — was a poet. And she never told a soul.',
    tags: ['Eleanor', 'poems', 'death', 'discovery', 'garden', 'sunflowers'],
    emotionalTone: 'bittersweet',
    createdAt: '2025-12-10T11:00:00Z',
  });

  stories.add({
    id: 'story-childhood-1',
    title: 'The Halloween Train',
    narratorId: 'caleb-morrison',
    dateOfEvent: '1998',
    text: 'Every Halloween, Grandpa Harold would set up a model train that ran through the living room, under the furniture, around the Christmas tree (which was always up way too early). He\'d decorate each car with little paper ghosts and pumpkins. The engine pulled a flatbed he\'d rigged with a tiny cauldron full of candy. He\'d start the train and we kids had to chase it around the room to get our treats. Ryan was fast, so he\'d grab the good stuff. Emma would just watch and laugh. I was too little to catch it, so Grandpa always stopped the train when it passed me and let me pick first. I think about that train every October. The candy was never the point. The chase was the point. Being together, running, laughing, with the train clicking and Grandma Eleanor yelling "Don\'t knock over the lamp!" — that was the whole thing.',
    tags: ['Halloween', 'Harold', 'Eleanor', 'Ryan', 'Emma', 'Caleb', 'trains', 'childhood'],
    emotionalTone: 'joyful',
    createdAt: '2025-12-15T13:30:00Z',
  });

  stories.add({
    id: 'story-career-1',
    title: 'The Bridge That David Built',
    narratorId: 'sophie-mitchell',
    dateOfEvent: '2005',
    text: 'Uncle David oversaw the renovation of the Beaver Valley Bridge — a massive project that took three years. When it reopened, the whole family drove across it in a caravan. Grandpa Harold was in the passenger seat of Uncle David\'s truck, and I swear I saw him tear up. David said later that his father told him, "I move things along the ground. You move things over it. We\'re not so different." It was the only time I ever saw those two men — both so quiet, so steady — really see each other. The bridge is just concrete and cable to everyone else. To the Morrisons, it\'s a conversation between a father and son written in steel.',
    tags: ['David', 'Harold', 'bridge', 'engineering', 'career', 'family'],
    emotionalTone: 'proud',
    createdAt: '2025-12-20T15:00:00Z',
  });

  stories.add({
    id: 'story-restaurant-1',
    title: 'The First Night at Morrison Table',
    narratorId: 'caleb-morrison',
    dateOfEvent: '2019',
    text: 'Opening night, I served Grandma Eleanor\'s apple butter as a table condiment and Mom\'s wonton soup as the signature starter. I didn\'t tell anyone in the family I was putting those on the menu — I wanted it to be a surprise. When Mom and Dad walked in and saw the menu, Mom didn\'t say anything. She just went to the bathroom and cried for five minutes. Dad found me in the kitchen, shook my hand, and said, "Your grandparents would have eaten here every week." The restaurant got a good review in the Inquirer, but that wasn\'t the review that mattered. The one that mattered was a text from Mom at 2am: "The soup tasted like home. I\'m so proud of you."',
    tags: ['Caleb', 'restaurant', 'cooking', 'Linda', 'wontons', 'Eleanor', 'apple butter'],
    emotionalTone: 'triumphant',
    createdAt: '2026-01-05T19:30:00Z',
  });

  // ── Timeline Events ────────────────────────────────────────────────────

  const timelineEvents: TimelineEvent[] = [
    { id: 'tl-1', year: 1945, title: 'Harold Morrison starts as a railroad apprentice', description: 'At 17, Harold begins working for the Pennsylvania Railroad, cleaning engines and learning the trade.', peopleIds: ['harold-morrison'], type: 'career' },
    { id: 'tl-2', year: 1950, title: 'Harold becomes a licensed engineer', description: 'After five years of apprenticeship, Harold earns his engineer certification.', peopleIds: ['harold-morrison'], type: 'career' },
    { id: 'tl-3', year: 1953, title: 'Harold and Eleanor meet', description: 'Harold spots Eleanor at a church social in Johnstown. He later says he knew in the first ten minutes.', peopleIds: ['harold-morrison', 'eleanor-morrison'], type: 'milestone' },
    { id: 'tl-4', year: 1954, title: 'Harold and Eleanor marry', description: 'A simple ceremony in Johnstown. Harold proposes in a train tunnel because he\'s too nervous in silence. Eleanor writes her first poem — a sonnet — and hides it.', peopleIds: ['harold-morrison', 'eleanor-morrison'], type: 'marriage' },
    { id: 'tl-5', year: 1955, title: 'David Morrison is born', description: 'Their first child. Named after Eleanor\'s father.', peopleIds: ['harold-morrison', 'eleanor-morrison', 'david-morrison'], type: 'birth' },
    { id: 'tl-6', year: 1958, title: 'Sarah Morrison is born', description: 'The Morrisons\' second child. Harold takes the day off work — one of the only times he ever does.', peopleIds: ['harold-morrison', 'eleanor-morrison', 'sarah-morrison'], type: 'birth' },
    { id: 'tl-7', year: 1960, title: 'Eleanor starts her garden', description: 'What begins as a small vegetable patch becomes a beloved family landmark over the decades.', peopleIds: ['eleanor-morrison'], type: 'milestone' },
    { id: 'tl-8', year: 1966, title: 'The Blizzard of \'66', description: 'Harold stranded for 14 hours. Walks 3 miles home through snow. The "soup story" becomes family legend.', peopleIds: ['harold-morrison', 'eleanor-morrison', 'david-morrison'], type: 'milestone' },
    { id: 'tl-9', year: 1975, title: 'Eleanor starts teaching at Altoona Elementary', description: 'Begins her 35-year career shaping young minds. She will remember every student.', peopleIds: ['eleanor-morrison'], type: 'career' },
    { id: 'tl-10', year: 1978, title: 'David and Linda meet at a hospital fundraiser', description: 'David, recently graduated from engineering school, meets Linda, a nursing student volunteering at the event.', peopleIds: ['david-morrison', 'linda-morrison'], type: 'milestone' },
    { id: 'tl-11', year: 1979, title: 'David and Linda marry; First wonton Thanksgiving', description: 'Linda joins the Morrison family and introduces Cantonese cooking traditions. Eleanor is won over by wontons.', peopleIds: ['david-morrison', 'linda-morrison', 'eleanor-morrison'], type: 'marriage' },
    { id: 'tl-12', year: 1980, title: 'Sarah marries James Mitchell', description: 'The history professor from Philadelphia joins the family, bringing his love of archives and old photographs.', peopleIds: ['sarah-morrison', 'james-mitchell'], type: 'marriage' },
    { id: 'tl-13', year: 1984, title: 'Ryan Morrison is born', description: 'David and Linda\'s first child. Harold calls him "the engineer\'s engineer\'s son."', peopleIds: ['david-morrison', 'linda-morrison', 'ryan-morrison'], type: 'birth' },
    { id: 'tl-14', year: 1986, title: 'Sophie Mitchell is born', description: 'James and Sarah\'s first daughter. Named after Sarah\'s favorite character in a novel.', peopleIds: ['james-mitchell', 'sarah-morrison', 'sophie-mitchell'], type: 'birth' },
    { id: 'tl-15', year: 1987, title: 'Emma Morrison is born', description: 'David and Linda\'s second child. Eleanor says she has "old eyes" — wise beyond her years.', peopleIds: ['david-morrison', 'linda-morrison', 'emma-morrison'], type: 'birth' },
    { id: 'tl-16', year: 1990, title: 'Olivia Mitchell is born', description: 'The youngest Mitchell. Born during a thunderstorm — Sarah says she came into the world announcing herself.', peopleIds: ['james-mitchell', 'sarah-morrison', 'olivia-mitchell'], type: 'birth' },
    { id: 'tl-17', year: 1991, title: 'Caleb Morrison is born', description: 'The youngest Morrison child. From day one, fascinated by the kitchen.', peopleIds: ['david-morrison', 'linda-morrison', 'caleb-morrison'], type: 'birth' },
    { id: 'tl-18', year: 1993, title: 'Harold retires from the railroad', description: '42 years of service. Ryan rides his last run with him. The crew gifts him a handmade lantern.', peopleIds: ['harold-morrison', 'ryan-morrison'], type: 'career' },
    { id: 'tl-19', year: 2005, title: 'Beaver Valley Bridge renovation completed', description: 'David\'s signature engineering project. Harold rides across it on opening day.', peopleIds: ['david-morrison', 'harold-morrison'], type: 'career' },
    { id: 'tl-20', year: 2010, title: 'Eleanor retires from teaching', description: 'After 35 years. Former students line the street outside the school to applaud her on her last day.', peopleIds: ['eleanor-morrison'], type: 'career' },
    { id: 'tl-21', year: 2015, title: 'Harold Morrison passes away', description: 'At home, in his favorite chair, with the handmade lantern on the table beside him. He was 87.', peopleIds: ['harold-morrison'], type: 'death' },
    { id: 'tl-22', year: 2018, title: 'Mia Morrison is born', description: 'Ryan\'s daughter. The great-grandchild Harold never met but would have adored.', peopleIds: ['ryan-morrison', 'mia-morrison'], type: 'birth' },
    { id: 'tl-23', year: 2019, title: 'Morrison Table opens in Philadelphia', description: 'Caleb\'s restaurant, serving dishes inspired by both Pennsylvania Dutch and Cantonese traditions.', peopleIds: ['caleb-morrison'], type: 'career' },
    { id: 'tl-24', year: 2020, title: 'Eleanor Morrison passes away', description: 'The family discovers her box of poems — hundreds, spanning 66 years. The garden sunflowers bloom one last time.', peopleIds: ['eleanor-morrison'], type: 'death' },
    { id: 'tl-25', year: 2024, title: 'Legacy AI project begins', description: 'Ryan starts building a digital family archive to preserve what remains and capture what\'s still waiting to be told.', peopleIds: ['ryan-morrison'], type: 'milestone' },
  ];

  for (const event of timelineEvents) {
    timeline.add(event);
  }

  // ── Recipes ────────────────────────────────────────────────────────────

  recipes.add({
    id: 'recipe-1',
    name: 'Linda\'s Thanksgiving Wonton Soup',
    originatorId: 'linda-morrison',
    ingredients: [
      '1 lb ground pork',
      '1 cup finely minced napa cabbage',
      '2 tbsp soy sauce',
      '1 tbsp sesame oil',
      '1 tsp fresh ginger, grated',
      '2 green onions, minced',
      '1 package wonton wrappers',
      '8 cups chicken broth',
      'Baby bok choy for garnish',
    ],
    instructions: 'Mix pork, cabbage, soy sauce, sesame oil, ginger, and green onions. Place a teaspoon of filling in each wonton wrapper, fold into triangles, then bring the two bottom corners together. Simmer in chicken broth for 6-8 minutes until wrappers are translucent. Garnish with baby bok choy. The secret is the ginger — use more than you think you need.',
    backstory: 'Linda brought this recipe to her first Morrison Thanksgiving in 1979. Eleanor watched her fold the wontons and said she folded them "like prayers." From that year on, it wasn\'t Thanksgiving without wonton soup. Eleanor learned to make them too, and for 36 years they prepared the soup together — Linda teaching, Eleanor perfecting, both women building something that was neither Chinese nor Pennsylvanian but entirely their own.',
    occasion: 'Thanksgiving',
  });

  recipes.add({
    id: 'recipe-2',
    name: 'Eleanor\'s Apple Butter',
    originatorId: 'eleanor-morrison',
    ingredients: [
      '6 lbs mixed apples (half tart, half sweet)',
      '2 cups apple cider',
      '1.5 cups brown sugar',
      '1 tbsp cinnamon',
      '1/2 tsp ground cloves',
      '1/2 tsp allspice',
      'Pinch of salt',
      '1 tsp vanilla extract',
    ],
    instructions: 'Peel and core apples, cook in cider until soft. Run through a food mill. Return to pot with sugar and spices. Cook on the lowest possible heat for 8-10 hours, stirring every 30 minutes, until thick and dark amber. Add vanilla at the end. Can in sterilized jars. The secret is patience — it cannot be rushed, just like the best stories.',
    backstory: 'Eleanor made apple butter every October for fifty years. She used apples from a single tree in her garden — a tree Harold planted the year they moved in. After Harold passed in 2015, the tree produced the largest crop it ever had. Eleanor said it was his last gift. Her apple butter appears on the table at Caleb\'s restaurant, Morrison Table, as a tribute to both the woman and the tree.',
    occasion: 'Autumn tradition, served at every family gathering',
  });

  recipes.add({
    id: 'recipe-3',
    name: 'Harold\'s Railroad Coffee',
    originatorId: 'harold-morrison',
    ingredients: [
      'Strong coffee (whatever\'s cheap)',
      '1 raw egg (shell and all)',
      'Cold water',
      'Optional: splash of bourbon (only after retirement)',
    ],
    instructions: 'This is "cowboy coffee" as Harold learned it from the old engineers. Crack a raw egg — shell and all — into the coffee grounds before brewing. The egg draws the bitterness out. Brew strong. Drink black. Harold\'s only rule: "Coffee should be strong enough to stand a spoon in, and warm enough to thaw a frozen engineer." The bourbon was added only after 1993, his retirement year.',
    backstory: 'Harold learned this method from an older engineer named Pete in 1948, his first year on the rails. Pete told him, "The egg takes the bitterness. Life takes the rest." Harold made this coffee every morning for 42 years, and Linda continued making it for David after Harold retired. It\'s not a fancy recipe. But it tastes like mornings in the Morrison household — strong, warm, and unpretentious.',
    occasion: 'Every morning',
  });

  // ── Photos ─────────────────────────────────────────────────────────────

  photos.add({
    id: 'photo-1',
    description: 'Harold in his engineer\'s uniform, standing in front of a steam locomotive. Black and white, slightly overexposed.',
    date: '1955',
    peopleIds: ['harold-morrison'],
    backStory: 'Taken the year David was born. Harold had this photo in his wallet for sixty years. The engine behind him was #1361, the K4s Pacific that once pulled the Broadway Limited. It now sits in the Railroad Museum of Pennsylvania.',
  });

  photos.add({
    id: 'photo-2',
    description: 'Eleanor in her garden, mid-summer. Sunflowers towering behind her. She\'s holding a basket of tomatoes and laughing at something off-camera.',
    date: '1985',
    peopleIds: ['eleanor-morrison'],
    backStory: 'David took this photo. He said he called her name and she turned around with that laugh — the one that made her whole face crinkle. This is how the family remembers her: not in the classroom, not in church, but in the garden, with dirt on her knees and joy on her face.',
  });

  photos.add({
    id: 'photo-3',
    description: 'The whole Morrison family at Thanksgiving, 1990. Long table, mismatched chairs, candlelight. Linda is carrying a pot of wonton soup. Eleanor is reaching for it. Harold is at the head of the table, smiling.',
    date: '1990',
    peopleIds: ['harold-morrison', 'eleanor-morrison', 'david-morrison', 'linda-morrison', 'sarah-morrison', 'james-mitchell'],
    backStory: 'The last Thanksgiving before the grandchildren started arriving in force. Sophie was four, Ryan was six, Emma was three. Caleb was not yet born. This photo hung in Eleanor\'s kitchen until she passed. The candlelight makes everyone look golden.',
  });

  // ── Interviews ─────────────────────────────────────────────────────────

  interviews.add({
    id: 'interview-1',
    date: '2025-11-15',
    intervieweeId: 'david-morrison',
    topics: ['Harold\'s railroad career', 'The blizzard of 1966', 'Childhood memories of Altoona', 'Eleanor\'s cooking'],
    keyStories: ['The Night the Snow Stopped the World', 'When Linda Brought Wontons to Thanksgiving'],
    duration: '2 hours 15 minutes',
    notes: 'David is a reserved man who warms up slowly. He tears up when talking about his father but recovers quickly. Best approach: start with concrete details (the railroad, the house) and the emotions follow naturally.',
  });

  interviews.add({
    id: 'interview-2',
    date: '2025-12-20',
    intervieweeId: 'sophie-mitchell',
    topics: ['Eleanor\'s garden', 'The Morrison family holidays', 'Growing up with the Mitchell side', 'Eleanor\'s poems discovery'],
    keyStories: ['Eleanor\'s Victory Garden', 'The Bridge That David Built'],
    duration: '1 hour 45 minutes',
    notes: 'Sophie is a professional interviewer — she makes the conversation flow naturally. She has strong opinions about preserving family history. She mentioned that her father James has boxes of old photographs and letters that haven\'t been organized. Follow-up needed.',
  });

  // ── Insights ───────────────────────────────────────────────────────────

  const insights = new LegacyInsights(familyTree, stories, timeline, recipes, interviews);

  return { familyTree, stories, timeline, recipes, photos, interviews, insights };
}
