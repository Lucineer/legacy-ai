import { seedDatabase } from './legacy/tracker';
import type { Person, Story, TimelineEvent, Recipe, PhotoEntry, Interview } from './legacy/tracker';

export interface Env {
  DEEPSEEK_API_KEY: string;
  ASSETS: { fetch: (request: Request) => Promise<Response> };
}

const db = seedDatabase();

const SYSTEM_PROMPT = `You are Legacy, a family historian. You conduct interview-style conversations to capture stories, memories, and family lore. Ask thoughtful follow-up questions. Help people articulate memories they didn't know they had. Be warm, patient, respectful.

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
- Eleanor Morrison née Walsh (1932-2020): School teacher, secret poet, legendary gardener
- Their children David (civil engineer) and Sarah (librarian)
- David married Linda Chen (nurse, brought Cantonese traditions)
- Sarah married James Mitchell (history professor, family archivist)
- Six grandchildren: Ryan, Emma, Caleb, Sophie, Olivia
- Great-granddaughter Mia (born 2018)
- 8 stories captured, spanning 1954-2020
- Signature family dishes: wonton soup, apple butter, railroad coffee
- Key themes: quiet love, food as language, work as identity, stories hidden in plain sight`;

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}

async function handleChat(request: Request, env: Env): Promise<Response> {
  const { messages } = (await request.json()) as { messages: { role: string; content: string }[] };

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
      stream: true,
      max_tokens: 1024,
      temperature: 0.8,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    return new Response(err, { status: response.status });
  }

  return new Response(response.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

function handlePeople(request: Request): Response {
  if (request.method === 'POST') {
    return request.json().then((data) => {
      const person = data as Person;
      db.familyTree.add(person);
      return jsonResponse(person, 201);
    }) as Promise<Response>;
  }
  return jsonResponse(db.familyTree.getAll());
}

function handleStories(request: Request): Response {
  if (request.method === 'POST') {
    return request.json().then((data) => {
      const story = data as Story;
      db.stories.add(story);
      return jsonResponse(story, 201);
    }) as Promise<Response>;
  }
  return jsonResponse(db.stories.getAll());
}

function handleTimeline(request: Request): Response {
  if (request.method === 'POST') {
    return request.json().then((data) => {
      const event = data as TimelineEvent;
      db.timeline.add(event);
      return jsonResponse(event, 201);
    }) as Promise<Response>;
  }
  return jsonResponse(db.timeline.getAll());
}

function handleRecipes(request: Request): Response {
  if (request.method === 'POST') {
    return request.json().then((data) => {
      const recipe = data as Recipe;
      db.recipes.add(recipe);
      return jsonResponse(recipe, 201);
    }) as Promise<Response>;
  }
  return jsonResponse(db.recipes.getAll());
}

function handlePhotos(request: Request): Response {
  if (request.method === 'POST') {
    return request.json().then((data) => {
      const photo = data as PhotoEntry;
      db.photos.add(photo);
      return jsonResponse(photo, 201);
    }) as Promise<Response>;
  }
  return jsonResponse(db.photos.getAll());
}

function handleInterviews(request: Request): Response {
  if (request.method === 'POST') {
    return request.json().then((data) => {
      const interview = data as Interview;
      db.interviews.add(interview);
      return jsonResponse(interview, 201);
    }) as Promise<Response>;
  }
  return jsonResponse(db.interviews.getAll());
}

function handlePrompts(): Response {
  return jsonResponse(db.insights.generatePrompts());
}

async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;

  // CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  // API routes
  if (path === '/api/chat' && request.method === 'POST') {
    return handleChat(request, env);
  }
  if (path === '/api/people' && (request.method === 'GET' || request.method === 'POST')) {
    return handlePeople(request);
  }
  if (path === '/api/stories' && (request.method === 'GET' || request.method === 'POST')) {
    return handleStories(request);
  }
  if (path === '/api/timeline' && (request.method === 'GET' || request.method === 'POST')) {
    return handleTimeline(request);
  }
  if (path === '/api/recipes' && (request.method === 'GET' || request.method === 'POST')) {
    return handleRecipes(request);
  }
  if (path === '/api/photos' && (request.method === 'GET' || request.method === 'POST')) {
    return handlePhotos(request);
  }
  if (path === '/api/interviews' && (request.method === 'GET' || request.method === 'POST')) {
    return handleInterviews(request);
  }
  if (path === '/api/prompts' && request.method === 'GET') {
    return handlePrompts();
  }

  // Serve static HTML
  if (path === '/' || path === '/index.html') {
    const html = await env.ASSETS?.fetch(new Request('http://localhost/app.html'));
    if (html) return html;
    // Fallback: serve from KV or static
    return new Response('Not found', { status: 404 });
  }

  return new Response('Not found', { status: 404 });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return handleRequest(request, env);
  },
};
