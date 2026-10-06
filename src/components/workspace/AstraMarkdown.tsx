import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** No HTML or remote image execution; Markdown's default URL filter rejects unsafe protocols. */
export function AstraMarkdown({
  text,
  resolveArtifactUrl,
}: {
  text: string;
  resolveArtifactUrl?: (url: string) => string;
}) {
  return (
    <div className="astra-message">
      <Markdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        components={{
          a: ({ children, href }) =>
            href ? (
              <a
                href={
                  href.startsWith("/artifacts/") && resolveArtifactUrl
                    ? resolveArtifactUrl(href)
                    : href
                }
                target="_blank"
                rel="noreferrer"
                className="font-medium text-primary underline underline-offset-2"
              >
                {children}
              </a>
            ) : (
              <span>{children}</span>
            ),
          img: ({ alt }) => <span>{alt ?? "Image reference"}</span>,
          h1: ({ children }) => <h3>{children}</h3>,
          h2: ({ children }) => <h3>{children}</h3>,
          table: ({ children }) => (
            <div className="overflow-x-auto">
              <table>{children}</table>
            </div>
          ),
        }}
      >
        {text}
      </Markdown>
    </div>
  );
}
