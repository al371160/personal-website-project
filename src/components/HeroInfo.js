const teams = [
  { label: "Penn Electric Racing", href: "https://www.pennelectricracing.com/", marker: "1" },
  { label: "Orble Tea", href: "https://orble-tea.com/", marker: "2" },
  { label: "Penn UPGRADE", href: "https://pennupgrade.com/", marker: "3" },
  { label: "PawFond", href: "https://mypawfond.com/", marker: "4" },
];

const links = [
  { label: "GitHub", href: "https://github.com/al371160", marker: "↗" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/alexander-liu-282739206/", marker: "↗" },
  { label: "Resume", href: "/resume.pdf", marker: "↗" },
  { label: "Email", href: "mailto:aliu10@seas.upenn.edu", marker: "↗" },
];

export default function HeroInfo() {
  return (
    <section className="hero-info-panel" aria-label="About Alexander Liu">
      <div className="hero-info-copy">
        <h1>Designing quiet tools, playful interfaces, and visual systems.</h1>
      </div>

      <div className="hero-info-lists">
        <div className="hero-info-list">
          <h2>Teams</h2>
          {teams.map((item) => (
            <a key={item.label} href={item.href} target="_blank" rel="noreferrer">
              <span>{item.label}</span>
              <sup>{item.marker}</sup>
            </a>
          ))}
        </div>

        <div className="hero-info-list">
          <h2>Links</h2>
          {links.map((item) => (
            <a key={item.label} href={item.href} target="_blank" rel="noreferrer">
              <span>{item.label}</span>
              <sup>{item.marker}</sup>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
