type Meta = {
  title: string;
};

export default function Top() {
  // @ts-ignore
  const posts = import.meta.glob<{ frontmatter: Meta }>('./*.mdx', {
    eager: true,
  });
  return (
    <div>
      <h2>Posts</h2>
      <ul >
        {Object.entries(posts).map(([id, module]) => {
          // @ts-ignore
          if (module.frontmatter) {
            return (
              <li>
                <a href={`${id.replace(/\.mdx$/, '')}`}>
                  {/* @ts-ignore */}
                  {module.frontmatter.title}
                </a>
              </li>
            );
          }
        })}
      </ul>
    </div>
  );
}
