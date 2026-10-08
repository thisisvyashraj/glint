# Blog content for Glint. Each post: slug, title, category, description, tags, body, cta (label, link).
# Body markup: blank line = new paragraph, "## " = heading, "- " lines = bullet list, [text](url) = link.
POSTS = [
("what-is-glint", "What Is Glint? Every AI Model in One Calm Workspace", "Guides",
 "Glint is a free, private AI workspace that puts Gemini, GPT, Claude, DeepSeek and more in one place. Here is what it does and who it is for.",
 ["Glint", "AI workspace", "multi-model AI", "getting started"],
 """If you use more than one AI, you know the pain: a tab for Gemini, another for ChatGPT, a third for Claude, and none of them remember what the others said. Glint was built to end that.

Glint is a free AI chat workspace that connects to many model providers at once. You bring your own API keys, pick a model from one dropdown, and keep every conversation in a single searchable history.

## What you get
- One chat window for Gemini, GPT, Claude, DeepSeek, Perplexity, Groq, OpenRouter and more
- Auto-pick, which switches to the best model for coding, research or writing
- Townhall, where several models debate your question
- Live web search, plus image, video and music modes
- Encrypted sync, so only you can read your chats

## Who it is for
Students who want clear explanations, developers who want a strong coding model, writers who want drafts with a voice, and researchers who want sources.

Because Glint uses your own keys, there is no markup on model prices, and several providers offer free tiers that cost nothing to start. Your chats and keys are encrypted in your browser before they sync anywhere.

Ready to try it? Open Glint, add one free key and ask your first question. The rest of this blog walks through every feature step by step.""",
 ("Open Glint", "/chat")),

("free-gemini-api-key-glint", "How to Get a Free Gemini API Key and Use It in Glint", "Guides",
 "Step-by-step: create a free Google Gemini API key in AI Studio and add it to Glint so you can chat, search the web and create images at no cost.",
 ["Gemini API key", "Google AI Studio", "free AI", "Glint setup"],
 """Gemini is the easiest way to start with Glint because Google offers a free tier for developers. Here is how to set it up in about two minutes.

## Create the key
- Visit Google AI Studio and sign in with your Google account
- Choose Get API key, then Create API key
- Copy the key somewhere safe. Treat it like a password

## Add it to Glint
- Open Glint and go to Account Center, then Settings and keys
- Paste the key into the Gemini field
- Press Save and Apply

That is it. Gemini models now appear in the model picker. Fast models are great for everyday questions, while larger ones handle harder reasoning, long documents and code.

## Good to know
Free tiers have rate limits that change over time, so check Google's page if you hit a limit. Your key is encrypted in your browser and is only sent to Google when you send a message. It never passes through Glint's server.

Gemini also powers Glint's image, video and music modes, so one key unlocks a lot. If you ever want a backup, add a second free key from Groq or OpenRouter and Glint will happily use either.

Never share your key in screenshots or public code. If it leaks, delete it in AI Studio and create a new one.""",
 ("Add your key in Glint", "/chat")),

("groq-api-key-fast-free-ai", "Groq in Glint: Blazing-Fast Free AI Answers", "Guides",
 "Learn how to add a free Groq API key to Glint and get near-instant answers from open models like Llama. Setup takes two minutes.",
 ["Groq", "fast AI", "Llama", "free API key"],
 """Some questions do not need a giant model. They need an answer right now. That is where Groq shines, and Glint makes it easy to use.

Groq runs open models, such as Llama, on specialised hardware, so replies stream back remarkably quickly. Groq also offers a free tier, which makes it a great second provider next to Gemini.

## Set it up
- Create a free account on the Groq console
- Open API Keys and create a new key
- In Glint, open Account Center, then Settings and keys, paste it into the Groq field and press Save and Apply

## When to pick Groq
- Quick drafts, summaries and rewrites
- Brainstorming where speed keeps you in flow
- Simple coding questions and regex help
- Testing a prompt before running it on a bigger model

## Pair it with Auto-pick
With Groq and Gemini both connected, you can keep Groq as your everyday model and let Glint's Auto-pick move to a stronger model when your message looks like heavy coding or research.

Free tiers have usage limits, so if you hit one, switch the model in the picker and carry on. Your key stays encrypted in your browser, and your chat history stays in one place no matter which model answered.""",
 ("Try a fast model", "/chat")),

("openrouter-one-key-hundreds-of-models", "OpenRouter in Glint: One Key, Hundreds of Models", "Guides",
 "Use a single OpenRouter key in Glint to reach hundreds of AI models, including free ones. Here is how to set it up and when it makes sense.",
 ["OpenRouter", "AI models", "API key", "free models"],
 """Collecting a separate key for every AI company gets tiring. OpenRouter solves that by giving you one key that reaches hundreds of models from many providers, and some of those models are free.

## Why use it with Glint
- One key instead of many accounts
- Access to models you may not have a direct key for
- A good fallback when another provider is rate limited
- Free models to experiment with at no cost

## Set it up
- Create an account on OpenRouter and generate an API key
- In Glint, go to Account Center, then Settings and keys
- Paste the key in the OpenRouter field and press Save and Apply

Open the model picker and you will see OpenRouter models grouped together. Try a free one first to confirm everything works.

## Tips
Model names and prices change often, so browse the OpenRouter list when you want something specific. If you use paid models, set a spending limit in your OpenRouter dashboard so nothing surprises you.

Glint treats OpenRouter like any other provider. Auto-pick can use it, Townhall can seat its models at the table, and your chats stay encrypted and in one history. It is the fastest way to explore what is out there.""",
 ("Explore models", "/chat")),

("auto-pick-best-ai-model", "Auto-Pick: How Glint Chooses the Best AI Model for Each Task", "Features",
 "Glint's Auto-pick detects whether you are coding, researching or writing, then switches to the strongest model you have a key for.",
 ["Auto-pick", "model routing", "best AI model", "Glint features"],
 """No single AI is best at everything. A model that writes beautiful prose may be average at debugging, and a research model may be clumsy with poems. Auto-pick takes that decision off your plate.

## How it works
When you send a message, Glint looks at what you are asking. If it looks like code, it prefers a strong coding model. If it looks like research, it prefers a model with strong reasoning and web knowledge. If it looks like writing, it reaches for your best writer.

Glint only chooses from providers you have added keys for, and it shows a small notice such as "Auto-picked Claude Sonnet for coding" so you always know what happened.

## You stay in control
- Pick a model by hand and Auto-pick steps aside
- Ask a general question and Glint returns to your own choice
- Turn it off anytime from the plus menu
- Multi-model chats are never switched

## Personas
Glint also adjusts tone for the task. Coding replies are precise and low on fluff, research replies compare views and label confidence, and writing replies are fuller and more creative.

The more providers you connect, the better Auto-pick gets. Two or three free keys are enough to feel the difference, and you never have to think about which model to use again.""",
 ("Try Auto-pick", "/chat")),

("townhall-ai-debate", "Townhall: Make AI Models Debate Your Question", "Features",
 "Townhall seats several AI models around a table to debate your question, then a chair writes the final answer. Learn when and how to use it.",
 ["Townhall", "AI debate", "multi-model", "decision making"],
 """Ask one AI a hard question and you get one opinion. Ask five and you get five, but you have to copy and paste between tabs. Townhall does the whole thing for you.

## What Townhall does
You choose a few models and pose a question. Each model gives its view, reacts to the others, and a chair model then writes a final answer that weighs the arguments. You see the disagreement, not just the conclusion.

## Great uses
- Big decisions, such as which framework to learn or which laptop to buy
- Essays and arguments where you want counterpoints
- Fact-heavy topics where models might disagree
- Feedback on your own writing, where blunt critics help

## Tips for better debates
- Ask open questions that have trade-offs
- Mix providers, for example Gemini with a Llama model, since different training gives different views
- Tell the table what you care about, such as cost, speed or safety

## When not to use it
For quick facts or simple edits, a single model is faster. Townhall is slower because several models are working, so save it for questions that deserve it.

You can open it from the sidebar or at the Townhall page. It uses the same keys you already added, and the full transcript is saved to your encrypted history.""",
 ("Open Townhall", "/townhall")),

("glint-encryption-explained", "How Glint Encrypts Your Chats So Only You Can Read Them", "Privacy",
 "A plain-English guide to Glint's privacy design: encryption in your browser, ciphertext-only sync, and what happens if you forget your password.",
 ["AI privacy", "encryption", "zero knowledge", "data security"],
 """Most chat apps keep your conversations on their servers in a form they can read. Glint is built the other way around.

## Encryption happens on your device
Your chats, settings and API keys are encrypted in your browser with AES-GCM before anything leaves your device. The key that does this is wrapped by your password and by a recovery code that you keep.

## What the server sees
If you create an account to sync across devices, our server stores ciphertext. That is unreadable bytes. It cannot read your messages, and it never receives your API keys. Those go straight from your browser to the model provider you choose.

## The trade-off
Because we cannot read your data, we cannot reset it for you. If you forget your password and lose your recovery code, your synced data cannot be recovered. Save the recovery code somewhere safe when you create your account.

## What is not private
- Messages go to the AI provider you select, under that provider's own policy
- Shared chat links are public by design, so only share what you are happy to publish
- Web search queries may be sent to search services when search is turned on

## No trackers
Glint does not use advertising or analytics trackers. You can read every detail in the [Privacy Policy](/privacy).

Privacy is not a feature you switch on. It is how the app is built, and it is why your keys and chats are safe to keep in one place.""",
 ("Read the Privacy Policy", "/privacy")),

("bring-your-own-key-byok", "Bring Your Own Key (BYOK): Why It Is Cheaper and Safer", "AI basics",
 "What bring-your-own-key means, why it can cost less than AI subscriptions, and how Glint keeps your keys private while you use them.",
 ["BYOK", "API key", "AI pricing", "AI subscriptions"],
 """Most AI subscriptions bundle one model into a monthly fee. Bring your own key, or BYOK, flips that. You get a key from the provider and pay only for what you use, or nothing at all on free tiers.

## Why BYOK can cost less
Light users often pay for a subscription they barely touch. With an API key, a few questions a day can cost pennies. Several providers, including Gemini, Groq and OpenRouter, also offer free models.

## Why it is more flexible
- Switch models in a click instead of switching apps
- Use the best model for each job
- No lock-in. Remove a key and you are done

## Is it safe?
Your key is like a password for your AI account, so it matters where it lives. In Glint, keys are encrypted in your browser and are only sent to the provider you picked. They never pass through Glint's server.

## Good habits
- Use a separate key for each app
- Set a spending limit in the provider dashboard
- Never paste keys into screenshots, chats or public code
- Delete and replace a key if you think it leaked

## Getting started
Begin with a free Gemini or Groq key and see how far you get. If you later add a paid provider, set a cap first. Understanding BYOK is the single best way to cut your AI costs while getting more choice, not less.""",
 ("Add a key", "/chat")),

("study-prompts-for-students", "10 Study Prompts for Students to Use in Glint", "Tips",
 "Ten practical prompts that turn Glint into a patient tutor: explain simply, quiz yourself, plan revision and check your own understanding.",
 ["study with AI", "student prompts", "AI tutor", "exam revision"],
 """AI can be a brilliant tutor if you ask it to teach rather than just answer. Here are ten prompts to paste into Glint, with a tip on when to use each.

## Understand
- Explain [topic] like I am 12, then like I am in grade 12
- Give me three real-life analogies for [concept]
- What are the most common mistakes students make with [topic]?

## Practise
- Quiz me on [chapter] with one question at a time and wait for my answer
- Give me five exam-style questions on [topic], then mark my answers strictly
- Create a worked example, then a similar problem for me to solve

## Revise
- Turn these notes into a one-page summary with key terms
- Build a seven-day revision plan for [exam] on [date], with 90 minutes a day
- Make flashcards from this text, question on one line and answer on the next

## Check yourself
Ask Glint to find gaps: tell it what you think you know about a topic and ask where you are wrong.

## Study smart with models
Try Townhall on tricky topics to see how different models explain the same idea. If one explanation clicks, keep it.

Remember that AI can make mistakes, so verify facts against your textbook before an exam. Use Glint to understand, not to copy. You will learn faster and remember more.""",
 ("Start studying", "/chat")),

("debug-code-with-ai-glint", "Debug Code Faster with AI in Glint", "Tips",
 "A practical workflow for debugging with AI: how to describe errors, what to paste, and how Glint's coding mode picks a strong model for you.",
 ["debug code", "AI coding assistant", "programming help", "developer tips"],
 """Staring at a stack trace is slow. A good AI model can spot the problem in seconds, if you give it the right information.

## What to include
- The exact error message and stack trace
- The smallest piece of code that still fails
- What you expected to happen and what happened instead
- The language, framework and versions you use

## A prompt that works
Here is my code and the error. Explain the cause in two sentences, then show the corrected code and why it works.

Asking for the cause first stops the model from just rewriting everything, and you learn something each time.

## Let Glint choose
When your message looks like code, Auto-pick moves to a strong coding model among your providers, and Glint switches to precise, low-fluff replies with syntax-highlighted blocks and one-click copy.

## More tips
- Ask for a test that reproduces the bug
- Request two alternative fixes with trade-offs
- Use extended thinking for tricky logic or concurrency bugs
- Run Townhall when models might disagree about the best approach

## Stay careful
Review every change before pasting it into production, and never share secrets or private keys in a prompt. Think of the AI as a fast pair programmer who still needs a code review.""",
 ("Debug with Glint", "/chat")),

("live-web-search-research", "Research With Live Web Search in Glint", "Features",
 "Turn on web search in Glint to get answers grounded in current sources instead of guesses. Learn how to ask, verify and compare viewpoints.",
 ["AI research", "web search", "fact checking", "citations"],
 """AI models learn from data that stops at a certain date. For anything recent, such as news, prices or new software, they can sound confident and still be out of date. Live web search fixes that.

## Turn it on
Open the plus menu in the chat bar and enable web search. Glint then fetches fresh pages for your question and gives the model real text to work from.

## Ask better research questions
- Be specific: include the topic, the time frame and what decision you need to make
- Ask for sources and for the strongest evidence on each side
- Ask the model to separate facts from opinions
- Request a short table when comparing options

## Verify before you trust
Even with search, models can misread a page. Open the sources it cites and check the key numbers yourself. If two sources disagree, ask Glint to explain why.

## Use the right model
For research tasks, Auto-pick prefers models with strong reasoning and, if you have a key, research-focused ones such as Perplexity. Research replies are written to compare views and label confidence.

## Privacy note
When search is on, your query may be sent to search services to fetch pages. Turn it off for sensitive topics.

Used well, live search turns Glint into a research assistant that shows its work.""",
 ("Try web search", "/chat")),

("write-with-ai-keep-your-voice", "Write With AI Without Losing Your Voice", "Tips",
 "How writers can use AI as a thinking partner while keeping their own style: prompts for ideas, feedback and editing that still sound like you.",
 ["writing with AI", "creative writing", "AI for writers", "editing"],
 """I write poetry and stories, and I will say it plainly: the words should be yours. But AI can still be a wonderful partner if you use it for the right jobs.

## Where AI helps
- Brainstorming angles, titles and opening lines
- Unsticking you when a scene or stanza is stuck
- Finding weak spots in your own draft
- Tightening grammar and clarity

## Keep your voice
Paste a few paragraphs you wrote and say: study my style, then give feedback in the margins only. Do not rewrite. This keeps every sentence yours.

## Prompts to try
- Give me ten unusual first lines for a story about [theme]
- Which sentences in my draft feel generic? Why?
- What is my reader likely to feel at the end, and is that what I intended?

## Use Townhall as an editorial board
Seat a few models around the table and ask for blunt feedback on your draft. Different models notice different things, and disagreement is useful.

## Draft first, ask later
Write a messy first version on your own, then bring in AI. You will notice what is working and what is not far better than if you start from a generated draft.

Writing mode in Glint is tuned for fuller, more creative replies. Use it for inspiration, then close the tab and write like only you can.""",
 ("Write in Glint", "/chat")),

("compare-ai-models-side-by-side", "Compare AI Models Side by Side in Glint", "Features",
 "Send one prompt to several AI models and compare answers in one place. Learn how to judge quality, speed and tone to find your favourite.",
 ["compare AI models", "multi-model chat", "AI benchmark", "model comparison"],
 """Reviews and leaderboards help, but nothing beats testing models on your own questions. Glint makes comparison easy because every model lives in the same workspace.

## How to compare
- Ask the same prompt in two chats using different models
- Or use Townhall to see several models answer together
- Keep the prompt identical so the comparison is fair

## What to look at
- Accuracy: did it get the facts and logic right?
- Clarity: could you act on the answer immediately?
- Tone: does it sound the way you want?
- Speed: fast models keep you in flow
- Length: concise is often better than long

## Build a tiny test set
Pick five prompts that matter to you, such as a coding bug, a summary of an article, a tricky maths question, a piece of creative writing and a research question. Run each one on every model. Write down which won.

## Use the results
Once you know that one model is best for code and another for essays, you can pick by hand or let Auto-pick follow your keys.

## Remember the limits
One test is not proof. Models change after updates, so recheck now and then. Free tiers may use smaller models than paid ones.

The goal is not to crown a winner. It is to learn which model fits each of your jobs.""",
 ("Compare models", "/townhall")),

("extended-thinking-when-to-use", "Extended Thinking: When to Turn It On in Glint", "Features",
 "Extended thinking makes AI models reason longer before answering. Learn which tasks benefit, which do not, and how it affects speed.",
 ["extended thinking", "AI reasoning", "chain of thought", "Glint features"],
 """Some questions are easy. Others need a model to slow down and work through the steps. Extended thinking tells the model to do exactly that.

## What it does
With extended thinking on, the model spends more effort reasoning before it writes the final answer. Replies take a little longer but are often more careful on hard problems.

## Turn it on for
- Maths, logic puzzles and multi-step word problems
- Tricky bugs, algorithms and design decisions
- Planning, such as a project schedule with constraints
- Questions where earlier answers felt shallow

## Leave it off for
- Quick facts and definitions
- Simple rewrites and translations
- Casual chat and brainstorming
- Anything where speed matters more than depth

## Get the best results
- State the problem clearly and include every constraint
- Ask the model to check its own answer
- Use a model that supports deeper reasoning. Not every model does
- Combine it with Townhall when you want a second opinion

## Mind the cost
Longer reasoning can use more tokens, which matters if you pay per use. If you are on a free tier, you may hit limits sooner.

Think of extended thinking like asking a friend to take a minute before answering. Use it when the minute is worth it.""",
 ("Try it in chat", "/chat")),

("install-glint-on-phone", "How to Install Glint on Your Phone or Desktop", "Guides",
 "Glint is a progressive web app. Add it to your home screen on iPhone or Android, or install it in Chrome and Edge, in under a minute.",
 ["install PWA", "AI app on phone", "add to home screen", "Glint mobile"],
 """Glint works in your browser, but it also installs like an app, with its own icon, full-screen window and offline support for chats you have already loaded. That is called a progressive web app.

## On iPhone or iPad
- Open Glint in Safari
- Tap the Share button
- Choose Add to Home Screen, then Add

## On Android
- Open Glint in Chrome
- Tap the menu with three dots
- Choose Install app or Add to Home screen

## On desktop
In Chrome or Edge, look for the install icon at the right end of the address bar, or open the browser menu and choose Install Glint.

## Why install it
- One tap from your home screen
- A cleaner, full-screen layout without browser bars
- Faster loading thanks to cached files
- Your existing chats open offline

## Updates
When we release an update, Glint tells you so you can reload and get the latest version. There is no app store to wait for.

## Tips
Sign in once on each device to sync your encrypted chats. Keep your recovery code safe, because you will need your password on every new device.

Glint is designed to feel just as good on a phone or tablet as on a desktop, so install it wherever you think best.""",
 ("Open Glint", "/chat")),

("temporary-chats-privacy", "Temporary Chats: Private Conversations That Leave No Trace", "Privacy",
 "Use Glint's temporary chat for sensitive questions. It is never saved or synced and disappears when you leave. Here is when to use it.",
 ["temporary chat", "private AI chat", "incognito AI", "privacy"],
 """Sometimes you want to ask something without it living in your history forever. A health worry, a rough idea, a draft you are not ready to keep. Temporary chat is for those moments.

## What it does
A temporary chat is never saved to your history and never synced to your other devices. When you switch away or close the tab, it is gone.

## Good uses
- Sensitive questions you do not want stored
- Quick experiments that would clutter your history
- Testing prompts on a shared or borrowed device
- Drafts you only need once

## What it does not do
Temporary does not mean invisible. Your message still goes to the AI provider you choose, and their own policy decides what they keep. Check your provider's settings if that matters to you. If web search is on, your search query may also be sent to search services.

## Combine it with good habits
- Do not paste passwords, API keys or private documents into any AI
- Turn off web search for sensitive topics
- Sign out on shared devices

## Everything else stays encrypted
Your normal chats are encrypted in your browser before they sync, so only you can read them. Temporary chats simply go one step further by not being stored at all.

You can read the full details in our [Privacy Policy](/privacy).""",
 ("Start a chat", "/chat")),

("import-memory-from-another-ai", "Import Your Memory From Another AI Into Glint", "Guides",
 "Moving to Glint does not mean starting over. Import what your old assistant knows about you with a simple copy-and-paste flow.",
 ["import memory", "switch AI", "AI memory", "personalization"],
 """If you have used another AI for a while, it probably learned your preferences, your projects and the way you like answers. Glint lets you bring that context with you.

## How it works
- Open Account Center, then Personalization
- Choose the import option
- Copy the prompt Glint gives you
- Paste it into your old assistant and let it list what it remembers
- Paste its answer back into Glint

Glint reads that summary and adds the useful parts to your personalization so new chats already feel familiar.

## Review before saving
Take a minute to read what was imported. Remove anything outdated, wrong or too personal. You are in control of what Glint remembers.

## Add custom instructions too
In Personalization you can also write standing instructions, such as keep answers short, explain code with comments, or always show sources. These apply to every chat.

## Privacy
Your personalization is encrypted in your browser like your chats. Only you can read it. You can edit or delete it anytime from Account Center.

## Start fresh when you want
You do not have to import anything. A blank slate is a fine place to begin, and you can add context bit by bit.

Switching tools is easier when your context comes along. Spend five minutes on this and every future chat gets better.""",
 ("Open Personalization", "/chat")),

("glint-keyboard-shortcuts", "Glint Keyboard Shortcuts and Power-User Tricks", "Tips",
 "Work faster in Glint with keyboard shortcuts, quick model switching, temporary chats and a few habits that save time every day.",
 ["keyboard shortcuts", "productivity", "power user", "Glint tips"],
 """A few small habits make Glint much faster to use. Here are the ones worth learning.

## Keyboard shortcuts
- Ctrl or Cmd plus K searches your chats
- Enter sends your message
- Shift plus Enter adds a new line
- Esc closes dialogs and menus

## Speed up your day
- Keep a fast, free model as your default for everyday questions
- Let Auto-pick switch to a stronger model for code and research
- Use the plus menu for web search, extended thinking and temporary chat
- Pin or rename important chats so they are easy to find later

## Use search
Search is more powerful than scrolling. Type a keyword from an old chat and jump straight to it. This makes your history a personal knowledge base.

## Save good prompts
When a prompt works well, keep it. Put it in your custom instructions or a note, and reuse it with different topics.

## Work on any screen
Install Glint as an app on your phone for quick questions on the go. Your encrypted chats sync, so you can start on one device and finish on another.

## Check settings once
Spend two minutes in Account Center. Set your theme, your tone and your custom instructions. A little setup pays off in every future chat.

Shortcuts are small, but small things done a hundred times add up to hours.""",
 ("Open Glint", "/chat")),

("create-images-video-music-gemini", "Create Images, Video and Music With Gemini Inside Glint", "Features",
 "Glint is not just text. Switch modes to create images, video and music using Gemini models. Learn how, and how to write better creative prompts.",
 ["AI image generation", "AI video", "AI music", "Gemini"],
 """Glint can create more than words. With a Gemini key, you can switch the chat bar into image, video and music modes and describe what you want.

## How to switch modes
Use the mode chip in the chat bar to move between Chat, Image, Video and Music. Type your idea and send it, just like a normal message.

## Writing better image prompts
- Describe the subject, the setting and the mood
- Name a style, such as watercolor, film photo or flat illustration
- Mention lighting and colors, for example warm sunset light and purple tones
- Say what to avoid, such as no text or no people

## Video and music
Keep these prompts short and vivid. For video, describe one scene and one motion. For music, name the genre, the mood and the instruments, such as calm lo-fi with soft piano.

## Iterate
Your first result is a sketch. Change one thing at a time, such as the style or the lighting, and try again. Small edits teach you what the model responds to.

## Be responsible
Do not create misleading images of real people, and respect copyright and the provider's rules. Free tiers may limit how many creations you can make.

Creative modes use the same encrypted history and the same Gemini key you already added, so there is nothing extra to set up.""",
 ("Create something", "/chat")),

("better-prompts-seven-rules", "Seven Rules for Better AI Prompts That Work on Any Model", "AI basics",
 "Better prompts mean better answers. These seven simple rules work with Gemini, GPT, Claude, Llama and every other model you use in Glint.",
 ["prompt engineering", "better prompts", "AI tips", "ChatGPT alternatives"],
 """You do not need magic words. You need clear instructions. These seven rules improve answers on every model.

## 1. Say who the answer is for
Explain it to a beginner, or write for a busy manager. Audience changes everything.

## 2. State the goal
Tell the model what you will do with the answer. Summarize this to decide whether to buy it is better than summarize this.

## 3. Give context
Paste the relevant text, code or numbers. Models cannot see what you can see.

## 4. Set the format
Ask for a table, five bullets, a short paragraph or step-by-step. Specific beats vague.

## 5. Add constraints
Word count, tone, things to avoid, and the level of detail all help.

## 6. Show an example
If you want a certain style, include a short sample. Models copy patterns very well.

## 7. Iterate
Treat the first answer as a draft. Say make it shorter, more formal or add a counterargument.

## A quick template
Role, task, context, format, constraints. Filling those five slots usually gives a strong result.

## Try different models
The same prompt can produce different answers on different models. In Glint you can test it across several in a click, or run Townhall to see them side by side.

Practice beats theory. Pick one rule, use it all week, then add the next.""",
 ("Practice in Glint", "/chat")),

("fact-check-ai-answers", "How to Fact-Check AI Answers Quickly", "AI basics",
 "AI can sound sure and still be wrong. Use these quick checks, plus web search and Townhall in Glint, to verify answers before you rely on them.",
 ["fact check AI", "AI hallucinations", "verify AI answers", "AI safety"],
 """AI models are fluent, and fluent is not the same as correct. They can invent facts, numbers and even sources. A few quick habits keep you safe.

## Red flags
- Very specific numbers or quotes with no source
- Names of studies, books or links you cannot find
- Confident answers about recent events
- Answers that change when you ask again

## A fast checking routine
- Ask the model how sure it is and what could be wrong
- Turn on web search in Glint and ask for sources
- Open the sources and check the key claim yourself
- Search two independent websites for the same fact

## Use more than one model
Ask the same question to a second model, or use Townhall to see several answer together. If they disagree, the topic deserves a closer look.

## Know the high-stakes areas
Be extra careful with health, law, money and safety. Treat AI as a starting point for questions to ask a professional, not as the final word.

## Use AI for what it is good at
Models are great for explaining ideas, drafting and brainstorming. They are weaker as an encyclopedia of precise facts without sources.

## Teach yourself to verify
Make checking a habit, not a chore. Two minutes of verification can save you from sharing a wrong claim.

Glint gives you the tools. Search, multiple models and linked sources make it easier to confirm than to trust blindly.""",
 ("Try search in Glint", "/chat")),

("why-i-built-glint", "Why I Built Glint: A Student's Story", "Story",
 "I am V Yash Raj, a high school student and author. This is the story of why I built Glint and what I hope it makes easier for people like me.",
 ["V Yash Raj", "Glint story", "student developer", "building in public"],
 """I am V Yash Raj. I am a high school student, I write poetry and stories, and I wrote a book called Indulgent Echoes. I also love building things for the web.

## The problem
I kept switching between AI tabs. One was better at code, another at explaining science, another at writing. None of them shared history, and my best ideas were scattered across five different chats.

## The idea
What if every model lived in one calm place? One chat, one history and one search bar. Better still, what if the app did not need to see my private conversations at all?

## What I built
Glint connects to many AI providers using your own keys. It chooses the best model for the job, lets models debate in Townhall, searches the web when you ask, and encrypts everything in your browser before it syncs.

## What I learned
Building Glint taught me about security, design and patience. Every feature I shipped came from something I wanted as a student and writer. I tested it on my own homework, essays and code.

## Where it is going
I want Glint to be fast on a phone, kind to beginners and respectful of privacy. I read every message sent through the contact page.

If you try Glint and have ideas, I would love to hear them. You can also meet me on the [About page](/about).

Thank you for reading, and happy building.""",
 ("Meet the creator", "/about")),
]
