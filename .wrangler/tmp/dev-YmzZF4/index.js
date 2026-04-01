var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-bqjmqb/strip-cf-connecting-ip-header.js
function stripCfConnectingIPHeader(input, init) {
  const request = new Request(input, init);
  request.headers.delete("CF-Connecting-IP");
  return request;
}
__name(stripCfConnectingIPHeader, "stripCfConnectingIPHeader");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    return Reflect.apply(target, thisArg, [
      stripCfConnectingIPHeader.apply(null, argArray)
    ]);
  }
});

// src/legacy/tracker.ts
var FamilyTree = class {
  members = /* @__PURE__ */ new Map();
  add(person) {
    this.members.set(person.id, person);
  }
  get(id) {
    return this.members.get(id);
  }
  getAll() {
    return Array.from(this.members.values());
  }
  update(id, updates) {
    const person = this.members.get(id);
    if (!person)
      return void 0;
    Object.assign(person, updates);
    return person;
  }
  count() {
    return this.members.size;
  }
};
__name(FamilyTree, "FamilyTree");
var StoryArchive = class {
  stories = /* @__PURE__ */ new Map();
  add(story) {
    this.stories.set(story.id, story);
  }
  get(id) {
    return this.stories.get(id);
  }
  getAll() {
    return Array.from(this.stories.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
  count() {
    return this.stories.size;
  }
  findByNarrator(narratorId) {
    return this.getAll().filter((s) => s.narratorId === narratorId);
  }
  findByTag(tag) {
    return this.getAll().filter((s) => s.tags.includes(tag));
  }
};
__name(StoryArchive, "StoryArchive");
var TimelineBuilder = class {
  events = /* @__PURE__ */ new Map();
  add(event) {
    this.events.set(event.id, event);
  }
  getAll() {
    return Array.from(this.events.values()).sort((a, b) => a.year - b.year);
  }
  getRange() {
    const events = this.getAll();
    if (events.length === 0)
      return "";
    return `${events[0].year}\u2013${events[events.length - 1].year}`;
  }
  count() {
    return this.events.size;
  }
};
__name(TimelineBuilder, "TimelineBuilder");
var RecipeKeeper = class {
  recipes = /* @__PURE__ */ new Map();
  add(recipe) {
    this.recipes.set(recipe.id, recipe);
  }
  getAll() {
    return Array.from(this.recipes.values());
  }
  count() {
    return this.recipes.size;
  }
};
__name(RecipeKeeper, "RecipeKeeper");
var PhotoArchive = class {
  photos = /* @__PURE__ */ new Map();
  add(photo) {
    this.photos.set(photo.id, photo);
  }
  getAll() {
    return Array.from(this.photos.values());
  }
  count() {
    return this.photos.size;
  }
};
__name(PhotoArchive, "PhotoArchive");
var InterviewManager = class {
  interviews = /* @__PURE__ */ new Map();
  add(interview) {
    this.interviews.set(interview.id, interview);
  }
  getAll() {
    return Array.from(this.interviews.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }
  count() {
    return this.interviews.size;
  }
  findByInterviewee(personId) {
    return this.getAll().filter((i) => i.intervieweeId === personId);
  }
};
__name(InterviewManager, "InterviewManager");
var LegacyInsights = class {
  constructor(familyTree, stories, timeline, recipes, interviews) {
    this.familyTree = familyTree;
    this.stories = stories;
    this.timeline = timeline;
    this.recipes = recipes;
    this.interviews = interviews;
  }
  generatePrompts() {
    const prompts = [];
    const people = this.familyTree.getAll();
    const allStories = this.stories.getAll();
    const allInterviews = this.interviews.getAll();
    for (const person of people) {
      const personStories = this.stories.findByNarrator(person.id);
      const mentionedInStories = allStories.filter(
        (s) => s.text.toLowerCase().includes(person.name.toLowerCase().split(" ")[0])
      );
      if (personStories.length === 0 && mentionedInStories.length === 0) {
        prompts.push({
          id: `prompt-no-stories-${person.id}`,
          prompt: `We don't have any stories about ${person.name} yet. What memories come to mind when you think of them?`,
          category: "gap",
          priority: 10
        });
      }
      if (personStories.length === 0 && mentionedInStories.length > 0) {
        prompts.push({
          id: `prompt-mentioned-${person.id}`,
          prompt: `${person.name} has been mentioned in ${mentionedInStories.length} stories but hasn't been the focus. What was a typical day like for them?`,
          category: "depth",
          priority: 7
        });
      }
    }
    const events = this.timeline.getAll();
    for (let i = 1; i < events.length; i++) {
      const gap = events[i].year - events[i - 1].year;
      if (gap > 10) {
        prompts.push({
          id: `prompt-timeline-gap-${i}`,
          prompt: `There's a ${gap}-year gap in the family timeline between ${events[i - 1].year} and ${events[i].year}. What was happening in the family during those years?`,
          category: "timeline",
          priority: 8
        });
      }
    }
    const interviewedIds = new Set(allInterviews.map((i) => i.intervieweeId));
    for (const person of people) {
      if (!interviewedIds.has(person.id) && !person.deathYear) {
        prompts.push({
          id: `prompt-interview-${person.id}`,
          prompt: `${person.name} hasn't been interviewed yet. Scheduling a conversation with them could uncover stories no one else knows.`,
          category: "interview",
          priority: 6
        });
      }
    }
    const tones = new Set(allStories.map((s) => s.emotionalTone));
    const missingTones = [];
    for (const expected of ["joyful", "bittersweet", "funny", "triumphant", "reflective"]) {
      if (!tones.has(expected))
        missingTones.push(expected);
    }
    if (missingTones.length > 0) {
      prompts.push({
        id: "prompt-emotional-range",
        prompt: `The archive is missing ${missingTones.join(", ")} stories. Can you think of a memory that fits one of those feelings?`,
        category: "depth",
        priority: 5
      });
    }
    if (this.recipes.count() < 5) {
      prompts.push({
        id: "prompt-recipes",
        prompt: `Only ${this.recipes.count()} recipes have been captured so far. What dish always reminds you of family gatherings?`,
        category: "recipes",
        priority: 4
      });
    }
    return prompts.sort((a, b) => b.priority - a.priority);
  }
  getGaps() {
    const prompts = this.generatePrompts();
    return prompts.filter((p) => p.category === "gap" || p.category === "timeline").map((p) => p.prompt);
  }
};
__name(LegacyInsights, "LegacyInsights");
function seedDatabase() {
  const familyTree = new FamilyTree();
  const stories = new StoryArchive();
  const timeline = new TimelineBuilder();
  const recipes = new RecipeKeeper();
  const photos = new PhotoArchive();
  const interviews = new InterviewManager();
  familyTree.add({
    id: "harold-morrison",
    name: "Harold Morrison",
    birthYear: 1928,
    deathYear: 2015,
    relationships: ["Husband of Eleanor Morrison", "Father of David and Sarah"],
    occupation: "Railroad engineer, Pennsylvania Railroad then Amtrak",
    hometown: "Altoona, Pennsylvania",
    photoDescription: "Tall, broad-shouldered man with kind eyes, always wearing suspenders and a slight smile. Silver hair combed neatly to one side.",
    bio: "Harold spent 42 years working the rails, first with Pennsylvania Railroad and later Amtrak. He was known for his steady hands and the way he could calm any crisis with a quiet word and a cup of coffee."
  });
  familyTree.add({
    id: "eleanor-morrison",
    name: "Eleanor Morrison (n\xE9e Walsh)",
    birthYear: 1932,
    deathYear: 2020,
    relationships: ["Wife of Harold Morrison", "Mother of David and Sarah", "Sister of Thomas Walsh"],
    occupation: "School teacher, Altoona Elementary District",
    hometown: "Johnstown, Pennsylvania",
    photoDescription: "Small woman with bright blue eyes and white hair pinned in a loose bun. Laugh lines around her eyes that deepened whenever she smiled, which was often.",
    bio: "Eleanor taught third grade for 35 years and never forgot a single student. She kept a garden that was the envy of the neighborhood and wrote poems she never showed anyone until her granddaughter found them after she passed."
  });
  familyTree.add({
    id: "david-morrison",
    name: "David Morrison",
    birthYear: 1955,
    relationships: ["Son of Harold and Eleanor", "Husband of Linda Morrison", "Father of Ryan, Emma, and Caleb", "Brother of Sarah"],
    occupation: "Civil engineer, PennDOT",
    hometown: "Altoona, Pennsylvania",
    photoDescription: "Medium build with his father's broad shoulders and his mother's kind eyes. Wears wire-rimmed glasses and has calloused hands from decades of drawing blueprints.",
    bio: "David followed his father into a life of infrastructure \u2014 not rails, but roads and bridges. He oversaw the renovation of three major highway interchanges in Pennsylvania."
  });
  familyTree.add({
    id: "linda-morrison",
    name: "Linda Morrison (n\xE9e Chen)",
    birthYear: 1958,
    relationships: ["Wife of David Morrison", "Mother of Ryan, Emma, and Caleb", "Daughter of immigrants from Guangzhou"],
    occupation: "Nurse practitioner, Altoona Regional Hospital",
    hometown: "Pittsburgh, Pennsylvania",
    photoDescription: "Warm smile, dark hair streaked with grey, always carrying a tote bag with a novel and knitting needles inside.",
    bio: "Linda moved to Altoona after nursing school and fell in love with both David and the mountains. She brought her family's Cantonese cooking traditions into the Morrison household, creating a beautiful fusion at every holiday table."
  });
  familyTree.add({
    id: "sarah-morrison",
    name: "Sarah Mitchell (n\xE9e Morrison)",
    birthYear: 1958,
    relationships: ["Daughter of Harold and Eleanor", "Wife of James Mitchell", "Mother of Sophie and Olivia", "Sister of David"],
    occupation: "Librarian, Altoona Public Library",
    hometown: "Altoona, Pennsylvania",
    photoDescription: "Round face with her mother's bright blue eyes, hair always in a practical braid. Usually wearing a cardigan and an enigmatic smile, as if she knows a secret.",
    bio: "Sarah has spent her life surrounded by stories \u2014 first as a voracious reader, then as the head librarian who knows every patron by name and reading taste."
  });
  familyTree.add({
    id: "james-mitchell",
    name: "James Mitchell",
    birthYear: 1956,
    relationships: ["Husband of Sarah Mitchell", "Father of Sophie and Olivia"],
    occupation: "History professor, Penn State Altoona",
    hometown: "Philadelphia, Pennsylvania",
    photoDescription: "Lean, bespectacled, with a neatly trimmed beard going grey. Always has a book under his arm and a faraway look, as if mentally time-traveling.",
    bio: "James married into the Morrison family and became its unofficial historian long before Legacy AI existed. He has boxes of old photographs and letters in his study that he's been meaning to organize for twenty years."
  });
  familyTree.add({
    id: "ryan-morrison",
    name: "Ryan Morrison",
    birthYear: 1984,
    relationships: ["Son of David and Linda", "Grandson of Harold and Eleanor", "Brother of Emma and Caleb"],
    occupation: "Software engineer",
    hometown: "Altoona, Pennsylvania (now lives in Pittsburgh)",
    photoDescription: "Athletic build, dark hair like his mother, with an easy laugh. Usually in a hoodie and jeans.",
    bio: "Ryan is the one who started this project \u2014 he wanted to capture his grandparents' stories before they were lost. He remembers his grandfather's stories about the railroad and his grandmother's secret poems."
  });
  familyTree.add({
    id: "emma-morrison",
    name: "Emma Morrison",
    birthYear: 1987,
    relationships: ["Daughter of David and Linda", "Granddaughter of Harold and Eleanor", "Sister of Ryan and Caleb"],
    occupation: "Pediatrician",
    hometown: "Altoona, Pennsylvania (now lives in Baltimore)",
    photoDescription: "Bright eyes behind round glasses, long dark hair, gentle demeanor. Often photographed with a child on her hip or a stethoscope around her neck.",
    bio: "Emma inherited her mother's calling for caregiving. She specializes in pediatric care and volunteers at free clinics on weekends."
  });
  familyTree.add({
    id: "caleb-morrison",
    name: "Caleb Morrison",
    birthYear: 1991,
    relationships: ["Son of David and Linda", "Grandson of Harold and Eleanor", "Brother of Ryan and Emma"],
    occupation: "Chef and restaurant owner",
    hometown: "Altoona, Pennsylvania (now lives in Philadelphia)",
    photoDescription: "Stocky like his grandfather Harold, with his mother's dark hair and a perpetually flour-dusted apron.",
    bio: `Caleb grew up in his mother's kitchen and his grandmother Eleanor's garden. He owns a small restaurant in Philly called "Morrison Table" that serves dishes inspired by both Pennsylvania Dutch and Cantonese traditions.`
  });
  familyTree.add({
    id: "sophie-mitchell",
    name: "Sophie Mitchell",
    birthYear: 1986,
    relationships: ["Daughter of James and Sarah", "Granddaughter of Harold and Eleanor", "Sister of Olivia"],
    occupation: "Journalist, Philadelphia Inquirer",
    hometown: "Altoona, Pennsylvania (now lives in Philadelphia)",
    photoDescription: "Sharp features, her mother's blue eyes, always carrying a reporter's notebook. Quick smile, intense gaze.",
    bio: "Sophie inherited her father's love of stories and her Aunt Linda's directness. She covers human interest stories and has won two regional press awards."
  });
  familyTree.add({
    id: "olivia-mitchell",
    name: "Olivia Mitchell",
    birthYear: 1990,
    relationships: ["Daughter of James and Sarah", "Granddaughter of Harold and Eleanor", "Sister of Sophie"],
    occupation: "Botanist, Longwood Gardens",
    hometown: "Altoona, Pennsylvania (now lives in Kennett Square, PA)",
    photoDescription: "Freckled, sun-kissed, perpetually outdoorsy. Usually photographed among plants, dirt under her fingernails, utterly content.",
    bio: "Olivia traces her love of plants directly to her grandmother Eleanor's garden. She now works at one of the premier botanical gardens in the country."
  });
  familyTree.add({
    id: "mia-morrison",
    name: "Mia Morrison",
    birthYear: 2018,
    relationships: ["Daughter of Ryan Morrison", "Great-granddaughter of Harold and Eleanor"],
    occupation: "Preschooler and aspiring dinosaur expert",
    hometown: "Pittsburgh, Pennsylvania",
    photoDescription: "Bright-eyed, curly-haired, almost always mid-laugh in photographs. Missing a front tooth in the most recent picture.",
    bio: `The youngest Morrison. She loves hearing stories about "Grandpa Harold's big trains" and wants to be a paleontologist when she grows up. Or a princess. It depends on the day.`
  });
  stories.add({
    id: "story-railroad-1",
    title: "The Night the Snow Stopped the World",
    narratorId: "david-morrison",
    dateOfEvent: "1966",
    text: "Dad came home late on a January night in '66. The blizzard of '66 had shut down the entire rail line between Altoona and Harrisburg. He'd been stuck in the engine for fourteen hours with nothing but a thermos of Mom's coffee and a box of saltines. He walked three miles through chest-high snow to get home. When he opened the back door, the whole kitchen was glowing warm \u2014 Mom had kept the stove burning all night. She didn't even say anything. Just poured him a bowl of soup and sat across from him while he ate. I was eight years old, watching from the stairs. That's when I understood what love looked like. Not words. Just soup and a warm fire when the world outside had frozen solid.",
    tags: ["blizzard", "railroad", "Harold", "Eleanor", "winter", "love"],
    emotionalTone: "warm",
    createdAt: "2025-11-15T10:30:00Z"
  });
  stories.add({
    id: "story-garden-1",
    title: "Eleanor's Victory Garden",
    narratorId: "sarah-morrison",
    dateOfEvent: "1960",
    text: "Mom always said the garden was her therapist. She started it in 1960 \u2014 the same year Sputnik's shock was still rippling through everything. She planted tomatoes, beans, marigolds to keep the pests away, and a row of sunflowers along the back fence because she said every yard needed something that looked up. By July, it was magnificent. Dad would come home from the yards and find her out there in a wide-brimmed hat, talking to her tomatoes. He never interrupted. He'd just sit on the porch steps and watch. I think that garden was where Mom kept her poems \u2014 not on paper, but in the arrangement of every bed. Each flower was a word she'd never say out loud.",
    tags: ["garden", "Eleanor", "Harold", "Altoona", "1960s"],
    emotionalTone: "tender",
    createdAt: "2025-11-18T14:00:00Z"
  });
  stories.add({
    id: "story-cooking-1",
    title: "When Linda Brought Wontons to Thanksgiving",
    narratorId: "david-morrison",
    dateOfEvent: "1979",
    text: `The first Thanksgiving after I brought Linda home, Mom was \u2014 polite. She made her usual spread: turkey, stuffing, cranberry sauce from a can (she always said fresh was overrated), pumpkin pie. And then Linda pulled out a bamboo steamer and made wonton soup from scratch. The whole kitchen smelled like ginger and sesame. Mom watched her fold those dumplings with the precision of a surgeon and something shifted. She didn't say anything at dinner, but after Linda went to bed, Mom came into the kitchen where I was drying dishes and said, "She folds those like she's folding prayers." That was high praise from Eleanor Morrison. The next year, Mom asked Linda to teach her. They made wontons together every Thanksgiving after that, for thirty-six years.`,
    tags: ["Thanksgiving", "Linda", "Eleanor", "cooking", "wontons", "family tradition"],
    emotionalTone: "bittersweet",
    createdAt: "2025-12-01T09:15:00Z"
  });
  stories.add({
    id: "story-railroad-2",
    title: "Harold's Last Run",
    narratorId: "ryan-morrison",
    dateOfEvent: "1993",
    text: "I was nine when Grandpa Harold retired. He took me on his very last run \u2014 Altoona to Harrisburg and back. He let me sit in the engineer's seat (with him right behind me, hands hovering). The rhythm of the train was like a heartbeat. He pointed out every landmark: the horseshoe curve, the river bend where he once saw a bald eagle, the tunnel where he proposed to Grandma by shouting over the engine noise because he was too nervous to do it in silence. When we pulled back into Altoona, the whole crew was on the platform. Forty-two years, and they gave him a hand-made lantern. He didn't cry. But he held that lantern like it was made of glass for the rest of his life.",
    tags: ["railroad", "Harold", "Ryan", "retirement", "Altoona", "trains"],
    emotionalTone: "proud",
    createdAt: "2025-12-05T16:45:00Z"
  });
  stories.add({
    id: "story-poems-1",
    title: "The Box Under the Bed",
    narratorId: "emma-morrison",
    dateOfEvent: "2020",
    text: "When Grandma Eleanor passed, we cleaned out the house. Mom found a shoebox under the bed \u2014 the kind that held dress shoes, the nice kind with the tissue paper still inside. It was full of poems. Hundreds of them, written on napkins, church bulletins, the backs of envelopes, notebook paper yellowed with age. The earliest was dated 1954. The last was written three days before she died. It was about the sunflowers in her garden and how they always knew which way to face. I sat on her bed and read every single one. Grandma \u2014 who never raised her voice, who taught third graders their times tables, who made the best apple butter in Blair County \u2014 was a poet. And she never told a soul.",
    tags: ["Eleanor", "poems", "death", "discovery", "garden", "sunflowers"],
    emotionalTone: "bittersweet",
    createdAt: "2025-12-10T11:00:00Z"
  });
  stories.add({
    id: "story-childhood-1",
    title: "The Halloween Train",
    narratorId: "caleb-morrison",
    dateOfEvent: "1998",
    text: `Every Halloween, Grandpa Harold would set up a model train that ran through the living room, under the furniture, around the Christmas tree (which was always up way too early). He'd decorate each car with little paper ghosts and pumpkins. The engine pulled a flatbed he'd rigged with a tiny cauldron full of candy. He'd start the train and we kids had to chase it around the room to get our treats. Ryan was fast, so he'd grab the good stuff. Emma would just watch and laugh. I was too little to catch it, so Grandpa always stopped the train when it passed me and let me pick first. I think about that train every October. The candy was never the point. The chase was the point. Being together, running, laughing, with the train clicking and Grandma Eleanor yelling "Don't knock over the lamp!" \u2014 that was the whole thing.`,
    tags: ["Halloween", "Harold", "Eleanor", "Ryan", "Emma", "Caleb", "trains", "childhood"],
    emotionalTone: "joyful",
    createdAt: "2025-12-15T13:30:00Z"
  });
  stories.add({
    id: "story-career-1",
    title: "The Bridge That David Built",
    narratorId: "sophie-mitchell",
    dateOfEvent: "2005",
    text: `Uncle David oversaw the renovation of the Beaver Valley Bridge \u2014 a massive project that took three years. When it reopened, the whole family drove across it in a caravan. Grandpa Harold was in the passenger seat of Uncle David's truck, and I swear I saw him tear up. David said later that his father told him, "I move things along the ground. You move things over it. We're not so different." It was the only time I ever saw those two men \u2014 both so quiet, so steady \u2014 really see each other. The bridge is just concrete and cable to everyone else. To the Morrisons, it's a conversation between a father and son written in steel.`,
    tags: ["David", "Harold", "bridge", "engineering", "career", "family"],
    emotionalTone: "proud",
    createdAt: "2025-12-20T15:00:00Z"
  });
  stories.add({
    id: "story-restaurant-1",
    title: "The First Night at Morrison Table",
    narratorId: "caleb-morrison",
    dateOfEvent: "2019",
    text: `Opening night, I served Grandma Eleanor's apple butter as a table condiment and Mom's wonton soup as the signature starter. I didn't tell anyone in the family I was putting those on the menu \u2014 I wanted it to be a surprise. When Mom and Dad walked in and saw the menu, Mom didn't say anything. She just went to the bathroom and cried for five minutes. Dad found me in the kitchen, shook my hand, and said, "Your grandparents would have eaten here every week." The restaurant got a good review in the Inquirer, but that wasn't the review that mattered. The one that mattered was a text from Mom at 2am: "The soup tasted like home. I'm so proud of you."`,
    tags: ["Caleb", "restaurant", "cooking", "Linda", "wontons", "Eleanor", "apple butter"],
    emotionalTone: "triumphant",
    createdAt: "2026-01-05T19:30:00Z"
  });
  const timelineEvents = [
    { id: "tl-1", year: 1945, title: "Harold Morrison starts as a railroad apprentice", description: "At 17, Harold begins working for the Pennsylvania Railroad, cleaning engines and learning the trade.", peopleIds: ["harold-morrison"], type: "career" },
    { id: "tl-2", year: 1950, title: "Harold becomes a licensed engineer", description: "After five years of apprenticeship, Harold earns his engineer certification.", peopleIds: ["harold-morrison"], type: "career" },
    { id: "tl-3", year: 1953, title: "Harold and Eleanor meet", description: "Harold spots Eleanor at a church social in Johnstown. He later says he knew in the first ten minutes.", peopleIds: ["harold-morrison", "eleanor-morrison"], type: "milestone" },
    { id: "tl-4", year: 1954, title: "Harold and Eleanor marry", description: "A simple ceremony in Johnstown. Harold proposes in a train tunnel because he's too nervous in silence. Eleanor writes her first poem \u2014 a sonnet \u2014 and hides it.", peopleIds: ["harold-morrison", "eleanor-morrison"], type: "marriage" },
    { id: "tl-5", year: 1955, title: "David Morrison is born", description: "Their first child. Named after Eleanor's father.", peopleIds: ["harold-morrison", "eleanor-morrison", "david-morrison"], type: "birth" },
    { id: "tl-6", year: 1958, title: "Sarah Morrison is born", description: "The Morrisons' second child. Harold takes the day off work \u2014 one of the only times he ever does.", peopleIds: ["harold-morrison", "eleanor-morrison", "sarah-morrison"], type: "birth" },
    { id: "tl-7", year: 1960, title: "Eleanor starts her garden", description: "What begins as a small vegetable patch becomes a beloved family landmark over the decades.", peopleIds: ["eleanor-morrison"], type: "milestone" },
    { id: "tl-8", year: 1966, title: "The Blizzard of '66", description: 'Harold stranded for 14 hours. Walks 3 miles home through snow. The "soup story" becomes family legend.', peopleIds: ["harold-morrison", "eleanor-morrison", "david-morrison"], type: "milestone" },
    { id: "tl-9", year: 1975, title: "Eleanor starts teaching at Altoona Elementary", description: "Begins her 35-year career shaping young minds. She will remember every student.", peopleIds: ["eleanor-morrison"], type: "career" },
    { id: "tl-10", year: 1978, title: "David and Linda meet at a hospital fundraiser", description: "David, recently graduated from engineering school, meets Linda, a nursing student volunteering at the event.", peopleIds: ["david-morrison", "linda-morrison"], type: "milestone" },
    { id: "tl-11", year: 1979, title: "David and Linda marry; First wonton Thanksgiving", description: "Linda joins the Morrison family and introduces Cantonese cooking traditions. Eleanor is won over by wontons.", peopleIds: ["david-morrison", "linda-morrison", "eleanor-morrison"], type: "marriage" },
    { id: "tl-12", year: 1980, title: "Sarah marries James Mitchell", description: "The history professor from Philadelphia joins the family, bringing his love of archives and old photographs.", peopleIds: ["sarah-morrison", "james-mitchell"], type: "marriage" },
    { id: "tl-13", year: 1984, title: "Ryan Morrison is born", description: `David and Linda's first child. Harold calls him "the engineer's engineer's son."`, peopleIds: ["david-morrison", "linda-morrison", "ryan-morrison"], type: "birth" },
    { id: "tl-14", year: 1986, title: "Sophie Mitchell is born", description: "James and Sarah's first daughter. Named after Sarah's favorite character in a novel.", peopleIds: ["james-mitchell", "sarah-morrison", "sophie-mitchell"], type: "birth" },
    { id: "tl-15", year: 1987, title: "Emma Morrison is born", description: `David and Linda's second child. Eleanor says she has "old eyes" \u2014 wise beyond her years.`, peopleIds: ["david-morrison", "linda-morrison", "emma-morrison"], type: "birth" },
    { id: "tl-16", year: 1990, title: "Olivia Mitchell is born", description: "The youngest Mitchell. Born during a thunderstorm \u2014 Sarah says she came into the world announcing herself.", peopleIds: ["james-mitchell", "sarah-morrison", "olivia-mitchell"], type: "birth" },
    { id: "tl-17", year: 1991, title: "Caleb Morrison is born", description: "The youngest Morrison child. From day one, fascinated by the kitchen.", peopleIds: ["david-morrison", "linda-morrison", "caleb-morrison"], type: "birth" },
    { id: "tl-18", year: 1993, title: "Harold retires from the railroad", description: "42 years of service. Ryan rides his last run with him. The crew gifts him a handmade lantern.", peopleIds: ["harold-morrison", "ryan-morrison"], type: "career" },
    { id: "tl-19", year: 2005, title: "Beaver Valley Bridge renovation completed", description: "David's signature engineering project. Harold rides across it on opening day.", peopleIds: ["david-morrison", "harold-morrison"], type: "career" },
    { id: "tl-20", year: 2010, title: "Eleanor retires from teaching", description: "After 35 years. Former students line the street outside the school to applaud her on her last day.", peopleIds: ["eleanor-morrison"], type: "career" },
    { id: "tl-21", year: 2015, title: "Harold Morrison passes away", description: "At home, in his favorite chair, with the handmade lantern on the table beside him. He was 87.", peopleIds: ["harold-morrison"], type: "death" },
    { id: "tl-22", year: 2018, title: "Mia Morrison is born", description: "Ryan's daughter. The great-grandchild Harold never met but would have adored.", peopleIds: ["ryan-morrison", "mia-morrison"], type: "birth" },
    { id: "tl-23", year: 2019, title: "Morrison Table opens in Philadelphia", description: "Caleb's restaurant, serving dishes inspired by both Pennsylvania Dutch and Cantonese traditions.", peopleIds: ["caleb-morrison"], type: "career" },
    { id: "tl-24", year: 2020, title: "Eleanor Morrison passes away", description: "The family discovers her box of poems \u2014 hundreds, spanning 66 years. The garden sunflowers bloom one last time.", peopleIds: ["eleanor-morrison"], type: "death" },
    { id: "tl-25", year: 2024, title: "Legacy AI project begins", description: "Ryan starts building a digital family archive to preserve what remains and capture what's still waiting to be told.", peopleIds: ["ryan-morrison"], type: "milestone" }
  ];
  for (const event of timelineEvents) {
    timeline.add(event);
  }
  recipes.add({
    id: "recipe-1",
    name: "Linda's Thanksgiving Wonton Soup",
    originatorId: "linda-morrison",
    ingredients: [
      "1 lb ground pork",
      "1 cup finely minced napa cabbage",
      "2 tbsp soy sauce",
      "1 tbsp sesame oil",
      "1 tsp fresh ginger, grated",
      "2 green onions, minced",
      "1 package wonton wrappers",
      "8 cups chicken broth",
      "Baby bok choy for garnish"
    ],
    instructions: "Mix pork, cabbage, soy sauce, sesame oil, ginger, and green onions. Place a teaspoon of filling in each wonton wrapper, fold into triangles, then bring the two bottom corners together. Simmer in chicken broth for 6-8 minutes until wrappers are translucent. Garnish with baby bok choy. The secret is the ginger \u2014 use more than you think you need.",
    backstory: `Linda brought this recipe to her first Morrison Thanksgiving in 1979. Eleanor watched her fold the wontons and said she folded them "like prayers." From that year on, it wasn't Thanksgiving without wonton soup. Eleanor learned to make them too, and for 36 years they prepared the soup together \u2014 Linda teaching, Eleanor perfecting, both women building something that was neither Chinese nor Pennsylvanian but entirely their own.`,
    occasion: "Thanksgiving"
  });
  recipes.add({
    id: "recipe-2",
    name: "Eleanor's Apple Butter",
    originatorId: "eleanor-morrison",
    ingredients: [
      "6 lbs mixed apples (half tart, half sweet)",
      "2 cups apple cider",
      "1.5 cups brown sugar",
      "1 tbsp cinnamon",
      "1/2 tsp ground cloves",
      "1/2 tsp allspice",
      "Pinch of salt",
      "1 tsp vanilla extract"
    ],
    instructions: "Peel and core apples, cook in cider until soft. Run through a food mill. Return to pot with sugar and spices. Cook on the lowest possible heat for 8-10 hours, stirring every 30 minutes, until thick and dark amber. Add vanilla at the end. Can in sterilized jars. The secret is patience \u2014 it cannot be rushed, just like the best stories.",
    backstory: "Eleanor made apple butter every October for fifty years. She used apples from a single tree in her garden \u2014 a tree Harold planted the year they moved in. After Harold passed in 2015, the tree produced the largest crop it ever had. Eleanor said it was his last gift. Her apple butter appears on the table at Caleb's restaurant, Morrison Table, as a tribute to both the woman and the tree.",
    occasion: "Autumn tradition, served at every family gathering"
  });
  recipes.add({
    id: "recipe-3",
    name: "Harold's Railroad Coffee",
    originatorId: "harold-morrison",
    ingredients: [
      "Strong coffee (whatever's cheap)",
      "1 raw egg (shell and all)",
      "Cold water",
      "Optional: splash of bourbon (only after retirement)"
    ],
    instructions: `This is "cowboy coffee" as Harold learned it from the old engineers. Crack a raw egg \u2014 shell and all \u2014 into the coffee grounds before brewing. The egg draws the bitterness out. Brew strong. Drink black. Harold's only rule: "Coffee should be strong enough to stand a spoon in, and warm enough to thaw a frozen engineer." The bourbon was added only after 1993, his retirement year.`,
    backstory: `Harold learned this method from an older engineer named Pete in 1948, his first year on the rails. Pete told him, "The egg takes the bitterness. Life takes the rest." Harold made this coffee every morning for 42 years, and Linda continued making it for David after Harold retired. It's not a fancy recipe. But it tastes like mornings in the Morrison household \u2014 strong, warm, and unpretentious.`,
    occasion: "Every morning"
  });
  photos.add({
    id: "photo-1",
    description: "Harold in his engineer's uniform, standing in front of a steam locomotive. Black and white, slightly overexposed.",
    date: "1955",
    peopleIds: ["harold-morrison"],
    backStory: "Taken the year David was born. Harold had this photo in his wallet for sixty years. The engine behind him was #1361, the K4s Pacific that once pulled the Broadway Limited. It now sits in the Railroad Museum of Pennsylvania."
  });
  photos.add({
    id: "photo-2",
    description: "Eleanor in her garden, mid-summer. Sunflowers towering behind her. She's holding a basket of tomatoes and laughing at something off-camera.",
    date: "1985",
    peopleIds: ["eleanor-morrison"],
    backStory: "David took this photo. He said he called her name and she turned around with that laugh \u2014 the one that made her whole face crinkle. This is how the family remembers her: not in the classroom, not in church, but in the garden, with dirt on her knees and joy on her face."
  });
  photos.add({
    id: "photo-3",
    description: "The whole Morrison family at Thanksgiving, 1990. Long table, mismatched chairs, candlelight. Linda is carrying a pot of wonton soup. Eleanor is reaching for it. Harold is at the head of the table, smiling.",
    date: "1990",
    peopleIds: ["harold-morrison", "eleanor-morrison", "david-morrison", "linda-morrison", "sarah-morrison", "james-mitchell"],
    backStory: "The last Thanksgiving before the grandchildren started arriving in force. Sophie was four, Ryan was six, Emma was three. Caleb was not yet born. This photo hung in Eleanor's kitchen until she passed. The candlelight makes everyone look golden."
  });
  interviews.add({
    id: "interview-1",
    date: "2025-11-15",
    intervieweeId: "david-morrison",
    topics: ["Harold's railroad career", "The blizzard of 1966", "Childhood memories of Altoona", "Eleanor's cooking"],
    keyStories: ["The Night the Snow Stopped the World", "When Linda Brought Wontons to Thanksgiving"],
    duration: "2 hours 15 minutes",
    notes: "David is a reserved man who warms up slowly. He tears up when talking about his father but recovers quickly. Best approach: start with concrete details (the railroad, the house) and the emotions follow naturally."
  });
  interviews.add({
    id: "interview-2",
    date: "2025-12-20",
    intervieweeId: "sophie-mitchell",
    topics: ["Eleanor's garden", "The Morrison family holidays", "Growing up with the Mitchell side", "Eleanor's poems discovery"],
    keyStories: ["Eleanor's Victory Garden", "The Bridge That David Built"],
    duration: "1 hour 45 minutes",
    notes: "Sophie is a professional interviewer \u2014 she makes the conversation flow naturally. She has strong opinions about preserving family history. She mentioned that her father James has boxes of old photographs and letters that haven't been organized. Follow-up needed."
  });
  const insights = new LegacyInsights(familyTree, stories, timeline, recipes, interviews);
  return { familyTree, stories, timeline, recipes, photos, interviews, insights };
}
__name(seedDatabase, "seedDatabase");

// src/index.ts
var db = seedDatabase();
var SYSTEM_PROMPT = `You are Legacy, a family historian. You conduct interview-style conversations to capture stories, memories, and family lore. Ask thoughtful follow-up questions. Help people articulate memories they didn't know they had. Be warm, patient, respectful.

Your role:
- Ask one question at a time, like a gentle, curious grandchild
- Listen carefully to what's said and what's left unsaid
- Follow up on sensory details: sounds, smells, textures, colors
- Help people find the story inside a vague memory
- Never rush. Some memories need silence to surface.
- Celebrate every story, no matter how small
- Connect new stories to what you already know about the family
- When someone shares something emotional, sit with it before moving on
- End conversations gently, like closing a photo album

Current family context:
- The Morrison family of Altoona, Pennsylvania
- Harold Morrison (1928-2015): Railroad engineer, 42 years on the rails
- Eleanor Morrison n\xE9e Walsh (1932-2020): School teacher, secret poet, legendary gardener
- Their children David (civil engineer) and Sarah (librarian)
- David married Linda Chen (nurse, brought Cantonese traditions)
- Sarah married James Mitchell (history professor, family archivist)
- Six grandchildren: Ryan, Emma, Caleb, Sophie, Olivia
- Great-granddaughter Mia (born 2018)
- 8 stories captured, spanning 1954-2020
- Signature family dishes: wonton soup, apple butter, railroad coffee
- Key themes: quiet love, food as language, work as identity, stories hidden in plain sight`;
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
}
__name(jsonResponse, "jsonResponse");
async function handleChat(request, env) {
  const { messages } = await request.json();
  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.DEEPSEEK_API_KEY}`
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      stream: true,
      max_tokens: 1024,
      temperature: 0.8
    })
  });
  if (!response.ok) {
    const err = await response.text();
    return new Response(err, { status: response.status });
  }
  return new Response(response.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
__name(handleChat, "handleChat");
function handlePeople(request) {
  if (request.method === "POST") {
    return request.json().then((data) => {
      const person = data;
      db.familyTree.add(person);
      return jsonResponse(person, 201);
    });
  }
  return jsonResponse(db.familyTree.getAll());
}
__name(handlePeople, "handlePeople");
function handleStories(request) {
  if (request.method === "POST") {
    return request.json().then((data) => {
      const story = data;
      db.stories.add(story);
      return jsonResponse(story, 201);
    });
  }
  return jsonResponse(db.stories.getAll());
}
__name(handleStories, "handleStories");
function handleTimeline(request) {
  if (request.method === "POST") {
    return request.json().then((data) => {
      const event = data;
      db.timeline.add(event);
      return jsonResponse(event, 201);
    });
  }
  return jsonResponse(db.timeline.getAll());
}
__name(handleTimeline, "handleTimeline");
function handleRecipes(request) {
  if (request.method === "POST") {
    return request.json().then((data) => {
      const recipe = data;
      db.recipes.add(recipe);
      return jsonResponse(recipe, 201);
    });
  }
  return jsonResponse(db.recipes.getAll());
}
__name(handleRecipes, "handleRecipes");
function handlePhotos(request) {
  if (request.method === "POST") {
    return request.json().then((data) => {
      const photo = data;
      db.photos.add(photo);
      return jsonResponse(photo, 201);
    });
  }
  return jsonResponse(db.photos.getAll());
}
__name(handlePhotos, "handlePhotos");
function handleInterviews(request) {
  if (request.method === "POST") {
    return request.json().then((data) => {
      const interview = data;
      db.interviews.add(interview);
      return jsonResponse(interview, 201);
    });
  }
  return jsonResponse(db.interviews.getAll());
}
__name(handleInterviews, "handleInterviews");
function handlePrompts() {
  return jsonResponse(db.insights.generatePrompts());
}
__name(handlePrompts, "handlePrompts");
async function handleRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  }
  if (path === "/api/chat" && request.method === "POST") {
    return handleChat(request, env);
  }
  if (path === "/api/people" && (request.method === "GET" || request.method === "POST")) {
    return handlePeople(request);
  }
  if (path === "/api/stories" && (request.method === "GET" || request.method === "POST")) {
    return handleStories(request);
  }
  if (path === "/api/timeline" && (request.method === "GET" || request.method === "POST")) {
    return handleTimeline(request);
  }
  if (path === "/api/recipes" && (request.method === "GET" || request.method === "POST")) {
    return handleRecipes(request);
  }
  if (path === "/api/photos" && (request.method === "GET" || request.method === "POST")) {
    return handlePhotos(request);
  }
  if (path === "/api/interviews" && (request.method === "GET" || request.method === "POST")) {
    return handleInterviews(request);
  }
  if (path === "/api/prompts" && request.method === "GET") {
    return handlePrompts();
  }
  if (path === "/" || path === "/index.html") {
    return new Response(getAppHTML(), { headers: { "Content-Type": "text/html" } });
  }
  if (path === "/app") {
    return new Response(getAppHTML(), { headers: { "Content-Type": "text/html" } });
  }
  return new Response("Not found", { status: 404 });
}
__name(handleRequest, "handleRequest");
function getAppHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Legacy \u2014 Family Historian</title>
<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --cream: #FFFBEB;
  --cream-dark: #FEF3C7;
  --brown: #44403C;
  --brown-light: #78716C;
  --amber: #B45309;
  --amber-light: #D97706;
  --amber-pale: #FDE68A;
  --amber-bg: #FEF3C7;
  --white: #FFFFFF;
  --border: #D6D3D1;
  --card-bg: #FFFBEB;
  --shadow: 0 1px 3px rgba(68,64,60,0.1), 0 1px 2px rgba(68,64,60,0.06);
  --shadow-lg: 0 4px 12px rgba(68,64,60,0.12);
}

body {
  font-family: Georgia, 'Times New Roman', serif;
  background: var(--cream);
  color: var(--brown);
  line-height: 1.6;
  min-height: 100vh;
}

/* \u2500\u2500 Header \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */

.header {
  background: var(--brown);
  color: var(--cream);
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: var(--shadow-lg);
}

.header h1 {
  font-size: 1.5rem;
  font-weight: 400;
  letter-spacing: 0.05em;
}

.header h1 span { color: var(--amber-light); }

.header .subtitle {
  font-size: 0.8rem;
  color: var(--brown-light);
  font-style: italic;
}

/* \u2500\u2500 Navigation \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */

.nav {
  background: var(--white);
  border-bottom: 1px solid var(--border);
  display: flex;
  gap: 0;
  overflow-x: auto;
  padding: 0 1rem;
}

.nav button {
  background: none;
  border: none;
  padding: 0.75rem 1.25rem;
  font-family: Georgia, serif;
  font-size: 0.85rem;
  color: var(--brown-light);
  cursor: pointer;
  white-space: nowrap;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.nav button:hover { color: var(--brown); }
.nav button.active {
  color: var(--amber);
  border-bottom-color: var(--amber);
  font-weight: 600;
}

/* \u2500\u2500 Main Content \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */

.main {
  max-width: 1100px;
  margin: 0 auto;
  padding: 2rem;
}

.tab-content { display: none; }
.tab-content.active { display: block; }

/* \u2500\u2500 Dashboard \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1.25rem;
  box-shadow: var(--shadow);
}

.stat-card .stat-number {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--amber);
  line-height: 1;
}

.stat-card .stat-label {
  font-size: 0.85rem;
  color: var(--brown-light);
  margin-top: 0.25rem;
  font-style: italic;
}

.section-title {
  font-size: 1.3rem;
  color: var(--brown);
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--amber-pale);
}

/* \u2500\u2500 Cards \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */

.card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1.25rem;
  margin-bottom: 1rem;
  box-shadow: var(--shadow);
  transition: box-shadow 0.2s;
}

.card:hover { box-shadow: var(--shadow-lg); }

.card h3 {
  font-size: 1.1rem;
  color: var(--brown);
  margin-bottom: 0.5rem;
}

.card .meta {
  font-size: 0.8rem;
  color: var(--brown-light);
  margin-bottom: 0.75rem;
  font-style: italic;
}

.card p {
  font-size: 0.95rem;
  line-height: 1.7;
}

.card .tags {
  margin-top: 0.75rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.tag {
  background: var(--amber-bg);
  color: var(--amber);
  padding: 0.15rem 0.6rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-family: system-ui, sans-serif;
}

.tone-badge {
  display: inline-block;
  background: var(--amber);
  color: var(--cream);
  padding: 0.15rem 0.6rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-family: system-ui, sans-serif;
  text-transform: capitalize;
}

/* \u2500\u2500 Person Card \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */

.person-card {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.person-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--amber-pale);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  color: var(--amber);
  flex-shrink: 0;
  font-family: system-ui, sans-serif;
  font-weight: 700;
}

.person-info h3 { margin-bottom: 0.25rem; }
.person-info .meta { margin-bottom: 0.5rem; }

/* \u2500\u2500 Timeline \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */

.timeline-container {
  position: relative;
  padding-left: 2rem;
}

.timeline-container::before {
  content: '';
  position: absolute;
  left: 0.5rem;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--amber-pale);
}

.timeline-item {
  position: relative;
  margin-bottom: 1.5rem;
  padding-left: 1.5rem;
}

.timeline-item::before {
  content: '';
  position: absolute;
  left: -1.65rem;
  top: 0.4rem;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--amber);
  border: 2px solid var(--white);
  box-shadow: 0 0 0 2px var(--amber-pale);
}

.timeline-item .year {
  font-size: 0.8rem;
  color: var(--amber);
  font-weight: 700;
  font-family: system-ui, sans-serif;
}

.timeline-item h3 { font-size: 1rem; margin: 0.25rem 0; }

.timeline-item p {
  font-size: 0.9rem;
  color: var(--brown-light);
}

.timeline-type {
  display: inline-block;
  background: var(--amber-bg);
  color: var(--amber);
  padding: 0.1rem 0.5rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-family: system-ui, sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* \u2500\u2500 Recipes \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */

.recipe-card { border-left: 3px solid var(--amber); }

.recipe-card .ingredients {
  background: var(--cream);
  padding: 1rem;
  border-radius: 6px;
  margin: 0.75rem 0;
  font-size: 0.9rem;
}

.recipe-card .ingredients h4 {
  font-size: 0.85rem;
  color: var(--amber);
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-family: system-ui, sans-serif;
}

.recipe-card .ingredients ul {
  list-style: none;
  padding: 0;
}

.recipe-card .ingredients li::before {
  content: '\xB7 ';
  color: var(--amber);
  font-weight: 700;
}

.recipe-card .backstory {
  font-style: italic;
  color: var(--brown-light);
  border-top: 1px solid var(--border);
  padding-top: 0.75rem;
  margin-top: 0.75rem;
}

/* \u2500\u2500 Chat \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */

.chat-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 200px);
  min-height: 500px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 0;
}

.chat-msg {
  margin-bottom: 1rem;
  display: flex;
  gap: 0.75rem;
}

.chat-msg.user { flex-direction: row-reverse; }

.chat-bubble {
  max-width: 70%;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  font-size: 0.95rem;
  line-height: 1.6;
}

.chat-msg.assistant .chat-bubble {
  background: var(--white);
  border: 1px solid var(--border);
  border-bottom-left-radius: 4px;
}

.chat-msg.user .chat-bubble {
  background: var(--brown);
  color: var(--cream);
  border-bottom-right-radius: 4px;
}

.chat-msg .avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  flex-shrink: 0;
  font-family: system-ui, sans-serif;
}

.chat-msg.assistant .avatar {
  background: var(--amber-pale);
  color: var(--amber);
}

.chat-msg.user .avatar {
  background: var(--brown);
  color: var(--cream);
}

.chat-input-area {
  display: flex;
  gap: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border);
}

.chat-input-area textarea {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-family: Georgia, serif;
  font-size: 0.95rem;
  background: var(--white);
  color: var(--brown);
  resize: none;
  outline: none;
  min-height: 48px;
  max-height: 120px;
}

.chat-input-area textarea:focus { border-color: var(--amber); }

.chat-input-area button {
  background: var(--amber);
  color: var(--cream);
  border: none;
  border-radius: 8px;
  padding: 0 1.25rem;
  cursor: pointer;
  font-family: Georgia, serif;
  font-size: 0.9rem;
  transition: background 0.2s;
}

.chat-input-area button:hover { background: var(--amber-light); }

.chat-input-area button:disabled {
  background: var(--brown-light);
  cursor: not-allowed;
}

.typing-indicator {
  display: inline-block;
}

.typing-indicator span {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--brown-light);
  margin: 0 1px;
  animation: bounce 1.4s infinite ease-in-out both;
}

.typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
.typing-indicator span:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

/* \u2500\u2500 Prompts / Gaps \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */

.prompt-card {
  border-left: 3px solid var(--amber);
  cursor: pointer;
  transition: border-color 0.2s;
}

.prompt-card:hover { border-left-color: var(--amber-light); }

/* \u2500\u2500 Interviews \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */

.interview-topics {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin: 0.5rem 0;
}

.interview-topic {
  background: var(--cream-dark);
  color: var(--brown);
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-family: system-ui, sans-serif;
}

/* \u2500\u2500 Photos \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */

.photo-card .photo-placeholder {
  background: var(--cream-dark);
  border-radius: 6px;
  padding: 2rem;
  text-align: center;
  margin-bottom: 1rem;
  color: var(--brown-light);
  font-style: italic;
  font-size: 0.9rem;
}

.photo-card .photo-placeholder::before {
  content: '\u{1F4F7}';
  display: block;
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

/* \u2500\u2500 Modal \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */

.modal-overlay {
  display: none;
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(68,64,60,0.5);
  z-index: 200;
  justify-content: center;
  align-items: flex-start;
  padding: 2rem;
  overflow-y: auto;
}

.modal-overlay.active { display: flex; }

.modal {
  background: var(--cream);
  border-radius: 12px;
  padding: 2rem;
  max-width: 600px;
  width: 100%;
  box-shadow: var(--shadow-lg);
  position: relative;
  margin-top: 2rem;
}

.modal h2 { margin-bottom: 1.25rem; color: var(--amber); }

.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--brown-light);
  cursor: pointer;
}

.modal label {
  display: block;
  font-size: 0.85rem;
  color: var(--brown-light);
  margin-bottom: 0.25rem;
  margin-top: 0.75rem;
  font-family: system-ui, sans-serif;
}

.modal input, .modal textarea, .modal select {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-family: Georgia, serif;
  font-size: 0.9rem;
  background: var(--white);
  color: var(--brown);
  outline: none;
}

.modal input:focus, .modal textarea:focus { border-color: var(--amber); }
.modal textarea { min-height: 80px; resize: vertical; }

.modal .btn-submit {
  margin-top: 1.25rem;
  background: var(--amber);
  color: var(--cream);
  border: none;
  border-radius: 6px;
  padding: 0.6rem 1.5rem;
  cursor: pointer;
  font-family: Georgia, serif;
  font-size: 0.9rem;
}

.modal .btn-submit:hover { background: var(--amber-light); }

/* \u2500\u2500 Responsive \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */

@media (max-width: 768px) {
  .header { padding: 0.75rem 1rem; }
  .header h1 { font-size: 1.2rem; }
  .main { padding: 1rem; }
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .chat-bubble { max-width: 85%; }
}

/* \u2500\u2500 Utility \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */

.fade-in { animation: fadeIn 0.3s ease-in; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }

.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--brown-light);
  font-style: italic;
}

.add-btn {
  background: var(--amber);
  color: var(--cream);
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-family: Georgia, serif;
  font-size: 0.85rem;
  margin-bottom: 1rem;
  transition: background 0.2s;
}
.add-btn:hover { background: var(--amber-light); }
</style>
</head>
<body>

<!-- Header -->
<header class="header">
  <div>
    <h1><span>Legacy</span></h1>
    <div class="subtitle">A family historian \u2014 capturing stories before they fade</div>
  </div>
</header>

<!-- Navigation -->
<nav class="nav" id="nav">
  <button class="active" data-tab="dashboard">Dashboard</button>
  <button data-tab="family">Family Tree</button>
  <button data-tab="stories">Stories</button>
  <button data-tab="timeline">Timeline</button>
  <button data-tab="recipes">Recipes</button>
  <button data-tab="photos">Photos</button>
  <button data-tab="interviews">Interviews</button>
  <button data-tab="chat">Chat</button>
</nav>

<!-- Main Content -->
<main class="main">

  <!-- Dashboard -->
  <div class="tab-content active" id="tab-dashboard">
    <div class="stats-grid" id="stats-grid"></div>

    <h2 class="section-title">Stories to Capture</h2>
    <div id="gaps-list"></div>

    <h2 class="section-title" style="margin-top:2rem;">Recent Stories</h2>
    <div id="recent-stories"></div>
  </div>

  <!-- Family Tree -->
  <div class="tab-content" id="tab-family">
    <button class="add-btn" onclick="openModal('person-modal')">+ Add Family Member</button>
    <div id="family-list"></div>
  </div>

  <!-- Stories -->
  <div class="tab-content" id="tab-stories">
    <button class="add-btn" onclick="openModal('story-modal')">+ Capture a Story</button>
    <div id="stories-list"></div>
  </div>

  <!-- Timeline -->
  <div class="tab-content" id="tab-timeline">
    <button class="add-btn" onclick="openModal('timeline-modal')">+ Add Timeline Event</button>
    <div class="timeline-container" id="timeline-list"></div>
  </div>

  <!-- Recipes -->
  <div class="tab-content" id="tab-recipes">
    <button class="add-btn" onclick="openModal('recipe-modal')">+ Add Family Recipe</button>
    <div id="recipes-list"></div>
  </div>

  <!-- Photos -->
  <div class="tab-content" id="tab-photos">
    <button class="add-btn" onclick="openModal('photo-modal')">+ Add Photo Description</button>
    <div id="photos-list"></div>
  </div>

  <!-- Interviews -->
  <div class="tab-content" id="tab-interviews">
    <button class="add-btn" onclick="openModal('interview-modal')">+ Log Interview</button>
    <div id="interviews-list"></div>
  </div>

  <!-- Chat -->
  <div class="tab-content" id="tab-chat">
    <div class="chat-container">
      <div class="chat-messages" id="chat-messages">
        <div class="chat-msg assistant">
          <div class="avatar">L</div>
          <div class="chat-bubble">Hello. I'm Legacy, your family historian. I'm here to listen and help you capture the stories that matter most.<br><br>What would you like to tell me about today? A memory, a person, a moment in time \u2014 whatever comes to mind.</div>
        </div>
      </div>
      <div class="chat-input-area">
        <textarea id="chat-input" placeholder="Tell me a story..." rows="1" onkeydown="handleChatKey(event)"></textarea>
        <button id="chat-send" onclick="sendChat()">Send</button>
      </div>
    </div>
  </div>

</main>

<!-- Modals -->
<div class="modal-overlay" id="person-modal">
  <div class="modal">
    <button class="modal-close" onclick="closeModal('person-modal')">&times;</button>
    <h2>Add Family Member</h2>
    <label>Name</label><input id="p-name" placeholder="Full name">
    <label>Birth Year</label><input id="p-birth" type="number" placeholder="e.g. 1955">
    <label>Death Year (if applicable)</label><input id="p-death" type="number" placeholder="Leave blank if living">
    <label>Relationships</label><textarea id="p-rel" placeholder="One per line: Wife of..., Mother of..."></textarea>
    <label>Occupation</label><input id="p-occ" placeholder="e.g. Teacher, Engineer">
    <label>Hometown</label><input id="p-home" placeholder="e.g. Altoona, Pennsylvania">
    <label>Brief Bio</label><textarea id="p-bio" placeholder="A short biography"></textarea>
    <button class="btn-submit" onclick="addPerson()">Save</button>
  </div>
</div>

<div class="modal-overlay" id="story-modal">
  <div class="modal">
    <button class="modal-close" onclick="closeModal('story-modal')">&times;</button>
    <h2>Capture a Story</h2>
    <label>Title</label><input id="s-title" placeholder="Give this story a name">
    <label>Narrator</label><select id="s-narrator"></select>
    <label>Date of Event</label><input id="s-date" placeholder="e.g. 1975, Summer 1985">
    <label>The Story</label><textarea id="s-text" rows="6" placeholder="Tell it in your own words..."></textarea>
    <label>Tags (comma separated)</label><input id="s-tags" placeholder="e.g. childhood, holidays, Grandma">
    <label>Emotional Tone</label>
    <select id="s-tone">
      <option value="warm">Warm</option>
      <option value="bittersweet">Bittersweet</option>
      <option value="joyful">Joyful</option>
      <option value="tender">Tender</option>
      <option value="proud">Proud</option>
      <option value="triumphant">Triumphant</option>
      <option value="funny">Funny</option>
      <option value="reflective">Reflective</option>
      <option value="sad">Sad</option>
    </select>
    <button class="btn-submit" onclick="addStory()">Save Story</button>
  </div>
</div>

<div class="modal-overlay" id="timeline-modal">
  <div class="modal">
    <button class="modal-close" onclick="closeModal('timeline-modal')">&times;</button>
    <h2>Add Timeline Event</h2>
    <label>Year</label><input id="t-year" type="number" placeholder="e.g. 1985">
    <label>Title</label><input id="t-title" placeholder="What happened?">
    <label>Description</label><textarea id="t-desc" placeholder="Tell the story behind this event"></textarea>
    <label>Type</label>
    <select id="t-type">
      <option value="birth">Birth</option>
      <option value="marriage">Marriage</option>
      <option value="move">Move</option>
      <option value="career">Career</option>
      <option value="milestone">Milestone</option>
      <option value="education">Education</option>
      <option value="travel">Travel</option>
    </select>
    <button class="btn-submit" onclick="addTimelineEvent()">Save Event</button>
  </div>
</div>

<div class="modal-overlay" id="recipe-modal">
  <div class="modal">
    <button class="modal-close" onclick="closeModal('recipe-modal')">&times;</button>
    <h2>Add Family Recipe</h2>
    <label>Recipe Name</label><input id="r-name" placeholder="e.g. Grandma's Apple Butter">
    <label>Originator</label><select id="r-originator"></select>
    <label>Ingredients (one per line)</label><textarea id="r-ingredients" rows="5" placeholder="One ingredient per line"></textarea>
    <label>Instructions</label><textarea id="r-instructions" rows="4" placeholder="How to make it"></textarea>
    <label>The Story Behind It</label><textarea id="r-backstory" rows="4" placeholder="Every family recipe has a story..."></textarea>
    <label>Occasion</label><input id="r-occasion" placeholder="e.g. Thanksgiving, Every Sunday">
    <button class="btn-submit" onclick="addRecipe()">Save Recipe</button>
  </div>
</div>

<div class="modal-overlay" id="photo-modal">
  <div class="modal">
    <button class="modal-close" onclick="closeModal('photo-modal')">&times;</button>
    <h2>Add Photo Description</h2>
    <label>Description of the Photo</label><textarea id="ph-desc" rows="3" placeholder="What does this photo show?"></textarea>
    <label>Approximate Date</label><input id="ph-date" placeholder="e.g. Summer 1985">
    <label>People in the Photo</label><input id="ph-people" placeholder="Names, comma separated">
    <label>The Story Behind the Photo</label><textarea id="ph-backstory" rows="4" placeholder="What was happening when this was taken?"></textarea>
    <button class="btn-submit" onclick="addPhoto()">Save Photo</button>
  </div>
</div>

<div class="modal-overlay" id="interview-modal">
  <div class="modal">
    <button class="modal-close" onclick="closeModal('interview-modal')">&times;</button>
    <h2>Log Interview Session</h2>
    <label>Date</label><input id="i-date" type="date">
    <label>Interviewee</label><select id="i-person"></select>
    <label>Topics Covered (comma separated)</label><input id="i-topics" placeholder="e.g. childhood, career, Grandma">
    <label>Key Stories Captured (comma separated)</label><input id="i-stories" placeholder="Story titles or descriptions">
    <label>Duration</label><input id="i-duration" placeholder="e.g. 1 hour 30 minutes">
    <label>Notes</label><textarea id="i-notes" placeholder="Observations, follow-ups needed..."></textarea>
    <button class="btn-submit" onclick="addInterview()">Save Interview</button>
  </div>
</div>

<script>
// \u2500\u2500 State \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

let people = [];
let stories = [];
let timelineEvents = [];
let recipes = [];
let photos = [];
let interviews = [];
let chatMessages = [];
let prompts = [];

// \u2500\u2500 API \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

const API = '/api';

async function apiGet(path) {
  const r = await fetch(\`\${API}/\${path}\`);
  return r.json();
}

async function apiPost(path, data) {
  const r = await fetch(\`\${API}/\${path}\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return r.json();
}

// \u2500\u2500 Navigation \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

document.querySelectorAll('.nav button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav button').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(\`tab-\${btn.dataset.tab}\`).classList.add('active');
  });
});

// \u2500\u2500 Modal \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

function openModal(id) {
  document.getElementById(id).classList.add('active');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

// Close modal on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.remove('active');
  });
});

// \u2500\u2500 Render Functions \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function renderDashboard() {
  // Stats
  const livingPeople = people.filter(p => !p.deathYear);
  document.getElementById('stats-grid').innerHTML = \`
    <div class="stat-card"><div class="stat-number">\${people.length}</div><div class="stat-label">Family Members</div></div>
    <div class="stat-card"><div class="stat-number">\${stories.length}</div><div class="stat-label">Stories Captured</div></div>
    <div class="stat-card"><div class="stat-number">\${interviews.length}</div><div class="stat-label">Interview Sessions</div></div>
    <div class="stat-card"><div class="stat-number">\${prompts.length}</div><div class="stat-label">Gaps to Fill</div></div>
    <div class="stat-card"><div class="stat-number">\${timelineEvents.length}</div><div class="stat-label">Timeline Events</div></div>
    <div class="stat-card"><div class="stat-number">\${recipes.length}</div><div class="stat-label">Family Recipes</div></div>
  \`;

  // Gaps
  const gapsHtml = prompts.slice(0, 4).map(p => \`
    <div class="card prompt-card fade-in" onclick="startChatWithPrompt('\${escapeHtml(p.prompt).replace(/'/g, "\\\\'")}')">
      <p>\${escapeHtml(p.prompt)}</p>
      <div class="tags"><span class="tag">\${p.category}</span></div>
    </div>
  \`).join('');
  document.getElementById('gaps-list').innerHTML = gapsHtml || '<div class="empty-state">No gaps identified \u2014 the archive is rich!</div>';

  // Recent stories
  const recent = stories.slice(0, 3);
  document.getElementById('recent-stories').innerHTML = recent.map(s => {
    const narrator = people.find(p => p.id === s.narratorId);
    return \`
      <div class="card fade-in">
        <h3>\${escapeHtml(s.title)}</h3>
        <div class="meta">\${narrator ? narrator.name : 'Unknown'} \xB7 \${s.dateOfEvent || 'Date unknown'} \xB7 <span class="tone-badge">\${s.emotionalTone}</span></div>
        <p>\${escapeHtml(s.text.substring(0, 200))}\${s.text.length > 200 ? '...' : ''}</p>
      </div>
    \`;
  }).join('') || '<div class="empty-state">No stories yet. Start a conversation to capture your first one.</div>';
}

function renderFamily() {
  document.getElementById('family-list').innerHTML = people.map(p => \`
    <div class="card fade-in">
      <div class="person-card">
        <div class="person-avatar">\${getInitials(p.name)}</div>
        <div class="person-info">
          <h3>\${escapeHtml(p.name)} \${p.deathYear ? '<span style="color:var(--brown-light);font-size:0.8rem;">(' + p.birthYear + '\u2013' + p.deathYear + ')</span>' : p.birthYear ? '<span style="color:var(--brown-light);font-size:0.8rem;">(b. ' + p.birthYear + ')</span>' : ''}</h3>
          <div class="meta">\${p.occupation || ''} \${p.hometown ? '\xB7 ' + p.hometown : ''}</div>
          \${p.relationships.length ? '<div class="tags">' + p.relationships.map(r => '<span class="tag">' + escapeHtml(r) + '</span>').join('') + '</div>' : ''}
          \${p.bio ? '<p style="margin-top:0.5rem;">' + escapeHtml(p.bio.substring(0, 200)) + (p.bio.length > 200 ? '...' : '') + '</p>' : ''}
        </div>
      </div>
    </div>
  \`).join('') || '<div class="empty-state">No family members recorded yet.</div>';
}

function renderStories() {
  document.getElementById('stories-list').innerHTML = stories.map(s => {
    const narrator = people.find(p => p.id === s.narratorId);
    return \`
      <div class="card fade-in">
        <h3>\${escapeHtml(s.title)}</h3>
        <div class="meta">\${narrator ? narrator.name : 'Unknown'} \xB7 \${s.dateOfEvent || 'Date unknown'} \xB7 <span class="tone-badge">\${s.emotionalTone}</span></div>
        <p>\${escapeHtml(s.text)}</p>
        <div class="tags">\${s.tags.map(t => '<span class="tag">' + escapeHtml(t) + '</span>').join('')}</div>
      </div>
    \`;
  }).join('') || '<div class="empty-state">No stories captured yet.</div>';
}

function renderTimeline() {
  document.getElementById('timeline-list').innerHTML = timelineEvents.map(e => \`
    <div class="timeline-item fade-in">
      <div><span class="year">\${e.year}</span> <span class="timeline-type">\${e.type}</span></div>
      <h3>\${escapeHtml(e.title)}</h3>
      <p>\${escapeHtml(e.description)}</p>
    </div>
  \`).join('') || '<div class="empty-state">No timeline events yet.</div>';
}

function renderRecipes() {
  document.getElementById('recipes-list').innerHTML = recipes.map(r => {
    const originator = people.find(p => p.id === r.originatorId);
    return \`
      <div class="card recipe-card fade-in">
        <h3>\${escapeHtml(r.name)}</h3>
        <div class="meta">\${originator ? originator.name : 'Unknown'} \${r.occasion ? '\xB7 ' + r.occasion : ''}</div>
        <div class="ingredients">
          <h4>Ingredients</h4>
          <ul>\${r.ingredients.map(i => '<li>' + escapeHtml(i) + '</li>').join('')}</ul>
        </div>
        <p><strong>Instructions:</strong> \${escapeHtml(r.instructions)}</p>
        <div class="backstory">\${escapeHtml(r.backstory)}</div>
      </div>
    \`;
  }).join('') || '<div class="empty-state">No family recipes recorded yet.</div>';
}

function renderPhotos() {
  document.getElementById('photos-list').innerHTML = photos.map(ph => \`
    <div class="card photo-card fade-in">
      <div class="photo-placeholder">\${escapeHtml(ph.description)}</div>
      <div class="meta">\${ph.date || 'Date unknown'}</div>
      <h3>The Story Behind This Photo</h3>
      <p>\${escapeHtml(ph.backStory)}</p>
      \${ph.peopleIds.length ? '<div class="tags" style="margin-top:0.5rem;">' + ph.peopleIds.map(id => {
        const p = people.find(x => x.id === id);
        return '<span class="tag">' + (p ? p.name : id) + '</span>';
      }).join('') + '</div>' : ''}
    </div>
  \`).join('') || '<div class="empty-state">No photos described yet.</div>';
}

function renderInterviews() {
  document.getElementById('interviews-list').innerHTML = interviews.map(i => {
    const interviewee = people.find(p => p.id === i.intervieweeId);
    return \`
      <div class="card fade-in">
        <h3>\${i.date} \u2014 \${interviewee ? interviewee.name : 'Unknown'}</h3>
        <div class="meta">\${i.duration || ''}</div>
        <div class="interview-topics">\${i.topics.map(t => '<span class="interview-topic">' + escapeHtml(t) + '</span>').join('')}</div>
        \${i.keyStories.length ? '<p><strong>Key stories:</strong> ' + i.keyStories.map(s => escapeHtml(s)).join(', ') + '</p>' : ''}
        \${i.notes ? '<p style="margin-top:0.5rem;color:var(--brown-light);font-style:italic;">' + escapeHtml(i.notes) + '</p>' : ''}
      </div>
    \`;
  }).join('') || '<div class="empty-state">No interviews logged yet.</div>';
}

function populateSelects() {
  const narratorSelects = ['s-narrator', 'r-originator', 'i-person'];
  narratorSelects.forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    sel.innerHTML = '<option value="">Select a person...</option>' +
      people.map(p => \`<option value="\${p.id}">\${p.name}</option>\`).join('');
  });
}

// \u2500\u2500 Add Functions \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

function uid() { return 'id-' + Math.random().toString(36).substring(2, 10); }

async function addPerson() {
  const person = {
    id: uid(),
    name: document.getElementById('p-name').value,
    birthYear: document.getElementById('p-birth').value ? parseInt(document.getElementById('p-birth').value) : undefined,
    deathYear: document.getElementById('p-death').value ? parseInt(document.getElementById('p-death').value) : undefined,
    relationships: document.getElementById('p-rel').value.split('\\n').filter(Boolean),
    occupation: document.getElementById('p-occ').value || undefined,
    hometown: document.getElementById('p-home').value || undefined,
    bio: document.getElementById('p-bio').value || undefined,
    photoDescription: undefined,
  };
  await apiPost('people', person);
  people.push(person);
  renderFamily();
  populateSelects();
  closeModal('person-modal');
}

async function addStory() {
  const story = {
    id: uid(),
    title: document.getElementById('s-title').value,
    narratorId: document.getElementById('s-narrator').value,
    dateOfEvent: document.getElementById('s-date').value || undefined,
    text: document.getElementById('s-text').value,
    tags: document.getElementById('s-tags').value.split(',').map(t => t.trim()).filter(Boolean),
    emotionalTone: document.getElementById('s-tone').value,
    createdAt: new Date().toISOString(),
  };
  await apiPost('stories', story);
  stories.unshift(story);
  renderStories();
  renderDashboard();
  closeModal('story-modal');
}

async function addTimelineEvent() {
  const event = {
    id: uid(),
    year: parseInt(document.getElementById('t-year').value),
    title: document.getElementById('t-title').value,
    description: document.getElementById('t-desc').value,
    peopleIds: [],
    type: document.getElementById('t-type').value,
  };
  await apiPost('timeline', event);
  timelineEvents.push(event);
  timelineEvents.sort((a, b) => a.year - b.year);
  renderTimeline();
  renderDashboard();
  closeModal('timeline-modal');
}

async function addRecipe() {
  const recipe = {
    id: uid(),
    name: document.getElementById('r-name').value,
    originatorId: document.getElementById('r-originator').value,
    ingredients: document.getElementById('r-ingredients').value.split('\\n').filter(Boolean),
    instructions: document.getElementById('r-instructions').value,
    backstory: document.getElementById('r-backstory').value,
    occasion: document.getElementById('r-occasion').value || undefined,
  };
  await apiPost('recipes', recipe);
  recipes.push(recipe);
  renderRecipes();
  renderDashboard();
  closeModal('recipe-modal');
}

async function addPhoto() {
  const peopleNames = document.getElementById('ph-people').value.split(',').map(n => n.trim()).filter(Boolean);
  const peopleIds = peopleNames.map(n => {
    const p = people.find(x => x.name.toLowerCase().includes(n.toLowerCase()));
    return p ? p.id : n;
  });
  const photo = {
    id: uid(),
    description: document.getElementById('ph-desc').value,
    date: document.getElementById('ph-date').value || undefined,
    peopleIds: peopleIds,
    backStory: document.getElementById('ph-backstory').value,
  };
  await apiPost('photos', photo);
  photos.push(photo);
  renderPhotos();
  closeModal('photo-modal');
}

async function addInterview() {
  const interview = {
    id: uid(),
    date: document.getElementById('i-date').value,
    intervieweeId: document.getElementById('i-person').value,
    topics: document.getElementById('i-topics').value.split(',').map(t => t.trim()).filter(Boolean),
    keyStories: document.getElementById('i-stories').value.split(',').map(s => s.trim()).filter(Boolean),
    duration: document.getElementById('i-duration').value || undefined,
    notes: document.getElementById('i-notes').value || undefined,
  };
  await apiPost('interviews', interview);
  interviews.unshift(interview);
  renderInterviews();
  renderDashboard();
  closeModal('interview-modal');
}

// \u2500\u2500 Chat \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

function appendChatMsg(role, content) {
  const container = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = \`chat-msg \${role} fade-in\`;
  div.innerHTML = \`
    <div class="avatar">\${role === 'assistant' ? 'L' : 'Y'}</div>
    <div class="chat-bubble">\${escapeHtml(content)}</div>
  \`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function appendStreamingMsg() {
  const container = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = 'chat-msg assistant fade-in';
  div.id = 'streaming-msg';
  div.innerHTML = \`
    <div class="avatar">L</div>
    <div class="chat-bubble"><div class="typing-indicator"><span></span><span></span><span></span></div></div>
  \`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return div;
}

function updateStreamingMsg(div, content) {
  const bubble = div.querySelector('.chat-bubble');
  bubble.textContent = content;
  const container = document.getElementById('chat-messages');
  container.scrollTop = container.scrollHeight;
}

async function sendChat() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;

  input.value = '';
  input.style.height = 'auto';
  chatMessages.push({ role: 'user', content: text });
  appendChatMsg('user', text);

  document.getElementById('chat-send').disabled = true;
  const streamDiv = appendStreamingMsg();

  try {
    const response = await fetch(\`\${API}/chat\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: chatMessages }),
    });

    if (!response.ok) throw new Error('Chat request failed');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              fullContent += delta;
              updateStreamingMsg(streamDiv, fullContent);
            }
          } catch (e) { /* skip non-JSON lines */ }
        }
      }
    }

    chatMessages.push({ role: 'assistant', content: fullContent });
  } catch (err) {
    updateStreamingMsg(streamDiv, 'I seem to have lost my train of thought. Could you say that again? (Error connecting to the historian.)');
  }

  document.getElementById('chat-send').disabled = false;
  input.focus();
}

function handleChatKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendChat();
  }
}

// Auto-resize textarea
document.getElementById('chat-input').addEventListener('input', function() {
  this.style.height = 'auto';
  this.style.height = Math.min(this.scrollHeight, 120) + 'px';
});

function startChatWithPrompt(prompt) {
  // Switch to chat tab
  document.querySelectorAll('.nav button').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelector('[data-tab="chat"]').classList.add('active');
  document.getElementById('tab-chat').classList.add('active');
  // Set prompt
  document.getElementById('chat-input').value = prompt;
  document.getElementById('chat-input').focus();
}

// \u2500\u2500 Initialize \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

async function init() {
  try {
    const [p, s, t, r, ph, i, pr] = await Promise.all([
      apiGet('people'),
      apiGet('stories'),
      apiGet('timeline'),
      apiGet('recipes'),
      apiGet('photos'),
      apiGet('interviews'),
      apiGet('prompts'),
    ]);
    people = p;
    stories = s;
    timelineEvents = t;
    recipes = r;
    photos = ph;
    interviews = i;
    prompts = pr;
  } catch (e) {
    console.error('Failed to load data:', e);
  }

  renderDashboard();
  renderFamily();
  renderStories();
  renderTimeline();
  renderRecipes();
  renderPhotos();
  renderInterviews();
  populateSelects();
}

init();
<\/script>
</body>
</html>
`;
}
__name(getAppHTML, "getAppHTML");
var src_default = {
  async fetch(request, env) {
    return handleRequest(request, env);
  }
};

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-bqjmqb/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-bqjmqb/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
__name(__Facade_ScheduledController__, "__Facade_ScheduledController__");
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = (request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
