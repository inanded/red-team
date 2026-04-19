"use client";

// Intentionally vulnerable: the component renders model-produced HTML via
// dangerouslySetInnerHTML without a sanitiser. Any instructions inside the
// model output are interpreted by the browser as HTML, including script tags
// and event-handler attributes.
export function ReportRenderer({ html }: { html: string }) {
  return (
    <article className="report">
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </article>
  );
}
