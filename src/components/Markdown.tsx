import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** Single renderer used by both the public article and the editor preview. Raw HTML is never rendered. */
export function Markdown({ source }: { source: string }) {
  return (
    <div className="prose-az">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        components={{
          a: ({ href, children }) => {
            const external = href?.startsWith("http");
            return (
              <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                {children}
              </a>
            );
          },
          img: ({ src, alt }) => <img src={typeof src === "string" ? src : undefined} alt={alt ?? ""} loading="lazy" />,
          h1: ({ children }) => <h2>{children}</h2>,
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
