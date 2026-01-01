export const projects = [
  {
    slug: "orble-tea",
    title: "Orble Tea",
    description: "Comprehensive branding and business work",
    
    // Image/video for Home page gallery card
    thumbnail: {
      type: "video",
      src: "https://orble-tea.com/media/next-gen-render-video.mp4",
    },

    // Hero image/video for Detail page
    hero: {
      type: "image",
      src: "https://orble-tea.com/.netlify/images?url=_astro%2Ffront-left.D0kYN4sG.jpg&w=1280&h=1280&dpl=69483ebca7d51e0008be244d",
    },

    meta: {
      role: "Brand Designer / Developer",
      collaborators: "Orble Tea Team",
      duration: "2023 – 2024",
      tools: "Astro, Blender, Maya, Onshape, React",
    },

    content: [
      {
        type: "image",
        src: "https://example.com/image1.jpg",
        caption: "Early branding explorations",
      },
      {
        type: "video",
        src: "https://example.com/demo.mp4",
        caption: "Product visualization demo",
      },
    ],
  },
];
