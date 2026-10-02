export const projects = [
  {
    slug: "penn-electric-racing",
    title: "Penn Electric Racing",
    category: "Design / 3D",
    description: "Design and operations for formula racing team",
    links: [
      { url: "https://www.pennelectricracing.com/" },
      { url: "https://www.youtube.com/watch?v=Tpl9AfQJKxo", label: "Watch Unveiling Video" },
    ],
    thumbnail: {
      type: "photo",
      src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1779599480/Untitled_design_euajtv.png",
    },
    hero: {
      type: "image",
      src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1790653516/d962af16-0a03-459f-abe1-0a1cc4d5ff76.png",
    },
    meta: {
      role: "Media / Business Operations / Project Manager",
      collaborators: "Operations Team",
      duration: "2025 – Present",
      tools: "Solidworks, Vercel, Blender, Maya, Adobe Suite, Procreate, Notion",
    },
    content: [
      {
        type: "text",
        title: "Overview",
        body: "Penn Electric Racing (REV11) needs visuals that work for sponsors, social media, and internal morale. My role is to be in charge of creating the livery, car renders, sponsor-facing posters and presentation assets, and tooling that keeps the business team aligned with engineering milestones.",
      },
      {
        type: "callout",
        icon: "lightbulb",
        title: "Working with the system",
        body: "Penn Electric Racing already has an established design language, evident in the maintenance of their website, social media, club colors and fonts. As a designer I try to create material that both emulates and expands on the visual style of the team.",
      },
      {
        type: "text",
        title: "Rendering 3D Models",
        body: "PER can benefit from more sophisticated 3D models that serve as visuals for its social media and merch. I followed my own guidelines in creating a scalable and efficient pipeline to treat the thousands of parts on the car through different versions.",
      },
      {
        type: "image",
        src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1790648865/anduril_v4_mdfsnf.png",
        caption: "A 3D model using the materials system I developed, used in our 2026-2027 sponsorship package. The layout is inspired by a graphic for the Anduril Fury.",
      },
      { type: "text", title: "Use Cases" },
      {
        type: "callout",
        columns: 2,
        items: [
          {
            icon: "presentation",
            title: "Presentation visual aid",
            body: "The models have to match our business presentation's need of labeling individual parts without much visual clutter.",
          },
          {
            icon: "shirt",
            title: "Merch and Media",
            body: "The models also have to be flexible enough to be incorporated into our sponsorship package, merch, unveiling and social media posts.",
          },
        ],
      },
      {
        type: "text",
        title: "A Messy Manual Pipeline",
        body: "As I was making visuals for models, I started off with a raw import without any modifications from Solidworks to Maya, and immediately ran into performance issues. Seeing no apparent alternatives, I manually adjusted parameters in all of the 3D apps I imported the CAD to, with much chagrin.",
      },
      {
        type: "image",
        src: "https://res.cloudinary.com/fet3ks1c/image/upload/v1790819098/REV11_fully_textured.jpg",
      },
      {
        type: "callout",
        icon: "frown",
        title: "Solidworks Visualize",
        body: "Although the materials transition was the easiest, the renderer struggled massively with the file size, taking 10 hours to render a video filled with graphical glitches due to an unoptimized model. I realized I needed to retopologize or delete some parts manually to keep the poly count low.",
      },
      {
        type: "video",
        src: "https://res.cloudinary.com/fet3ks1c/video/upload/v1790819508/translucent_test_vid_1.mp4",
      },
      {
        type: "callout",
        icon: "frown",
        title: "Maya",
        body: "Maya was a better alternative, but it struggled with the massive amount of duplicate objects merged into each other and thousands of unwanted materials (opening Hypershade would crash my computer). However, I was able to utilize the nCloth feature to render a few test scenes for the car unveiling.",
      },
      {
        type: "image",
        src: "https://res.cloudinary.com/fet3ks1c/image/upload/v1790819710/Screenshot_2026-03-27_at_1.23.22_AM.png",
      },
      {
        type: "callout",
        icon: "smile",
        title: "Blender",
        body: "I completed my retopology and added modifiers to different parts to create wireframe animations here. Using shader graphs, I created most of the animated shaders shown in the presentations and videos below.",
      },
      {
        type: "text",
        title: "Next Steps",
        body: "The current system is time consuming and stressful to operate. With the appearance of new technology that connects CAD with other types of rendering and simulation software, I'm currently working on modular, efficient software that allows different parts of the team to access certain parts of a vehicle's information without overriding anything.",
      },
      {
        type: "image",
        src: "https://res.cloudinary.com/fet3ks1c/image/upload/v1790822506/3c1531cc-9fc5-4e37-8579-1ab4e699ad3c.png",
        caption: "The proposed software stack. Currently building using Cursor and GrokBot.",
      },
      {
        type: "callout",
        icon: "notebook-pen",
        title: "Final Thoughts",
        body: "In a new era of photorealistic graphics, as a cutting-edge competition racing team, I feel like I've taken us a step forward. In the coming year, I will work closely with the vehicle dynamics team and the driverless team to improve my system. Although the technological hurdle is significant, I believe that with the time saved transferring between different file systems and the potential of agents to automate the maintenance of vehicle systems as a whole, this can be more than a fancy pipeline for 3D renderings. It can be a way to speed up all kinds of testing and design work.",
      },
      {
        type: "text",
        title: "GM Presentation",
        body: "Created presentation that utilized limited space and optimized design and clarity of content.",
      },
      {
        type: "image",
        src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1790651510/e30507f3-6321-4ca8-9b2c-4bcd1068d2eb.png",
        caption: "Process breakdown",
      },
      {
        type: "image",
        src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1790649636/Penn_Electric_Racing_070_-_2026_Excellence_in_Technical_Innovation_Award_Submission-3_uinwhv.png",
        caption: "Finalized slides. The presentation won 1st place in the Excellence in Technical Innovation category, earning ~$8,000 in prize money for free registration for the team.",
      },
      {
        type: "text",
        title: "Business Presentation",
        body: "Created stylized renders to visually demonstrate presentation topics.",
      },
      {
        type: "image",
        src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1768443294/cover_design_2_dt5pgo.png",
        caption: "Business presentation cover, made using Photoshop and Maya",
      },
      {
        type: "video",
        src: "https://res.cloudinary.com/dak0zi45d/video/upload/v1779599483/0000-0630_PER_biz_prez_ctejsr.mov",
        caption: "Video breaking down different part categories",
      },

      {
        type: "text",
        title: "Livery exploration",
        body: "Livery directions are prototyped in Solidworks and Blender texture painting so the team can compare scale, contrast, and sponsor lockups before paint shop commitments.",
      },
      {
        type: "gallery",
        columns: 1,
        items: [
          {
            type: "image",
            src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1768443546/livery_designs_fkypyc.png",
            caption: "Early livery roughs board",
          },
          {
            type: "image",
            src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1772938899/Screenshot_2026-02-08_at_8.45.57_PM_rs34rx.png",
            caption: "Livery iteration A. These 3D mockups are done with texture painting in Blender, with retopologized cad models and low-poly versions of the car modeled by myself.",
          },
          {
            type: "image",
            src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1772938899/Screenshot_2026-02-08_at_8.47.32_PM_gpil4p.png",
            caption: "Livery iteration B",
          },
          {
            type: "image",
            src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1773291728/download_2_kkzpq4.png",
            caption: "Final revision — Blender texture paint",
          },
          {
            type: "image",
            src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1773291414/Screenshot_2026-03-11_225932_enfvvu.png",
            caption: "Solidworks livery prototype",
          },
                    {
            type: "image",
            src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1790653122/DSC04492_aoifds.jpg",
            caption: "Finalized livery design. Image credit: Arjun Sharma",
          },
        ],
      },
      {
        type: "video",
        src: "https://res.cloudinary.com/dak0zi45d/video/upload/v1772842240/rev_11_logo_test_v4_el956p.mp4",
        caption: "REV11 logo animation — done in Rive",
      },
      {
        type: "text",
        title: "Car visualization",
        body: "Full-car renders combine Solidworks CAD, Visualize, and Maya for lighting passes used in decks and Instagram.",
      },
      {
        type: "gallery",
        columns: 1,
        items: [
          {
            type: "image",
            src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1768442453/per_good_render_2_lnzuf6.jpg",
            caption: "Studio render — three-quarter front",
          },
          {
            type: "image",
            src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1768442452/per_good_render_3_ptceqx.jpg",
            caption: "Studio render — side elevation",
          },
          {
            type: "image",
            src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1768442452/per_good_render_5_ml3xcb.jpg",
            caption: "Solidworks → Visualize → Maya pipeline",
          },
          {
            type: "image",
            src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1768442452/per_good_render_6_phw7ny.jpg",
            caption: "Detail render — aero and sponsor panels",
          },
        ],
      },
      {
        type: "text",
        title: "Posters & business media",
        body: "Poster and cover art support recruitment and sponsor meetings — often starting in 3D and finishing in Photoshop or Procreate for hand-tuned typography.",
      },
      {
        type: "gallery",
        columns: 1,
        items: [
          {
            type: "image",
            src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1790648869/design-1778317614466_qvzjvu.png",
            caption: "Competition uniforms design",
          },
          {
            type: "image",
            src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1768442451/PER_car_drifting_better_v2_ps_cvjatn.png",
            caption: "Poster — Photoshop and Gemini assist",
          },
          {
            type: "image",
            src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1768442913/IMG_2018_2_guzdye.png",
            caption: "Render-to-poster workflow — Maya and Procreate",
          },
          {
            type: "image",
            src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1768442913/Rev_11_comic_better_lettering_t3y9nt.png",
            caption: "Rally-style poster variant",
          },
          {
            type: "image",
            src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1768442716/Untitled_Artwork_1_bs0bnx.png",
            caption: "Concept sketch — composition study",
          },
          {
            type: "image",
            src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1768442715/Untitled_-_December_11_2025_01.13.36_ybcmhj.jpg",
            caption: "Poster rough sketches",
          },
        ],
      },
      {
        type: "image",
        src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1790652314/000383660022_l9sne0.jpg",
        caption: "Penn Electric Racing was one of the most stressful, challenging and exhilarating experiences of my freshman year. I learned so much and I'll do it again without hesitation, but I will also keep the life lessons in my heart.",
      },
    ],
  },
  {
    slug: "provelis",
    title: "Provelis",
    category: "UI / Product",
    description: "Complete UI overhaul and frontend–backend integration for a recruiting platform",
    thumbnail: {
      type: "video",
      //src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1790642179/d7790251-8429-4deb-af56-9ff3ca85aa63.png",
      src: "https://res.cloudinary.com/dak0zi45d/video/upload/v1784453857/Screen_Recording_2026-07-19_at_5.35.46_AM_exov4y.mov",
    },
    hero: {
      type: "image",
      src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1790647084/ddf97bda-00dd-4f01-9c0b-430bd12d2585.png",
    },
    meta: {
      role: "UI contractor",
      collaborators: "Axiom / Caliber team",
      duration: "Jun – Jul 2026",
      tools: "Figma, React, TypeScript, Cursor",
    },
    content: [
      {
        type: "text",
        title: "Overview",
        body: "Provelis is a talent-intelligence console for time-boxed staffing on large IT deals. Deal data comes in — what needs to be done, by whom, and where — and a recruiting supervisor tracks which job requirements are actually filling. I was hired on a short contract to overhaul a vibe-coded UI so it could hold up for enterprise users, and to wire the new screens to live backend services before a July go-live.",
      },
      {
        type: "image",
        src: "https://res.cloudinary.com/fet3ks1c/image/upload/v1790910369/Untitled_Artwork_78.png",
        caption: "How Provelis sits in the hiring loop. Candidates come in from job boards and people looking for work. Provelis runs interview flows out to recruiters, takes their manual reviews back in, and stays connected to Axiom so the console can handle a large, time-boxed search without the team leaving the tool.",
      },
      {
        type: "text",
        title: "The brief",
        body: "The first assignment was one home screen. Most of the pipeline was already automated from requirement to shortlist. What still needed a person was candidates answering interviews and recruiters reviewing the top ones. The page had to show, in order: where that pipeline was stalling, open jobs and their status, AI interview scorecards, and who needed a decision — with a prompt button, not just a number. The look was corporate, data-dense, and still readable.",
      },
      {
        type: "callout",
        columns: 2,
        items: [
          {
            icon: "target",
            title: "Shorter paths",
            body: "Leadership and the backend lead wanted the distance between buttons and functions as short as possible.",
          },
          {
            icon: "layers",
            title: "Higher density",
            body: "The same brief asked for more information on screen so hiring managers could act without hunting through extra pages.",
          },
        ],
      },
      {
        type: "text",
        title: "Cleaning up v1",
        body: "The first version had been coded with almost no design direction. It was full of duplicate screens, messy connections, and type and functions that did not need to be there. I stripped those out, then rebuilt the pages around modular windows and dense lists, taking cues from the S&P terminals investment bankers use — a format that already matched how Provelis stored its data. The first sample used scalable windows, a collapsible sidebar, and outlined clickable controls. I tried tiles for the important action items, then switched to a list because a list was easier to scan. That pass did shrink the distance between pages.",
      },
      {
        type: "image",
        src: "https://res.cloudinary.com/fet3ks1c/image/upload/v1790908804/Untitled_Artwork_77.png",
      },
      {
        type: "callout",
        icon: "building-2",
        title: "S&P as a model",
        body: "Modular windows and long lists felt like the right language for a professional ops tool. I treated that as the design system for the first rebuild. After review I cut a large KPI strip of redundant numbers and a one-item notification banner that ate a full row for a single alert.",
      },
      {
        type: "text",
        title: "Initial feedback - it was confusing",
        body: "Hiring managers — the people Provelis is actually for — said the rebuild was hard to use. The hiring tool they already used felt more intuitive and less cluttered, and it let them customize tables. I had to throw out the first system and start from their working habits instead of from a denser terminal.",
      },
      {
        type: "callout",
        icon: "frown",
        title: "Talk to the users earlier",
        body: "I designed against an internal brief instead of checking each feature idea with hiring managers. That is why the first version looked finished and still failed. Later click-throughs kept finding the same class of problem: table headers that did not stick, filters that did not filter, buttons that went nowhere, a search box that ate keystrokes, and a job description that was too small on the requirement canvas.",
      },
      {
        type: "text",
        title: "A clearer console",
        body: "I dropped the top sliding bar of buttons for a side panel that opens and closes, reused the existing table assets instead of inventing new ones, and used icons plus changes in padding and type to mark what mattered. After the concepts landed, the home grid they asked for was client rows, stalls, recruiter output, and a schedule — each panel expandable to a full list. Urgency was the item that had sat longest, or the one closest to an SLA. The goal was the same density, but with a layout hiring managers already recognized.",
      },
      {
        type: "callout",
        columns: 2,
        items: [
          {
            icon: "panel-left",
            title: "Collapsible side nav",
            body: "Primary actions live in a panel that can get out of the way, instead of a sliding top bar.",
          },
          {
            icon: "table",
            title: "Reuse before invent",
            body: "Tables, icons, and type scale do the hierarchy work. New UI chrome is expensive and, in this case, broke the prototype backend.",
          },
        ],
      },
      {
        type: "callout",
        columns: 2,
        items: [
          {
            icon: "app-window",
            title: "One canvas, not a stack of popups",
            body: "Clicking a job opens the description, candidates, and actions on one screen, with a breadcrumb back path — dashboard, then job, then candidate. Stalls and interviews get hover peeks instead of another hidden menu.",
          },
          {
            icon: "swatch-book",
            title: "Parchment over glass",
            body: "Rounded Liquid Glass and frost looked pretty and read as unprofessional. Stakeholders picked the sharp, parchment, high-density direction. Blue and white to match the logo; no purple; no generic AI glyphs; no extra titles.",
          },
        ],
      },
      {
        type: "text",
        title: "Redefining User Flow.",
        body: "I redesigned roughly 40 screens across the console. The executive portal was the core. A recruiter-scoped twin followed — only assigned jobs, with louder review and advance actions. I also started a lighter pass on the candidate interview screens. Two surfaces mattered most while the rest of the system came together.",
      },
      {
        type: "callout",
        columns: 2,
        items: [
          {
            icon: "columns-2",
            title: "Resume beside the job",
            body: "A side-by-side view so hiring managers can read a resume against the job requirements without flipping between pages.",
          },
          {
            icon: "list",
            title: "Modular hire list",
            body: "A list of hires that can be rearranged and scanned the way they already work through a pipeline.",
          },
        ],
      },
      {
        type: "image",
        src: "https://res.cloudinary.com/fet3ks1c/image/upload/v1790920216/3ea4d7c8-cf28-47e8-a087-196eef7f1cb6.png",
        caption: "Important details are never more than three links away. Pop-ups and half-pages sit on top of the main canvas so recruiters can move through large applicant piles without leaving the job. Many links between pages are not shown.",
      },
      {
        type: "text",
        title: "Home & pipeline",
        body: "The home dashboard surfaces open requirements, submissions, interview volume, and funnel health so a supervisor can see which jobs are filling without opening five tabs.",
      },
      {
        type: "gallery",
        columns: 1,
        items: [
          {
            type: "image",
            src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1784453341/Screenshot_2026-07-12_at_4.50.19_AM_vuuepl.png",
            caption: "Home — open jobs, stalls, and funnel health on one grid, each panel expandable to a full list",
          },
          {
            type: "image",
            src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1784453341/Screenshot_2026-07-12_at_4.50.28_AM_lbrjo0.png",
            caption: "Requirements — jobs table with pipeline and conversion, reused from the existing table language instead of a new chrome",
          },
        ],
      },
      {
        type: "text",
        title: "Recruiters & analytics",
        body: "Recruiter performance and live analytics pull from completed interviews so ops can track verdicts, weekly throughput, and submit rates in one place.",
      },
      {
        type: "gallery",
        columns: 1,
        items: [
          {
            type: "image",
            src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1784453340/Screenshot_2026-07-12_at_4.50.53_AM_ujaa7y.png",
            caption: "Recruiters — performance table and throughput widgets",
          },
          {
            type: "image",
            src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1784453340/Screenshot_2026-07-12_at_4.51.10_AM_btd9ws.png",
            caption: "Analytics — verdict distribution and weekly completions",
          },
        ],
      },
      {
        type: "text",
        title: "Workflow builder",
        body: "Interview workflows are editable node graphs — from simple round sequences to multi-step outreach, wait, and verification flows with live save state and AI-assisted resets.",
      },
      {
        type: "image",
        src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1784453341/Screenshot_2026-07-12_at_4.51.31_AM_rwb6s2.png",
        caption: "Workflows list — active journeys and running counts",
      },
      {
        type: "gallery",
        columns: 1,
        items: [
          {
            type: "image",
            src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1784453340/Screenshot_2026-07-13_at_10.58.43_AM_xvcquv.png",
            caption: "Interview rounds — linear workflow canvas",
          },
          {
            type: "image",
            src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1784453340/Screenshot_2026-07-12_at_4.52.39_AM_b62ijs.png",
            caption: "Previous design for a workflow graph, scrapped due to graphical glitches and incomplete feature set",
          },
        ],
      },
      {
        type: "text",
        title: "Interview review",
        body: "Candidate review combines recording, transcript, AI verdict, strengths/weaknesses, and proctoring signals so recruiters can advance, hold, or reject from one screen.",
      },
      {
        type: "image",
        src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1784453341/Screenshot_2026-07-12_at_4.50.11_AM_mcitvj.png",
        caption: "Interview overview — score cards, AI verdict, strengths / weaknesses",
      },
      {
        type: "gallery",
        columns: 1,
        items: [
          {
            type: "image",
            src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1784453339/Screenshot_2026-07-13_at_11.02.48_AM_irbgsg.png",
            caption: "Evaluation — webcam + transcript beside decision panel",
          },
          {
            type: "image",
            src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1784453339/Screenshot_2026-07-13_at_11.02.57_AM_fs7hct.png",
            caption: "Verify — cheating likelihood and proctoring signals",
          },
        ],
      },
      {
        type: "text",
        title: "Sourcing & ops",
        body: "Deep Search and Problems close the loop — external-only candidate sourcing with verification, plus a severity queue for stalled requirements.",
      },
      {
        type: "gallery",
        columns: 1,
        items: [
          {
            type: "image",
            src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1784453339/Screenshot_2026-07-13_at_11.04.19_AM_p9xuqq.png",
            caption: "Deep Search — JD parse and external source config",
          },
          {
            type: "image",
            src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1784453339/Screenshot_2026-07-13_at_11.04.14_AM_c9fsbd.png",
            caption: "Problems — stalled requirements ordered by longest wait and closest SLA, not a pretty empty circle",
          },
        ],
      },
      {
        type: "callout",
        icon: "shield",
        title: "No separate test backend",
        body: "I could not fork production for security and clearance reasons, and I also could not run the full stack locally. Previews went through a shared cluster with 10–20 minute deploys, so a style change and a wiring bug looked the same until they landed. Interview video and resumes lived on a service with no safe development copy, which is why some paths stayed empty on the preview and why a visual rewrite could take the backend down. My lead unblocked cluster access. I owned the UI wiring.",
      },
      {
        type: "callout",
        icon: "notebook-pen",
        title: "What I learned",
        body: "Reuse what already works, talk to the people who run the desks — not only the internal brief — and be careful prompting agents so a visual rewrite cannot take the backend down. Treat click-through QA as part of the design, not a pass after ship. Do not invent new chrome when the existing tables already match how the team works.",
      },
      { type: "text", title: "Video demo" },
      {
        type: "video",
        src: "https://res.cloudinary.com/dak0zi45d/video/upload/v1784453476/Screen_Recording_2026-07-19_at_5.29.23_AM_gd3tts.mov",
      },
    ],
  }, /*
  {
    slug: "alex-twin",
    title: "AlexTwin",
    category: "WebGL / 3D",
    description: "Web-based, 3D world simulation for distribution",
    visitUrl: "https://alex-twin.com/",
    thumbnail: {
      type: "photo",
      src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1780348329/Screenshot_2026-05-31_at_1.56.03_AM_i2cikb.png",
    },
    hero: {
      type: "video",
      src: "https://res.cloudinary.com/dak0zi45d/video/upload/v1780539409/Screen_Recording_2026-06-03_at_7.15.23_PM_mleipg.mov",
    },
    meta: {
      role: "Solo Developer",
      roleDescription: "Everything!",
      collaborators: "",
      duration: "2026",
      tools: "Cursor, React, Cesium, Google 3D Tiles, Playwright MCP",
    },
    content: [
      {
        type: "text",
        title: "Overview",
        body: "AlexTwin is a web-based 3D world simulation built for distribution and live demo. The goal was to make a dense AR + assistant stack feel legible on a phone in a single hackathon sprint.",
      },
      {
        type: "image",
        src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1780538718/IMG_2071_peicap.jpg",
        caption: "UI and app structure brainstorming",
      },
      {
        type: "text",
        title: "Interface & build",
        body: "",
      },
      {
        type: "gallery",
        columns: 1,
        items: [
          {
            type: "video",
            src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1780348329/Screenshot_2026-05-31_at_1.53.46_AM_jwljs2.png",
            caption: "Light mode - less performance-heavy, from 1.2 GB to 200 MB",
          },
        ],
      },
    ],
  }, */
  {
    slug: "orble-tea",
    title: "Orble Tea",
    category: "Brand / Business",
    description: "Comprehensive branding and business work",
    visitUrl: "https://orble-tea.com/",
    thumbnail: {
      type: "video",
      src: "https://orble-tea.com/media/next-gen-render-video.mp4",
    },
    hero: {
      type: "image",
      src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1768444772/Screenshot_2026-01-14_at_9.39.22_PM_qrxnda.png",
    },
    meta: {
      role: "Brand Designer / Developer",
      collaborators: "Orble Tea Team",
      duration: "2025 – Present",
      tools: "Astro, Blender, Maya, Onshape, React",
    },
    content: [
      {
        type: "text",
        title: "Overview",
        body: "Orble Tea is an automated boba concept spanning product design, brand, and go-to-market visuals. I shape Orble's visual identity, hardware storytelling, and marketing site, tying physical machine design to a coherent digital presence on orble-tea.com — from CAD-backed renders to vinyl wraps and architectural viz for investor decks.",
      },
      {
        type: "image",
        src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1768444772/Screenshot_2026-01-14_at_9.39.22_PM_qrxnda.png",
        caption: "Marketing site and brand snapshot",
      },
      {
        type: "image",
        src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1772842030/IMG_5522_2_1_gfa0m8.png",
        caption: "Vinyl wrap for the 'coming soon' launch box",
      },
      {
        type: "text",
        title: "Hardware & beta unit",
        body: "Beta vending concepts combine Onshape CAD, Substance texturing, and Blender lighting so stakeholders can read materials and footprint before fabrication.",
      },
      {
        type: "gallery",
        columns: 1,
        items: [
          {
            type: "image",
            src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1773974232/Untitled_Artwork_64_yrjse5.png",
            caption: "Beta vending machine — industrial design pass",
          },
          {
            type: "image",
            src: "https://orble-tea.com/.netlify/images?url=_astro%2Ffront-left.D0kYN4sG.jpg&w=1280&h=1280&dpl=69483ebca7d51e0008be244d",
            caption: "Beta unit render — card reader and boba materials",
          },
          {
            type: "image",
            src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1768445467/textured_reexport_v2_pattern_BaseColor_qdm7px.png",
            caption: "Substance Painter surface maps",
          },
          {
            type: "image",
            src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1768446936/orble_next_gen_render_1_720_zykg6e.png",
            caption: "Next-gen machine — Onshape CAD with custom materials",
          },
        ],
      },
      {
        type: "text",
        title: "Architectural visualization",
        body: "Location renders (airport, apartment, campus) place the machine in real contexts for pitch decks and partner conversations.",
      },
      {
        type: "gallery",
        columns: 1,
        items: [
          {
            type: "image",
            src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1768444581/airport_render_3_wmsjre.jpg",
            caption: "Airport / station placement study",
          },
          {
            type: "image",
            src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1768444580/airport_render_png_sr8ls4.jpg",
            caption: "Station visualization — final lighting",
          },
          {
            type: "image",
            src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1768554175/Screenshot_2026-01-16_at_4.02.36_AM_cgw82a.png",
            caption: "Wireframe overlay for layout review",
          },
          {
            type: "image",
            src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1768446826/archviz_apartment_1_vaftas.jpg",
            caption: "Apartment lobby context",
          },
          {
            type: "image",
            src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1768554330/archviz_1_with_people_studying_1_lkmnqf.jpg",
            caption: "Academic building — foot traffic study",
          },
        ],
      },
    ],
  },
  {
    slug: "saturn",
    title: "Saturn",
    category: "Long term indie project",
    visitUrl: "https://al371160.itch.io/saturn",
    thumbnail: {
      type: "video",
      src: "https://res.cloudinary.com/dak0zi45d/video/upload/v1790636205/Screen_Recording_2025-08-05_at_8.05.04_AM_w94srq.mov",
    },
    hero: {
      type: "image",
      src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1790636355/Screenshot_2026-05-08_at_11.10.00_PM_mxxr1n.png",
    },
    meta: {
      role: "Solo Developer",
      collaborators: "Solo Developer",
      duration: "Sep 2025 - Present",
      tools: "Adobe Substance 3D, Blender, Maya, Procreate, Unity, Cursor",
    },
    content: [
      {
        type: "callout",
        icon: "hammer",
        title: "In development",
        body: "Saturn is a long-term indie project in active development. Follow along and play the latest build on itch.io.",
      },
    ],
  },
  /* {
    slug: "ragebaiter",
    title: "Ragebaiter",
    category: "Product / Experiment",
    description: "Gamifying the approach to online discussion of sensitive topics",
    visitUrl: "https://ragebaiter-three.vercel.app/",
    thumbnail: {
      type: "photo",
      src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1780358115/Screenshot_2026-06-01_at_4.54.37_PM_wceqgw.png",
    },
    hero: {
      type: "image",
      src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1780553617/copy_of_screenshot_2026-06-03_at_110949_pm_nsbvux.png",
    },
    meta: {
      role: "Solo Developer",
      roleDescription: "Designed and built the full stack solo — product concept, UI, and inference pipeline — to test whether game mechanics could make heated threads more constructive.",
      collaborators: "Solo",
      duration: "2026",
      tools: "Cursor, React, Python",
    },
    content: [
      {
        type: "text",
        title: "Overview",
        body: "Coming soon!",
      },
    ],
  }, */
  {
    slug: "aquara",
    title: "Aquara",
    category: "UI / Brand",
    description: "Direct, modular UI for professional clients",
    visitUrl: "https://aquara.ai",
    thumbnail: {
      type: "photo",
      src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1780352903/Screenshot_2026-06-01_at_3.28.05_PM_qx6qst.png",
    },
    hero: {
      type: "image",
      src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1781073756/Screenshot_2026-06-09_at_11.41.06_PM_acnflh.png",
    },
    heroVideo: {
      type: "video",
      src: "https://res.cloudinary.com/dak0zi45d/video/upload/v1784514310/Screen_Recording_2026-07-19_at_10.15.40_PM_ajusoi.mov",
    },
    meta: {
      role: "UI Lead",
      collaborators: "Benjamin Liu, Ivan Zhang, Theo Weises",
      duration: "2026",
      tools: "Figma, React, TypeScript",
    },
    content: [
      {
        type: "photo",
        src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1781073756/Screenshot_2026-06-09_at_11.41.06_PM_acnflh.png",
        caption: "Designs for LinkedIn banners.",
      },
      {
        type: "text",
        title: "Overview",
        body: "Aquara is a professional client portal built around clarity under load: accountants and ops leads need numbers, status, and actions without hunting through nested menus. I led the interface architecture — modular panels, dense data tables, and a calm visual system that still feels fast at a glance.",
      },
      {
        type: "image",
        src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1780352903/Screenshot_2026-06-01_at_3.28.05_PM_qx6qst.png",
        caption: "Dashboard shell — modular cards and primary actions",
      },
      {
        type: "gallery",
        columns: 3,
        items: [
          {
            type: "image",
            src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1781073756/605565783-10a40fe6-62d1-4e2c-acde-876730388469_ffsfpv.png",
            caption: "Settings layout for the chrome extension sidepanel",
          },
          {
            type: "image",
            src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1781073756/605566129-7f5cc883-6063-4493-80d4-b67e5039c3b1_rzi9mp.png",
            caption: "Onboarding checklist",
          },
          {
            type: "image",
            src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1781073756/605566359-5cc8e0e4-7b30-4dc1-aecf-1e6b0c9c7b1b_slimdt.png",
            caption: "Onboarding tutorial",
          },
        ],
      },
      {
        type: "text",
        title: "Design principles",
        body: "Type scale and spacing follow an 8px grid. Components are swappable blocks (summary, ledger, alerts) so new client verticals reuse the same frame.\n\nColor is mostly neutral with a single accent for CTAs and risk states.",
      },
      {
        type: "text",
        title: "Next steps",
        body: "Continuing to tighten responsive breakpoints and empty states for first-time client onboarding.",
      },
    ],
  },
  {
    slug: "omni",
    title: "Omni",
    category: "Product / Tools",
    description: "Accessible, interactive toolmaking for users",
    visitUrl: "https://devpost.com/software/omni-hzxqra",
    thumbnail: {
      type: "video",
      src: "https://res.cloudinary.com/dak0zi45d/video/upload/v1769220262/IMG_5239_pwu4jw.mov",
    },
    hero: {
      type: "image",
      src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1769220305/Untitled_Artwork_56_ppoklz.png",
    },
    meta: {
      role: "UI Lead",
      collaborators: "Benjamin Liu, Ivan Zhang, Theo Weises",
      duration: "2026",
      tools: "Rive, XCode, ARKit, Swift, Antigravity, Overshoot API",
    },
    content: [
      {
        type: "text",
        title: "Overview",
        body: "Omni is an accessible AR assistant for interactive toolmaking: users describe what they need, see it in space, and refine it through voice and touch. I directed the UI, from layout and motion to Xcode implementation and demo-ready polish, keeping the interface calm while the backend orchestration stayed complex.",
      },
      {
        type: "image",
        src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1769220305/Untitled_Artwork_56_ppoklz.png",
        caption: "Assistant character and UI sketch sheet",
      },
      {
        type: "image",
        src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1769220430/Screenshot_2026-01-23_at_9.07.00_PM_gbwxam.png",
        caption: "Logo and visual identity",
      },
      {
        type: "text",
        title: "iOS interface",
        body: "Built the SwiftUI shell, navigation, and component library in Xcode so engineering could plug in ARKit sessions and live API streams without redesigning screens.",
      },
      {
        type: "image",
        src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1769221063/Screenshot_2026-01-23_at_9.17.37_PM_raqzba.png",
        caption: "App structure in Xcode — dependencies and screen map",
      },
      {
        type: "video",
        src: "https://res.cloudinary.com/dak0zi45d/video/upload/v1769220305/look_back0001-0072_ffci2z.mp4",
        caption: "Blender pre-visualization of assistant in AR",
      },
      {
        type: "gallery",
        columns: 1,
        items: [
          {
            type: "video",
            src: "https://res.cloudinary.com/dak0zi45d/video/upload/v1769221622/Screen_Recording_2026-01-23_at_9.22.51_PM_qsy0dd.mov",
            caption: "Rive animation system for the assistant",
          },
          {
            type: "video",
            src: "https://res.cloudinary.com/dak0zi45d/video/upload/v1769220289/IMG_5241_wu0tga.mov",
            caption: "Animation synced to voice input",
          },
        ],
      },
      {
        type: "text",
        title: "Integrations",
        body: "Supported Overshoot, Gemini, and LiveKit hooks for the hackathon demo and authored the public Devpost writeup.",
      },
      {
        type: "image",
        src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1769222275/IMG_5214_d3mw7p.png",
        caption: "Submission snapshot — https://devpost.com/software/omni-hzxqra",
      },
    ],
  },
  {
    slug: "y-prize",
    title: "Y-Prize",
    category: "Strategy / Design",
    description: "Led design and prototyping for sustainable startup competition",
    visitUrl: "https://youtu.be/k8fP14yVEa8",
    thumbnail: {
      type: "video",
      src: "https://res.cloudinary.com/dak0zi45d/video/upload/v1768447371/Screen_Recording_2026-01-14_at_10.20.36_PM_hfnucs.mov",
    },
    hero: {
      type: "image",
      src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1768450142/Y-Prize_2025-images-0_lke54o.jpg",
    },
    heroVideo: {
      type: "youtube",
      src: "k8fP14yVEa8",
    },
    meta: {
      role: "Team Lead",
      collaborators: "Shaomin Kee, Corina Chen, Reine Huang, Joanne Lin",
      duration: "2025",
      tools: "Blender, Capcut, Microsoft PowerPoint, Google Slides",
    },
    content: [
      {
        type: "text",
        title: "Overview",
        body: "Y-Prize is Penn's startup design competition. I led a five-person team through Y-Prize 2025, packaging a sustainable product narrative into a tight deck, a visual identity, Blender prototypes, and the five-minute cinematic pitch film that anchored our submission.",
      },
      {
        type: "text",
        title: "Pitch deck",
        body: "Five slides cover problem, solution, market, prototype, and ask — designed for legibility on a projector and PDF export.",
      },
      {
        type: "gallery",
        columns: 1,
        items: [
          {
            type: "image",
            src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1768450142/Y-Prize_2025-images-0_lke54o.jpg",
            caption: "Deck slide 1 — problem framing",
          },
          {
            type: "image",
            src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1768450145/Y-Prize_2025-images-1_n6vjy1.jpg",
            caption: "Deck slide 2 — solution",
          },
          {
            type: "image",
            src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1768450143/Y-Prize_2025-images-2_z4j26i.jpg",
            caption: "Deck slide 3 — market",
          },
          {
            type: "image",
            src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1768450144/Y-Prize_2025-images-3_c2ec4z.jpg",
            caption: "Deck slide 4 — prototype",
          },
          {
            type: "image",
            src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1768450144/Y-Prize_2025-images-4_owz80v.jpg",
            caption: "Deck slide 5 — team & ask",
          },
        ],
      },
      {
        type: "text",
        title: "Pitch film",
        body: "The video above the writeup is the full five-minute pitch. Blender models were edited in CapCut with VO and music for submission.",
      },
      {
        type: "image",
        src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1768524628/Screenshot_2026-01-15_at_7.49.13_PM_vykmri.png",
        caption: "YouTube pitch — https://youtu.be/k8fP14yVEa8",
      },
    ],
  },
  {
    slug: "pawfond",
    title: "PawFond",
    category: "Product / Web",
    description: "Product design and web development for pet care startup",
    visitUrl: "https://mypawfond.com/",
    thumbnail: {
      type: "image",
      src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1768451779/16oz_packaging_blue_fpowis.png",
    },
    hero: {
      type: "image",
      src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1768451908/8oz_packagin_design_v2_ssbpjw.png",
    },
    heroVideo: {
      type: "video",
      src: "https://res.cloudinary.com/dak0zi45d/video/upload/v1768592032/pawfond_hero_u323pp.mov",
    },
    meta: {
      role: "Product Designer / Developer",
      collaborators: "PawFond Team",
      duration: "2025",
      tools: "Procreate, Adobe Fresco, Adobe Illustrator, Shopify",
    },
    content: [
      {
        type: "text",
        title: "Overview",
        body: "PawFond is a pet-care startup spanning physical product and DTC web. I owned packaging exploration and the Shopify storefront, translating brand sketches into trustworthy, shelf-ready dielines and a simple purchase path for first-time customers — a shoppable site the team can run without engineers on call.",
      },
      {
        type: "video",
        src: "https://res.cloudinary.com/dak0zi45d/video/upload/v1768526150/Screen_Recording_2026-01-15_at_8.10.29_PM_wdjscw.mov",
        caption: "Shopify theme build and product setup",
      },
      {
        type: "text",
        title: "Packaging system",
        body: "Explored 8 oz and 16 oz formats in blue-forward palettes, keeping typography readable at arm's length on shelf and in unboxing photos.",
      },
      {
        type: "gallery",
        columns: 1,
        items: [
          {
            type: "image",
            src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1768451908/8oz_packagin_design_v2_ssbpjw.png",
            caption: "8 oz — alternate layout v2",
          },
          {
            type: "image",
            src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1768451691/Untitled_Artwork_51_yd3pcx.png",
            caption: "Brand illustration explorations",
          },
          {
            type: "image",
            src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1768451889/8oz_packagin_design_blue_f01q6t.png",
            caption: "8 oz — blue primary",
          },
          {
            type: "image",
            src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1768451693/16oz_packaging_blue_t3tyfp.png",
            caption: "16 oz — production candidate",
          },
        ],
      },
      {
        type: "image",
        src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1768451779/16oz_packaging_blue_fpowis.png",
        caption: "16 oz hero SKU — thumbnail asset",
      },
      {
        type: "image",
        src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1768526880/pawfond_display_7736b524-df3c-4f3a-ab41-ced9397e3db1_ywzt1a.webp",
        caption: "Retail display render",
      },
    ],
  },
  {
    slug: "rum-rush",
    title: "Rum Rush",
    category: "Game / 3D",
    description: "Game development leadership under schedule",
    thumbnail: {
      type: "image",
      src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1768527339/Rum_rush_thumbnail_z1x6cb.png",
    },
    hero: {
      type: "image",
      src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1768552482/Screenshot_2026-01-16_at_3.34.33_AM_evwmzc.png",
    },
    meta: {
      role: "Producer / Team Lead",
      collaborators: "Rajas Nanda, Chris Wang, Andrew Han",
      duration: "2025",
      tools: "Unity, C#, Blender",
    },
    content: [
      {
        type: "text",
        title: "Overview",
        body: "Rum Rush is a time-manipulation action prototype built in Unity. As producer under a fixed schedule, I wrote the game design doc, planned milestones, and built hands-on systems (physics, ragdoll, audio, post) — keeping scope honest so the team could ship a vertical slice that still landed a distinctive feel: slow-mo combat, readable pickups, and punchy feedback.",
      },
      {
        type: "image",
        src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1768552482/Screenshot_2026-01-16_at_3.34.33_AM_evwmzc.png",
        caption: "Unity graybox — bar and pickup layout",
      },
      {
        type: "image",
        src: "https://res.cloudinary.com/dak0zi45d/image/upload/v1768552649/Screenshot_2026-01-16_at_3.36.06_AM_jyqwts.png",
        caption: "Game design document — https://docs.google.com/document/d/1whl24mmz1ueF_pX9FL21w8iHkfytmpR0FFxYYhbG_nk/edit",
      },
      {
        type: "text",
        title: "Systems",
        body: "Core loops were proven with short capture clips before polish passes. Each system below was scoped to support the slow-time fantasy without bloating the build.",
      },
      {
        type: "gallery",
        columns: 1,
        items: [
          {
            type: "video",
            src: "https://res.cloudinary.com/dak0zi45d/video/upload/v1768552902/rigidbody_demo_rl2tpq.mov",
            caption: "Pickup and rigidbody interaction",
          },
          {
            type: "video",
            src: "https://res.cloudinary.com/dak0zi45d/video/upload/v1768553309/ragdoll_demo_rjzmdu.mov",
            caption: "Enemy ragdoll on impact",
          },
          {
            type: "video",
            src: "https://res.cloudinary.com/dak0zi45d/video/upload/v1768553492/mixer_demo_k224rc.mov",
            caption: "Dynamic audio mixer for slow-time",
          },
          {
            type: "video",
            src: "https://res.cloudinary.com/dak0zi45d/video/upload/v1768553724/post_processing_demo_mpbgvn.mov",
            caption: "Post-processing tied to slow-time",
          },
        ],
      },
    ],
  },
];
