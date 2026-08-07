import { ElementType } from "react";

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon: ElementType;
}

export default function PlaceholderPage({ title, description, icon: Icon }: PlaceholderPageProps) {
  return (
    <>
      <div className="admin-page-head">
        <div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </div>
      <div className="admin-placeholder">
        <Icon />
        <h3>{title} module coming soon</h3>
        <p>
          This section is scaffolded and ready — connect it to your Supabase
          tables to start managing {title.toLowerCase()}.
        </p>
      </div>
    </>
  );
}
