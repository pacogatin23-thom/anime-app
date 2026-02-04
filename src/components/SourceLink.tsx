import { isHttpUrl } from "../utils/typeGuards";

interface SourceLinkProps {
  url: string | null | undefined;
}

export default function SourceLink({ url }: SourceLinkProps) {
  if (!url || !isHttpUrl(url)) return null;
  return (
    <span className="metaSource">
      {" "}
      ·{" "}
      <a href={url} target="_blank" rel="noreferrer">
        fuente
      </a>
    </span>
  );
}
